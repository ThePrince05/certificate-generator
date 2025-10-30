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
      resolve(result.split(",")[1]); // remove data:image/...;base64, prefix
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
  // convert blobs to base64
  const attachmentsPayload = await Promise.all(
    (opts.attachments || []).map(async (att) => {
      if (att.blob) {
        const base64 = await blobToBase64(att.blob);
        return { content: base64, filename: att.filename || "attachment.pdf" };
      } else if (att.url) {
        return { url: att.url, filename: att.filename };
      }
      return null;
    })
  );

  const body = {
    to: opts.to,
    subject: opts.subject,
    message: opts.message,
    attachments: attachmentsPayload.filter(Boolean), // remove nulls
  };

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
