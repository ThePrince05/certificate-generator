"use client";

import { motion } from "framer-motion";
import { FaShareAlt } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import CertificateTemplate from "@/components/CertificateTemplate";
import { DownloadDropdown } from "@/components/DownloadDropdown";
import { CleanCertificateData } from "@/types/certificates";

interface PreviewSectionProps {
  formData: CleanCertificateData | null;
  getTemplateUrl: (category?: string) => string;
  getCertificateDate: () => string;
  onShare: (e?: React.MouseEvent) => void;
  onDownloadPDF: () => void;
  onDownloadJPEG: () => void;
  onCertificateReady?: () => void;
  onCertificateUnready?: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  formData,
  getTemplateUrl,
  getCertificateDate,
  onShare,
  onDownloadPDF,
  onDownloadJPEG,
  onCertificateReady,
  onCertificateUnready
}) => {
  const [isCertificateReady, setIsCertificateReady] = useState(false);
  const [readinessCheckCount, setReadinessCheckCount] = useState(0);
  const certificateRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxChecksRef = useRef(0);

  // Enhanced certificate readiness detection
  useEffect(() => {
    if (!formData) {
      setIsCertificateReady(false);
      onCertificateUnready?.();
      return;
    }

    // Reset counters when formData changes
    setReadinessCheckCount(0);
    maxChecksRef.current = 0;
    setIsCertificateReady(false);

    const checkCertificateReadiness = () => {
      const certificateElement = document.getElementById('certificate');
      
      if (!certificateElement) {
        console.log('📋 Certificate element not found yet');
        setIsCertificateReady(false);
        onCertificateUnready?.();
        return false;
      }

      // Check dimensions
      const hasValidDimensions = 
        certificateElement.offsetWidth > 100 && 
        certificateElement.offsetHeight > 100;
      
      // Check content
      const hasSubstantialContent = certificateElement.innerHTML.length > 500;
      
      // Check for critical elements
      const criticalElements = [
        '#organization-text',
        '#programName-text', 
        '#recipientName-text',
        '#achievement-text'
      ];
      
      const hasCriticalElements = criticalElements.every(selector => 
        certificateElement.querySelector(selector)
      );

      // Check images are loaded
      const images = certificateElement.querySelectorAll('img');
      const allImagesLoaded = images.length === 0 || 
        Array.from(images).every(img => img.complete && img.naturalHeight > 0);

      // Check for CSS issues (basic check)
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

      const currentCheckCount = readinessCheckCount + 1;
      setReadinessCheckCount(currentCheckCount);

      console.log('🔍 Certificate readiness check:', {
        count: currentCheckCount,
        hasValidDimensions,
        hasSubstantialContent: hasSubstantialContent ? `${certificateElement.innerHTML.length} chars` : 'too short',
        hasCriticalElements,
        allImagesLoaded,
        hasValidStyles,
        isReady
      });

      if (isReady) {
        setIsCertificateReady(true);
        onCertificateReady?.();
        
        // STOP CHECKING once ready
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        return true;
      } else {
        setIsCertificateReady(false);
        onCertificateUnready?.();
        return false;
      }
    };

    // Initial check after a short delay
    const initialCheck = setTimeout(() => {
      checkCertificateReadiness();
    }, 100);

    // Set up periodic checking with maximum limit
    maxChecksRef.current = 30; // Maximum 30 checks (~30 seconds)
    let checkCount = 0;
    
    const performCheck = () => {
      if (checkCount >= maxChecksRef.current) {
        console.warn('⚠️ Certificate failed to become ready after maximum checks');
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        return;
      }

      checkCertificateReadiness();
      checkCount++;
    };

    // Start periodic checks (every second)
    checkIntervalRef.current = setInterval(performCheck, 1000);

    return () => {
      clearTimeout(initialCheck);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [formData, onCertificateReady, onCertificateUnready]); // Removed readinessCheckCount from dependencies

  // Additional check when images load
  useEffect(() => {
    if (!formData || isCertificateReady) return;

    const handleImageLoad = () => {
      console.log('🖼️ Image loaded, rechecking certificate readiness');
      // Perform a single check when images load
      setTimeout(() => {
        const certificateElement = document.getElementById('certificate');
        if (certificateElement) {
          const isReady = certificateElement.offsetWidth > 100 && 
                         certificateElement.offsetHeight > 100;
          if (isReady && !isCertificateReady) {
            setIsCertificateReady(true);
            onCertificateReady?.();
            // Stop any ongoing checks
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }
      }, 50);
    };

    const certificateElement = document.getElementById('certificate');
    if (certificateElement) {
      const images = certificateElement.querySelectorAll('img');
      images.forEach(img => {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad);
      });

      return () => {
        images.forEach(img => {
          img.removeEventListener('load', handleImageLoad);
          img.removeEventListener('error', handleImageLoad);
        });
      };
    }
  }, [formData, isCertificateReady, onCertificateReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  if (!formData) return null;

  const handleShareClick = (e: React.MouseEvent) => {
    console.log("🟡 PreviewSection share button clicked", { 
      hasFormData: !!formData,
      isCertificateReady,
      readinessCheckCount,
      eventType: e.type 
    });

    if (!isCertificateReady) {
      e.preventDefault();
      console.warn('🚫 Share blocked - certificate not ready');
      alert('Certificate is still loading. Please wait a moment and try again.');
      return;
    }

    onShare(e);
  };

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

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mt-3 flex-wrap">
        <button
          onClick={handleShareClick}
          disabled={!isCertificateReady}
          className={`px-4 py-2 rounded transition flex items-center gap-2 ${
            isCertificateReady
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FaShareAlt className="w-4 h-4" />
          {isCertificateReady ? 'Share' : 'Loading...'}
        </button>

        <DownloadDropdown
          onDownloadPDF={handleDownloadPDF}
          onDownloadJPEG={handleDownloadJPEG}
          isDisabled={!isCertificateReady}
        />
      </div>

    </div>
  );
};

export default PreviewSection;