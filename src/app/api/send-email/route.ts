import { NextResponse } from "next/server";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const MAILER_FROM_ADDRESS = "no-reply@test-vz9dlem29qq4kj50.mlsender.net"; 
const MAILER_FROM_NAME = "One Planet-One People Certificates";

console.log("🔧 Initializing MailerSend...");
console.log("📧 From address:", MAILER_FROM_ADDRESS);
console.log("🔑 API Key exists:", !!process.env.MAILERSEND_API_KEY);

const mailer = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY! });

type AttachmentInput = {
  url?: string;
  content?: string; // base64 string
  filename?: string;
};

// Helper function to convert plain text with line breaks to proper HTML
function convertTextToHtml(text: string): string {
  if (!text) return "";
  
  // Convert line breaks to HTML paragraphs and line breaks
  const htmlContent = text
    .split('\n\n') // Split on double line breaks for paragraphs
    .map(paragraph => {
      if (paragraph.trim() === '') return '';
      // Convert single line breaks to <br> within paragraphs
      const withLineBreaks = paragraph.replace(/\n/g, '<br>');
      return `<p style="margin: 0 0 16px 0; line-height: 1.5; font-family: Arial, sans-serif; color: #333; text-align: left;">${withLineBreaks}</p>`;
    })
    .join('');
  
  // Wrap in a proper email container (remove centering)
  return `
    <div style="max-width: 600px; margin: 0; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: left;">
      ${htmlContent}
    </div>
  `;
}

export async function POST(req: Request) {
  console.log("📨 === EMAIL API CALL STARTED ===");
  
  try {
    console.log("📥 Parsing request body...");
    const body = await req.json();
    console.log("✅ Request body parsed:", { 
      to: body.to, 
      subject: body.subject,
      messageLength: body.message?.length || 0,
      attachmentsCount: body.attachments?.length || 0 
    });

    const { to, subject, message, attachments = [] }: {
      to: string;
      subject: string;
      message: string;
      attachments?: AttachmentInput[];
    } = body;

    if (!to) {
      console.error("❌ Missing 'to' field");
      return NextResponse.json({ error: "Missing `to` field" }, { status: 400 });
    }

    console.log("👤 Creating sender and recipient...");
    const sentFrom = new Sender(MAILER_FROM_ADDRESS, MAILER_FROM_NAME);
    const recipients = [new Recipient(to)];
    console.log("✅ Created:", { from: MAILER_FROM_ADDRESS, to });

    // Convert the plain text message to proper HTML
    const htmlMessage = convertTextToHtml(message);
    console.log("📝 Converted message to HTML:", {
      originalLength: message?.length || 0,
      htmlLength: htmlMessage.length
    });

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject || "Your certificates")
      .setHtml(htmlMessage || convertTextToHtml("Please find your certificate(s) attached."));

    console.log("📎 Processing attachments...");
    console.log("📎 Total attachments to process:", attachments.length);
    
    const processed: { content: string; filename: string; disposition: string }[] = [];

    for (const [i, att] of attachments.entries()) {
      console.log(`\n📎 Processing attachment ${i + 1}/${attachments.length}:`, {
        hasContent: !!att.content,
        hasUrl: !!att.url,
        filename: att.filename || 'not provided'
      });

      if (att.content) {
        console.log(`✅ Attachment ${i + 1}: Using base64 content`);
        processed.push({
          content: att.content,
          filename: att.filename || `attachment_${i}.pdf`,
          disposition: "attachment",
        });
        console.log(`✅ Added base64 attachment: ${att.filename || `attachment_${i}.pdf`}`);
        
      } else if (att.url) {
    
        try {
          const res = await fetch(att.url);
          console.log(`📡 URL fetch response: ${res.status} ${res.statusText}`);
          
          if (!res.ok) {
            console.warn(`❌ Attachment ${i + 1} fetch failed: ${res.status} ${res.statusText}`);
            continue;
          }
          
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          console.log(`✅ Fetched ${buffer.length} bytes from URL`);
          
          let filename = att.filename;
          if (!filename) {
            try {
              filename = new URL(att.url).pathname.split("/").pop() || `attachment_${i}.pdf`;
              console.log(`📝 Extracted filename from URL: ${filename}`);
            } catch {
              filename = `attachment_${i}.pdf`;
              console.log(`📝 Using default filename: ${filename}`);
            }
          }

          processed.push({
            content: buffer.toString("base64"),
            filename,
            disposition: "attachment",
          });
          console.log(`✅ Added URL attachment: ${filename}`);

        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error(`❌ Error processing attachment ${i + 1}:`, errorMessage);
        }
      } else {
        console.warn(`⚠️ Attachment ${i + 1}: No content or URL provided, skipping`);
      }
    }

    console.log(`\n📎 Attachment processing complete:`);
    console.log(`📎 Successfully processed: ${processed.length}/${attachments.length} attachments`);

    if (processed.length > 0) {
      console.log("📎 Setting attachments on email...");
      // Use type assertion instead of any
      emailParams.setAttachments(processed as Parameters<typeof emailParams.setAttachments>[0]);
    } else {
      console.log("ℹ️ No attachments to add to email");
    }

    console.log("🚀 Sending email via MailerSend...");
    console.log("⏳ This may take a moment...");
    
    const startTime = Date.now();
    await mailer.email.send(emailParams);
    const endTime = Date.now();
    
    console.log(`✅ Email sent successfully! Time: ${endTime - startTime}ms`);
    console.log("📨 === EMAIL API CALL COMPLETED SUCCESSFULLY ===");

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error("❌ === EMAIL API CALL FAILED ===");
    
    // Proper error type checking
    if (err instanceof Error) {
      console.error("❌ Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    } else {
      console.error("❌ Unknown error type:", err);
    }
    
    // Log additional MailerSend specific error details if available
    // Note: You might need to adjust this based on the actual error structure from MailerSend
    if (err && typeof err === 'object' && 'response' in err) {
      const errorWithResponse = err as { response?: { status?: number; statusText?: string; data?: unknown } };
      console.error("📡 MailerSend API Response:", {
        status: errorWithResponse.response?.status,
        statusText: errorWithResponse.response?.statusText,
        data: errorWithResponse.response?.data
      });
    }
    
    if (err && typeof err === 'object' && 'code' in err) {
      console.error("🔍 Error code:", (err as { code?: unknown }).code);
    }
    
    console.error("❌ === END ERROR DETAILS ===");
    
    const errorMessage = err instanceof Error ? err.message : "Failed to send email";
    
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 });
  }
}