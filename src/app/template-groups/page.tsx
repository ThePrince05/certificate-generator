"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTemplates } from "../context/TemplateContext";
import { v4 as uuidv4 } from "uuid";

const MAX_LENGTHS = {
  heading: 25,
  subheading: 54,
  pakText: 188,
};

export default function TemplateGroupsPage() {
  const router = useRouter();
  const { groups, addGroup, updateGroup, deleteGroup, setGroups } = useTemplates();

  const [newGroup, setNewGroup] = useState({
    heading: "",
    subheading: "",
    pakText: "",
  });

  // Ref to ensure localStorage loads only once
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return; // Prevent re-loading

    const saved = localStorage.getItem("templateGroups");
    if (!saved) return;

    try {
      const parsed: (typeof newGroup & { id?: string })[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;

      // Ensure each group has an ID
      const groupsWithId = parsed.map(g => ({ ...g, id: g.id || uuidv4() }));

      // Remove duplicates by ID
      const uniqueGroups = Array.from(new Map(groupsWithId.map(g => [g.id, g])).values());

      setGroups(uniqueGroups); // Safe update
      hasLoaded.current = true;

    } catch (err) {
      console.error("Failed to parse saved templates", err);
    }
  }, [setGroups]);

  // Persist to localStorage whenever groups change
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem("templateGroups", JSON.stringify(groups));
    }
  }, [groups]);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.heading.trim()) return alert("Heading is required.");
    addGroup({ ...newGroup, id: uuidv4() }); // assign unique id
    setNewGroup({ heading: "", subheading: "", pakText: "" });
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
              placeholder="Heading"
              value={newGroup.heading}
              onChange={(e) =>
                setNewGroup((prev) => ({
                  ...prev,
                  heading: e.target.value.slice(0, MAX_LENGTHS.heading),
                }))
              }
              className="border p-3 w-full rounded mb-2"
              required
            />
            {renderCounter("heading", newGroup.heading)}
          </div>

          <div>
            <input
              type="text"
              placeholder="Subheading"
              value={newGroup.subheading}
              onChange={(e) =>
                setNewGroup((prev) => ({
                  ...prev,
                  subheading: e.target.value.slice(0, MAX_LENGTHS.subheading),
                }))
              }
              className="border p-3 w-full rounded mb-2"
            />
            {renderCounter("subheading", newGroup.subheading)}
          </div>

          <div>
            <textarea
              placeholder="PAK Paragraph"
              value={newGroup.pakText}
              onChange={(e) =>
                setNewGroup((prev) => ({
                  ...prev,
                  pakText: e.target.value.slice(0, MAX_LENGTHS.pakText),
                }))
              }
              className="border p-3 w-full rounded resize-none"
              rows={4}
            />
            {renderCounter("pakText", newGroup.pakText)}
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
              <div
                key={group.id} // unique key
                className="border p-4 rounded shadow-sm bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{group.heading}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const heading = prompt("Edit heading:", group.heading);
                        if (!heading) return;
                        const subheading =
                          prompt("Edit subheading:", group.subheading) || "";
                        const pakText =
                          prompt("Edit PAK Paragraph:", group.pakText) || "";
                        updateGroup(group.id, { ...group, heading, subheading, pakText });
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

                {group.subheading && (
                  <p className="text-sm font-medium text-gray-700 mb-1">{group.subheading}</p>
                )}
                <p className="text-sm text-gray-600 whitespace-pre-line">{group.pakText}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
