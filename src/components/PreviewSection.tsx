"use client";

import { motion } from "framer-motion";
import { FaShareAlt } from "react-icons/fa";
import CertificateTemplate from "@/components/CertificateTemplate";
import { DownloadDropdown } from "@/components/DownloadDropdown";
import { CleanCertificateData } from "@/types/certificates";

interface PreviewSectionProps {
  formData: CleanCertificateData | null;
  getTemplateUrl: (category?: string) => string;
  getCertificateDate: () => string;
  onShare: (e?: React.MouseEvent) => void; // Update this line - make event optional
  onDownloadPDF: () => void;
  onDownloadJPEG: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  formData,
  getTemplateUrl,
  getCertificateDate,
  onShare,
  onDownloadPDF,
  onDownloadJPEG,
}) => {
  if (!formData) return null;

  return (
    <div className="text-center">
      <div className="w-full flex justify-center overflow-x-auto py-4">
        <div className="flex-shrink-0 max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
          <CertificateTemplate
          {...formData}
          templateUrl={getTemplateUrl(formData.category)}
          isPreview
          certificateDate={formData.certificateDate ?? getCertificateDate()}
          type={formData.type} 
        />

        </div>
      </div>

      <div className="flex justify-center gap-3 mt-3 flex-wrap">
       <button
  onClick={(e) => {
    console.log("🟡 PreviewSection share button clicked", { 
      hasFormData: !!formData,
      eventType: e.type 
    });
    onShare(e);
  }}
  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
>
  <FaShareAlt className="w-4 h-4" />
  Share
</button>

        <DownloadDropdown
          onDownloadPDF={onDownloadPDF}
          onDownloadJPEG={onDownloadJPEG}
        />
      </div>
    </div>
  );
};

export default PreviewSection;