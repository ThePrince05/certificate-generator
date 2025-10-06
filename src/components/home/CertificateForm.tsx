"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplates } from "../../app/context/TemplateContext";

interface FormFields {
  initiative: string;
  category: string;
  textField: string;
  recipientName: string;
  certificateDate: string;
  signature?: string;
  signatory?: string;
}

const MAX_LENGTHS: Partial<Record<keyof FormFields, number>> = {
  initiative: 25,
  category: 54,
  textField: 188,
  recipientName: 15,
  certificateDate: 22,
};

export default function CertificateForm({
  onSubmit,
}: {
  onSubmit: (data: FormFields) => void;
}) {
  const router = useRouter();
  const { groups } = useTemplates();

  const [formData, setFormData] = useState<FormFields>({
    initiative: "",
    category: "",
    textField: "",
    recipientName: "",
    certificateDate: "",
  });

  const [isEditingDate, setIsEditingDate] = useState(false);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("en-GB", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      certificateDate: `Awarded ${selectedMonth} ${selectedYear}`,
    }));
  }, [selectedMonth, selectedYear]);

  const handleInitiativeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInitiative = e.target.value;
    const defaults = groups.find((g) => g.initiative === newInitiative);

    setFormData((prev) => ({
      ...prev,
      initiative: newInitiative,
      category: defaults ? defaults.category : prev.category,
      textField: defaults ? defaults.textField : prev.textField,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const maxLength = MAX_LENGTHS[name as keyof FormFields] || Infinity;

    setFormData((prev) => ({
      ...prev,
      [name]: value.slice(0, maxLength),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const key in MAX_LENGTHS) {
      const field = key as keyof FormFields;
      if (field === "initiative") continue;
      const max = MAX_LENGTHS[field];
      if (max && (formData[field] || "").length > max) {
        alert(`"${field}" exceeds the maximum of ${max} characters.`);
        return;
      }
    }
    onSubmit(formData);
  };

  const renderCounter = (fieldName: keyof FormFields) => {
    const max = MAX_LENGTHS[fieldName];
    if (!max) return null;
    const current = (formData[fieldName]?.length ?? 0);
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
      {/* Initiative dropdown */}
      <div>
        <label className="block font-semibold mb-1">Initiative</label>
        <select
          name="initiative"
          value={formData.initiative}
          onChange={handleInitiativeSelect}
          required
          className="border p-2 w-full"
        >
          <option value="">-- Select Initiative --</option>
          {groups.map((g) => (
            <option key={g.initiative} value={g.initiative}>
              {g.initiative}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <input
          name="category"
          placeholder="Category (e.g., Best Performer)"
          value={formData.category}
          onChange={handleChange}
          required
          className="border p-2 w-full mb-2"
        />
        {renderCounter("category")}
      </div>

      {/* Text Field */}
      <div>
        <textarea
          name="textField"
          placeholder="Enter main certificate text here"
          value={formData.textField}
          onChange={handleChange}
          required
          className="border p-2 w-full resize-none"
          rows={4}
        />
        {renderCounter("textField")}
      </div>

      {/* Recipient Name */}
      <div>
        <input
          name="recipientName"
          placeholder="Recipient Name"
          value={formData.recipientName}
          onChange={handleChange}
          required
          className="border p-2 w-full mb-2"
        />
        {renderCounter("recipientName")}
      </div>

      {/* Certificate Date */}
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
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 flex-1"
          >
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
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

      {/* Buttons */}
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
