"use client";

import { useState, useEffect } from "react";

interface CertificateData {
  heading: string;
  subheading: string;
  pakText: string;  
  name: string;
  certificateDate: string;
  signature: string;
  signatory: string;
}

const MAX_LENGTHS = {
  heading: 25,
  subheading: 54,
  pakText: 162,
  name: 15,
  certificateDate: 22,
  signature: 16,
  signatory: 46,
};

export default function CertificateForm({ onSubmit }: { onSubmit: (data: CertificateData) => void }) {
  const [formData, setFormData] = useState<CertificateData>({
    heading: "",
    subheading: "",
    pakText: "",
    name: "",
    certificateDate: "",
    signature: "/signature.svg", // constant
    signatory: "AUTHORIZED BY LYLE BENJAMIN, PAK FOUNDER", // constant
  });

  // Set default date automatically
  useEffect(() => {
    const today = new Date();
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    setFormData(prev => ({
      ...prev,
      certificateDate: `AWARDED ${month} ${year}`.toUpperCase(),
    }));
  }, []);

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;
  const maxLength = MAX_LENGTHS[name as keyof CertificateData] || Infinity;
  setFormData({
    ...formData,
    [name]: value.slice(0, maxLength),
  });
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // validate field lengths
    for (const key in MAX_LENGTHS) {
      const field = key as keyof CertificateData;
      if ((formData[field] || "").length > MAX_LENGTHS[field]) {
        alert(`"${field}" exceeds the maximum of ${MAX_LENGTHS[field]} characters.`);
        return;
      }
    }
    onSubmit(formData);
  };

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
      <textarea
        name="pakText"
        placeholder="PAK Paragraph"
        value={formData.pakText}
        onChange={handleChange}
        required
        className="border p-2 w-full resize-none"
        rows={4}
      />
      {renderCounter("pakText")}
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

      {/* No date input anymore, it's automatic */}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Generate Certificate
      </button>
    </form>
  );
}
