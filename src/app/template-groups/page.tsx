"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTemplates } from "../context/TemplateContext";
import { v4 as uuidv4 } from "uuid";

const MAX_LENGTHS = {
  programName: 54,
  achievementText: 188,
};


export default function TemplateGroupsPage() {
  const router = useRouter();
  const { groups, addGroup, updateGroup, deleteGroup, setGroups } = useTemplates();

const [newGroup, setNewGroup] = useState({
  programName: "",
  achievementText: "",
});


  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;

    const saved = localStorage.getItem("templateGroups");
    if (!saved) return;

    try {
      const parsed: (typeof newGroup & { id?: string })[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;

      const groupsWithId = parsed.map(g => ({ ...g, id: g.id || uuidv4() }));
      const uniqueGroups = Array.from(new Map(groupsWithId.map(g => [g.id, g])).values());

      setGroups(uniqueGroups);
      hasLoaded.current = true;
    } catch (err) {
      console.error("Failed to parse saved templates", err);
    }
  }, [setGroups]);

  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem("templateGroups", JSON.stringify(groups));
    }
  }, [groups]);

const handleAddGroup = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newGroup.programName.trim()) return alert("Program Name is required.");
  addGroup({ ...newGroup, id: uuidv4() });
  setNewGroup({ programName: "", achievementText: "" });
};

  const renderCounter = (field: keyof typeof newGroup, value: string) => {
    const max = MAX_LENGTHS[field];
    return (
      <p className="text-xs text-gray-500 text-right">
        {value.length}/{max} characters
      </p>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Add New Template Form */}
      <section className="bg-white border rounded shadow p-6 mb-12">
        <h1 className="text-2xl font-bold text-center mb-6">
          Add New Template Group
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
          className="border p-3 w-full rounded mb-2"
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
              onClick={() => router.push("/")}
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
            No template groups yet.
          </p>
        ) : (
          <div className="space-y-4">
           {groups.map((group) => (
            <div key={group.id} className="border p-4 rounded shadow-sm bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{group.programName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const programName = prompt("Edit program name:", group.programName);
                      if (!programName) return;
                      const achievementText = prompt("Edit achievement text:", group.achievementText) || "";
                      updateGroup(group.id, { ...group, programName, achievementText });
                    }}
                    className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 border rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 whitespace-pre-line">{group.achievementText}</p>
            </div>
          ))}

          </div>
        )}
      </section>
    </div>
  );
}
