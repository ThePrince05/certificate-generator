"use client";

import { useState } from "react";
import CertificateForm from "../components/home/CertificateForm";
import CertificateTemplate from "../components/home/CertificateTemplate";
import { generatePDF, generateJPEG } from "./utils/generatePDF";

export default function Home() {
 const [data, setData] = useState<any>(null);

return (
    <div className="space-y-8 p-8">
      {/* Page Heading */}
      <h1 className="text-4xl font-bold text-center">
        Custom Certificate Program
      </h1>

      {/* Single Certificate Form */}
      <CertificateForm onSubmit={setData} />

      {/* Render Certificate and PDF Button */}
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
          signatory: -20,
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
          signatory: -20,
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
