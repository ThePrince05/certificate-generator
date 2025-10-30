export type ClientAttachment = {
  url?: string;       // fallback URL-based attachments
  blob?: Blob;        // blob object
  content?: string;   // base64 string for server
  filename?: string;
};

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:application/pdf;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function sendCertificatesEmail(opts: {
  to: string;
  subject: string;
  message: string;
  attachments?: ClientAttachment[];
}) {
  // ✅ Convert blobs to base64 and add MailerSend-compatible fields
  const attachmentsPayload = await Promise.all(
    (opts.attachments || []).map(async (att) => {
      if (att.blob) {
        const base64 = await blobToBase64(att.blob);
        return {
          content: base64,
          filename: att.filename || "attachment.pdf",
          disposition: "attachment", // ✅ Required by MailerSend
        };
      } else if (att.content) {
        // Already base64 — just attach disposition
        return {
          content: att.content,
          filename: att.filename || "attachment.pdf",
          disposition: "attachment",
        };
      } else if (att.url) {
        // MailerSend also allows file URLs
        return {
          url: att.url,
          filename: att.filename || "attachment.pdf",
          disposition: "attachment",
        };
      }
      return null;
    })
  );

  const body = {
    to: opts.to,
    subject: opts.subject,
    message: opts.message,
    attachments: attachmentsPayload.filter(Boolean),
  };

  // 🔹 Debug (optional, can remove after testing)
 // console.log(
 //   "📦 Sending email with MailerSend payload:",
 //   JSON.stringify(body, null, 2)
 // );

  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to send email");
  }

  return res.json();
}
