"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTemplates } from "../../app/context/TemplateContext";
import { CleanCertificateData } from "../../types/certificates";
import Select from "react-select";
import { useData } from "../../app/context/DataContext";

interface FormFields {
  organization: string;
  category: string;
  programName: string;
  achievementText: string;
  recipientName: string;
  certificateDate: string;
  fieldOfInterest: string;
  signature?: string;
  signatory?: string;
  certificateType?: string;
}

const MAX_LENGTHS: Partial<Record<keyof FormFields, number>> = {
  programName: 65,
  achievementText: 260,
  recipientName: 15,
  certificateDate: 22,
};

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
  "Gaming & Development",
];

export default function CertificateForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<CleanCertificateData>;
  onSubmit: (data: FormFields) => void;
}) {
  const router = useRouter();
  const { selectedTemplate, setTemplate } = useTemplates();
  const { groups, fieldOfInterestOptions, loading } = useData();

  const [isGenerating, setIsGenerating] = useState(false);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("en-GB", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [formData, setFormData] = useState<FormFields>({
    organization: initialValues?.organization || "",
    category: "",
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
    const opts = (groups || []).map((g) => ({
      value: g.programName,
      label: g.programName,
    }));
   
    return opts;
  }, [groups]);

  // --- handle program selection ---
  const handleProgramSelect = (selected: { value: string; label: string } | null) => {
    const newProgram = selected?.value || '';
    
    const defaults = groups.find((g) => g.programName === newProgram);
    
    setFormData((prev) => ({
      ...prev,
      programName: newProgram,
      // Clear Field of Interest when Program Name is selected
      fieldOfInterest: "",
      achievementText: defaults ? defaults.achievementText : prev.achievementText,
      // Set the type directly
      type: defaults?.type || "Achievement",
    }));
  };

  // Add this useMemo to check if a Karma Club program is selected
  const isKarmaClubSelected = useMemo(() => {
    return formData.programName.startsWith("The Karma Club");
  }, [formData.programName]);

  // --- filtered program options with category filtering + debug ---
  const filteredProgramOptions = useMemo(() => {
    const selected = selectedCategory?.toLowerCase() || "";
    
    return programOptions.filter((p) => {
      const group = groups.find((g) => g.programName === p.value);
      if (!group) return false;

      // Treat empty category as "uncategorized"
      const groupCategory = (group.category?.trim() || "Uncategorized").toLowerCase();
      
      // If no category selected, show all programs
      if (!selected) return true;
      
      // Match the category (including "Uncategorized")
      return groupCategory === selected;
    });
  }, [programOptions, groups, selectedCategory]);

  const shouldShowCategory = useMemo(() => {
    if (!groups || groups.length === 0) return false;
    
    // Count distinct categories (treat empty/null as "Uncategorized")
    const distinctCategories = new Set<string>();
    
    groups.forEach((group) => {
      if (group.programName) {
        const category = group.category?.trim() || "Uncategorized";
        distinctCategories.add(category);
      }
    });
    
    // Only show category dropdown if we have more than one distinct category
    return distinctCategories.size > 1;
  }, [groups]);

  // --- prevent clearing before groups are loaded ---
  useEffect(() => {
    if (!groups || groups.length === 0) {
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
      setFormData((prev) => ({
        ...prev,
        programName: "",
        achievementText: "",
      }));
    }
  }, [selectedCategory, groups, formData.programName]);

  // --- clear Field of Interest for Gaming & Development ---
  useEffect(() => {
    if (selectedCategory === "Gaming & Development") {
      setFormData(prev => ({ ...prev, fieldOfInterest: "" }));
    }
  }, [selectedCategory]);

  // --- change background template when "Gaming & Development" is selected ---
  useEffect(() => {
    if (!selectedCategory) return;

    if (selectedCategory === "Gaming & Development") {
      // 🕹️ Switch to your special gaming background
      setTemplate({
        backgroundUrl: "/templates/one-planet-one-people-games/certificate-template.jpg",
        name: "Gaming & Development Template",
      });
    } else {
      // 🎓 Otherwise revert to the default
      setTemplate({
        backgroundUrl: "/templates/one-planet-one-people/certificate-template.jpg",
        name: "Default Template",
      });
    }
  }, [selectedCategory, setTemplate]);

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
      // Clear Program Name when Field of Interest is selected
      programName: "",
      achievementText: "",
    }));
  };

  // --- form submission ---
// In your CertificateForm component, add debug logs:

