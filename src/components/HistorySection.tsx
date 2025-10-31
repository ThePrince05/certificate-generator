"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CleanCertificateData } from "@/types/certificates";
import DownloadDropdown from "@/components/DownloadDropdown";

interface HistorySectionProps {
  history: any[];
  showHistory: boolean;
  searchQuery: string;
  filteredHistory: any[];
  setShowHistory: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFormData: (data: CleanCertificateData) => void;
  saveHistory: (items: any[]) => void;
  handleDeleteHistory: (id: string) => void;
  doDownloadPDF: (item: any) => void;
  doDownloadJPEG: (item: any) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  showHistory,
  searchQuery,
  filteredHistory,
  setShowHistory,
  setSearchQuery,
  setFormData,
  saveHistory,
  handleDeleteHistory,
  doDownloadPDF,
  doDownloadJPEG,
}) => {
  if (!showHistory) return null;

  return (
    <section className="max-w-3xl mx-auto bg-gray-50 border rounded shadow p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Certificate History</h2>
        {history.length > 0 && (
          <button 
            onClick={() => saveHistory([])} 
            className="text-sm text-red-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded p-3"
          />
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          {searchQuery ? `No certificates match "${searchQuery}".` : "No certificates generated yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((h) => (
            <div
              key={h.id}
              className="border p-4 rounded shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setFormData(h)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{h.recipientName}</h3>
                  <p className="text-xs text-gray-500">
                    {h.category} · {h.programName} · {h.fieldOfInterest} · {new Date(h.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <DownloadDropdown
                    onDownloadPDF={(e) => {
                      e?.stopPropagation?.();
                      doDownloadPDF(h);
                    }}
                    onDownloadJPEG={(e) => {
                      e?.stopPropagation?.();
                      doDownloadJPEG(h);
                    }}
                    fontSize="sm"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(h.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 whitespace-pre-line">{h.achievementText}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HistorySection;