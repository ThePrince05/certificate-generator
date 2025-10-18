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

type PastCertificate = CleanCertificateData & {
  id: string;
  generatedAt: string;
};

export default function GenerateSingle() {
  const { selectedOrg } = useOrganization();
  const { groups, loadGroups, selectedTemplate } = useTemplates();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const [formData, setFormData] = useState<CleanCertificateData | null>(null);
  const [forcePreview, setForcePreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<PastCertificate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("certificateHistory_v1");
      return raw ? (JSON.parse(raw) as PastCertificate[]) : [];
    } catch {
      return [];
    }
  });

  const saveHistory = (items: PastCertificate[]) => {
    setHistory(items);
    try {
      localStorage.setItem("certificateHistory_v1", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save certificate history", e);
    }
  };

  const getCertificateDate = () => {
    const today = new Date();
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    return `Awarded ${month} ${year}`;
  };

  // Filter history by search
  const filteredHistory = history.filter((h) =>
    [h.recipientName, h.programName, h.category, h.fieldOfInterest]
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

  // Handle new certificate generation
  const handleGenerate = (data: CleanCertificateData) => {
    const item: PastCertificate = { ...data, id: uuidv4(), generatedAt: new Date().toISOString() };
    saveHistory([item, ...history]);
    setFormData(data);
  };

  const handleDeleteHistory = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
  };

  const doDownloadPDF = (item: PastCertificate) => {
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

  const doDownloadJPEG = (item: PastCertificate) => {
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

            <CertificateForm
              initialValues={{ organization: selectedOrg.name }}
              onSubmit={handleGenerate}
            />
          </div>

          {formData && (
            <div className="mt-6 text-center space-y-4">
              {!isDesktop && !forcePreview ? (
                <>
                  <p className="text-sm text-gray-500">
                    Preview is disabled on small/tablet screens to improve performance and prevent layout issues.
                  </p>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() =>
                        generatePDF({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Download PDF
                    </button>

                    <button
                      onClick={() =>
                        generateJPEG({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Download JPEG
                    </button>
                  </div>

                  <button
                    onClick={() => setForcePreview(true)}
                    className="mt-2 text-sm underline text-blue-600"
                  >
                    Show preview anyway
                  </button>
                </>
              ) : (
                <>
                  <div className="w-full flex justify-center overflow-x-auto py-4">
                    <div className="flex-shrink-0">
                      <CertificateTemplate
                        {...formData}
                        templateUrl={selectedTemplate.backgroundUrl}
                        isPreview
                        certificateDate={formData.certificateDate ?? getCertificateDate()}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() =>
                        generatePDF({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Download PDF
                    </button>

                    <button
                      onClick={() =>
                        generateJPEG({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Download JPEG
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
{/* Certificate History */}
<section className="max-w-3xl mx-auto bg-gray-50 border rounded shadow p-6 mt-8">
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
      {searchQuery
        ? `No certificates match "${searchQuery}".`
        : "No certificates generated yet."}
    </p>
  ) : (
    <div className="space-y-4">
      {filteredHistory.map((h) => (
        <div key={h.id} className="border p-4 rounded shadow-sm bg-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold">{h.recipientName || h.programName}</h3>
              <p className="text-xs text-gray-500">
                {h.category} · {h.fieldOfInterest} ·{" "}
                {new Date(h.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => doDownloadPDF(h)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
              >
                PDF
              </button>
              <button
                onClick={() => doDownloadJPEG(h)}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition text-sm"
              >
                JPEG
              </button>
              <button
                onClick={() => handleDeleteHistory(h.id)}
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

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
