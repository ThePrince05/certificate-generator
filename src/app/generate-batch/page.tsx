"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { FaShareAlt, FaDownload,  FaChevronDown, FaChevronUp } from "react-icons/fa";

// Components
import CertificateTemplate from "@/components/CertificateTemplate";
import PersonSearchBatch from "@/components/generate-batch/PersonSearchBatch";

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
import DownloadDropdown from "@/components/DownloadDropdown";
import MultiDownloadDropdown from "@/components/MultiDownloadDropdown";

// Types
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
  type: 30,
};

// Utility Functions
const getCertificateDate = () => {
  const today = new Date();
  const month = today.toLocaleString("en-GB", { month: "long" });
  const year = today.getFullYear();
  return `Awarded ${month} ${year}`;
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

  const [formData, setFormData] = useState<CertificateData | null>(null);
  const [dbCertificates, setDbCertificates] = useState<DemoCertificate[]>([]);
 
  const [shareTarget, setShareTarget] = useState<{ type: "person" | "history"; data: any } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);  

  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCSVSection, setShowCSVSection] = useState(true);
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

 

  if (!selectedOrg) return <p className="p-8 text-center">Redirecting...</p>;
  const getTemplateUrl = (category?: string) => {
    if (!category) return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";

    if (category.toLowerCase().includes("gaming") || category.toLowerCase().includes("development")) {
      return "/templates/one-planet-one-people-games/certificate-template.jpg";
    }

    return selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg";
  };

      const toggleCSVSection = () => {
          setShowCSVSection(!showCSVSection);
        };

 const CSVUploadSection = () => (
    <div className="flex justify-center my-6 px-4">
      <div className="w-full max-w-3xl">
        {/* Toggle Header */}
        <div 
          className="flex items-center justify-between p-4 bg-gray-100 border rounded-t cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={toggleCSVSection}
        >
          <h3 className="text-lg font-semibold text-gray-800">
            CSV Upload & Batch Processing
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {validatedBatch.length > 0 ? `${validatedBatch.length} records loaded` : 'No data'}
            </span>
            {showCSVSection ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence>
          {showCSVSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 md:p-6 border border-t-0 rounded-b shadow bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
                  <DownloadDropdown
                    onDownloadPDF={() => handleBatchDownload("pdf")}
                    onDownloadJPEG={() => handleBatchDownload("jpeg")}
                    isDownloading={isDownloading}
                    batchCount={validatedBatch.length}
                    fontSize="base"
                  />
                )}
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Modify the Batch Data Display to be conditionally rendered
  const BatchDataDisplay = () => {
    if (validatedBatch.length === 0 || !showCSVSection) return null;

    return (
      <>
        <TableView />
        <CardView />
      </>
    );
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
        className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
      >
        ← Change Generation
      </button>
      
        {/* CSV Upload & Batch Actions */}
        <CSVUploadSection />

        {/* Batch Data Display - Now conditionally rendered */}
        <BatchDataDisplay />

      

              
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