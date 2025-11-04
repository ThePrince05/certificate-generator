import { FaShareAlt, FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { useEffect, useState } from "react";
import { ShareableCertificate, ContactInfo } from "@/types/certificates";
import { sendCertificatesEmail, ClientAttachment } from "@/app/utils/sharing";
import { generatePDFBlob } from "@/app/utils/generatePDF";

type ShareModalProps = {
  recipientCertificates: ShareableCertificate[];
  contactInfoList?: ContactInfo[];
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
};

type MessageOption = {
  id: string;
  title: string;
  content: string;
};

export const ShareModal = ({
  recipientCertificates,
  isOpen,
  onClose,
  contactInfoList = [],
  defaultEmail,
}: ShareModalProps) => {
  const recipient = recipientCertificates[0];

  const [editableContactInfo, setEditableContactInfo] = useState<ContactInfo>({
    email: defaultEmail || recipient?.contactInfo?.email || recipient?.email || "",
    recipientName: recipient?.contactInfo?.recipientName || recipient?.recipientName || "Unknown",
    whatsapp: recipient?.contactInfo?.whatsapp || "",
  });

  const [customMessage, setCustomMessage] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState<MessageOption | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);

  // Generate AI message when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const generateMessage = async () => {
      const DISABLE_GEMINI = false;
      if (DISABLE_GEMINI) {
        setCustomMessage("");
        return;
      }

      try {
        setLoadingMessage(true);
        if (recipientCertificates.length === 0) return;

        const firstCert = recipientCertificates[0];
        const programNames = recipientCertificates.map(c => c.programName || "a program");

        const res = await fetch("/api/generate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientName: firstCert.recipientName || editableContactInfo.recipientName || "Participant",
            programs: programNames,
            organization: firstCert.organization || "our organization",
            certificateTypes: recipientCertificates.map(c => c.type || "Achievement")
          }),
        });

        const data = await res.json();
        if (data.message) {
          setGeneratedMessage(data.message);
          setCustomMessage(data.message.content);
        } else {
          // Fallback if API response structure is unexpected
          setCustomMessage(`Hello ${firstCert.recipientName || editableContactInfo.recipientName || "Participant"}!

We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning your Certificate${recipientCertificates.length > 1 ? "s" : ""} of ${recipientCertificates.map(c => c.type || "Achievement").join(", ")} for completing ${programNames.length > 1 ? programNames.slice(0, -1).join(", ") + " and " + programNames.slice(-1) : programNames[0]} is a truly impressive milestone, showcasing your dedication and growth.

Your well-deserved certificate${recipientCertificates.length > 1 ? "s are" : " is"} attached to this email, a testament to your hard work and commitment.

We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!

Please feel free to share this with your friends, family and on-line connections (LinkedIn, Social Media Platforms) so they can appreciate the work you do.

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the Betterment of Kids, People and the Planet!`);
        }
      } catch (err) {
        // Fallback message
        console.error("Failed to generate message:", err);
        const firstName = recipient?.recipientName?.split(' ')[0] || "Participant";
        const programNames = recipientCertificates.map(c => c.programName || "a program");
        const formattedPrograms = programNames.length > 1 
          ? programNames.slice(0, -1).join(", ") + " and " + programNames.slice(-1)
          : programNames[0];
        const formattedTypes = recipientCertificates.map(c => c.type || "Achievement").join(", ");
        
        setCustomMessage(`Hello ${firstName}!

We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning your Certificate of ${formattedTypes} for completing ${formattedPrograms} is a truly impressive milestone, showcasing your dedication and growth.

Your well-deserved certificate${recipientCertificates.length > 1 ? "s are" : " is"} attached to this email, a testament to your hard work and commitment.

We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!

Please feel free to share this with your friends, family and on-line connections (LinkedIn, Social Media Platforms) so they can appreciate the work you do

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the Betterment of Kids, People and the Planet!`);
      } finally {
        setLoadingMessage(false);
      }
    };

    generateMessage();
  }, [isOpen]);

  const handleShare = async () => {
    if (!recipientCertificates.length) {
      alert("No certificates to share");
      return;
    }

    try {
      // Generate PDF attachments
      const attachments: ClientAttachment[] = (
        await Promise.all(
          recipientCertificates.map(async (cert) => {
            const baseName = `${cert.recipientName || "recipient"} - ${cert.programName || "certificate"}`;
            const filename = `${baseName}${cert.certificateDate ? ` - ${cert.certificateDate}` : ""}.pdf`
              .replace(/[/\\?%*:|"<>]/g, "_")
              .replace(/\s+/g, "_");

            const pdfOffsets = {
              organization: -30,
              programName: -15,
              achievementText: -15,
              recipientName: -16,
              certificateDate: -8,
              signature: 1,
              signatory: -10,
            };

            const blob = await generatePDFBlob(pdfOffsets);
            if (!blob) return null;

            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(",")[1]);
              reader.readAsDataURL(blob);
            });

            return { content: base64, filename } as ClientAttachment;
          })
        )
      ).filter((a): a is ClientAttachment => a !== null);

      if (!attachments.length) {
        alert("No certificates were generated.");
        return;
      }

      // Send email
      await sendCertificatesEmail({
        to: editableContactInfo.email,
        subject: `Your Certificate${recipientCertificates.length > 1 ? "s" : ""} from ${recipientCertificates[0]?.organization || ""}`,
        message: customMessage || "Please find your certificate(s) attached.",
        attachments,
      });

      alert("Certificates shared successfully!");
      onClose();
    } catch (err) {
      console.error("Failed to share certificates:", err);
      alert("Failed to send email. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">
        Share with <span className="text-blue-600">{recipient?.recipientName || "Recipient"}</span>
      </h2>

      {/* Email Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <FaEnvelope className="text-gray-700 text-xl" />
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            value={editableContactInfo.email}
            placeholder="Email address"
            onChange={(e) => setEditableContactInfo(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-3">
          <FaWhatsapp className="text-green-500 text-xl" />
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={editableContactInfo.whatsapp}
            placeholder="WhatsApp number (optional)"
            onChange={(e) => setEditableContactInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
          />
        </div>
      </div>

    
      {/* Message */}
      <div>
        <label className="block font-medium mb-2">Message</label>
        {loadingMessage ? (
          <div className="border rounded px-3 py-4 text-gray-500 text-center italic">
            Generating warm congratulatory message with AI...
          </div>
        ) : (
          <textarea
            className="w-full border rounded px-3 py-2 resize-none"
            rows={12}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter a custom message..."
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button 
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
          onClick={handleShare}
        >
          <FaShareAlt className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
};