"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CleanCertificateData } from "@/types/certificates";
import DownloadDropdown from "@/components/DownloadDropdown";
import { useState } from "react";

// Updated interface - remove person-related props
interface HistorySectionProps {
  history: any[];
  showHistory: boolean;
  searchQuery: string;
  filteredHistory: any[];
  setShowHistory: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFormData: (data: CleanCertificateData) => void;
  saveHistory: () => Promise<void>;
  handleDeleteHistory: (id: string) => Promise<void>;
  doDownloadPDF: (item: any) => void;
  doDownloadJPEG: (item: any) => void;
  isDeleting?: boolean;
  // REMOVED: selectedPerson and personCertificates props
}

// Delete Confirmation Dialog Component (unchanged)
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">{title}</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                exit={{ width: 0 }}
                className="h-1 bg-blue-500 rounded mb-4"
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex items-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clear All Confirmation Dialog Component (unchanged)
interface ClearAllConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ClearAllConfirmationDialog: React.FC<ClearAllConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Clear All History</h2>
          <p className="text-gray-700 mb-6">
            Are you sure you want to clear all certificate history? This action cannot be undone and will remove all items.
          </p>
          
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                exit={{ width: 0 }}
                className="h-1 bg-blue-500 rounded mb-4"
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex items-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isLoading ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  isDeleting = false,
  // REMOVED: selectedPerson and personCertificates from props
}) => {
  // State for dialogs and loading
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
  }>({
    isOpen: false,
    itemId: null,
    itemName: ""
  });

  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Handle single item deletion
  const handleDeleteClick = (itemId: string, itemName: string) => {
    setDeleteDialog({
      isOpen: true,
      itemId,
      itemName
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.itemId) {
      setIsDeletingSingle(true);
      try {
        await handleDeleteHistory(deleteDialog.itemId);
      } finally {
        setIsDeletingSingle(false);
        setDeleteDialog({ isOpen: false, itemId: null, itemName: "" });
      }
    }
  };

  // Handle clear all
  const handleClearAllClick = () => {
    setClearAllDialog(true);
  };

  const handleClearAllConfirm = async () => {
    setIsClearingAll(true);
    try {
      await saveHistory();
    } finally {
      setIsClearingAll(false);
      setClearAllDialog(false);
    }
  };

  if (!showHistory) return null;

  return (
    <>
      <section className="max-w-3xl mx-auto border rounded shadow p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Certificate History</h2>
          {history.length > 0 && (
            <button 
              onClick={handleClearAllClick}
              disabled={isClearingAll || isDeleting}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClearingAll ? "Clearing..." : "Clear all"}
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
              className="w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border p-4 rounded shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setFormData(h)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{h.recipientName}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {h.category} · {h.programName} · {h.fieldOfInterest} · {new Date(h.generatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
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
                        handleDeleteClick(h.id, h.recipientName);
                      }}
                      disabled={isDeleting || isDeletingSingle || isClearingAll}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 whitespace-pre-line mt-2">{h.achievementText}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Single Item Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })}
        onConfirm={handleDeleteConfirm}
        title="Delete Certificate"
        message={`Are you sure you want to delete the certificate for "${deleteDialog.itemName}"? This action cannot be undone.`}
        isLoading={isDeletingSingle}
      />

      {/* Clear All Dialog */}
      <ClearAllConfirmationDialog
        isOpen={clearAllDialog}
        onClose={() => setClearAllDialog(false)}
        onConfirm={handleClearAllConfirm}
        isLoading={isClearingAll}
      />
    </>
  );
};

export default HistorySection;