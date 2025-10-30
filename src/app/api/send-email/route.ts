import { NextResponse } from "next/server";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const MAILER_FROM_ADDRESS = "no-reply@test-vz9dlem29qq4kj50.mlsender.net"; 
const MAILER_FROM_NAME = "One Planet-One People Certificates";

const mailer = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY! });

type AttachmentInput = {
  url?: string;
  content?: string; // base64 string
  filename?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message, attachments = [] }: {
      to: string;
      subject: string;
      message: string;
      attachments?: AttachmentInput[];
    } = body;

    if (!to) return NextResponse.json({ error: "Missing `to` field" }, { status: 400 });

    const sentFrom = new Sender(MAILER_FROM_ADDRESS, MAILER_FROM_NAME);
    const recipients = [new Recipient(to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject || "Your certificates")
      .setHtml(message || "");

   // process attachments
const processed: { content: string; filename: string; disposition: string }[] = [];

for (const [i, att] of attachments.entries()) {
  if (att.content) {
    // client already sent base64 content (no data: prefix)
    processed.push({
      content: att.content,
      filename: att.filename || `attachment_${i}.pdf`,
      disposition: "attachment", // <-- required by MailerSend
    });
  } else if (att.url) {
    try {
      const res = await fetch(att.url);
      if (!res.ok) {
     //   console.warn(`Attachment ${i} fetch failed: ${res.status}`);
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let filename = att.filename;
      if (!filename) {
        try {
          filename = new URL(att.url).pathname.split("/").pop() || `attachment_${i}.pdf`;
        } catch {
          filename = `attachment_${i}.pdf`;
        }
      }

        processed.push({
        content: buffer.toString("base64"),
        filename,
        disposition: "attachment",
      });

    } catch (err) {
    //  console.error(`Error processing attachment ${i}:`, err);
    }
  }
}

if (processed.length > 0) emailParams.setAttachments(processed as any);

    await mailer.email.send(emailParams);
    return NextResponse.json({ success: true });

  } catch (err: any) {
  //  console.error("send-email error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
