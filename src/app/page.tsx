"use client";

import { useState } from "react";
import CertificateForm from "../components/home/CertificateForm";
import CertificateTemplate from "../components/home/CertificateTemplate";
import { generatePDF, generateJPEG } from "./utils/generatePDF";

import Papa from "papaparse";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";

import {
  CertificateData,
  CleanCertificateData,
  CertificateFields,
} from "@/types/certificates";

// Max lengths for validation
const MAX_LENGTHS: Record<CertificateFields, number> = {
  initiative: 25,
  category: 54,
  textField: 188,
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

export default function Home() {
  const [formData, setFormData] = useState<CleanCertificateData | null>(null);
  const [batchCertificates, setBatchCertificates] = useState<CertificateData[]>([]);
  const [validatedBatch, setValidatedBatch] = useState<CertificateData[]>([]);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Validation
  const validateBatch = (data: CertificateData[]) => {
    const invalidRows: string[] = [];
    const validated: CertificateData[] = data.map((item, index) => {
      const newItem: CertificateData = { ...item };
      for (const key of Object.keys(MAX_LENGTHS) as CertificateFields[]) {
        const value = (item[key] ?? "").toString().trim();
        if (value.length > MAX_LENGTHS[key]) {
          newItem[`${key}_invalid`] = true;
          invalidRows.push(
            `Row ${index + 1}: "${key}" exceeds ${MAX_LENGTHS[key]} chars (length: ${value.length})`
          );
        } else {
          newItem[`${key}_invalid`] = false;
        }
      }
      return newItem;
    });
    return { validated, invalidRows };
  };

  // CSV Upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as CertificateData[];
        const { validated, invalidRows } = validateBatch(rawData);
        setBatchCertificates(rawData);
        setValidatedBatch(validated);
        const errors = invalidRows.length ? invalidRows.join("\n") : null;
        setValidationErrors(errors);
        if (errors) setBatchWarning(errors);
      },
    });
  };

  const validateBeforeDownload = (data: CertificateData[]) => {
    const { validated, invalidRows } = validateBatch(data);
    const errors = invalidRows.length ? invalidRows.join("\n") : null;
    setValidatedBatch(validated);
    setValidationErrors(errors);
    setBatchWarning(errors);
    return invalidRows.length === 0;
  };

  // ---- Batch PDF Download ----
  const handleBatchDownloadPDF = async () => {
    if (!validatedBatch.length) return;
    if (!validateBeforeDownload(validatedBatch)) return;

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
        root.render(
         <CertificateTemplate
  initiative={item.initiative}
  category={item.category}
  textfield={item.textField} // lowercase t
  recipientName={item.recipientName}
  certificateDate={item.certificateDate || getCertificateDate()} // match interface
  pdfOffsets={{
    initiative: -30,
    category: -15,
    textfield: -8, // lowercase t
    recipientName: -10,
    certificateDate: -2, // rename from certificateDate → awardedDate
    signature: 8,
    signatory: -2,
  }}
/>

        );

        await new Promise((res) => setTimeout(res, 200));

        const certificateEl = container.querySelector("#certificate") as HTMLElement;
        if (certificateEl) {
          const canvas = await html2canvas(certificateEl, { scale: 4 });
          const imgData = canvas.toDataURL("image/png");

          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [8382, 6706],
          });
          pdf.addImage(imgData, "PNG", 0, 0, 8382, 6706);

          zip.file(`${item.recipientName || "certificate"}-${i + 1}.pdf`, pdf.output("arraybuffer"));
        }

        root.unmount();
        document.body.removeChild(container);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "certificates.zip");
    } finally {
      setIsDownloading(false);
    }
  };

  // ---- Batch JPEG Download ----
  const handleBatchDownloadJPEG = async () => {
    if (!validatedBatch.length) return;
    if (!validateBeforeDownload(validatedBatch)) return;

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
        root.render(
          <CertificateTemplate
            initiative={item.initiative}
            category={item.category}
            recipientName={item.recipientName}
            certificateDate={item.certificateDate || getCertificateDate()}
            textfield={item.textField}
            pdfOffsets={{
              initiative: -30,
              category: -15,
              textfield: -8,
              recipientName: -10,
              certificateDate: -2,
              signature: 8,
              signatory: -2,
            }}
          />
        );

        await new Promise((res) => setTimeout(res, 200));

        const certificateEl = container.querySelector("#certificate") as HTMLElement;
        if (certificateEl) {
          const canvas = await html2canvas(certificateEl, { scale: 4 });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          const res = await fetch(imgData);
          const blob = await res.blob();
          zip.file(`${item.recipientName || "certificate"}-${i + 1}.jpg`, blob);
        }

        root.unmount();
        document.body.removeChild(container);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "certificates-jpeg.zip");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-4xl font-bold text-center">Custom Certificate Program</h1>

      <CertificateForm onSubmit={(data: CertificateData) => setFormData(data)} />

      {/* CSV upload + buttons */}
      <div className="flex justify-center my-6">
        <div className="p-6 border rounded shadow bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-semibold">Upload CSV for Batch</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {validatedBatch.length > 0 && (
            <div className="flex gap-2">
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

      {/* Batch Preview Table */}
      {validatedBatch.length > 0 && (
        <div className="overflow-auto max-w-5xl mx-auto mt-4">
          <table className="min-w-full border border-black border-collapse">
            <thead>
              <tr className="bg-gray-200">
                {Object.keys(MAX_LENGTHS).map((key) => (
                  <th key={key} className="border border-black px-3 py-2 text-left font-semibold">
                    {key.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validatedBatch.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {Object.keys(MAX_LENGTHS).map((fieldKey) => {
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
                            setValidationErrors(
                              invalidRows.length ? invalidRows.join("\n") : null
                            );
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

          {validationErrors && (
            <button
              onClick={() => setBatchWarning(validationErrors)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Show Errors
            </button>
          )}
        </div>
      )}

      {/* Error Popup */}
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

      {/* Single Certificate Preview */}
      {formData && (
        <>
        <CertificateTemplate
  initiative={formData.initiative}
  category={formData.category}
  textfield={formData.textField} // lowercase t
  recipientName={formData.recipientName}
  certificateDate={getCertificateDate()} // rename certificateDate → awardedDate
/>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() =>
                generatePDF({
                  initiative: -30,
                  category: -14,
                  textfield: -15,
                  recipientName: -18,
                  certificateDate: -10,
                  signature: -20,
                  signatory: -8,
                })
              }
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Download PDF
            </button>
            <button
              onClick={() =>
                generateJPEG({
                  initiative: -30,
                  category: -14,
                  textfield: -15,
                  recipientName: -18,
                  certificateDate: -10,
                  signature: -20,
                  signatory: -8,
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
  );
}
