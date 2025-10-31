"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { FaShareAlt, FaDownload } from "react-icons/fa";

// Components
import CertificateTemplate from "@/components/generate-single/CertificateTemplate";
import PersonSearch from "@/components/PersonSearch";

// Contexts
import { useOrganization } from "../context/OrganizationContext";
import { useTemplates } from "../context/TemplateContext";

// Utilities
import { generatePDF, generateJPEG } from "../utils/generatePDF";
import { handleMultiDownload } from "../utils/multiDownload";
import { loadCSVData, parseCSVData } from "../utils/csvLoader";

// Types & Data
import { CertificateData, CertificateFields, CleanCertificateData } from "@/types/certificates";
import { contactInfoList } from "@/data/SocialMediaData";

import PreviewSection from "@/components/PreviewSection"; 
import HistoryToggle from "@/components/HistoryToggle";
import HistorySection from "@/components/HistorySection";

// Types
interface DownloadDropdownProps {
  onDownloadPDF: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDownloadJPEG: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  fontSize?: "sm" | "base";
}

type DemoCertificate = CleanCertificateData & {
  id: string;
};

type ValidationKey = `${keyof CertificateData}_invalid`;

type CertificateDataWithValidation = CertificateData & 
  Partial<Record<ValidationKey, boolean>> & 
  { id?: string };

// Constants
const MAX_LENGTHS: Record<CertificateFields, number> = {
  organization: 25,
  category: 30,
  fieldOfInterest: 50,
  programName: 65,
  achievementText: 260,
  recipientName: 15,
  certificateDate: 22,
};

