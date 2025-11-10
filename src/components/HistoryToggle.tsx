"use client";

import { CleanCertificateData } from "@/types/certificates";

// Define a proper type for history items
interface HistoryItem extends CleanCertificateData {
  id: string;
  generatedAt: string;
}

interface HistoryToggleProps {
  history: HistoryItem[];
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

export const HistoryToggle: React.FC<HistoryToggleProps> = ({
  history,
  showHistory,
  setShowHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="flex justify-center mb-4">
      <button
        onClick={() => setShowHistory(!showHistory)} 
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        {showHistory ? "Hide History" : "Show History"}
      </button>
    </div>
  );
};

export default HistoryToggle;