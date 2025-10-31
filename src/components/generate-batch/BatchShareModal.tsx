"use client";

import { FaShareAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { ShareableCertificate, ContactInfo } from "@/types/certificates";
import { sendCertificatesEmail, ClientAttachment } from "@/app/utils/sharing";
import { generatePDFBlob } from "@/app/utils/generatePDF";

type BatchShareModalProps = {
  recipients: { certificates: ShareableCertificate[]; contactInfo: ContactInfo }[];
  isOpen: boolean;
  onClose: () => void;
  defaultMessage?: string;
};

export const BatchShareModal = ({ recipients, isOpen, onClose, defaultMessage }: BatchShareModalProps) => {
  const [customMessage, setCustomMessage] = useState(defaultMessage || "");
  const [loadingMessage, setLoadingMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCustomMessage(defaultMessage || "");
  }, [isOpen, defaultMessage]);

  const handleShare = async () => {
    try {
      for (const rec of recipients) {
        const attachments: ClientAttachment[] = (
          await Promise.all(
            rec.certificates.map(async (cert) => {
              const sanitizeFilename = (name: string) =>
                name.trim().replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").replace(/__+/g, "_").slice(0, 120);

              const filename = sanitizeFilename(
                `${cert.recipientName ?? "recipient"} - ${cert.programName ?? "certificate"}${cert.certificateDate ? ` - ${cert.certificateDate}` : ""}.pdf`
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

        if (!attachments.length) continue;

        await sendCertificatesEmail({
          to: rec.contactInfo.email,
          subject: `Your Certificate${rec.certificates.length > 1 ? "s" : ""} from ${rec.certificates[0]?.organization}`,
          message: customMessage || rec.certificates[0]?.shareMessage || "Please find your certificate(s) attached.",
          attachments,
        });
      }

      alert("Certificates shared successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to send emails. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-11/12 max-w-3xl rounded p-6 space-y-4">
        <h2 className="text-xl font-semibold">Share Certificates</h2>

        <div className="space-y-2 max-h-96 overflow-y-auto border p-2 rounded">
          {recipients.map((rec, i) => (
            <div key={i} className="flex flex-col border-b py-2">
              <span className="font-medium">{rec.contactInfo.recipientName}</span>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full mt-1"
                value={rec.contactInfo.email}
                onChange={(e) => {
                  rec.contactInfo.email = e.target.value;
                }}
              />
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
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter a custom message (leave empty to use default)"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
            onClick={handleShare}
          >
            <FaShareAlt className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
};
