"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "../context/OrganizationContext";
import { useTemplates } from "../context/TemplateContext";
import CertificateForm from "@/components/home/CertificateForm";
import CertificateTemplate from "@/components/home/CertificateTemplate";
import { generatePDF, generateJPEG } from "../utils/generatePDF";
import { CleanCertificateData } from "@/types/certificates";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { handleMultiDownload } from "@/app/utils/multiDownload";
import { loadCSVData, parseCSVData } from "../utils/csvLoader";
import { contactInfoList } from "@/data/SocialMediaData";

interface DownloadDropdownProps {
  onDownloadPDF: (e?: MouseEvent) => void;
  onDownloadJPEG: (e?: MouseEvent) => void;
}

/** Returns true when viewport is desktop width or larger. Tailwind 'lg' == 1024px. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(e.matches);
    onChange(mq);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isDesktop;
}

type DemoCertificate = CleanCertificateData & {
  id: string;
};

export default function GenerateSingle() {
  const [showManualForm, setShowManualForm] = useState(true);
  const [dbCertificates, setDbCertificates] = useState<DemoCertificate[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null); // stores email if available, otherwise name
  const [personCertificates, setPersonCertificates] = useState<DemoCertificate[]>([]);
  const [dbSearch, setDbSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { selectedOrg } = useOrganization();
  const { groups, loadGroups, selectedTemplate } = useTemplates();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);

  const [formData, setFormData] = useState<CleanCertificateData | null>(null);
  const [forcePreview, setForcePreview] = useState(false);
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

  const saveHistory = (items: any[]) => {
    setHistory(items);
    try {
      localStorage.setItem("certificateHistory_v1", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save certificate history", e);
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

  // Filter history by search
  const filteredHistory = history.filter((h) =>
    [h.recipientName, h.programName, h.category, h.fieldOfInterest, h.email]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedOrg) {
      router.push("/generate");
      return;
    }
    loadGroups(selectedOrg.id);
  }, [selectedOrg, router, loadGroups]);


  // Load CSV demo data and attach emails from contact list when missing
  useEffect(() => {
    const loadDemoData = async () => {
      if (!selectedOrg) return;

      try {
        const csvContent = await loadCSVData();
        const parsedData = parseCSVData(csvContent, selectedOrg.name);

       // inside your loadDemoData function — replace the current parsedData.map(...) block
const demoCertificates: DemoCertificate[] = parsedData.map((item) => {
  const emailFromCSV = (item.email || "").trim();
  const contact = contactInfoList.find(
    (c) => (c.email || "").toLowerCase() === emailFromCSV.toLowerCase()
  );

  return {
    id: uuidv4(),
    // prefer CSV recipientName, then contact.recipientName (or contact.name), then fallback
    recipientName:
      (item.recipientName && item.recipientName.trim()) ||
      contact?.recipientName ||
      // some contact lists use `name` instead — be defensive
      (contact as any)?.name ||
      "Unknown",
    email: emailFromCSV || contact?.email || "",
    programName: item.programName || "",
    category: item.category || "",
    achievementText: item.achievementText || "",
    fieldOfInterest: item.fieldOfInterest ?? "",
    certificateDate:
      item.certificateDate ||
      `Awarded ${new Date().toLocaleString("en-GB", {
        month: "long",
        year: "numeric",
      })}`,
    organization: item.organization || selectedOrg.name,
  };
});

        setDbCertificates(demoCertificates);
      } catch (error) {
        console.error("Failed to load demo data:", error);
      }
    };

    loadDemoData();
  }, [selectedOrg]);

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

  // Build unique suggestions — prefer unique by email; fall back to name if no email
  const suggestions = (() => {
    const map = new Map<string, { name: string; email: string }>();

    // Merge from dbCertificates
    for (const c of dbCertificates) {
      const name = c.recipientName?.trim();
      const email = c.email?.trim();
      if (name && email && !map.has(email.toLowerCase())) {
        map.set(email.toLowerCase(), { name, email });
      }
    }

      // Merge from contactInfoList if not already included
    for (const contact of contactInfoList) {
      const name = contact.recipientName?.trim();
      const email = contact.email?.trim();
      if (name && email && !map.has(email.toLowerCase())) {
        map.set(email.toLowerCase(), { name, email });
      }
    }

    // Return as array for rendering
    return Array.from(map.values());
  })();


// Filter suggestions by dbSearch matching either name or email
  const filteredPersons = suggestions.filter((s) => {
    if (!dbSearch) return true;
    const q = dbSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  if (!selectedOrg) return <p className="p-8 text-center text-gray-600">Redirecting...</p>;

  const DownloadDropdown = ({ onDownloadPDF, onDownloadJPEG }: DownloadDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-base flex items-center gap-2"
        >
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

        {isOpen && (
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden">
            <button
              onClick={() => {
                onDownloadPDF();
                setIsOpen(false);
              }}
              className="flex justify-center items-center w-full px-4 py-2 text-base text-white bg-green-500 hover:bg-green-600 transition"
            >
              PDF
            </button>
            <button
              onClick={() => {
                onDownloadJPEG();
                setIsOpen(false);
              }}
              className="flex justify-center items-center w-full px-4 py-2 text-base text-white bg-yellow-500 hover:bg-yellow-600 transition"
            >
              JPEG
            </button>
          </div>
        )}
      </div>
    );
  };

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

            {/* Search Box */}
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
                      if (s.email) return c.email?.trim().toLowerCase() === s.email.toLowerCase();
                      return c.recipientName?.trim().toLowerCase() === s.name.toLowerCase();
                    });

                    setPersonCertificates(certs);

                    // If certificates exist, pick the first one to show in preview
                    if (certs.length > 0) {
                      setFormData({
                        ...certs[0],
                        certificateDate: certs[0].certificateDate || getCertificateDate(), // fallback
                      });
                    } else {
                      setFormData(null); // ensure nothing renders if none
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

            {/* Certificates for selected person */}
            {selectedPerson && personCertificates.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {personCertificates[0].recipientName}'s Certificates
                </h3>

                {personCertificates.length > 0 && (
                  <div className="flex justify-end mb-2">
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
                      {selectedCertificates.length === personCertificates.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}

                <div className="space-y-3">
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
                          <button
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
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
                          >
                            PDF
                          </button>
                          <button
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
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
                          >
                            JPEG
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {selectedCertificates.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t pt-4">
                      <p className="text-gray-700">
                        {selectedCertificates.length} certificate{selectedCertificates.length > 1 ? "s" : ""} selected
                      </p>

                      <div className="flex gap-3">
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                          onClick={() => {
                            const selected = personCertificates.filter((c) =>
                              selectedCertificates.includes(c.id)
                            );

                            handleMultiDownload(selected, "pdf", selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg");
                          }}
                        >
                          Generate PDFs (ZIP)
                        </button>

                        <button
                          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                          onClick={() => {
                            const selected = personCertificates.filter((c) =>
                              selectedCertificates.includes(c.id)
                            );

                            handleMultiDownload(selected, "jpeg", selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg");
                          }}
                        >
                          Generate JPEGs (ZIP)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Input Form (always visible) */}
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

          {formData && (
            <div className="mt-6 text-center space-y-4">
              {!isDesktop && !forcePreview ? (
                <>
                  <p className="text-sm text-gray-500">
                    Preview is disabled on small/tablet screens to improve performance and prevent layout issues.
                  </p>

                  <div className="flex justify-center">
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

                  <button onClick={() => setForcePreview(true)} className="mt-2 text-sm underline text-blue-600">
                    Show preview anyway
                  </button>
                </>
              ) : (
                <>
                  <div className="w-full flex justify-center overflow-x-auto py-4">
                    <div className="flex-shrink-0">
                      <CertificateTemplate
                        {...formData}
                        templateUrl={selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"}
                        isPreview
                        certificateDate={formData.certificateDate ?? getCertificateDate()}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
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
                </>
              )}
            </div>
          )}

          {/* Toggle History Button */}
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

              {/* Search */}
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
                          <h3 className="font-bold">{h.recipientName || h.programName}</h3>
                          <p className="text-xs text-gray-500">
                            {h.category} · {h.fieldOfInterest} · {new Date(h.generatedAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              doDownloadPDF(h);
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
                          >
                            PDF
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              doDownloadJPEG(h);
                            }}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition text-sm"
                          >
                            JPEG
                          </button>
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
      </motion.div>
    </AnimatePresence>
  );
}
