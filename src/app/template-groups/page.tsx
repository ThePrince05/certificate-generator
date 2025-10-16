"use client";
import Select from "react-select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplates, TemplateGroup } from "../context/TemplateContext";
import { useOrganization } from "../context/OrganizationContext";
import { v4 as uuidv4 } from "uuid";

const MAX_LENGTHS = { programName: 65, achievementText: 300 };

export default function TemplateGroupsPage() {
  const router = useRouter();
  const { selectedOrg } = useOrganization();
  const { groups, loadGroups, addGroup, updateGroup, deleteGroup } = useTemplates();

  // ✅ Include category and fieldOfInterest with defaults
  const [newGroup, setNewGroup] = useState({
    programName: "",
    achievementText: "",
    category: "",
    fieldOfInterest: "",
  });

  useEffect(() => {
    if (selectedOrg) loadGroups(selectedOrg.id);
  }, [selectedOrg, loadGroups]);

  if (!selectedOrg) {
    return (
      <div className="text-center p-8">
        <p>Please select an organization first.</p>
        <button
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          onClick={() => router.push("/select-organization")}
        >
          Select Organization
        </button>
      </div>
    );
  }

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.programName.trim()) return alert("Program Name is required.");

    // ✅ Pass all required fields for TemplateGroup
    const group: TemplateGroup = {
      id: uuidv4(),
      programName: newGroup.programName.trim(),
      achievementText: newGroup.achievementText.trim(),
      category: newGroup.category.trim(),
      fieldOfInterest: newGroup.fieldOfInterest.trim(),
    };

    addGroup(group, selectedOrg.id);
    setNewGroup({
      programName: "",
      achievementText: "",
      category: "",
      fieldOfInterest: "",
    });
  };

  const renderCounter = (field: keyof typeof newGroup, value: string) => {
    const max = MAX_LENGTHS[field as keyof typeof MAX_LENGTHS];
    return (
      max && (
        <p className="text-xs text-gray-500 text-right">
          {value.length}/{max} characters
        </p>
      )
    );
  };

  // top of the file
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
  "Gaming & Development",
];



  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Add New Template Form */}
      <section className="bg-white border rounded shadow p-6 mb-12">
        <h1 className="text-2xl font-bold text-center mb-6">
          Add New Template Group for {selectedOrg.name}
        </h1>
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Program Name"
              value={newGroup.programName}
              onChange={(e) =>
                setNewGroup((prev) => ({
                  ...prev,
                  programName: e.target.value.slice(0, MAX_LENGTHS.programName),
                }))
              }
              className="border p-3 w-full rounded mb-1"
              required
            />
            {renderCounter("programName", newGroup.programName)}
          </div>

          <div>
            <textarea
              placeholder="Achievement Text"
              value={newGroup.achievementText}
              onChange={(e) =>
                setNewGroup((prev) => ({
                  ...prev,
                  achievementText: e.target.value.slice(0, MAX_LENGTHS.achievementText),
                }))
              }
              className="border p-3 w-full rounded resize-none"
              rows={4}
            />
            {renderCounter("achievementText", newGroup.achievementText)}
          </div>

          {/* Optional dropdowns for category and fieldOfInterest */}
         <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block font-semibold mb-1">Category</label>
            <Select
              options={[
                { value: "", label: "-- Search or Select a Category --" }, // placeholder
                ...CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
              value={
                newGroup.category
                  ? { value: newGroup.category, label: newGroup.category }
                  : { value: "", label: "-- Search or Select a Category --" } // show placeholder if empty
              }
              onChange={(selected) =>
                setNewGroup((prev) => ({ ...prev, category: selected?.value || "" }))
              }
              isClearable={false}
            />
          </div>

          <div className="w-1/2">
            <label className="block font-semibold mb-1">Field of Interest</label>
            <Select
              options={[
                { value: "", label: "--  Search or Select Field of Interest --" }, // placeholder
                ...FIELD_OF_INTEREST_OPTIONS.map((f) => ({ value: f, label: f })),
              ]}
              value={
                newGroup.fieldOfInterest
                  ? { value: newGroup.fieldOfInterest, label: newGroup.fieldOfInterest }
                  : { value: "", label: "-- Search or Select Field of Interest --" } // show placeholder if empty
              }
              onChange={(selected) =>
                setNewGroup((prev) => ({ ...prev, fieldOfInterest: selected?.value || "" }))
              }
              isClearable={false}
            />
          </div>
        </div>


          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition"
            >
              Add Group
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => router.push("/generate-single")}
              className="bg-gray-100 text-gray-800 px-5 py-2 rounded border hover:bg-gray-200 transition"
            >
              Back
            </button>
          </div>
        </form>
      </section>

      {/* Existing Templates */}
      <section className="bg-gray-50 border rounded shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 text-center mb-6">
          Saved Template Groups
        </h2>

        {groups.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No template groups yet for {selectedOrg.name}.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="border p-4 rounded shadow-sm bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{group.programName}</h3>
                    <p className="text-xs text-gray-500">
                      {group.category} · {group.fieldOfInterest}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const programName = prompt("Edit program name:", group.programName);
                        if (!programName) return;
                        const achievementText =
                          prompt("Edit achievement text:", group.achievementText) || "";
                        updateGroup(
                          group.id,
                          { ...group, programName, achievementText },
                          selectedOrg.id
                        );
                      }}
                      className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 border rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id, selectedOrg.id)}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {group.achievementText}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
