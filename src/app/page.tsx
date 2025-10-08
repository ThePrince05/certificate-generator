"use client";

import { useEffect, useState } from "react";
import CertificateForm from "../components/home/CertificateForm";
import CertificateTemplate from "../components/home/CertificateTemplate";
import { generatePDF, generateJPEG } from "./utils/generatePDF";
import { useOrganization } from "./context/OrganizationContext";
import { useRouter } from "next/navigation";

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
  organization: 25,
  programName: 54,
  achievementText: 188,
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
  const { selectedOrg } = useOrganization();
  const router = useRouter();

  // Redirect if no organization selected
  useEffect(() => {
    if (!selectedOrg) {
      router.push("/select-organization");
    }
  }, [selectedOrg, router]);

  if (!selectedOrg) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-600">Redirecting to organization selection...</p>
      </div>
    );
  }

  // Validate batch
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

  const renderCertificate = (item: CertificateData) => (
    <CertificateTemplate
      organization={item.organization}
      programName={item.programName}
      achievementText={item.achievementText}
      recipientName={item.recipientName}
      certificateDate={item.certificateDate || getCertificateDate()}
      templateUrl={selectedOrg.templateUrl}
      pdfOffsets={{
        organization: -30,
        programName: -15,
        achievementText: -8,
        recipientName: -10,
        certificateDate: -2,
        signature: 8,
        signatory: -2,
      }}
    />
  );

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
        root.render(renderCertificate(item));

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
      saveAs(blob, `${selectedOrg.name}-certificates.zip`);
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
        root.render(renderCertificate(item));

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
      saveAs(zipBlob, `${selectedOrg.name}-certificates-jpeg.zip`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-4xl font-bold text-center">{selectedOrg.name}</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => router.push("/select-organization")}
          className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
        >
          ← Back
        </button>
      </div>

     <CertificateForm
  initialValues={{
    organization: selectedOrg.name, // pre-fill organization field
  }}
  onSubmit={(data: CertificateData) => setFormData(data)}
/>


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

      {/* Single Certificate Preview */}
      {formData && (
        <>
          {renderCertificate(formData)}

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() =>
                generatePDF({
                  organization: -30,
                  programName: -14,
                  achievementText: -15,
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
                  organization: -30,
                  programName: -14,
                  achievementText: -15,
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
