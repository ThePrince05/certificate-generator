"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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

// Types
interface DownloadDropdownProps {
  onDownloadPDF: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDownloadJPEG: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  fontSize?: "sm" | "base";
}

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

// Components
const DownloadDropdown = ({
  onDownloadPDF,
  onDownloadJPEG,
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



  return (
    <>
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ${sizeClass} flex items-center gap-2`}
        >
          <FaDownload className="w-4 h-4" />
          Download
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>


    {isOpen &&
    createPortal(
      <div
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
    onDownloadPDF(e);
    setTimeout(() => setIsOpen(false), 50);
  }}
          className={`flex justify-center items-center w-full px-4 py-2 ${sizeClass} text-white bg-green-500 hover:bg-green-600 transition`}
        >
          PDF
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log("[DEBUG] JPEG button clicked");
            onDownloadJPEG(e);
            setIsOpen(false);
          }}
          className={`flex justify-center items-center w-full px-4 py-2 ${sizeClass} text-white bg-yellow-500 hover:bg-yellow-600 transition`}
        >
          JPEG
        </button>
      </div>
    </div>,
    document.body
  )}


    </>
  );
};

const MultiDownloadDropdown = ({
  onDownloadPDF,
  onDownloadJPEG,
  isDownloading,
}: {
  onDownloadPDF: () => void;
  onDownloadJPEG: () => void;
  isDownloading: boolean;
}) => {
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

      const demoCertificates: DemoCertificate[] = parsedData.map((item) => {
        const emailFromCSV = (item.recipientName || "").trim();
        const contact = contactInfoList.find(
          (c) => (c.email || "").toLowerCase() === emailFromCSV.toLowerCase()
        );

        return {
          id: uuidv4(),
          recipientName: contact?.recipientName || (contact as any)?.name || "Unknown",
          email: emailFromCSV || contact?.email || "",
          programName: item.programName || "",
          category: item.category || "",
          achievementText: item.achievementText || "",
          fieldOfInterest: item.fieldOfInterest ?? "",
          certificateDate: item.certificateDate || getCertificateDate(),
          organization: item.organization || selectedOrg.name,
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
    //  console.error("Failed to save history:", e);
    }
  };

  const handleGenerateFromDatabase = (cert: DemoCertificate) => {
    const newItem = {
      ...cert,
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

    setFormData(cert);
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

    if (!exists) {
      const item = {
        ...data,
        id: uuidv4(),
        generatedAt: new Date().toISOString(),
      };
      const updatedHistory = [item, ...history];
      saveHistory(updatedHistory);
    }

    setFormData(data);
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
            <div className="p-6 bg-white rounded shadow border border-gray-200 space-y-4">
              <input
                type="text"
                placeholder="Search for a person or email..."
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                className="w-full border rounded p-3"
              />

              {dbSearch && filteredPersons.length > 0 && (
                <ul className="border rounded max-h-60 overflow-y-auto divide-y divide-gray-200">
                  {filteredPersons.map((s) => (
                    <li
                      key={`${s.email ?? s.name}`}
                      onClick={() => {
                        setSelectedPerson(s.name);
                        setDbSearch("");

                        const certs = dbCertificates.filter((c) => {
                          const certEmail = c.email?.trim().toLowerCase() || "";
                          const certName = c.recipientName?.trim().toLowerCase() || "";
                          const searchEmail = s.email?.toLowerCase() || "";
                          const searchName = s.name?.toLowerCase() || "";

                          if (searchEmail && certEmail === searchEmail) return true;
                          if (!certEmail && searchName && certName === searchName) return true;
                          
                          return false;
                        });
                        setPersonCertificates(certs);

                        if (certs.length > 0) {
                          const firstCert = {
                            ...certs[0],
                            certificateDate: certs[0].certificateDate || getCertificateDate(),
                          };

                          setFormData(firstCert);

                          const alreadyExists = history.some(
                            (h) =>
                              h.recipientName === firstCert.recipientName &&
                              h.programName === firstCert.programName &&
                              h.email === firstCert.email
                          );
                          if (!alreadyExists) {
                            saveHistory([{ ...firstCert, id: uuidv4(), generatedAt: new Date().toISOString() }, ...history]);
                          }
                        } else {
                          setFormData(null);
                        }
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">{s.name}</span>
                          {s.email && (
                            <span className="text-sm text-gray-500 ml-2">({s.email})</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
            <div className="text-center">
              <div className="w-full flex justify-center overflow-x-auto py-4">
                <div className="flex-shrink-0 max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
                  <CertificateTemplate
                    {...formData}
                    templateUrl={getTemplateUrl(formData.category)}
                    isPreview
                    certificateDate={formData.certificateDate ?? getCertificateDate()}
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-3 flex-wrap">
                <button
                  onClick={() => {
                    setShareTarget({ type: "history", data: formData });
                    setIsShareModalOpen(true);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
                >
                  <FaShareAlt className="w-4 h-4" />
                  Share
                </button>

                <DownloadDropdown
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
              </div>
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                {showHistory ? "Hide History" : "Show History"}
              </button>
            </div>
          )}

          {showHistory && (
            <section className="max-w-3xl mx-auto bg-gray-50 border rounded shadow p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Certificate History</h2>
                {history.length > 0 && (
                  <button onClick={() => saveHistory([])} className="text-sm text-red-600 hover:underline">
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
          )}
        </div>

        {/* Share Modal */}
        {isShareModalOpen && (() => {
          let recipientCertificates: any[] = [];

          if (shareTarget?.type === "person") {
            recipientCertificates = personCertificates
              .filter(c => selectedCertificates.includes(c.id))
              .map(c => ({
                ...c,
                contactInfo: contactInfoList.find(
                  ci => ci?.email?.toLowerCase() === c.email?.toLowerCase()
                ) || null,
              }));
          } else if (shareTarget?.type === "history") {
            if (shareTarget.data) {
              recipientCertificates = [{
                ...shareTarget.data,
                contactInfo: contactInfoList.find(
                  ci => ci?.email?.toLowerCase() === shareTarget.data.email?.toLowerCase()
                ) || null
              }];
            }
          }

          return (
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => {
                setIsShareModalOpen(false);
                setShareTarget(null);
              }}
              recipientCertificates={recipientCertificates}
              contactInfoList={contactInfoList}
              defaultEmail={recipientCertificates[0]?.email ?? ""}
            />
          );
        })()}
      </motion.div>
    </AnimatePresence>
  );
}