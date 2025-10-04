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
  pakText: 188,
  name: 15,
  certificateDate: 22,
  signature: 16,
  signatory: 46,
};

// Heading presets
const HEADING_MAP: Record<string, { subheading: string; pakText: string }> = {
  "Planned Acts of Kindness": {
    subheading: "Karma Club Member",
    pakText: "I Hereby Make a PAK to Treat Others with Respect & Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself"
  },
  "One Planet - One People": {
    subheading: "Global Ambassador",
    pakText: "I hereby pledge I am committed to the Collaborative Sustainability initiatives of One Planet - One People & I Volunteer to actively work for the betterment of Kids, People & The Planet"
  }
};


export default function CertificateForm({ onSubmit }: { onSubmit: (data: CertificateData) => void }) {
  const [formData, setFormData] = useState<CertificateData>({
    heading: "",
    subheading: "",
    pakText: "",
    name: "",
    certificateDate: "",
    signature: "/signature.svg",
    signatory: "AUTHORIZED BY LYLE BENJAMIN, PAK FOUNDER",
  });

  // Default date
  useEffect(() => {
    const today = new Date();
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    setFormData(prev => ({
      ...prev,
      certificateDate: `AWARDED ${month} ${year}`.toUpperCase(),
    }));
  }, []);

  // Handle heading selection
  const handleHeadingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHeading = e.target.value;
    const defaults = HEADING_MAP[newHeading];

    setFormData(prev => ({
      ...prev,
      heading: newHeading,
      subheading: defaults ? defaults.subheading : prev.subheading,
      pakText: defaults ? defaults.pakText : prev.pakText,
    }));
  };

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  // Only slice if MAX_LENGTH exists and field is not heading
  const maxLength = name === "heading" ? Infinity : MAX_LENGTHS[name as keyof CertificateData] || Infinity;

  setFormData(prev => ({
    ...prev,
    [name]: value.slice(0, maxLength),
  }));
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const key in MAX_LENGTHS) {
    const field = key as keyof CertificateData;
    if (field === "heading") continue; // skip heading
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

// Component state at the top
const [isEditingDate, setIsEditingDate] = useState(false);
const today = new Date();
const [selectedMonth, setSelectedMonth] = useState(today.toLocaleString("en-GB", { month: "long" }).toUpperCase());
const [selectedYear, setSelectedYear] = useState(today.getFullYear());


  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded shadow">
      {/* Heading dropdown */}
      <div>
        <label className="block font-semibold mb-1">Heading</label>
        <select
          name="heading"
          value={formData.heading}
          onChange={handleHeadingSelect}
          required
          className="border p-2 w-full"
        >
          <option value="">-- Select Heading --</option>
          {Object.keys(HEADING_MAP).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Subheading editable */}
      <div>
        <input
          name="subheading"
          placeholder="Subheading"
          value={formData.subheading}
          onChange={handleChange}
          required
          className="border p-2 w-full mb-2"
        />
        {renderCounter("subheading")}
      </div>

      {/* PAK Paragraph editable */}
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

      {/* Recipient name */}
      <div>
        <input
          name="name"
          placeholder="Recipient Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border p-2 w-full mb-2"
        />
        {renderCounter("name")}
      </div>

      {/* Certificate Date Field with Edit button */}
      <div className="flex items-center gap-2">
        <input
          name="certificateDate"
          placeholder="Certificate Date"
          value={formData.certificateDate}
          readOnly
          className="border p-2 flex-1"
        />
        <button
          type="button"
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => setIsEditingDate((prev) => !prev)}
        >
          Edit
        </button>
      </div>

    {/* Month & Year Dropdowns */}
    {isEditingDate && (
      <div className="mt-2 flex gap-2">
        {/* Month Dropdown */}
        <select
          value={selectedMonth}
          onChange={(e) => {
            const month = e.target.value;
            setSelectedMonth(month);
            setFormData(prev => ({
              ...prev,
              certificateDate: `AWARDED ${month} ${selectedYear}`,
            }));
          }}
          className="border p-2 flex-1"
        >
          {[
            "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
            "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"
          ].map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Year Dropdown: Current to past 20 years */}
        <select
          value={selectedYear}
          onChange={(e) => {
            const year = Number(e.target.value);
            setSelectedYear(year);
            setFormData(prev => ({
              ...prev,
              certificateDate: `AWARDED ${selectedMonth} ${year}`,
            }));
          }}
          className="border p-2 flex-1"
        >
          {Array.from({ length: 21 }, (_, i) => today.getFullYear() - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    )}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Generate Certificate
      </button>
    </form>
  );
}
