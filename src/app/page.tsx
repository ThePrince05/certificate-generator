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

// ✅ Define the proper type for your certificate data
export type CertificateData = {
  heading: string;
  subheading: string;
  name: string;
  certificateDate: string;
  signature: string;
  signatory: string;
  [key: string]: any; // allows dynamic _invalid flags
};

export default function Home() {
  const [data, setData] = useState<CertificateData | null>(null);
  const [batchData, setBatchData] = useState<CertificateData[]>([]);
  const [editedBatchData, setEditedBatchData] = useState<CertificateData[]>([]);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [lastValidationErrors, setLastValidationErrors] = useState<string | null>(null);

  const MAX_LENGTHS: Record<keyof CertificateData, number> = {
    heading: 25,
    subheading: 54,
    name: 15,
    certificateDate: 22,
    signature: 16,
    signatory: 46,
  };

  // ✅ Validation helper
  const validateBatchData = (data: CertificateData[]) => {
    const invalidRows: string[] = [];
    const validatedData: CertificateData[] = data.map((item, index) => {
      const newItem: CertificateData = { ...item };
      for (const key in MAX_LENGTHS) {
        const field = key as keyof typeof MAX_LENGTHS;
        const value = (item[field] ?? "").toString().trim();

        if (value.length > MAX_LENGTHS[field]) {
          newItem[`${field}_invalid`] = true;
          invalidRows.push(
            `Row ${index + 1}: "${field}" exceeds ${MAX_LENGTHS[field]} chars (length: ${value.length})`
          );
        } else {
          newItem[`${field}_invalid`] = false;
        }
      }
      return newItem;
    });

    return { validatedData, invalidRows };
  };

  // CSV Upload Handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as CertificateData[];

        const { validatedData, invalidRows } = validateBatchData(rawData);

        setBatchData(rawData);
        setEditedBatchData(validatedData);

        const errorString = invalidRows.length > 0 ? invalidRows.join("\n") : null;
        setLastValidationErrors(errorString);
        if (errorString) setBatchWarning(errorString);
      },
    });
  };

  // Batch Download
  const handleBatchDownloadPDF = async () => {
    if (!editedBatchData.length) return;

    const { validatedData, invalidRows } = validateBatchData(editedBatchData);
    setEditedBatchData(validatedData);

    const errorString = invalidRows.length > 0 ? invalidRows.join("\n") : null;
    setLastValidationErrors(errorString);

    if (errorString) {
      setBatchWarning(errorString);
      return;
    }

    const zip = new JSZip();

    for (let i = 0; i < validatedData.length; i++) {
      const item = validatedData[i];

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(
        <CertificateTemplate
          heading={item.heading}
          subheading={item.subheading}
          name={item.name}
          certificateDate={item.certificateDate}
          signature={item.signature}
          signatory={item.signatory}
          pdfOffsets={{ heading: -12, subheading: 3, pak: 3, name: -8, date: -2, signature: -12, signatory: -2 }}
        />
      );

      await new Promise((res) => setTimeout(res, 500));

      const certificateElement = container.querySelector("#certificate") as HTMLElement;
      if (certificateElement) {
        const canvas = await html2canvas(certificateElement, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

        zip.file(`${item.name || "certificate"}-${i + 1}.pdf`, pdf.output("arraybuffer"));
      }

      root.unmount();
      document.body.removeChild(container);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "certificates.zip");
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-4xl font-bold text-center">Custom Certificate Program</h1>

      <CertificateForm onSubmit={setData} />

      <div className="flex justify-center my-6">
        <div className="p-6 border rounded shadow bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="mb-1 md:mb-0 font-semibold">Upload CSV for Batch</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {editedBatchData.length > 0 && (
            <button
              onClick={handleBatchDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition-all"
            >
              Download ZIP ({editedBatchData.length} Certificates)
            </button>
          )}
        </div>
      </div>

      {/* Batch Table Preview */}
      {editedBatchData.length > 0 && (
        <div className="overflow-auto max-w-5xl mx-auto mt-4">
          <table className="min-w-full border border-black border-collapse">
            <thead>
              <tr className="bg-gray-200">
                {Object.keys(MAX_LENGTHS).map((key) => (
                  <th
                    key={key}
                    className="border border-black px-3 py-2 text-left font-semibold"
                  >
                    {key.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editedBatchData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {Object.keys(MAX_LENGTHS).map((fieldKey) => {
                    const field = fieldKey as keyof CertificateData;
                    const value = row[field] || "";
                    const isInvalid = row[`${field}_invalid`] === true;

                    return (
                      <td
                        key={fieldKey}
                        className={`border px-2 py-1 ${isInvalid ? "bg-red-100 border-2 border-red-500" : "border-black"}`}
                      >
                        <input
                          value={value}
                          onChange={(e) => {
                            const newData = [...editedBatchData];
                            newData[rowIndex][field] = e.target.value;

                            const { validatedData, invalidRows } = validateBatchData(newData);
                            setEditedBatchData(validatedData);
                            setLastValidationErrors(invalidRows.length > 0 ? invalidRows.join("\n") : null);
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

          {lastValidationErrors && (
            <button
              onClick={() => setBatchWarning(lastValidationErrors)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Show Errors
            </button>
          )}
        </div>
      )}

      {/* Batch Warning Popup */}
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

      {data && (
        <>
          <CertificateTemplate {...data} />
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() =>
                generatePDF({
                  heading: -20,
                  subheading: -5,
                  pak: -10,
                  name: -16,
                  date: -10,
                  signature: -20,
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
                  heading: -20,
                  subheading: -5,
                  pak: -10,
                  name: -16,
                  date: -10,
                  signature: -20,
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
  );
}
