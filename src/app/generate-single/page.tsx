"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { FaShareAlt, FaFilePdf, FaFileImage, FaDownload } from "react-icons/fa";

// Contexts
import { useOrganization } from "../context/OrganizationContext";
import { useTemplates } from "../context/TemplateContext";
import { useData } from "../context/DataContext";

// Components
import CertificateForm from "@/components/generate-single/CertificateForm";
import { ShareModal } from "@/components/generate-single/ShareModal";

// Utilities
import { generatePDF, generateJPEG } from "../utils/generatePDF";
import { handleMultiDownload } from "@/app/utils/multiDownload";

// Types & Data
import { CleanCertificateData } from "@/types/certificates";
import { contactInfoList } from "@/data/SocialMediaData";

import PersonSearch from "@/components/generate-single/PersonSearch";
import PreviewSection from "@/components/generate-single/PreviewSection"; 
import DownloadDropdown from "@/components/DownloadDropdown";
import MultiDownloadDropdown from "@/components/MultiDownloadDropdown";
import HistoryToggle from "@/components/HistoryToggle";
import HistorySection from "@/components/HistorySection";

type DemoCertificate = CleanCertificateData & {
  id: string;
};

// Custom Hooks
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(e.matches);

    onChange(mq);

    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
    } else {
      mq.addListener(onChange);
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", onChange);
      } else {
        mq.removeListener(onChange);
      }
    };
  }, []);

  return isDesktop;
}

// ADDED: getCertificateDate function
const getCertificateDate = () => {
  const today = new Date();
  const month = today.toLocaleString("en-GB", { month: "long" });
  const year = today.getFullYear();
  return `Awarded ${month} ${year}`;
};

