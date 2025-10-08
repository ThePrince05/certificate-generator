"use client";

import { useRouter } from "next/navigation";
import { useOrganization } from "../context/OrganizationContext";

export default function GenerateLanding() {
  const { selectedOrg } = useOrganization();
  const router = useRouter();

  if (!selectedOrg) {
    router.push("/select-organization");
    return <p className="text-center p-8">Redirecting...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Generate Certificates for {selectedOrg.name}
        </h1>

       <div className="flex flex-col md:flex-row justify-center gap-6 mb-6">
  <button
    className="px-8 py-4 bg-green-600 text-white rounded-lg border-2 border-green-700 hover:bg-green-700 hover:border-green-800 shadow-md transition"
    onClick={() => router.push("/generate-single")}
  >
    Single Certificate
  </button>

  <button
    className="px-8 py-4 bg-blue-600 text-white rounded-lg border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 shadow-md transition"
    onClick={() => router.push("/generate-batch")}
  >
    Batch Certificates
  </button>
</div>


        <div className="text-center">
           <button
        onClick={() => router.push("/select-organization")}
        className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
      >
        ← Change Organization
      </button>
        </div>
      </div>
    </div>
  );
}
