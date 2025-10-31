"use client";

import { useState, useEffect, useRef } from "react";

interface MultiDownloadDropdownProps {
  onDownloadPDF: () => void;
  onDownloadJPEG: () => void;
  isDownloading: boolean;
}

const MultiDownloadDropdown = ({
  onDownloadPDF,
  onDownloadJPEG,
  isDownloading,
}: MultiDownloadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 90;
      setOpenUpward(spaceBelow < dropdownHeight);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2"
      >
        {isDownloading ? "Generating..." : "Download ZIP"}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          } w-44 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden`}
        >
          <button
            onClick={() => {
              onDownloadPDF();
              setIsOpen(false);
            }}
            disabled={isDownloading}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white transition"
          >
            PDF
          </button>
          <button
            onClick={() => {
              onDownloadJPEG();
              setIsOpen(false);
            }}
            disabled={isDownloading}
            className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white transition"
          >
            JPEG
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiDownloadDropdown;