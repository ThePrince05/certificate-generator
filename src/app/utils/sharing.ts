import { ShareableCertificate } from "@/types/certificates";

export async function shareCertificate(cert: ShareableCertificate, method: "email" | "whatsapp") {
  const message = cert.shareMessage || `Hi ${cert.recipientName}, here’s your certificate!`;
  const encodedMessage = encodeURIComponent(message);

  if (method === "whatsapp") {
    // Manual share – just open WhatsApp
    const phone = cert.contactInfo?.whatsapp?.replace(/[^0-9]/g, "");
    if (!phone) {
      alert("No WhatsApp number available.");
      return;
    }
    const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(waUrl, "_blank");
    return;
  }

  if (method === "email") {
    // Automatic share via backend or service
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cert.contactInfo?.email,
          subject: `Certificate for ${cert.recipientName}`,
          message,
          attachmentUrl: cert.downloadUrl, // optional
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");
      alert(`Email sent to ${cert.contactInfo?.email}`);
    } catch (err) {
  
      alert("Failed to send email. Please try again.");
    }
  }
}
