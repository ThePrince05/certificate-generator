"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { FaShareAlt, FaFilePdf, FaFileImage, FaDownload } from "react-icons/fa";


// Contexts
import { useOrganization } from "../context/OrganizationContext";
import { useTemplates } from "../context/TemplateContext";

// Components
import CertificateForm from "@/components/generate-single/CertificateForm";
import CertificateTemplate from "@/components/generate-single/CertificateTemplate";
import { ShareModal } from "@/components/generate-single/ShareModal";

// Utilities
import { generatePDF, generateJPEG } from "../utils/generatePDF";
import { handleMultiDownload } from "@/app/utils/multiDownload";
import { loadCSVData, parseCSVData } from "../utils/csvLoader";

// Types & Data
import { CleanCertificateData } from "@/types/certificates";
import { contactInfoList } from "@/data/SocialMediaData";

import PersonSearch from "@/components/generate-single/PersonSearch";
import PreviewSection from "@/components/PreviewSection"; 
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

// Main Component
export default function GenerateSingle() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { selectedOrg } = useOrganization();
  const { loadGroups, selectedTemplate } = useTemplates();

  // State
  const [isDownloadingMulti, setIsDownloadingMulti] = useState(false);
  const [showManualForm, setShowManualForm] = useState(true);
  const [dbCertificates, setDbCertificates] = useState<DemoCertificate[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personCertificates, setPersonCertificates] = useState<DemoCertificate[]>([]);
  const [dbSearch, setDbSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ type: "person" | "history"; data: any } | null>(null);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [formData, setFormData] = useState<CleanCertificateData | null>(null);
  const [forcePreview, setForcePreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [certificatesCollapsed, setCertificatesCollapsed] = useState(false);

  const [history, setHistory] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("certificateHistory_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Derived state
  const certificatesToShare = personCertificates.filter(cert =>
    selectedCertificates.includes(cert.id)
  );

  // Effects
  useEffect(() => {
    if (!selectedOrg) {
      router.push("/generate");
      return;
    }
    loadGroups(selectedOrg.id);
  }, [selectedOrg, router, loadGroups]);

  useEffect(() => {
    const loadDemoData = async () => {
      if (!selectedOrg) return;

      const csvContent = await loadCSVData();
      const parsedData = parseCSVData(csvContent, selectedOrg.name);

      // First, filter the data by selected organization
      const filteredData = parsedData.filter(item => item.organization === selectedOrg.name);
      
      const demoCertificates: DemoCertificate[] = filteredData.map((item) => {
        const emailFromCSV = (item.email || "").trim();
        const nameFromCSV = (item.recipientName || "").trim();

        const contact = contactInfoList.find(
          (c) => (c.email || "").toLowerCase() === emailFromCSV.toLowerCase()
        );

        return {
          id: uuidv4(),
          recipientName: nameFromCSV || contact?.recipientName || "Unknown",
          email: emailFromCSV || contact?.email || "",
          programName: item.programName || "",
          category: item.category || "",
          achievementText: item.achievementText || "",
          fieldOfInterest: item.fieldOfInterest ?? "",
          certificateDate: item.certificateDate || getCertificateDate(),
          organization: item.organization,
          type: item.type || "Achievement",
        };
      });

      setDbCertificates(demoCertificates);
    };

    loadDemoData();
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedPerson) {
      setShowManualForm(false);
    } else {
      setShowManualForm(true);
    }
  }, [selectedPerson]);

  // Handlers
  const saveHistory = (items: any[]) => {
    setHistory(items);
    try {
      localStorage.setItem("certificateHistory_v1", JSON.stringify(items));
    } catch (e) {
      // console.error("Failed to save history:", e);
    }
  };

  const handleGenerateFromDatabase = (cert: DemoCertificate) => {
    const newItem = {
      ...cert,
      certificateType: cert.type || "Achievement", // Add certificateType here
      type: cert.type || "generate-single",
      id: uuidv4(),
      generatedAt: new Date().toISOString(),
    };

    const alreadyExists = history.some(
      (h) =>
        h.recipientName === cert.recipientName &&
        h.programName === cert.programName &&
        h.email === cert.email
    );

    if (!alreadyExists) {
      saveHistory([newItem, ...history]);
    }

    // Make sure certificateType is included
    setFormData({
      ...cert,
      type: cert.type || "generate-single",
    });
  };

  const getCertificateDate = () => {
    const today = new Date();
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    return `Awarded ${month} ${year}`;
  };

 const handleGenerate = (data: CleanCertificateData) => {
  const exists = history.some(
    (h) =>
      h.recipientName === data.recipientName &&
      h.programName === data.programName
  );

  // Set the type directly from the data
  const formDataWithType = {
    ...data,
    type: data.type || "Achievement" // Use the existing type field
  };

  if (!exists) {
    const item = {
      ...formDataWithType,
      id: uuidv4(),
      generatedAt: new Date().toISOString(),
    };
    const updatedHistory = [item, ...history];
    saveHistory(updatedHistory);
  }

  setFormData(formDataWithType);
};

  const handleDeleteHistory = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
  };

  const doDownloadPDF = (item: any) => {
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

  const doDownloadJPEG = (item: any) => {
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

  // Helper functions
  const suggestions = (() => {
    const map = new Map<string, { name: string; email: string }>();
    const validEmails = new Set<string>();
    const normalizedNames: string[] = [];

    for (const c of dbCertificates) {
      const e = c.email?.trim().toLowerCase();
      if (e) validEmails.add(e);

      const n = c.recipientName?.trim().toLowerCase();
      if (n) normalizedNames.push(n);
    }


    for (const contact of contactInfoList) {
      const name = contact.recipientName?.trim();
      const email = contact.email?.trim();
      if (!name || !email) continue;

      const emailLower = email.toLowerCase();
      const nameLower = name.toLowerCase();

      const emailMatch = validEmails.has(emailLower);
      const nameMatch = normalizedNames.some(
        (n) => n.includes(nameLower) || nameLower.includes(n)
      );

      if ((emailMatch || nameMatch) && !map.has(emailLower)) {
        map.set(emailLower, { name, email });
      }
    }

    return Array.from(map.values());
  })();

  const filteredPersons = suggestions.filter((s) => {
    if (!dbSearch) return true;
    const q = dbSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const filteredHistory = history.filter((h) =>
    [h.recipientName, h.programName, h.category, h.fieldOfInterest, h.email]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getTemplateUrl = (category?: string) => {
    if (!category) return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";

    if (category.toLowerCase().includes("gaming") || category.toLowerCase().includes("development")) {
      return "/templates/one-planet-one-people-games/certificate-template.jpg";
    }

    return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";
  };

  if (!selectedOrg) return <p className="p-8 text-center text-gray-600">Redirecting...</p>;

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

          {/* Person Search */}
          <PersonSearch
            dbCertificates={dbCertificates}
            contactInfoList={contactInfoList}
            setSelectedPerson={setSelectedPerson}
            setPersonCertificates={setPersonCertificates}
            setFormData={setFormData}
            history={history}
            saveHistory={saveHistory}
            getCertificateDate={getCertificateDate}
            organization={selectedOrg.name}
          />

            {/* Person Certificates */}
            {selectedPerson && personCertificates.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {personCertificates[0]?.recipientName}'s Certificates
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
                                onDownloadPDF={() => {
                                  console.log("[DEBUG] PDF download clicked for certificate:", cert);
                                  handleGenerateFromDatabase(cert);
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
                                onDownloadJPEG={() => {
                                  console.log("[DEBUG] JPEG download clicked for certificate:", cert);
                                  handleGenerateFromDatabase(cert);
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
                        onClick={() => {
                          const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
                          if (selected.length === 0) return;

                          // Add to history if not already there
                          const newHistoryEntries = selected.map((c) => ({
                            ...c,
                            id: uuidv4(),
                            generatedAt: new Date().toISOString(),
                          })).filter((newItem) =>
                            !history.some(
                              (h) =>
                                h.recipientName === newItem.recipientName &&
                                h.programName === newItem.programName &&
                                h.email === newItem.email
                            )
                          );

                          if (newHistoryEntries.length > 0) {
                            saveHistory([...newHistoryEntries, ...history]);
                          }

                          setShareTarget({ type: "person", data: selected });
                          setIsShareModalOpen(true);
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
                      >
                        <FaShareAlt className="w-4 h-4" />
                        Share Selected
                      </button>

                      <MultiDownloadDropdown
                        isDownloading={isDownloadingMulti}
                        onDownloadPDF={async () => {
                          const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
                          if (selected.length === 0) return;
                          console.log("[DEBUG] Multi PDF download clicked for:", selected);
                          setIsDownloadingMulti(true);
                          try {
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
                          console.log("[DEBUG] Multi JPEG download clicked for:", selected);
                          setIsDownloadingMulti(true);
                          try {
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
                      )  // Remove the "|| null" - find() returns undefined if not found
                    }))}
                        contactInfoList={contactInfoList}
                        defaultEmail={personCertificates[0]?.email ?? ""}
                      />
                    </motion.div>
                  )}
            </AnimatePresence>

            {/* Manual Entry Form */}
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
        saveHistory={saveHistory}
        handleDeleteHistory={handleDeleteHistory}
        doDownloadPDF={doDownloadPDF}
        doDownloadJPEG={doDownloadJPEG}
      />

      </motion.div>
    </AnimatePresence>
  );
}
