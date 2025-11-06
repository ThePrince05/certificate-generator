import { FaShareAlt, FaEnvelope } from "react-icons/fa";
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
  });

  const [customMessage, setCustomMessage] = useState("");
  const [messageOptions, setMessageOptions] = useState<MessageOption[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [loadingMessage, setLoadingMessage] = useState(false);

  // Generate AI messages when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const generateMessages = async () => {
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

        console.log("🔍 API Response status:", res.status);
        const data = await res.json();
        console.log("🔍 API Response data:", data);

        // FIX: Handle both single message and array format
        if (data.message) {
          // Single message format from backend
          const messageOption = {
            id: data.message.id || "1",
            title: data.message.title || "Warm Congratulations",
            content: data.message.content
          };
          setMessageOptions([messageOption]);
          setSelectedMessageId(messageOption.id);
          setCustomMessage(messageOption.content);
        } else if (data.messages && Array.isArray(data.messages)) {
          // Array format (backward compatibility)
          setMessageOptions(data.messages);
          if (data.messages.length > 0) {
            setSelectedMessageId(data.messages[0].id);
            setCustomMessage(data.messages[0].content);
          }
        } else {
          // Fallback if no message is generated
          console.warn("No message generated, using fallback");
          const fallbackMessage = {
            id: "1",
            title: "Congratulations",
            content: `Hello ${firstCert.recipientName || 'Participant'}!

We're excited to share your certificate${recipientCertificates.length > 1 ? 's' : ''} for completing ${programNames.length > 1 ? programNames.slice(0, -1).join(", ") + " and " + programNames.slice(-1) : programNames[0]}.

Your certificate${recipientCertificates.length > 1 ? 's are' : ' is'} attached to this email.

Best regards,
The Team`
          };
          setMessageOptions([fallbackMessage]);
          setSelectedMessageId(fallbackMessage.id);
          setCustomMessage(fallbackMessage.content);
        }
      } catch (err) {
        console.error("Failed to generate messages:", err);
        // Fallback message on error
        const fallbackMessage = {
          id: "1",
          title: "Congratulations",
          content: `Hello ${recipient?.recipientName || 'Participant'}!

We're pleased to share your certificate${recipientCertificates.length > 1 ? 's' : ''} with you.

Your certificate${recipientCertificates.length > 1 ? 's are' : ' is'} attached to this email.

Best regards,
The Team`
        };
        setMessageOptions([fallbackMessage]);
        setSelectedMessageId(fallbackMessage.id);
        setCustomMessage(fallbackMessage.content);
      } finally {
        setLoadingMessage(false);
      }
    };

    generateMessages();
  }, [isOpen, recipientCertificates, editableContactInfo.recipientName]);

  const handleMessageOptionSelect = (option: MessageOption) => {
    setSelectedMessageId(option.id);
    setCustomMessage(option.content);
  };

  const handleShare = async () => {
    if (!recipientCertificates.length) {
      alert("No certificates to share");
      return;
    }

    // Validate email
    if (!editableContactInfo.email || !editableContactInfo.email.includes('@')) {
      alert("Please enter a valid email address");
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
      </div>

      {/* Message Options */}
      {messageOptions.length > 0 && (
        <div>
          <label className="block font-medium mb-2">Choose a message</label>
          <div className="space-y-2">
            {messageOptions.map((option) => (
              <div
                key={option.id}
                className={`border rounded px-3 py-2 cursor-pointer transition-colors ${
                  selectedMessageId === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => handleMessageOptionSelect(option)}
              >
                <div className="font-medium">{option.title}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{option.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      <div>
        <label className="block font-medium mb-2">Message</label>
        {loadingMessage ? (
          <div className="border rounded px-3 py-4 text-gray-500 text-center italic">
            Generating message options with AI...
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
          disabled={loadingMessage}
        >
          <FaShareAlt className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
};