// Main Component
export default function GenerateSingle() {
  const router = useRouter();
  
  // Remove unused variables
  const _isDesktop = useIsDesktop();
  
  const { selectedOrg } = useOrganization();
  const { selectedTemplate } = useTemplates();
  const { 
    groups: _groups, 
    isDataLoaded, 
    loading, 
    history,
    demoData,
    saveHistory,
    deleteHistoryItem,
    clearHistory
  } = useData();

  // State
  const [isDownloadingMulti, setIsDownloadingMulti] = useState(false);
  const [showManualForm, setShowManualForm] = useState(true);
  const [dbCertificates, setDbCertificates] = useState<DemoCertificate[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personCertificates, setPersonCertificates] = useState<DemoCertificate[]>([]);
  
  // Remove unused state variables
  const [_dbSearch, _setDbSearch] = useState("");
  
  const [showHistory, setShowHistory] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ type: "person" | "history"; data: DemoCertificate[] | CleanCertificateData | null } | null>(null);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [formData, setFormData] = useState<CleanCertificateData | null>(null);
  
  // Remove unused state variables
  const [_forcePreview, _setForcePreview] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [certificatesCollapsed, setCertificatesCollapsed] = useState(false);
  const [isSharingSelected, setIsSharingSelected] = useState(false);
  
  // Remove unused state variables
  const [_isCertificateReady, _setIsCertificateReady] = useState(false);
  const _certificateRef = useRef<HTMLDivElement>(null);
  
  // Remove unused derived state
  // const certificatesToShare = personCertificates.filter(cert =>
  //   selectedCertificates.includes(cert.id)
  // );

  // Filtered history based on search query
  const filteredHistory = history.filter((h) =>
    [h.recipientName, h.programName, h.category, h.fieldOfInterest, h.email]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Effects - Data is now automatically loaded by DataContext when selectedOrg changes
  useEffect(() => {
    if (!selectedOrg) {
      router.push("/generate");
      return;
    }
    // Data loading is now handled automatically by DataContext
  }, [selectedOrg, router]);

  // SIMPLIFIED: Process demo data with merged structure
  // FIXED: Process demo data with proper type safety
useEffect(() => {
  const processDemoData = () => {
    if (!selectedOrg || !demoData) {
      console.log(`📭 No selectedOrg or demo data available`);
      return;
    }

    // FIXED: Ensure recipientName is always a string with proper type checking
    const demoCertificates: DemoCertificate[] = demoData
      .filter(item => {
        // Flexible organization matching
        const orgMatches = !item.organization || 
                          item.organization === selectedOrg.name || 
                          item.organization === selectedOrg.id;
        
        // FIXED: Use non-null assertion and ensure recipientName exists
        const hasRequiredData = item.recipientName && item.email && item.programName;
        
        if (!hasRequiredData) {
          console.warn('⚠️ Skipping incomplete record:', item);
          return false;
        }
        
        return orgMatches;
      })
      .map((item) => {
        // FIXED: Ensure recipientName is always defined with fallback
        const recipientName = item.recipientName!; // Non-null assertion since we filtered above
        
        return {
          id: uuidv4(),
          // FIXED: recipientName is now guaranteed to be a string
          recipientName: recipientName,
          email: item.email!,
          programName: item.programName!,
          category: item.category || "General",
          achievementText: item.achievementText || "In recognition of your achievement",
          fieldOfInterest: item.fieldOfInterest || item.category || "General",
          certificateDate: item.certificateDate || getCertificateDate(),
          organization: item.organization || selectedOrg.name,
          type: item.type || "Achievement",
        };
      });
    
    if (demoCertificates.length > 0) {
      // Demo data loaded successfully
    }
    
    setDbCertificates(demoCertificates);
  };

  processDemoData();
}, [selectedOrg, demoData]);

  useEffect(() => {
    if (selectedPerson) {
      setShowManualForm(false);
    } else {
      setShowManualForm(true);
    }
  }, [selectedPerson]);

  // Handlers
 // FIXED: Handle undefined values in normalize function
const isDuplicateCertificate = (existingCert: CleanCertificateData, newCert: CleanCertificateData): boolean => {
  const normalize = (str: string | undefined) => (str || '').toLowerCase().trim();
  
  return (
    normalize(existingCert.recipientName) === normalize(newCert.recipientName) &&
    normalize(existingCert.programName) === normalize(newCert.programName) &&
    normalize(existingCert.email) === normalize(newCert.email) &&
    normalize(existingCert.organization) === normalize(newCert.organization)
  );
};

 const handleGenerateFromDatabase = async (cert: DemoCertificate) => {
  console.log('🚀 handleGenerateFromDatabase called with certificate:', cert);
  
  // Create the history item with current timestamp
  const newItem = {
    ...cert,
    certificateType: cert.type || "Achievement",
    type: cert.type || "generate-single",
    id: uuidv4(), // Always generate new ID for tracking
    generatedAt: new Date().toISOString(), // Always current timestamp
    createdAt: new Date().toISOString(), // Set creation date
  };


  // Check if similar certificate already exists in history
  const existingItemIndex = history.findIndex(h => 
    isDuplicateCertificate(h, cert)
  );

  if (existingItemIndex !== -1) {
    // UPDATE EXISTING ITEM: Keep the original ID but update timestamp
    const existingItem = history[existingItemIndex];
    const updatedItem = {
      ...existingItem,
      generatedAt: new Date().toISOString(), // Update generation timestamp
      // You can update other fields here if they changed
      category: cert.category || existingItem.category,
      achievementText: cert.achievementText || existingItem.achievementText,
      fieldOfInterest: cert.fieldOfInterest || existingItem.fieldOfInterest,
    };

    console.log('🔄 Updating existing history item:', {
      recipient: cert.recipientName,
      program: cert.programName,
      oldDate: existingItem.generatedAt,
      newDate: updatedItem.generatedAt
    });

    try {
      // Save the updated item
      await saveHistory([updatedItem]);
    } catch (error) {
      console.error('💥 Error updating history:', error);
    }
  } else {
    // ADD NEW ITEM
    console.log('🆕 Adding new history item:', {
      recipient: cert.recipientName,
      program: cert.programName
    });

    try {
      await saveHistory([newItem]);
    } catch (error) {
      console.error('💥 Error saving to history:', error);
    }
  }

  // Set form data for preview
  setFormData({
    ...cert,
    type: cert.type || "generate-single",
  });
};
  const handleGenerate = async (data: CleanCertificateData) => {
  console.log('🚀 handleGenerate called with data:', data);
  
  // Create the history item
  const newItem = {
    ...data,
    type: data.type || "Achievement",
    id: uuidv4(),
    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Check if similar certificate already exists
  const existingItemIndex = history.findIndex(h => 
    isDuplicateCertificate(h, data)
  );

  if (existingItemIndex !== -1) {
    // UPDATE EXISTING ITEM
    const existingItem = history[existingItemIndex];
    const updatedItem = {
      ...existingItem,
      generatedAt: new Date().toISOString(), // Update timestamp
      // Update other fields if needed
      category: data.category || existingItem.category,
      achievementText: data.achievementText || existingItem.achievementText,
      fieldOfInterest: data.fieldOfInterest || existingItem.fieldOfInterest,
    };

    console.log('🔄 Updating existing manual entry:', {
      recipient: data.recipientName,
      program: data.programName
    });

    try {
      await saveHistory([updatedItem]);
    } catch (error) {
      console.error('💥 Error updating history:', error);
    }
  } else {
    // ADD NEW ITEM
    console.log('🆕 Adding new manual entry:', {
      recipient: data.recipientName,
      program: data.programName
    });

    try {
      await saveHistory([newItem]);
    } catch (error) {
      console.error('💥 Error in saveHistory call:', error);
    }
  }

  setFormData({
    ...data,
    type: data.type || "Achievement"
  });
};


  const handleDeleteHistory = async (id: string) => {
    await deleteHistoryItem(id);
  };

  const handleClearHistory = async () => {
      await clearHistory();
  };

  // UPDATED: Download handlers to update history
const doDownloadPDF = async (item: CleanCertificateData) => {
  // First update the history with current timestamp
  await handleGenerateFromDatabase(item as DemoCertificate);
  setFormData(item);
  setTimeout(() => {
    generatePDF({
      organization: -30,
      programName: -14,
      achievementText: -15,
      recipientName: -16,
      certificateDate: -10,
      signatory: -10,
    });
  }, 250);
};

const doDownloadJPEG = async (item: CleanCertificateData) => {
  // First update the history with current timestamp
  await handleGenerateFromDatabase(item as DemoCertificate);
  setFormData(item);
  setTimeout(() => {
    generateJPEG({
      organization: -30,
      programName: -14,
      achievementText: -15,
      recipientName: -16,
      certificateDate: -10,
      signatory: -10,
    });
  }, 250);
};

  // SIMPLIFIED: Remove complex contact matching logic since we have recipientName in CSV
  const suggestions = (() => {
    // Just extract unique recipient names from dbCertificates
    const uniqueRecipients = new Map<string, { name: string; email: string }>();
    
    for (const cert of dbCertificates) {
      const name = cert.recipientName?.trim();
      const email = cert.email?.trim();
      if (name && email && !uniqueRecipients.has(email)) {
        uniqueRecipients.set(email, { name, email });
      }
    }
    
    return Array.from(uniqueRecipients.values());
  })();

  // Remove unused variable
  // const filteredPersons = suggestions.filter((s) => {
  //   if (!dbSearch) return true;
  //   const q = dbSearch.toLowerCase();
  //   return (
  //     s.name.toLowerCase().includes(q) ||
  //     (s.email && s.email.toLowerCase().includes(q))
  //   );
  // });

  const getTemplateUrl = (category?: string) => {
    if (!category) return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";

    if (category.toLowerCase().includes("gaming") || category.toLowerCase().includes("development")) {
      return "/templates/one-planet-one-people-games/certificate-template.jpg";
    }

    return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";
  };

  // Show loading state while data is being fetched
  if (!selectedOrg) return <p className="p-8 text-center text-gray-600">Redirecting...</p>;

  if (loading.groups && !isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {selectedOrg.name} data...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="generate-single"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="p-8 space-y-8"
      >
        <div className="p-6 space-y-8">
          <button
            onClick={() => router.push("/generate")}
            className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
          >
            ← Change Generation
          </button>

          <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold text-center mb-4">Generate Single Certificate</h1>
            <h2 className="text-2xl text-center text-gray-600 mb-8">{selectedOrg.name}</h2>

            {/* Data Loading Indicator */}
            {loading.groups && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700">Loading programs and categories...</p>
              </div>
            )}

            {/* Person Search */}
           <PersonSearch
              dbCertificates={dbCertificates}
              contactInfoList={contactInfoList}
              setSelectedPerson={setSelectedPerson}
              setPersonCertificates={setPersonCertificates}
              setFormData={setFormData}
              getCertificateDate={getCertificateDate}
              organization={selectedOrg.name}
            />

            {/* Person Certificates */}
            {selectedPerson && personCertificates.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {personCertificates[0]?.recipientName}&apos;s Certificates
                  </h3>

                  <div className="flex gap-4 items-center">
                    <button
                      onClick={() =>
                        setSelectedCertificates(
                          selectedCertificates.length === personCertificates.length
                            ? []
                            : personCertificates.map((c) => c.id)
                        )
                      }
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {selectedCertificates.length === personCertificates.length ? "Unselect All" : "Select All"}
                    </button>

                    <button
                      onClick={() => setCertificatesCollapsed((prev) => !prev)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {certificatesCollapsed ? "Show Certificates" : "Hide Certificates"}
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {!certificatesCollapsed && (
                    <motion.div
                      key="certificates-list"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {personCertificates.map((cert) => {
                        const isSelected = selectedCertificates.includes(cert.id);
                        return (
                          <div
                                key={cert.id}
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).tagName !== "BUTTON" && (e.target as HTMLElement).tagName !== "INPUT") {
                                    // This will now properly update the history item
                                    handleGenerateFromDatabase(cert);
                                    setFormData(cert);
                                  }
                                }}
                                className={`border rounded p-6 shadow bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer transition ${
                                  isSelected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                                }`}
                              >
                          <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => {
                                  setSelectedCertificates((prev) =>
                                    isSelected ? prev.filter((id) => id !== cert.id) : [...prev, cert.id]
                                  );
                                }}
                                className="mt-1 accent-blue-500 scale-110"
                              />
                              <div>
                                <p className="font-bold text-gray-900">{cert.programName}</p>
                                <p className="text-sm text-gray-500">{cert.category}</p>
                                <p className="text-sm text-gray-600 mt-1">{cert.achievementText}</p>
                              </div>
                            </div>

                          <div className="flex gap-2 flex-wrap">
                            <DownloadDropdown
                              onDownloadPDF={async () => {
                                // First add to history and wait for it to complete
                                await handleGenerateFromDatabase(cert);
                                setFormData(cert);
                                
                                // Then start download after a brief delay
                                setTimeout(
                                  () =>
                                    generatePDF({
                                      organization: -25,
                                      programName: -12,
                                      achievementText: -14,
                                      recipientName: -18,
                                      certificateDate: -10,
                                      signatory: -8,
                                    }),
                                  200
                                );
                              }}
                              onDownloadJPEG={async () => {
                                // First add to history and wait for it to complete
                                await handleGenerateFromDatabase(cert);
                                setFormData(cert);
                                
                                // Then start download after a brief delay
                                setTimeout(
                                  () =>
                                    generateJPEG({
                                      organization: -25,
                                      programName: -12,
                                      achievementText: -14,
                                      recipientName: -18,
                                      certificateDate: -10,
                                      signatory: -8,
                                    }),
                                  200
                                );
                              }}
                              fontSize="sm"
                            />
                          </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedCertificates.length > 0 && (
                    <motion.div
                      key="selected-actions"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-wrap justify-center gap-4 mt-6"
                    >
                      <button
                        onClick={async () => {
                          if (isSharingSelected) return;
                          
                          const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
                          if (selected.length === 0) return;

                          setIsSharingSelected(true);
                          
                          try {
                            // Use the same logic as handleGenerateFromDatabase for consistency
                            const historyUpdates = selected.map(cert => {
                              // Check if certificate already exists in history
                              const existingItemIndex = history.findIndex(h => 
                                isDuplicateCertificate(h, cert)
                              );

                              if (existingItemIndex !== -1) {
                                // UPDATE EXISTING ITEM - same logic as download
                                const existingItem = history[existingItemIndex];
                                return {
                                  ...existingItem,
                                  generatedAt: new Date().toISOString(), // Update timestamp
                                  category: cert.category || existingItem.category,
                                  achievementText: cert.achievementText || existingItem.achievementText,
                                  fieldOfInterest: cert.fieldOfInterest || existingItem.fieldOfInterest,
                                };
                              } else {
                                // ADD NEW ITEM - same logic as download
                                return {
                                  ...cert,
                                  certificateType: cert.type || "Achievement",
                                  type: cert.type || "generate-single",
                                  id: uuidv4(),
                                  generatedAt: new Date().toISOString(),
                                  createdAt: new Date().toISOString(),
                                };
                              }
                            });

                            // Save all updates to history
                            if (historyUpdates.length > 0) {
                              await saveHistory(historyUpdates);
                              console.log(`✅ Saved ${historyUpdates.length} certificates to history before sharing`);
                            }

                            setShareTarget({ type: "person", data: selected });
                            setIsShareModalOpen(true);
                          } catch (error) {
                            console.error('Error sharing selected certificates:', error);
                          } finally {
                            setIsSharingSelected(false);
                          }
                        }}
                        disabled={isSharingSelected}
                        className={`px-4 py-2 rounded transition flex items-center gap-2 ${
                          isSharingSelected 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {isSharingSelected ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaShareAlt className="w-4 h-4" />
                            Share Selected ({selectedCertificates.length})
                          </>
                        )}
                      </button>

                      <MultiDownloadDropdown
                        isDownloading={isDownloadingMulti}
                        onDownloadPDF={async () => {
                          const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
                          if (selected.length === 0) return;
                          
                          setIsDownloadingMulti(true);
                          try {
                            // First save all selected certificates to history using consistent logic
                            const historyUpdates = selected.map(cert => {
                              const existingItemIndex = history.findIndex(h => 
                                isDuplicateCertificate(h, cert)
                              );

                              if (existingItemIndex !== -1) {
                                const existingItem = history[existingItemIndex];
                                return {
                                  ...existingItem,
                                  generatedAt: new Date().toISOString(),
                                  category: cert.category || existingItem.category,
                                  achievementText: cert.achievementText || existingItem.achievementText,
                                  fieldOfInterest: cert.fieldOfInterest || existingItem.fieldOfInterest,
                                };
                              } else {
                                return {
                                  ...cert,
                                  certificateType: cert.type || "Achievement",
                                  type: cert.type || "generate-single",
                                  id: uuidv4(),
                                  generatedAt: new Date().toISOString(),
                                  createdAt: new Date().toISOString(),
                                };
                              }
                            });

                            if (historyUpdates.length > 0) {
                              await saveHistory(historyUpdates);
                            }

                            // Then start batch download
                            await handleMultiDownload(
                              selected,
                              "pdf",
                              selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"
                            );
                          } finally {
                            setIsDownloadingMulti(false);
                          }
                        }}
                        onDownloadJPEG={async () => {
                          const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
                          if (selected.length === 0) return;
                          
                          setIsDownloadingMulti(true);
                          try {
                            // First save all selected certificates to history using consistent logic
                            const historyUpdates = selected.map(cert => {
                              const existingItemIndex = history.findIndex(h => 
                                isDuplicateCertificate(h, cert)
                              );

                              if (existingItemIndex !== -1) {
                                const existingItem = history[existingItemIndex];
                                return {
                                  ...existingItem,
                                  generatedAt: new Date().toISOString(),
                                  category: cert.category || existingItem.category,
                                  achievementText: cert.achievementText || existingItem.achievementText,
                                  fieldOfInterest: cert.fieldOfInterest || existingItem.fieldOfInterest,
                                };
                              } else {
                                return {
                                  ...cert,
                                  certificateType: cert.type || "Achievement",
                                  type: cert.type || "generate-single",
                                  id: uuidv4(),
                                  generatedAt: new Date().toISOString(),
                                  createdAt: new Date().toISOString(),
                                };
                              }
                            });

                            if (historyUpdates.length > 0) {
                              await saveHistory(historyUpdates);
                            }

                            // Then start batch download
                            await handleMultiDownload(
                              selected,
                              "jpeg",
                              selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"
                            );
                          } finally {
                            setIsDownloadingMulti(false);
                          }
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence>
              {isShareModalOpen && shareTarget?.type === "person" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                >
                  <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => {
                      setIsShareModalOpen(false);
                      setShareTarget(null);
                    }}
                    recipientCertificates={personCertificates
                  .filter(c => selectedCertificates.includes(c.id))
                  .map(c => ({
                    ...c,
                    contactInfo: contactInfoList.find(
                      ci => ci?.email?.toLowerCase() === c.email?.toLowerCase()
                    )
                  }))}
                    contactInfoList={contactInfoList}
                    defaultEmail={personCertificates[0]?.email ?? ""}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* MANUAL ENTRY FORM */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-inner border border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Manual Entry</h3>
                <button
                  onClick={() => setShowManualForm((prev) => !prev)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {showManualForm ? "Hide" : "Show"}
                </button>
              </div>

              <AnimatePresence>
                {showManualForm && (
                  <motion.div
                    key="manual-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <CertificateForm initialValues={{ organization: selectedOrg.name }} onSubmit={handleGenerate} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Certificate Preview */}
          {formData && (
            <PreviewSection
              formData={formData}
              getTemplateUrl={getTemplateUrl}
              getCertificateDate={getCertificateDate}
              onShare={() => {
                setShareTarget({ type: "history", data: formData });
                setIsShareModalOpen(true);
              }}
              onDownloadPDF={() =>
                generatePDF({
                  organization: -30,
                  programName: -14,
                  achievementText: -15,
                  recipientName: -16,
                  certificateDate: -10,
                  signatory: -10,
                })
              }
              onDownloadJPEG={() =>
                generateJPEG({
                  organization: -30,
                  programName: -14,
                  achievementText: -15,
                  recipientName: -16,
                  certificateDate: -10,
                  signatory: -10,
                })
              }
              onCertificateReady={() => _setIsCertificateReady(true)}
              onCertificateUnready={() => _setIsCertificateReady(false)}
            />
          )}

          <AnimatePresence>
            {isShareModalOpen && shareTarget?.type === "history" && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto"
              >
                <ShareModal
                  isOpen={isShareModalOpen}
                  onClose={() => {
                    setIsShareModalOpen(false);
                    setShareTarget(null);
                  }}
                  recipientCertificates={formData ? [
                    {
                      organization: formData.organization || "",
                      category: formData.category || "",
                      email: formData.email || "",
                      fieldOfInterest: formData.fieldOfInterest || "",
                      programName: formData.programName || "",
                      achievementText: formData.achievementText || "",
                      recipientName: formData.recipientName || "",
                      certificateDate: formData.certificateDate,
                      signature: formData.signature,
                      signatory: formData.signatory,
                      contactInfo: contactInfoList.find(
                        ci => ci?.email?.toLowerCase() === formData?.email?.toLowerCase()
                      )
                    }
                  ] : []}
                  contactInfoList={contactInfoList}
                  defaultEmail={formData?.email ?? ""}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Section */}
        <HistoryToggle
          history={history}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
        />

        <HistorySection
          history={history}
          showHistory={showHistory}
          searchQuery={searchQuery}
          filteredHistory={filteredHistory}
          setShowHistory={setShowHistory}
          setSearchQuery={setSearchQuery}
          setFormData={setFormData}
          saveHistory={handleClearHistory}
          handleDeleteHistory={handleDeleteHistory}
          doDownloadPDF={doDownloadPDF}
          doDownloadJPEG={doDownloadJPEG}
        />
      </motion.div>
    </AnimatePresence>
  );
}