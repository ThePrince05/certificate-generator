import { FaShareAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { FaEnvelope, FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { ShareableCertificate, ContactInfo } from "@/types/certificates";
import { sendCertificatesEmail , ClientAttachment } from "@/app/utils/sharing";
import { generatePDFBlob } from "@/app/utils/generatePDF";

type ShareModalProps = {
  recipientCertificates: ShareableCertificate[];
  contactInfoList?: ContactInfo[];
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  email: <FaEnvelope className="text-gray-700" size={28}/>,
  whatsapp: <FaWhatsapp className="text-green-500" size={28} />,
  facebook: <FaFacebookF className="text-blue-600" />,
  linkedin: <FaLinkedinIn className="text-blue-500" />,
  twitter: <FaTwitter className="text-blue-400" />,
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
    email: defaultEmail || recipient.contactInfo?.email || recipient.email || "",
    recipientName: recipient.contactInfo?.recipientName || recipient.recipientName || "Unknown",
    whatsapp: recipient.contactInfo?.whatsapp || "",
    phone: recipient.contactInfo?.phone || "",
    facebook: recipient.contactInfo?.facebook || "",
    linkedin: recipient.contactInfo?.linkedin || "",
    twitter: recipient.contactInfo?.twitter || "",
    preferredMethod: recipient.contactInfo?.preferredMethod,
  });

  const [customMessage, setCustomMessage] = useState("");
  const [platforms, setPlatforms] = useState({
    email: !!editableContactInfo.email,
    whatsapp: !!editableContactInfo.whatsapp,
  });
  const [loadingMessage, setLoadingMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const generateMessage = async () => {
      const DISABLE_GEMINI = false; // 🔹 toggle Gemini
      if (DISABLE_GEMINI) {
        setCustomMessage(""); // fallback message
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
          }),
        });

        const data = await res.json();
        if (data.message) setCustomMessage(data.message);
      } catch (err) {
        // console.error("Failed to fetch Gemini message:", err);
      } finally {
        setLoadingMessage(false);
      }
    };

    generateMessage();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const rec = recipientCertificates?.[0];
    if (!rec) return;

    const csvMatch = contactInfoList.find(
      (c) => c.email?.trim().toLowerCase() === rec.email?.trim().toLowerCase()
    );

    const contactToUse: ContactInfo = {
      email: defaultEmail || rec.email || csvMatch?.email || "",
      recipientName: rec.contactInfo?.recipientName || rec.recipientName || "Unknown",
      whatsapp: csvMatch?.whatsapp || rec.contactInfo?.whatsapp || "",
      phone: csvMatch?.phone || rec.contactInfo?.phone || "",
      facebook: csvMatch?.facebook || rec.contactInfo?.facebook || "",
      linkedin: csvMatch?.linkedin || rec.contactInfo?.linkedin || "",
      twitter: csvMatch?.twitter || rec.contactInfo?.twitter || "",
      preferredMethod: rec.contactInfo?.preferredMethod,
    };

    setEditableContactInfo(contactToUse);

    setPlatforms({
      email: !!contactToUse.email,
      whatsapp: !!contactToUse.whatsapp,
    });
  }, [isOpen, recipientCertificates, contactInfoList, defaultEmail]);

  const handleShare = async () => {
    function sanitizeFilename(name: string) {
      return name
        .trim()
        .replace(/[/\\?%*:|"<>]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/__+/g, "_")
        .slice(0, 120);
    }

    try {
      if (!recipientCertificates.length) {
        console.warn("No certificates to share");
        return;
      }

      // Generate attachments
      const attachments: ClientAttachment[] = (
        await Promise.all(
          recipientCertificates.map(async (cert) => {
            const baseName = `${cert.recipientName ?? "recipient"} - ${cert.programName ?? "certificate"}`;
            const filename = sanitizeFilename(
              `${baseName}${cert.certificateDate ? ` - ${cert.certificateDate}` : ""}.pdf`
            );

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

            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(",")[1]);
              reader.onerror = reject;
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

      const to = editableContactInfo.email;
      const subject = `Your Certificate${recipientCertificates.length > 1 ? "s" : ""} from ${recipientCertificates[0]?.organization || ""}`;
      const messageToSend = customMessage || recipientCertificates[0]?.shareMessage || "Please find your certificate(s) attached.";

      // Send email
      await sendCertificatesEmail({ to, subject, message: messageToSend, attachments });

      alert("Certificates shared successfully!");
    } catch (err) {
      console.error("send-email route error:", err);
      alert("Failed to send email. Please try again.");
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-11/12 max-w-2xl rounded p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          Share with <span className="text-blue-600">{recipient.recipientName}</span>
        </h2>

        <div className="space-y-2">
          {["email", "whatsapp"].map((platform) => (
            <div key={platform} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={platforms[platform as keyof typeof platforms] || false}
                onChange={(e) =>
                  setPlatforms((prev) => ({ ...prev, [platform]: e.target.checked }))
                }
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2 flex-1">
                {platformIcons[platform]}
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={editableContactInfo[platform as keyof ContactInfo] || ""}
                  placeholder={platform}
                  onChange={(e) =>
                    setEditableContactInfo((prev) => ({ ...prev, [platform]: e.target.value }))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block font-medium mb-1">Custom Message</label>
          {loadingMessage ? (
            <div className="border rounded px-2 py-3 text-gray-500 text-center italic">
              Generating message with AI...
            </div>
          ) : (
            <textarea
              className="w-full border rounded px-2 py-1"
              rows={12}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter a custom message (leave empty to use AI suggestion)"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
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
    </div>
  );
};
