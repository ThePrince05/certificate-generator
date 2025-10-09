"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "../context/OrganizationContext";
import { useTemplates } from "../context/TemplateContext";
import CertificateForm from "@/components/home/CertificateForm";
import CertificateTemplate from "@/components/home/CertificateTemplate";
import { generatePDF, generateJPEG } from "../utils/generatePDF";
import { CleanCertificateData } from "@/types/certificates";

export default function GenerateSingle() {
  const { selectedOrg } = useOrganization();
  const { groups, loadGroups } = useTemplates();
  const router = useRouter();
  const [formData, setFormData] = useState<CleanCertificateData | null>(null);

  const getCertificateDate = () => {
    const today = new Date();
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    return `Awarded ${month} ${year}`;
  };

  useEffect(() => {
    if (!selectedOrg) {
      router.push("/generate");
      return;
    }
    loadGroups(selectedOrg.id);
  }, [selectedOrg, router, loadGroups]);

  if (!selectedOrg) return <p className="p-8 text-center text-gray-600">Redirecting...</p>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="generate-single"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="p-8 space-y-8 max-w-4xl mx-auto"
      >
        <button
          onClick={() => router.push("/generate")}
          className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
        >
          ← Change Generation
        </button>

        <h1 className="text-4xl font-bold text-center mb-4">
          Generate Single Certificate
        </h1>

        <h2 className="text-2xl text-center text-gray-600 mb-8">
          {selectedOrg.name}
        </h2>

        <CertificateForm
          initialValues={{ organization: selectedOrg.name }}
          onSubmit={(data) => setFormData(data)}
        />

        {formData && (
          <div className="mt-6 text-center">
            <CertificateTemplate
              {...formData}
              templateUrl={selectedOrg.templateUrl}
              isPreview
              certificateDate={formData.certificateDate ?? getCertificateDate()}
            />

            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() =>
                  generatePDF({
                    organization: -30,
                    programName: -14,
                    achievementText: -15,
                    recipientName: -16,
                    certificateDate: -10,
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
                  })
                }
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Download JPEG
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
