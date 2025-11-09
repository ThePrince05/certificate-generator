import { FaShareAlt, FaEnvelope, FaCheck, FaExclamationTriangle } from "react-icons/fa";
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

type DialogType = 'success' | 'error' | null;

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
  const [isSharing, setIsSharing] = useState(false);
  const [dialog, setDialog] = useState<{ type: DialogType; message: string } | null>(null);

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

  const showDialog = (type: DialogType, message: string) => {
    setDialog({ type, message });
    
    // Auto-hide success dialog after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        setDialog(null);
      }, 3000);
    }
  };

  const handleShare = async () => {
    if (!recipientCertificates.length) {
      showDialog('error', "No certificates to share");
      return;
    }

    // Validate email
    if (!editableContactInfo.email || !editableContactInfo.email.includes('@')) {
      showDialog('error', "Please enter a valid email address");
      return;
    }

    try {
      setIsSharing(true);

      // Generate PDF attachments with better error handling
      const attachmentPromises = recipientCertificates.map(async (cert) => {
        try {
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

          console.log(`🔄 Generating PDF for: ${filename}`);
          
          const blob = await generatePDFBlob(pdfOffsets);
          
          if (!blob) {
            console.error(`❌ No blob generated for certificate: ${filename}`);
            return null;
          }

          console.log(`✅ PDF generated successfully, size: ${blob.size} bytes`);

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          return { content: base64, filename } as ClientAttachment;
        } catch (error) {
          console.error(`❌ Failed to generate PDF for certificate:`, cert, error);
          return null;
        }
      });

      const attachments = (await Promise.all(attachmentPromises)).filter((a): a is ClientAttachment => a !== null);

      console.log(`📎 Generated ${attachments.length} out of ${recipientCertificates.length} attachments`);

      if (!attachments.length) {
        showDialog('error', "No certificates were generated. Please check the certificate data and try again.");
        return;
      }

      if (attachments.length < recipientCertificates.length) {
        console.warn(`⚠️ Only ${attachments.length} out of ${recipientCertificates.length} certificates were generated`);
        // Continue with partial success
      }

      // Send email
      await sendCertificatesEmail({
        to: editableContactInfo.email,
        subject: `Your Certificate${recipientCertificates.length > 1 ? "s" : ""} from ${recipientCertificates[0]?.organization || ""}`,
        message: customMessage || "Please find your certificate(s) attached.",
        attachments,
      });

      showDialog('success', `Certificates shared successfully with ${editableContactInfo.email}!`);
      
      // Close modal after successful share (with slight delay for user to see success message)
      // setTimeout(() => {
      //   onClose();
      //   setDialog(null);
      // }, 1500);
      
    } catch (err) {
      console.error("Failed to share certificates:", err);
      showDialog('error', "Failed to send email. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const closeDialog = () => {
    setDialog(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Custom Dialog - REMOVED background overlay */}
      {dialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 transform transition-all duration-300 scale-100 opacity-100 ${
            dialog.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 ${
                dialog.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {dialog.type === 'success' ? (
                  <FaCheck className="w-6 h-6" />
                ) : (
                  <FaExclamationTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  dialog.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {dialog.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-gray-700 mt-1">{dialog.message}</p>
              </div>
              {dialog.type === 'error' && (
                <button
                  onClick={closeDialog}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {dialog.type === 'success' && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-3000"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Modal */}
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
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isSharing}
          >
            Cancel
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleShare}
            disabled={loadingMessage || isSharing}
          >
            {isSharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sharing...
              </>
            ) : (
              <>
                <FaShareAlt className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};