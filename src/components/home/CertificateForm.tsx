"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplates } from "../../app/context/TemplateContext";
import { CleanCertificateData } from "../../types/certificates";
import Select from "react-select";

interface FormFields {
  organization: string;
  programName: string;
  achievementText: string;
  recipientName: string;
  certificateDate: string;
  signature?: string;
  signatory?: string;
}

const MAX_LENGTHS: Partial<Record<keyof FormFields, number>> = {
  programName: 65,
  achievementText: 300,
  recipientName: 15,
  certificateDate: 22,
};

export default function CertificateForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<CleanCertificateData>;
  onSubmit: (data: FormFields) => void;
}) {
  const router = useRouter();
  const { groups } = useTemplates();

  const [formData, setFormData] = useState<FormFields>({
    organization: initialValues?.organization || "",
    programName: "",
    achievementText: "",
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

  const programOptions = groups.map((g) => ({
    value: g.programName,
    label: g.programName,
  }));

  const handleProgramSelect = (selected: { value: string; label: string } | null) => {
    const newProgram = selected?.value || "";
    const defaults = groups.find((g) => g.programName === newProgram);

    setFormData((prev) => ({
      ...prev,
      programName: newProgram,
      achievementText: defaults ? defaults.achievementText : prev.achievementText,
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
    const current = formData[fieldName]?.length ?? 0;
    return (
      <p className="text-xs text-gray-500 text-right">
        {current}/{max} characters
      </p>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full border rounded shadow p-6"
    >
      {/* Program Name autocomplete */}
      <div>
        <label className="block font-semibold mb-1">Program Name</label>
        <Select
          options={programOptions}
          value={programOptions.find((o) => o.value === formData.programName)}
          onChange={handleProgramSelect}
          placeholder="-- Type to search or select a program --"
          isClearable
        />
      </div>

      {/* Achievement Text */}
      <div>
        <textarea
          name="achievementText"
          placeholder="Enter achievement text here"
          value={formData.achievementText}
          onChange={handleChange}
          required
          className="border p-2 w-full resize-none"
          rows={4}
        />
        {renderCounter("achievementText")}
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

      {/* Certificate Date - responsive: stacks on small screens */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <input
          name="certificateDate"
          placeholder="Certificate Date"
          value={formData.certificateDate}
          readOnly
          className="border p-2 flex-1 min-w-0" // min-w-0 to allow shrinking on tiny screens
        />
        <button
          type="button"
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded border hover:bg-gray-200 transition w-full sm:w-auto"
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
            className="border p-2 flex-1 min-w-0"
          >
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December",
            ].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border p-2 flex-1 min-w-0"
          >
            {Array.from({ length: 21 }, (_, i) => today.getFullYear() - i).map(
              (y) => <option key={y} value={y}>{y}</option>
            )}
          </select>
        </div>
      )}

      {/* Buttons (responsive) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 w-full">
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Generate Certificate
        </button>

        {/* push Manage Template to the right on sm+ */}
        <button
          type="button"
          onClick={() => router.push("/template-groups")}
          className="w-full sm:ml-auto sm:w-auto bg-gray-100 text-gray-800 px-4 py-2 rounded border hover:bg-gray-200 transition"
        >
          Manage Template
        </button>
      </div>
    </form>
  );
}
