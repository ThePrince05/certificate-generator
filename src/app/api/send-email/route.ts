// app/api/send-email/route.ts
import { NextResponse } from "next/server";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const MAILER_FROM_ADDRESS = "no-reply@test-vz9dlem29qq4kj50.mlsender.net"; // verified test domain
const MAILER_FROM_NAME = "One Planet-One People Certificates";

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});

type AttachmentInput = {
  url: string;       // public URL to fetch (PDF/JPEG)
  filename?: string; // optional suggested filename
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message, attachments = [] } : {
      to: string;
      subject: string;
      message: string;
      attachments?: AttachmentInput[];
    } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing `to` field" }, { status: 400 });
    }

    // Build EmailParams
    const sentFrom = new Sender(MAILER_FROM_ADDRESS, MAILER_FROM_NAME);
    const recipients = [new Recipient(to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject || "Your certificates")
      .setHtml(message || "");

    // Handle attachments
    if (attachments.length > 0) {
      const prepared: { content: string; filename: string; type?: string }[] = [];

      for (const att of attachments) {
        try {
          const res = await fetch(att.url);
          if (!res.ok) {
            console.warn(`Failed to fetch attachment ${att.url}: ${res.status}`);
            continue;
          }

          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");
          const contentType = res.headers.get("content-type") || undefined;

          // Modern URL API for filename
          let filename = att.filename;
          if (!filename) {
            try {
              const urlObj = new URL(att.url);
              filename = urlObj.pathname.split("/").pop() || `attachment.pdf`;
            } catch {
              filename = `attachment.pdf`;
            }
          }

          prepared.push({ content: base64, filename, type: contentType });
        } catch (err) {
          console.error("Error fetching attachment:", err);
        }
      }

      if (prepared.length > 0) {
        emailParams.setAttachments(prepared as any);
      }
    }

    // Send email via MailerSend with proper error handling
    try {
      await mailer.email.send(emailParams);
    } catch (msErr: any) {
      console.error("MailerSend error:", msErr.body?.message || msErr.message);
      return NextResponse.json(
        { error: msErr.body?.message || "Failed to send email" },
        { status: msErr.statusCode || 422 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-email route error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
