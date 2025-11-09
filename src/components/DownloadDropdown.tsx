"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaDownload } from "react-icons/fa";

// Types
interface DownloadDropdownProps {
  onDownloadPDF: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDownloadJPEG: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isDownloading?: boolean;
  isDisabled?: boolean; // ADDED: New prop for certificate readiness
  batchCount?: number;
  fontSize?: "sm" | "base";
}

export const DownloadDropdown = ({
  onDownloadPDF,
  onDownloadJPEG,
  isDownloading = false,
  isDisabled = false, // ADDED: Default value
  batchCount,
  fontSize = "base",
}: DownloadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const sizeClass = fontSize === "sm" ? "text-sm" : "text-base";

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 90;
    const shouldOpenUpward = window.innerHeight - rect.bottom < dropdownHeight + 10;

    setOpenUpward(shouldOpenUpward);
    setDropdownPos({
      top: shouldOpenUpward ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Generate button text based on state
  const getButtonText = () => {
    if (isDownloading) return "Downloading...";
    if (isDisabled) return "Loading..."; // ADDED: Disabled state text
    return `Download${batchCount ? ` (${batchCount})` : ''}`;
  };

  // Determine if the main button should be disabled
  const isButtonDisabled = isDownloading || isDisabled;

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={() => !isButtonDisabled && setIsOpen((prev) => !prev)}
          disabled={isButtonDisabled}
          className={`px-4 py-2 rounded transition ${sizeClass} flex items-center gap-2 ${
            isButtonDisabled 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          <FaDownload className="w-4 h-4" />
          {getButtonText()}
          {!isButtonDisabled && (
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999]"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-40 bg-white rounded-md shadow-lg border overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[DEBUG] PDF button clicked");
                  if (!isDisabled) { // ADDED: Check for disabled state
                    onDownloadPDF(e);
                    setTimeout(() => setIsOpen(false), 50);
                  }
                }}
                disabled={isButtonDisabled} // UPDATED: Use combined disabled state
                className={`flex justify-center items-center w-full px-4 py-2 ${sizeClass} transition ${
                  isButtonDisabled 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "text-white bg-green-500 hover:bg-green-600"
                }`}
              >
                PDF{batchCount ? ` (${batchCount})` : ''}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[DEBUG] JPEG button clicked");
                  if (!isDisabled) { // ADDED: Check for disabled state
                    onDownloadJPEG(e);
                    setTimeout(() => setIsOpen(false), 50);
                  }
                }}
                disabled={isButtonDisabled} // UPDATED: Use combined disabled state
                className={`flex justify-center items-center w-full px-4 py-2 ${sizeClass} transition ${
                  isButtonDisabled 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "text-white bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                JPEG{batchCount ? ` (${batchCount})` : ''}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default DownloadDropdown;