// Utility Functions
const getCertificateDate = () => {
  const today = new Date();
  const month = today.toLocaleString("en-GB", { month: "long" });
  const year = today.getFullYear();
  return `Awarded ${month} ${year}`;
};

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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const sizeClass = fontSize === "sm" ? "text-sm" : "text-base";

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
export default function GenerateBatch() {
  const router = useRouter();
  const { selectedOrg } = useOrganization();
  const { loadGroups, selectedTemplate } = useTemplates();

  // State
  const [validatedBatch, setValidatedBatch] = useState<CertificateDataWithValidation[]>([]);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPerson, setSelectedPersonName] = useState<string | null>(null);
  const [personCertificates, setPersonCertificates] = useState<DemoCertificate[]>([]);
  const [formData, setFormData] = useState<CertificateData | null>(null);
  const [dbCertificates, setDbCertificates] = useState<DemoCertificate[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [certificatesCollapsed, setCertificatesCollapsed] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ type: "person" | "history"; data: any } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloadingMulti, setIsDownloadingMulti] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [history, setHistory] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("certificateHistory_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Handlers
const saveHistory = (items: any[]) => {
  setHistory(items);
  try {
    localStorage.setItem("certificateHistory_v1", JSON.stringify(items));
  } catch (e) {
    // ignore
  }
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


  // Derived state
  const searchDbCertificates = useMemo(
    () => validatedBatch.map((c) => ({ ...c, id: c.id ?? uuidv4() })),
    [validatedBatch]
  );

    const filteredHistory = useMemo(() => 
    history.filter((h) =>
      [h.recipientName, h.programName, h.category, h.fieldOfInterest, h.email]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    ),
    [history, searchQuery]
  );

  // Effects
  useEffect(() => {
    if (!selectedOrg) router.push("/generate?step=org");;
  }, [selectedOrg, router]);

  useEffect(() => {
  const loadDemoData = async () => {
    if (!selectedOrg) return;

    const csvContent = await loadCSVData();
    const parsedData = parseCSVData(csvContent, selectedOrg.name);

    const demoCertificates: DemoCertificate[] = parsedData.map((item) => {
      const emailFromCSV = (item.recipientName || "").trim();
      
      const contact = contactInfoList.find(
        (c) => c.email?.toLowerCase().trim() === emailFromCSV.toLowerCase()
      );

      return {
        id: uuidv4(),
        recipientName: contact?.recipientName || "Unknown",
        email: emailFromCSV,
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


  const validateBatch = (
    data: CertificateData[]
  ): { validated: CertificateDataWithValidation[]; invalidRows: string[] } => {
    const invalidRows: string[] = [];

    const validated: CertificateDataWithValidation[] = data.map((item, index) => {
      const newItem: CertificateDataWithValidation = { ...item };

      (Object.keys(MAX_LENGTHS) as CertificateFields[]).forEach((key) => {
        const value = (item[key] ?? "").toString().trim();
        const invalidKey = `${key}_invalid` as ValidationKey;

        if (value.length > MAX_LENGTHS[key]) {
          newItem[invalidKey] = true;
          invalidRows.push(`Row ${index + 1}: "${key}" exceeds ${MAX_LENGTHS[key]} chars`);
        } else {
          newItem[invalidKey] = false;
        }
      });

      return newItem;
    });

    return { validated, invalidRows };
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrg) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = (results.data as CertificateData[]).map((item) => ({
          ...item,
          organization: selectedOrg.name,
          category: item.category || "General",
          fieldOfInterest:
            item.category === "Gaming & Development" ? "" : item.fieldOfInterest || "Unspecified",
        }));

        const { validated, invalidRows } = validateBatch(rawData);
        const validatedWithIds = validated.map((row) => ({
          ...row,
          id: (row as any).id ?? uuidv4(),
        }));

        setValidatedBatch(validatedWithIds);
        setBatchWarning(invalidRows.length ? invalidRows.join("\n") : null);
      },
    });
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

  const hasInvalidRows = (batch: CertificateDataWithValidation[]) =>
    batch.some((row) =>
      (Object.keys(MAX_LENGTHS) as CertificateFields[]).some(
        (key) => row[`${key}_invalid` as ValidationKey]
      )
    );

  const handleBatchDownload = async (type: "pdf" | "jpeg") => {
    if (!validatedBatch.length || !selectedOrg) return;

    if (hasInvalidRows(validatedBatch)) {
      alert("Some fields are invalid. Please fix them before downloading.");
      return;
    }

    setIsDownloading(true);
    try {
      const batchWithIds = validatedBatch.map((cert) => ({
        ...cert,
        id: cert.id ?? uuidv4(),
      }));

      await handleMultiDownload(
        batchWithIds,
        type,
        selectedOrg.templateUrl || "/templates/one-planet-one-people/certificate-template.jpg"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMultiDownloadAction = async (type: "pdf" | "jpeg") => {
    const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
    if (selected.length === 0) return;
    
    setIsDownloadingMulti(true);
    try {
      await handleMultiDownload(
        selected,
        type,
        selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"
      );
    } finally {
      setIsDownloadingMulti(false);
    }
  };

  const handleShareSelected = () => {
    const selected = personCertificates.filter((c) => selectedCertificates.includes(c.id));
    if (selected.length === 0) return;

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
  };

  const handleDownloadCertificate = (cert: DemoCertificate, type: "pdf" | "jpeg") => {
    console.log("[DEBUG] handleDownloadCertificate called:", { cert, type });
    handleGenerateFromDatabase(cert);
    setTimeout(() => {
      const offsets = {
        organization: -25,
        programName: -12,
        achievementText: -14,
        recipientName: -18,
        certificateDate: -10,
        signatory: -8,
      };
      
      type === "pdf" ? generatePDF(offsets) : generateJPEG(offsets);
    }, 200);
  };

  // Render Functions
  const renderCertificate = (item: CertificateDataWithValidation) => {
    if (!selectedOrg) return null;
    
    const templateUrl = item.category === "Gaming & Development"
      ? "/templates/one-planet-one-people-games/certificate-template.jpg"
      : selectedOrg.templateUrl;

    return (
      <CertificateTemplate
        {...item}
        templateUrl={templateUrl}
        certificateDate={item.certificateDate || getCertificateDate()}
        pdfOffsets={{
          organization: -30,
          programName: -15,
          achievementText: -15,
          recipientName: -16,
          certificateDate: -8,
          signature: 1,
          signatory: -10,
        }}
      />
    );
  };

  const TableView = () => (
    <div className="overflow-auto max-w-5xl mx-auto mt-4 hidden sm:block">
      <table className="min-w-full border border-black border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {Object.keys(MAX_LENGTHS)
              .filter((key) => key !== "organization")
              .map((key) => (
                <th key={key} className="border border-black px-3 py-2 text-left font-semibold">
                  {key.toUpperCase()}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {validatedBatch.map((row, rowIndex) => (
            <tr key={row.id ?? rowIndex} className="hover:bg-gray-50">
              {Object.keys(MAX_LENGTHS)
                .filter((key) => key !== "organization")
                .map((fieldKey) => {
                  const field = fieldKey as CertificateFields;
                  const value = (row[field] ?? "") as string;
                  const isInvalid = (row[`${field}_invalid` as ValidationKey] ?? false) as boolean;

                  return (
                    <td
                      key={fieldKey}
                      className={`border px-2 py-1 align-top ${
                        isInvalid ? "bg-red-100 border-2 border-red-500" : "border-black"
                      }`}
                    >
                      <input
                        value={value}
                        onChange={(e) => {
                          const newData = [...validatedBatch];
                          newData[rowIndex][field] = e.target.value;
                          const { validated, invalidRows } = validateBatch(newData as CertificateData[]);
                          const withIds = validated.map((r, i) => ({
                            ...r,
                            id: newData[i]?.id ?? uuidv4(),
                          }));
                          setValidatedBatch(withIds);
                          setBatchWarning(invalidRows.length ? invalidRows.join("\n") : null);
                        }}
                        className={`w-full px-2 py-1 rounded focus:outline-none ${isInvalid ? "bg-red-100" : "bg-white"}`}
                      />
                    </td>
                  );
                })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CardView = () => (
    <div className="sm:hidden max-w-3xl mx-auto mt-4 space-y-3">
      {validatedBatch.map((row, rowIndex) => (
        <div key={row.id ?? rowIndex} className="border rounded p-3 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <div>Row {rowIndex + 1}</div>
            <div className="text-xs text-gray-500">{row.recipientName || "—"}</div>
          </div>

          <div className="space-y-2">
            {Object.keys(MAX_LENGTHS)
              .filter((key) => key !== "organization")
              .map((fieldKey) => {
                const field = fieldKey as CertificateFields;
                const value = (row[field] ?? "") as string;
                const isInvalid = (row[`${field}_invalid` as ValidationKey] ?? false) as boolean;
                return (
                  <div key={fieldKey}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {field.toUpperCase()}
                    </label>
                    <input
                      value={value}
                      onChange={(e) => {
                        const newData = [...validatedBatch];
                        newData[rowIndex][field] = e.target.value;
                        const { validated, invalidRows } = validateBatch(newData as CertificateData[]);
                        const withIds = validated.map((r, i) => ({
                          ...r,
                          id: newData[i]?.id ?? uuidv4(),
                        }));
                        setValidatedBatch(withIds);
                        setBatchWarning(invalidRows.length ? invalidRows.join("\n") : null);
                      }}
                      className={`w-full px-2 py-2 rounded border focus:outline-none ${
                        isInvalid ? "bg-red-100 border-red-400" : "bg-white border-gray-200"
                      }`}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );

  const PersonCertificatesSection = () => {
    return (
      <div className="person-certificates-section">
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
                      if ((e.target as HTMLElement).tagName !== "BUTTON" && 
                          (e.target as HTMLElement).tagName !== "INPUT") {
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
                          const newSelection = isSelected 
                            ? selectedCertificates.filter((id) => id !== cert.id)
                            : [...selectedCertificates, cert.id];
                          setSelectedCertificates(newSelection);
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
                        onDownloadPDF={() => handleDownloadCertificate(cert, "pdf")}
                        onDownloadJPEG={() => handleDownloadCertificate(cert, "jpeg")}
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
                onClick={handleShareSelected}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
              >
                <FaShareAlt className="w-4 h-4" />
                Share Selected
              </button>

              <MultiDownloadDropdown
                isDownloading={isDownloadingMulti}
                onDownloadPDF={() => handleMultiDownloadAction("pdf")}
                onDownloadJPEG={() => handleMultiDownloadAction("jpeg")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  if (!selectedOrg) return <p className="p-8 text-center">Redirecting...</p>;
  const getTemplateUrl = (category?: string) => {
    if (!category) return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";

    if (category.toLowerCase().includes("gaming") || category.toLowerCase().includes("development")) {
      return "/templates/one-planet-one-people-games/certificate-template.jpg";
    }

    return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="generate-batch"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="p-8 space-y-8"
      >
        {/* Header */}
        <div className="text-center mb-2 px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Generate Batch Certificates</h1>
          <h2 className="text-lg md:text-2xl font-semibold text-gray-700">{selectedOrg.name}</h2>
        </div>

        {/* Navigation */}
        <button
          onClick={() => router.push("/generate")}
          className="hidden md:inline-flex fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
        >
          ← Change Generation
        </button>

        {/* Person Search & Certificates */}
        <div className="max-w-3xl mx-auto mb-6 px-4">

          <PersonSearch
             dbCertificates={dbCertificates} 
            contactInfoList={contactInfoList}
            setSelectedPerson={setSelectedPersonName}
            setPersonCertificates={setPersonCertificates}
            setFormData={setFormData}
            history={history}
            saveHistory={saveHistory}
            getCertificateDate={getCertificateDate}
          />
          
          {selectedPerson && personCertificates.length > 0 && <PersonCertificatesSection />}
          
          {selectedPerson && personCertificates.length === 0 && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-700">
                No certificates found for {selectedPerson}. 
                This might mean there's no match between the contact and certificate data.
              </p>
            </div>
          )}
        </div>

        {/* CSV Upload & Batch Actions */}
        <div className="flex justify-center my-6 px-4">
          <div className="p-4 md:p-6 border rounded shadow bg-gray-50 w-full max-w-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <label className="font-semibold block mb-1">Upload CSV for Batch</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex gap-2 flex-wrap justify-center md:justify-end mt-2 md:mt-0">
              {validatedBatch.length > 0 && (
                <>
                  <button
                    onClick={() => handleBatchDownload("pdf")}
                    disabled={isDownloading}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition-all"
                  >
                    {isDownloading ? "Downloading..." : `Download PDF (${validatedBatch.length})`}
                  </button>

                  <button
                    onClick={() => handleBatchDownload("jpeg")}
                    disabled={isDownloading}
                    className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded shadow transition-all"
                  >
                    {isDownloading ? "Downloading..." : `Download JPEG (${validatedBatch.length})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Batch Data Display */}
        {validatedBatch.length > 0 && (
          <>
            <TableView />
            <CardView />
          </>
        )}

        {/* Mobile Navigation */}
        <div className="px-4 block md:hidden">
          <button
            onClick={() => router.push("/generate")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded shadow-md"
          >
            ← Change Generation
          </button>
        </div>

       {/* Preview */}
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
               

        {/* Batch Warning */}
        {batchWarning && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-lg w-[calc(100%-2rem)] bg-red-600 text-white p-4 rounded shadow-lg z-50">
            <strong className="block mb-2">CSV Errors:</strong>
            <pre className="whitespace-pre-wrap text-sm">{batchWarning}</pre>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setBatchWarning(null)}
                className="px-3 py-1 bg-white text-red-600 rounded hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}