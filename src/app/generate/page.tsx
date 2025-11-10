"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { Organization } from "../context/OrganizationContext";
import { useOrganization } from "../context/OrganizationContext";

const organizations: Organization[] = [
  {
    id: "opop",
    name: "One Planet-One People",
    logoUrl: "/images/one-planet-one-people/logo.png",
    templateUrl: "/templates/one-planet-one-people/certificate-template.jpg",
  },
  {
    id: "pak",
    name: "Planned Acts of Kindness",
    logoUrl: "/images/planned-acts-of-kindness/logo.png",
    templateUrl: "/templates/one-planet-one-people/certificate-template.jpg",
  },
];

// Separate component that uses useSearchParams
function GeneratePageContent() {
  const { selectedOrg, selectOrg, clearOrg } = useOrganization();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || (selectedOrg ? "type" : "org");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/generate-single");
    router.prefetch("/generate-batch");

    const shouldReset = sessionStorage.getItem("resetOrgOnNextGenerate");
    if (shouldReset) {
      clearOrg();
      sessionStorage.removeItem("resetOrgOnNextGenerate");
    }
  }, [clearOrg, router]);

  // Wrap navigation to show loading bar
  const navigateWithLoading = (path: string) => {
    setLoading(true);
    router.push(path);
  };

  const handleSelect = (org: Organization) => {
    selectOrg(org);
    router.replace("/generate?step=type");
  };

  const handleBack = () => {
    clearOrg();
    router.replace("/generate?step=org");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-16">
      {/* Loading Bar */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ width: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-1 bg-green-500 z-50"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === "org" || !selectedOrg ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl font-extrabold mb-4">
              Custom Certificate Program
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-10">
              Select an organization to begin.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => handleSelect(org)}
                  className="cursor-pointer bg-white border rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
                >
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-32 h-32 mx-auto mb-4 object-contain"
                  />
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl font-bold mb-8">
              {selectedOrg.name} Certificates
            </h1>

            <div className="flex flex-col md:flex-row justify-center gap-6 mb-6">
              <button
                className="px-8 py-4 bg-green-600 text-white rounded-lg border-2 border-green-700 hover:bg-green-700 shadow-md transition"
                onClick={() => navigateWithLoading("/generate-single")}
              >
                Single Certificate
              </button>

              <button
                className="px-8 py-4 bg-blue-600 text-white rounded-lg border-2 border-blue-700 hover:bg-blue-700 shadow-md transition"
                onClick={() => navigateWithLoading("/generate-batch")}
              >
                Batch Certificates
              </button>
            </div>

            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md"
            >
              ← Change Organization
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main component with Suspense boundary
export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-6 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GeneratePageContent />
    </Suspense>
  );
}