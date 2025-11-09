// components/BatchPreviewSection.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import CertificateTemplate from "@/components/CertificateTemplate";
import { DownloadDropdown } from "@/components/DownloadDropdown";
import { CleanCertificateData } from "@/types/certificates";

interface BatchPreviewSectionProps {
  formData: CleanCertificateData | null;
  getTemplateUrl: (category?: string) => string;
  getCertificateDate: () => string;
  onDownloadPDF: () => void;
  onDownloadJPEG: () => void;
  onCertificateReady?: () => void;
  onCertificateUnready?: () => void;
}

export const BatchPreviewSection: React.FC<BatchPreviewSectionProps> = ({
  formData,
  getTemplateUrl,
  getCertificateDate,
  onDownloadPDF,
  onDownloadJPEG,
  onCertificateReady,
  onCertificateUnready
}) => {
  const [isCertificateReady, setIsCertificateReady] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Certificate readiness detection (same as PreviewSection)
  useEffect(() => {
    if (!formData) {
      setIsCertificateReady(false);
      onCertificateUnready?.();
      return;
    }

    const checkCertificateReadiness = () => {
      const certificateElement = document.getElementById('certificate');
      
      if (!certificateElement) {
        console.log('📋 Certificate element not found yet');
        setIsCertificateReady(false);
        onCertificateUnready?.();
        return false;
      }

      const hasValidDimensions = 
        certificateElement.offsetWidth > 100 && 
        certificateElement.offsetHeight > 100;
      
      const hasSubstantialContent = certificateElement.innerHTML.length > 500;
      
      const criticalElements = [
        '#organization-text',
        '#programName-text', 
        '#recipientName-text',
        '#achievement-text'
      ];
      
      const hasCriticalElements = criticalElements.every(selector => 
        certificateElement.querySelector(selector)
      );

      const images = certificateElement.querySelectorAll('img');
      const allImagesLoaded = images.length === 0 || 
        Array.from(images).every(img => img.complete && img.naturalHeight > 0);

      const computedStyle = window.getComputedStyle(certificateElement);
      const hasValidStyles = 
        computedStyle.display !== 'none' && 
        computedStyle.visibility !== 'hidden' &&
        computedStyle.opacity !== '0';

      const isReady = hasValidDimensions && 
                     hasSubstantialContent && 
                     hasCriticalElements && 
                     allImagesLoaded && 
                     hasValidStyles;

      if (isReady) {
        setIsCertificateReady(true);
        onCertificateReady?.();
        return true;
      } else {
        setIsCertificateReady(false);
        onCertificateUnready?.();
        return false;
      }
    };

    // Check readiness with intervals
    const initialCheck = setTimeout(() => {
      checkCertificateReadiness();
    }, 100);

    let checkCount = 0;
    const maxChecks = 30;
    
    const intervalId = setInterval(() => {
      if (checkCount >= maxChecks) {
        clearInterval(intervalId);
        return;
      }
      checkCertificateReadiness();
      checkCount++;
    }, 1000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalId);
    };
  }, [formData, onCertificateReady, onCertificateUnready]);

  if (!formData) return null;

  const handleDownloadPDF = () => {
    if (!isCertificateReady) {
      console.warn('🚫 PDF download blocked - certificate not ready');
      alert('Certificate is still loading. Please wait a moment and try again.');
      return;
    }
    onDownloadPDF();
  };

  const handleDownloadJPEG = () => {
    if (!isCertificateReady) {
      console.warn('🚫 JPEG download blocked - certificate not ready');
      alert('Certificate is still loading. Please wait a moment and try again.');
      return;
    }
    onDownloadJPEG();
  };

  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold">Certificate Preview</h3>

      {/* Certificate Preview */}
      <div className="w-full flex justify-center overflow-x-auto">
        <div 
          ref={certificateRef}
          className="flex-shrink-0 max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]"
        >
          <CertificateTemplate
            {...formData}
            templateUrl={getTemplateUrl(formData.category)}
            isPreview
            certificateDate={formData.certificateDate ?? getCertificateDate()}
            type={formData.type} 
          />
        </div>
      </div>

      {/* Action Buttons - Only Download, No Share */}
      <div className="flex justify-center gap-3 mt-3 flex-wrap">
        <DownloadDropdown
          onDownloadPDF={handleDownloadPDF}
          onDownloadJPEG={handleDownloadJPEG}
          isDisabled={!isCertificateReady}
        />
      </div>

      {/* Loading Status */}
      {!isCertificateReady && (
        <div className="mt-2 text-sm text-gray-500">
          Preparing certificate preview...
        </div>
      )}
    </div>
  );
};

export default BatchPreviewSection;