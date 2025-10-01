"use client";

import { useState, useEffect } from "react";

interface CertificateData {
  heading: string;
  subheading: string;
  name: string;
  certificateDate: string;
  signature: string;
  signatory: string;
}

const MAX_LENGTHS = {
  heading: 25,
  subheading: 52,
  name: 15,
  certificateDate: 21,
  signature: 15,
  signatory: 47,
};

export default function CertificateForm({ onSubmit }: { onSubmit: (data: CertificateData) => void }) {
  const [formData, setFormData] = useState<CertificateData>({
    heading: "",
    subheading: "",
    name: "",
    certificateDate: "",
    signature: "",
    signatory: "AUTHORIZED BY LYLE BENJAMIN, PAK FOUNDER",
  });

  const [isDateEditable, setIsDateEditable] = useState(false);
  const [isSignatoryEditable, setIsSignatoryEditable] = useState(false);

  // Set default date
  useEffect(() => {
    const today = new Date();
    const monthYear = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    setFormData((prev) => ({
      ...prev,
      certificateDate: `AWARDED ${monthYear}`.toUpperCase(),
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Enforce max length
    if (value.length <= MAX_LENGTHS[name as keyof CertificateData]) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check all fields for length
    for (const key in MAX_LENGTHS) {
      const field = key as keyof CertificateData;
      if ((formData[field] || "").length > MAX_LENGTHS[field]) {
        alert(`"${field}" exceeds the maximum of ${MAX_LENGTHS[field]} characters.`);
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded shadow">
      <input
        name="heading"
        placeholder="Heading"
        value={formData.heading}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      />
      <input
        name="subheading"
        placeholder="Subheading"
        value={formData.subheading}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      />
      <input
        name="name"
        placeholder="Recipient Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      />

      {/* Toggle to allow editing the date */}
      <div className="flex items-center space-x-2">
        <input
          name="certificateDate"
          value={formData.certificateDate}
          onChange={handleChange}
          readOnly={!isDateEditable}
          className={`border p-2 w-full ${isDateEditable ? "bg-white" : "bg-gray-100"}`}
        />
        <button
          type="button"
          onClick={() => setIsDateEditable((prev) => !prev)}
          className="px-2 py-1 border rounded text-sm"
        >
          {isDateEditable ? "Lock" : "Edit"}
        </button>
      </div>

      <input
        name="signature"
        placeholder="Signature"
        value={formData.signature}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      {/* Signatory with toggle */}
      <div className="flex items-center space-x-2">
        <input
          name="signatory"
          value={formData.signatory}
          onChange={handleChange}
          readOnly={!isSignatoryEditable}
          className={`border p-2 w-full ${isSignatoryEditable ? "bg-white" : "bg-gray-100"}`}
        />
        <button
          type="button"
          onClick={() => setIsSignatoryEditable((prev) => !prev)}
          className="px-2 py-1 border rounded text-sm"
        >
          {isSignatoryEditable ? "Lock" : "Edit"}
        </button>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Generate Certificate
      </button>
    </form>
  );
}
