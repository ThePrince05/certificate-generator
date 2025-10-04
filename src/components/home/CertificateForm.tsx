"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplates } from "../../app/context/TemplateContext";


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

export default function CertificateForm({
  onSubmit,
}: {
  onSubmit: (data: CertificateData) => void;
}) {
  const router = useRouter();
  const { groups } = useTemplates(); // ✅ get templates from context

  const [formData, setFormData] = useState<CertificateData>({
    heading: "",
    subheading: "",
    pakText: "",
    name: "",
    certificateDate: "",
    signature: "/signature.svg",
    signatory: "AUTHORIZED BY LYLE BENJAMIN, PAK FOUNDER",
  });

  const [isEditingDate, setIsEditingDate] = useState(false);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("en-GB", { month: "long" }).toUpperCase()
  );
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  useEffect(() => {
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    setFormData((prev) => ({
      ...prev,
      certificateDate: `AWARDED ${month} ${year}`.toUpperCase(),
    }));
  }, []);

  const handleHeadingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHeading = e.target.value;
    const defaults = groups.find((g) => g.heading === newHeading);

    setFormData((prev) => ({
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
    const maxLength =
      name === "heading"
        ? Infinity
        : MAX_LENGTHS[name as keyof CertificateData] || Infinity;

    setFormData((prev) => ({
      ...prev,
      [name]: value.slice(0, maxLength),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const key in MAX_LENGTHS) {
      const field = key as keyof CertificateData;
      if (field === "heading") continue;
      if ((formData[field] || "").length > MAX_LENGTHS[field]) {
        alert(
          `"${field}" exceeds the maximum of ${MAX_LENGTHS[field]} characters.`
        );
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto p-4 border rounded shadow"
    >
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
          {groups.map((g) => (
            <option key={g.heading} value={g.heading}>
              {g.heading}
            </option>
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
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded border hover:bg-gray-200 transition"
          onClick={() => setIsEditingDate((prev) => !prev)}
        >
          Edit
        </button>
      </div>

      {/* Month & Year Dropdowns */}
      {isEditingDate && (
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value;
              setSelectedMonth(month);
              setFormData((prev) => ({
                ...prev,
                certificateDate: `AWARDED ${month} ${selectedYear}`,
              }));
            }}
            className="border p-2 flex-1"
          >
            {[
              "JANUARY",
              "FEBRUARY",
              "MARCH",
              "APRIL",
              "MAY",
              "JUNE",
              "JULY",
              "AUGUST",
              "SEPTEMBER",
              "OCTOBER",
              "NOVEMBER",
              "DECEMBER",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              const year = Number(e.target.value);
              setSelectedYear(year);
              setFormData((prev) => ({
                ...prev,
                certificateDate: `AWARDED ${selectedMonth} ${year}`,
              }));
            }}
            className="border p-2 flex-1"
          >
            {Array.from({ length: 21 }, (_, i) => today.getFullYear() - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {/* Buttons row */}
      <div className="flex items-center gap-3 mt-4 w-full">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Generate Certificate
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => router.push("/template-groups")}
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded border hover:bg-gray-200 transition"
        >
          Manage Template
        </button>
      </div>
    </form>
  );
}