// --- form submission ---
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ADD THIS: Prevent multiple clicks while generating
  if (isGenerating) {
    console.log('⏳ Form submission already in progress');
    return;
  }

  console.log('🚀 CertificateForm: Form submitted!');
  console.log('📝 Form data being submitted:', formData);

  // Validation: Ensure only one of Program Name or Field of Interest is selected
  if (formData.programName && formData.fieldOfInterest) {
    console.log('❌ Validation failed: Both program and field selected');
    alert("Please select either Program Name OR Field of Interest, not both.");
    return;
  }

  // Validation: Ensure at least one of Program Name or Field of Interest is selected
  if (!formData.programName && !formData.fieldOfInterest) {
    console.log('❌ Validation failed: Neither program nor field selected');
    alert("Please select either Program Name OR Field of Interest.");
    return;
  }

  console.log('✅ Validation passed, calling onSubmit...');
  
  // ADD THIS: Set loading state
  setIsGenerating(true);

  try {
    // Submit the form data
    await onSubmit(formData);
  } catch (error) {
    console.error('❌ Form submission error:', error);
    // You can show an error message here if needed
  } finally {
    // ADD THIS: Reset loading state regardless of success/error
    setIsGenerating(false);
  }
};

  // --- character counter function ---
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

  const filteredCategories = useMemo(() => {
    if (!groups || groups.length === 0) return [];

    // Only keep categories that have at least one program
    const categoryMap: Record<string, boolean> = {};
    groups.forEach((g) => {
      if (g.category && g.programName) {
        categoryMap[g.category.trim()] = true;
      }
    });

    return Object.keys(categoryMap);
  }, [groups]);

  // Create filtered field of interest options for the dropdown
  const filteredFieldOfInterestOptions = useMemo(() => {
    return fieldOfInterestOptions.map((f) => ({ value: f, label: f }));
  }, [fieldOfInterestOptions]);

  // Determine when to show each field
  const showProgramName = !formData.fieldOfInterest;
  const showFieldOfInterest = !formData.programName && 
                              selectedCategory !== "Gaming & Development" && 
                              !isKarmaClubSelected;

  // Loading states from DataContext
  const groupsLoading = loading.groups;
  const fieldOfInterestLoading = loading.fieldOfInterest;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full border rounded shadow p-6"
    >
      {/* Category - Only show if there are categorized programs */}
      {shouldShowCategory && (
        <div>
          <label className="block font-semibold mb-1">Category</label>
          <Select
            options={[
              { value: "", label: "-- Search or Select a Category --" },
              ...filteredCategories.map((c) => ({ 
                value: c, 
                label: c 
              })),
            ]}
            value={
              selectedCategory
                ? { value: selectedCategory, label: selectedCategory }
                : { value: "", label: "-- Search or Select a Category --" }
            }
            onChange={(selected) => {
              const value = selected?.value || "";
              setSelectedCategory(value);
              setFormData(prev => ({ ...prev, category: value }));
            }}
            isClearable={false}
          />
        </div>
      )}

      {/* Program Name - Only show when Field of Interest is not selected */}
      {showProgramName && (
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
            isLoading={groupsLoading}
            noOptionsMessage={() =>
              groupsLoading
                ? "Loading programs..."
                : "No programs match this category"
            }
          />
          {groupsLoading && (
            <p className="text-xs text-gray-500 mt-1">Loading programs...</p>
          )}
        </div>
      )}

      {/* Field of Interest - Only show when Program Name is not selected and not restricted by category/Karma Club */}
      {showFieldOfInterest && (
        <div>
          <label className="block font-semibold mb-1">Field of Interest</label>
          <Select
            options={[
              { value: "", label: "-- Search or Select Field of Interest --" },
              ...filteredFieldOfInterestOptions,
            ]}
            value={
              formData.fieldOfInterest
                ? { value: formData.fieldOfInterest, label: formData.fieldOfInterest }
                : { value: "", label: "-- Search or Select Field of Interest --" }
            }
            onChange={handleFieldOfInterestChange}
            isClearable={false}
            isLoading={fieldOfInterestLoading}
            noOptionsMessage={() => 
              fieldOfInterestLoading 
                ? "Loading field of interest options..." 
                : "No field of interest options found"
            }
          />
          {fieldOfInterestLoading && (
            <p className="text-xs text-gray-500 mt-1">Loading field of interest options...</p>
          )}
        </div>
      )}

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
          disabled={isGenerating} // ADD THIS: Disable when loading
          className={`w-full sm:w-auto px-4 py-2 rounded transition flex items-center justify-center gap-2 ${
            isGenerating 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            'Generate Certificate'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/template-groups")}
          disabled={isGenerating} // ADD THIS: Optional - disable other actions too
          className="w-full sm:ml-auto sm:w-auto bg-gray-100 text-gray-800 px-4 py-2 rounded border hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Manage Template
        </button>
      </div>
    </form>
  );
}