"use client";

import { useState, useEffect, useMemo } from "react";
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
  fieldOfInterest: string;
  signature?: string;
  signatory?: string;
}

const MAX_LENGTHS: Partial<Record<keyof FormFields, number>> = {
  programName: 65,
  achievementText: 300,
  recipientName: 15,
  certificateDate: 22,
};

const FIELD_OF_INTEREST_OPTIONS = [
  "AI Based Communication and Journalism",
  "AI Assisted Business Development Managers",
  "HR Recruiter - HR Specialist (AI Assisted)",
  "AI Public Relations / Publicist",
  "AI Based Project Management Volunteer",
  "Web Development Volunteer or Intern",
  "AI Assisted Research Specialist or Research Manager",
  "AI Based Human Resources Recruitment, On-Boarding & Management",
  "Military & Service Veteran Volunteers",
  "AI BASED Video Editor/Producer",
  "PUBLICIST - BOOKS, AUTHOR",
  "AI BASED Graphic Designer/Illustrator/Editor",
  "AI Assisted Applications Developer",
  "AI Assisted WORD PRESS WEBSITE DEVELOPER",
  "Product Development Engineer",
  "(UNSDG) Project Management Volunteer",
  "AI Based Database Management Volunteer or Intern",
  "Retired Volunteers for CSR, HR, PR & Social Responsibility Entrepreneurship",
  "AI Based Business/Marketing Management Specialist",
  "AI Based Social Media Volunteer or Intern",
  "AI Assisted Marketing Manager",
  "AI Assisted PHP Developer",
  "AI Assisted Meeting & Event Planning",
  "TEDx Coach & Coordinator",
  "AI Based Business Development Management",
  "AI Assisted Grant Writing",
  "Publicist for Ground-Breaking CSR, HR & PR Programs",
  "AI Assisted Volunteer Coordinator",
  "AI Assisted Product Development Engineer",
];

const CATEGORIES = [
  "Architecture & Design",
  "Business & Finance",
  "Creative & Media",
  "Education",
  "Engineering & Product",
  "Entrepreneurship",
  "Human Services",
  "Marketing & Communications",
  "Professional Services",
  "Social Impact & Policy",
  "Technology & Digital",
];

export default function CertificateForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<CleanCertificateData>;
  onSubmit: (data: FormFields) => void;
}) {
  const router = useRouter();
  const { groups } = useTemplates();

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("en-GB", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [formData, setFormData] = useState<FormFields>({
    organization: initialValues?.organization || "",
    programName: "",
    achievementText: "",
    recipientName: "",
    certificateDate: `Awarded ${selectedMonth} ${selectedYear}`,
    fieldOfInterest: "",
  });

  // --- keep certificate date synced with dropdowns ---
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      certificateDate: `Awarded ${selectedMonth} ${selectedYear}`,
    }));
  }, [selectedMonth, selectedYear]);

  // --- derive program options safely ---
  const programOptions = useMemo(() => {
    console.group("🧭 Deriving Program Options");
    console.log("Groups:", groups);
    const opts = (groups || []).map((g) => ({
      value: g.programName,
      label: g.programName,
    }));
    console.log("Derived programOptions:", opts);
    console.groupEnd();
    return opts;
  }, [groups]);

  // --- handle program selection ---
  const handleProgramSelect = (selected: { value: string; label: string } | null) => {
    const newProgram = selected?.value || "";
    console.log("➡️ Program selected:", newProgram);

    const defaults = groups.find((g) => g.programName === newProgram);
    if (!defaults) console.warn("⚠️ No group found for selected program.");

    setFormData((prev) => ({
      ...prev,
      programName: newProgram,
      achievementText: defaults ? defaults.achievementText : prev.achievementText,
    }));
  };

  // --- filtered program options with category filtering + debug ---
