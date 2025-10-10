"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CertificateTemplate from "@/components/home/CertificateTemplate";
import { useOrganization } from "../context/OrganizationContext";
import Papa from "papaparse";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";
import { CertificateData, CertificateFields } from "@/types/certificates";

// Max lengths for validation
const MAX_LENGTHS: Record<CertificateFields, number> = {
  organization: 25,
  programName: 65,
  achievementText: 300,
  recipientName: 15,
  certificateDate: 22,
};

// Auto-generate "Awarded <Month> <Year>"
const getCertificateDate = () => {
  const today = new Date();
  const month = today.toLocaleString("en-GB", { month: "long" });
  const year = today.getFullYear();
  return `Awarded ${month} ${year}`;
};

export default function GenerateBatch() {
  const { selectedOrg } = useOrganization();
  const router = useRouter();

  const [validatedBatch, setValidatedBatch] = useState<CertificateData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!selectedOrg) router.push("/select-organization");
  }, [selectedOrg, router]);

  if (!selectedOrg) return <p className="p-8 text-center">Redirecting...</p>;

  const validateBatch = (data: CertificateData[]) => {
    const invalidRows: string[] = [];
    const validated = data.map((item, index) => {
      const newItem: CertificateData = { ...item };
      (Object.keys(MAX_LENGTHS) as CertificateFields[]).forEach((key) => {
        const value = (item[key] ?? "").toString().trim();
        if (value.length > MAX_LENGTHS[key]) {
          newItem[`${key}_invalid`] = true;
          invalidRows.push(`Row ${index + 1}: "${key}" exceeds ${MAX_LENGTHS[key]} chars`);
        } else {
          newItem[`${key}_invalid`] = false;
        }
      });
      return newItem;
    });
    return { validated, invalidRows };
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = (results.data as CertificateData[]).map((item) => ({
          ...item,
          organization: selectedOrg.name,
        }));
        const { validated, invalidRows } = validateBatch(rawData);
        setValidatedBatch(validated);
        const errors = invalidRows.length ? invalidRows.join("\n") : null;
        setValidationErrors(errors);
        if (errors) setBatchWarning(errors);
      },
    });
  };

  const renderCertificate = (item: CertificateData) => (
    <CertificateTemplate
      {...item}
      templateUrl={selectedOrg.templateUrl}
      certificateDate={item.certificateDate || getCertificateDate()}
      pdfOffsets={{
        organization: -30,
        programName: -15,
        achievementText: -18,
        recipientName: -16,
        certificateDate: -8,
        signature: 1,
        signatory: -10,
      }}
    />
  );

  const handleBatchDownloadPDF = async () => {
    if (!validatedBatch.length) return;
    setIsDownloading(true);
    const zip = new JSZip();

    for (let i = 0; i < validatedBatch.length; i++) {
      const item = validatedBatch[i];
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(renderCertificate(item));
      await new Promise((res) => setTimeout(res, 200));

      const el = container.querySelector("#certificate") as HTMLElement;
      if (el) {
        const canvas = await html2canvas(el, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [8382, 6706] });
        pdf.addImage(imgData, "PNG", 0, 0, 8382, 6706);
        zip.file(`${item.recipientName || "certificate"}-${i + 1}.pdf`, pdf.output("arraybuffer"));
      }

      root.unmount();
      document.body.removeChild(container);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${selectedOrg.name}-certificates.zip`);
    setIsDownloading(false);
  };

  const handleBatchDownloadJPEG = async () => {
  if (!validatedBatch.length) return;
  setIsDownloading(true);

  try {
    const zip = new JSZip();

    for (let i = 0; i < validatedBatch.length; i++) {
      const item = validatedBatch[i];
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(renderCertificate(item));

      await new Promise((res) => setTimeout(res, 200));

      const certificateEl = container.querySelector("#certificate") as HTMLElement;
      if (certificateEl) {
        const canvas = await html2canvas(certificateEl, { scale: 2 });
        const imgData = canvas.toDataURL("image/jpeg", 0.9);
        const res = await fetch(imgData);
        const blob = await res.blob();
        zip.file(`${item.recipientName || "certificate"}-${i + 1}.jpg`, blob);
      }

      root.unmount();
      document.body.removeChild(container);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${selectedOrg.name}-certificates-jpeg.zip`);
  } finally {
    setIsDownloading(false);
  }
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
      {/* Top header */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-extrabold mb-4">Generate Batch Certificates</h1>
        <h2 className="text-2xl font-semibold text-gray-700">{selectedOrg.name}</h2>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push("/generate")}
        className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
      >
        ← Change Generation
      </button>

      {/* CSV Upload + Download Buttons */}
      <div className="flex justify-center my-6">
        <div className="p-6 border rounded shadow bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-center gap-4">
          <label className="font-semibold">Upload CSV for Batch</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {validatedBatch.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleBatchDownloadPDF}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition-all"
              >
                {isDownloading ? "Downloading..." : `Download PDF (${validatedBatch.length})`}
              </button>

              <button
                onClick={handleBatchDownloadJPEG}
                disabled={isDownloading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-5 py-2 rounded shadow transition-all"
              >
                {isDownloading ? "Downloading..." : `Download JPEG (${validatedBatch.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Batch Table */}
      {validatedBatch.length > 0 && (
        <div className="overflow-auto max-w-5xl mx-auto mt-4">
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
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {Object.keys(MAX_LENGTHS)
                    .filter((key) => key !== "organization")
                    .map((fieldKey) => {
                      const field = fieldKey as CertificateFields;
                      const value = row[field] || "";
                      const isInvalid = row[`${field}_invalid`] ?? false;

                      return (
                        <td
                          key={fieldKey}
                          className={`border px-2 py-1 ${
                            isInvalid ? "bg-red-100 border-2 border-red-500" : "border-black"
                          }`}
                        >
                          <input
                            value={value}
                            onChange={(e) => {
                              const newData = [...validatedBatch];
                              newData[rowIndex][field] = e.target.value;
                              const { validated, invalidRows } = validateBatch(newData);
                              setValidatedBatch(validated);
                              setValidationErrors(invalidRows.length ? invalidRows.join("\n") : null);
                            }}
                            className={`w-full px-2 py-1 rounded focus:outline-none ${
                              isInvalid ? "bg-red-100" : "bg-white"
                            }`}
                          />
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Batch Warning */}
      {batchWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-lg w-full bg-red-600 text-white p-4 rounded shadow-lg z-50 animate-fade-in">
          <strong className="block mb-2">CSV Errors:</strong>
          <pre className="whitespace-pre-wrap text-sm">{batchWarning}</pre>
          <button
            onClick={() => setBatchWarning(null)}
            className="mt-3 px-3 py-1 bg-white text-red-600 rounded hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      )}
    </motion.div>
  </AnimatePresence>
);
}
