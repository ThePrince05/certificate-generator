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

  // Set the default date on mount
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  setFormData((prev) => ({
    ...prev,
    certificateDate: `AWARDED ON ${formattedDate}`.toUpperCase(), // ← convert entire string to uppercase
  }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