const filteredProgramOptions = useMemo(() => {
  console.group("🔍 Filtering Program Options");
  console.log("programOptions:", programOptions);
  console.log("selectedCategory:", selectedCategory);

  const selected = (selectedCategory || "").trim().toLowerCase();

  const filtered = programOptions.filter((p) => {
    const group = groups.find((g) => g.programName === p.value);
    if (!group) {
      console.warn("⚠️ Group not found for program:", p.value);
      return false;
    }

    const groupCategory = (group.category || "").trim().toLowerCase();
    const match = selected === "" || groupCategory === selected;

    console.log(
      `Program: ${p.value}, Group Category: ${group.category}, Matches?`,
      match
    );
    return match;
  });

  console.groupEnd();
  return filtered;
}, [programOptions, groups, selectedCategory]);


  // --- prevent clearing before groups are loaded ---
  useEffect(() => {
    console.group("📝 Category Change Check");
    console.log("selectedCategory:", selectedCategory);
    console.log("current programName:", formData.programName);
    console.log("groups length:", groups?.length || 0);

    if (!groups || groups.length === 0) {
      console.log("⏳ Groups not loaded yet — skipping clear logic.");
      console.groupEnd();
      return;
    }

    const selectedProgramGroup = groups.find(
      (g) => g.programName === formData.programName
    );

    if (
      formData.programName &&
      (!selectedProgramGroup ||
        selectedProgramGroup.category !== selectedCategory)
    ) {
      console.warn("⚠️ Clearing programName + achievementText due to category mismatch.");
      setFormData((prev) => ({
        ...prev,
        programName: "",
        achievementText: "",
      }));
    } else {
      console.log("✅ Program still valid for category — keeping selection.");
    }

    console.groupEnd();
  }, [selectedCategory, groups]);

  // --- handlers for text and dropdown fields ---
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

  const handleFieldOfInterestChange = (selected: { value: string; label: string } | null) => {
    setFormData((prev) => ({
      ...prev,
      fieldOfInterest: selected?.value || "",
    }));
  };

  // --- form submission ---
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
    if (!formData.fieldOfInterest) {
      alert("Please select a Field of Interest.");
      return;
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
      {/* Category */}
      <div>
        <label className="block font-semibold mb-1">Category</label>
        <Select
          options={[
            { value: "", label: "-- Search or Select a Category --" },
            ...CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          value={
            selectedCategory
              ? { value: selectedCategory, label: selectedCategory }
              : { value: "", label: "-- Search or Select a Category --" }
          }
          onChange={(selected) => setSelectedCategory(selected?.value || "")}
          isClearable={false}
        />
      </div>

      {/* Program Name */}
      <div>
        <label className="block font-semibold mb-1">Program Name</label>
        <Select
          options={[
            { value: "", label: "-- Search or Select Program Name --" },
            ...filteredProgramOptions,
          ]}
          value={
            formData.programName
              ? { value: formData.programName, label: formData.programName }
              : { value: "", label: "-- Search or Select Program Name --" }
          }
          onChange={handleProgramSelect}
          isClearable={false}
          isLoading={!groups || groups.length === 0}
          noOptionsMessage={() =>
            !groups || groups.length === 0
              ? "Loading programs..."
              : "No programs match this category"
          }
        />
      </div>

      {/* Field of Interest */}
      <div>
        <label className="block font-semibold mb-1">Field of Interest</label>
        <Select
          options={[
            { value: "", label: "-- Search or Select Field of Interest --" },
            ...FIELD_OF_INTEREST_OPTIONS.map((f) => ({ value: f, label: f })),
          ]}
          value={
            formData.fieldOfInterest
              ? { value: formData.fieldOfInterest, label: formData.fieldOfInterest }
              : { value: "", label: "-- Search or Select Field of Interest --" }
          }
          onChange={handleFieldOfInterestChange}
          isClearable={false}
          required
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

      {/* Recipient */}
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

      {/* Date Selection */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border p-2 flex-1 min-w-0"
          required
        >
          <option value="">-- Select Month --</option>
          {[
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
          ].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border p-2 flex-1 min-w-0"
          required
        >
          <option value="">-- Select Year --</option>
          {Array.from({ length: 21 }, (_, i) => today.getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 w-full">
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Generate Certificate
        </button>

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
