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
  subheading: 54,
  name: 15,
  certificateDate: 22,
  signature: 16,
  signatory: 46,
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
  const month = today.toLocaleString("en-GB", { month: "long" });
  const year = today.getFullYear(); // <-- dynamic year

  setFormData((prev) => ({
    ...prev,
    certificateDate: `AWARDED ${month} ${year}`.toUpperCase(),
  }));
}, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const maxLength = MAX_LENGTHS[name as keyof CertificateData] || Infinity;
    setFormData({
      ...formData,
      [name]: value.slice(0, maxLength),
    });
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

  // helper to display remaining characters
  const renderCounter = (fieldName: keyof CertificateData) => {
    const max = MAX_LENGTHS[fieldName];
    const current = formData[fieldName].length;
    return (
      <p className="text-xs text-gray-500 text-right">
        {current}/{max} characters
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded shadow">
      <div>
        <input
          name="heading"
          placeholder="Heading"
          value={formData.heading}
          onChange={handleChange}
          required
          className="border p-2 w-full"
        />
        {renderCounter("heading")}
      </div>

      <div>
        <input
          name="subheading"
          placeholder="Subheading"
          value={formData.subheading}
          onChange={handleChange}
          required
          className="border p-2 w-full"
        />
        {renderCounter("subheading")}
      </div>

      <div>
        <input
          name="name"
          placeholder="Recipient Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border p-2 w-full"
        />
        {renderCounter("name")}
      </div>

      {/* Toggle to allow editing the date */}
      <div>
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
        {renderCounter("certificateDate")}
      </div>

      <div>
        <input
          name="signature"
          placeholder="Signature"
          value={formData.signature}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        {renderCounter("signature")}
      </div>

      {/* Signatory with toggle */}
      <div>
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
        {renderCounter("signatory")}
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Generate Certificate
      </button>
    </form>
  );
}
