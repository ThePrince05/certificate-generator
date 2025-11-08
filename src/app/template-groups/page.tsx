"use client";
import Select from "react-select";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTemplates, TemplateGroup } from "../context/TemplateContext";
import { useOrganization } from "../context/OrganizationContext";
import { useData } from "../context/DataContext"; // Add DataContext import
import { v4 as uuidv4 } from "uuid";

const MAX_LENGTHS = { programName: 65, achievementText: 260 };

export default function TemplateGroupsPage() {
  const router = useRouter();
  const { selectedOrg } = useOrganization();
  const { 
    addGroup, 
    updateGroup, 
    deleteGroup, 
    syncStatus,
  } = useTemplates(); // Remove groups, loadGroups, certificateTypes, loadCertificateTypes
   const { groups, certificateTypes, loading, refreshGroups, refreshCertificateTypes } = useData();
  // ✅ Use 'type' instead of 'certificateType'
  const [newGroup, setNewGroup] = useState({
    programName: "",
    achievementText: "",
    category: "",
    type: "",
  });

  // New search query state
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ State for dialogs and loading
  const [editingGroup, setEditingGroup] = useState<TemplateGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<TemplateGroup | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // ✅ Track if we're doing an action (add/edit/delete) vs initial load
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  // ✅ Form validation state - now includes all fields
  const [formErrors, setFormErrors] = useState({
    programName: "",
    achievementText: "",
    category: "",
    type: ""
  });

    const refreshAllData = useCallback(() => {
    console.log('🔄 Refreshing all data after operation...');
    refreshGroups();
    refreshCertificateTypes();
  }, [refreshGroups, refreshCertificateTypes]);

  useEffect(() => {
    if (syncStatus === 'loading' && isPerformingAction) {
      // Keep the loading state
    } else if (syncStatus === 'success' || syncStatus === 'error') {
      setIsPerformingAction(false);
    }
  }, [syncStatus, isPerformingAction]);
  // Data is now automatically loaded by DataContext when selectedOrg changes
  // Remove the manual loadGroups and loadCertificateTypes calls

  // ✅ Effect to track when we're performing actions vs initial loading
  useEffect(() => {
    // Only show action loading overlay when syncStatus is loading AND we're performing an action
    if (syncStatus === 'loading' && isPerformingAction) {
      // Keep the loading state
    } else if (syncStatus === 'success' || syncStatus === 'error') {
      // Reset action state when operation completes
      setIsPerformingAction(false);
    }
  }, [syncStatus, isPerformingAction]);

  if (!selectedOrg) {
    return (
      <div className="text-center p-8">
        <p>Please select an organization first.</p>
        <button
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          onClick={() => router.push("/generate?step=org")}
        >
          Select Organization
        </button>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (loading.groups || loading.certificateTypes) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template data for {selectedOrg.name}...</p>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const errors = {
      programName: "",
      achievementText: "",
      category: "",
      type: ""
    };

    if (!newGroup.programName.trim()) {
      errors.programName = "Program Name is required";
    }

    if (!newGroup.achievementText.trim()) {
      errors.achievementText = "Achievement Text is required";
    }

    if (!newGroup.category.trim()) {
      errors.category = "Category is required";
    }

    if (!newGroup.type.trim()) {
      errors.type = "Certificate Type is required";
    }

    setFormErrors(errors);
    return !errors.programName && !errors.achievementText && !errors.category && !errors.type;
  };

  const validateEditForm = (group: TemplateGroup): boolean => {
    const errors = {
      programName: "",
      achievementText: "",
      category: "",
      type: ""
    };

    if (!group.programName.trim()) {
      errors.programName = "Program Name is required";
    }

    if (!group.achievementText.trim()) {
      errors.achievementText = "Achievement Text is required";
    }

    if (!group.category.trim()) {
      errors.category = "Category is required";
    }

    if (!group.type.trim()) {
      errors.type = "Certificate Type is required";
    }

    setFormErrors(errors);
    return !errors.programName && !errors.achievementText && !errors.category && !errors.type;
  };

 const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsPerformingAction(true);
    const group: TemplateGroup = {
      id: uuidv4(),
      programName: newGroup.programName.trim(),
      achievementText: newGroup.achievementText.trim(),
      category: newGroup.category.trim(),
      type: newGroup.type.trim(),
    };

    // ✅ Pass refresh function to addGroup
    await addGroup(group, selectedOrg.id, refreshAllData);
    setNewGroup({
      programName: "",
      achievementText: "",
      category: "",
      type: "",
    });
    setFormErrors({ programName: "", achievementText: "", category: "", type: "" });
  };
  
 const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGroup || !validateEditForm(editingGroup)) {
      return;
    }

    setIsPerformingAction(true);
    // ✅ Pass refresh function to updateGroup
    await updateGroup(editingGroup.id, editingGroup, selectedOrg.id, refreshAllData);
    setIsEditDialogOpen(false);
    setEditingGroup(null);
    setFormErrors({ programName: "", achievementText: "", category: "", type: "" });
  };


   const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    setIsPerformingAction(true);
    setIsDeleting(deletingGroup.id);
    // ✅ Pass refresh function to deleteGroup
    await deleteGroup(deletingGroup.id, selectedOrg.id, refreshAllData);
    setIsDeleteDialogOpen(false);
    setDeletingGroup(null);
    setIsDeleting(null);
  };

  const openEditDialog = (group: TemplateGroup) => {
    setEditingGroup({ ...group });
    setIsEditDialogOpen(true);
    setFormErrors({ programName: "", achievementText: "", category: "", type: "" });
  };

  const openDeleteDialog = (group: TemplateGroup) => {
    setDeletingGroup(group);
    setIsDeleteDialogOpen(true);
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

  // ✅ Update search to include type
  const filteredGroups = groups.filter((group) =>
    [group.programName, group.category, group.type]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* ✅ Global Loading Overlay - Only show for actions, not initial load */}
      {(syncStatus === 'loading' && isPerformingAction) && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 border">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-gray-700">Saving changes...</p>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit Group Dialog - No dimming effect */}
      {isEditDialogOpen && editingGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Template Group</h2>
              <form onSubmit={handleEditGroup} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Program Name</label>
                  <input
                    type="text"
                    value={editingGroup.programName}
                    onChange={(e) =>
                      setEditingGroup(prev => prev ? {
                        ...prev,
                        programName: e.target.value.slice(0, MAX_LENGTHS.programName)
                      } : null)
                    }
                    className={`border p-3 w-full rounded ${formErrors.programName ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.programName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.programName}</p>
                  )}
                  {renderCounter("programName", editingGroup.programName)}
                </div>

                <div>
                  <label className="block font-semibold mb-2">Achievement Text</label>
                  <textarea
                    value={editingGroup.achievementText}
                    onChange={(e) =>
                      setEditingGroup(prev => prev ? {
                        ...prev,
                        achievementText: e.target.value.slice(0, MAX_LENGTHS.achievementText)
                      } : null)
                    }
                    className={`border p-3 w-full rounded resize-none ${formErrors.achievementText ? 'border-red-500' : ''}`}
                    rows={4}
                    required
                  />
                  {formErrors.achievementText && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.achievementText}</p>
                  )}
                  {renderCounter("achievementText", editingGroup.achievementText)}
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block font-semibold mb-2">Category</label>
                    <Select
                      options={[{ value: "", label: "-- Select a Category --" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                      value={editingGroup.category ? { value: editingGroup.category, label: editingGroup.category } : { value: "", label: "-- Select a Category --" }}
                      onChange={(selected) => setEditingGroup(prev => prev ? { ...prev, category: selected?.value || "" } : null)}
                      isClearable={false}
                    />
                    {formErrors.category && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                    )}
                  </div>

                  <div className="w-1/2">
                    <label className="block font-semibold mb-2">Certificate Type</label>
                    <Select
                      options={[
                        { value: "", label: "-- Select Certificate Type --" }, 
                        ...certificateTypes.map((type: string) => ({ value: type, label: type })) // ✅ Use dynamic certificateTypes from DataContext
                      ]}
                      value={editingGroup.type ? { value: editingGroup.type, label: editingGroup.type } : { value: "", label: "-- Select Certificate Type --" }}
                      onChange={(selected) => setEditingGroup(prev => prev ? { ...prev, type: selected?.value || "" } : null)}
                      isClearable={false}
                    />
                    {formErrors.type && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingGroup(null);
                      setFormErrors({ programName: "", achievementText: "", category: "", type: "" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2"
                  >
                    {syncStatus === 'loading' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Dialog */}
      {isDeleteDialogOpen && deletingGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-red-600">Delete Template Group</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the template group <strong>"{deletingGroup.programName}"</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingGroup(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={syncStatus === 'loading'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex items-center gap-2"
                  disabled={syncStatus === 'loading'}
                >
                  {(syncStatus === 'loading' && isDeleting === deletingGroup.id) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {(syncStatus === 'loading' && isDeleting === deletingGroup.id) ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/generate-single")}
        className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-40"
      >
        ← Single Certificate
      </button>
      
      {/* Add New Template Form */}
      <section className="bg-white border rounded shadow p-6 mb-20">
        <h1 className="text-2xl font-bold text-center mb-6">
          Add New Template Group for {selectedOrg.name}
        </h1>
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Program Name</label>
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
              className={`border p-3 w-full rounded mb-1 ${formErrors.programName ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.programName && (
              <p className="text-red-500 text-sm mt-1">{formErrors.programName}</p>
            )}
            {renderCounter("programName", newGroup.programName)}
          </div>

          <div>
            <label className="block font-semibold mb-1">Achievement Text</label>
            <textarea
              placeholder="Achievement Text"
              value={newGroup.achievementText}
              onChange={(e) =>
                setNewGroup((prev) => ({
                  ...prev,
                  achievementText: e.target.value.slice(0, MAX_LENGTHS.achievementText),
                }))
              }
              className={`border p-3 w-full rounded resize-none ${formErrors.achievementText ? 'border-red-500' : ''}`}
              rows={4}
              required
            />
            {formErrors.achievementText && (
              <p className="text-red-500 text-sm mt-1">{formErrors.achievementText}</p>
            )}
            {renderCounter("achievementText", newGroup.achievementText)}
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block font-semibold mb-1">Category</label>
              <Select
                options={[{ value: "", label: "-- Search or Select a Category --" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                value={newGroup.category ? { value: newGroup.category, label: newGroup.category } : { value: "", label: "-- Search or Select a Category --" }}
                onChange={(selected) => setNewGroup((prev) => ({ ...prev, category: selected?.value || "" }))}
                isClearable={false}
              />
              {formErrors.category && (
                <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
              )}
            </div>

            {/* ✅ Certificate Type dropdown - Now uses dynamic certificateTypes from DataContext */}
            <div className="w-1/2">
              <label className="block font-semibold mb-1">Certificate Type</label>
              <Select
                options={[
                  { value: "", label: "-- Select Certificate Type --" }, 
                  ...certificateTypes.map((type: string) => ({ value: type, label: type })) // ✅ Use dynamic certificateTypes from DataContext
                ]}
                value={newGroup.type ? { value: newGroup.type, label: newGroup.type } : { value: "", label: "-- Select Certificate Type --" }}
                onChange={(selected) => setNewGroup((prev) => ({ ...prev, type: selected?.value || "" }))}
                isClearable={false}
              />
              {formErrors.type && (
                <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500">All fields are required</p>
            </div>
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2"
              disabled={syncStatus === 'loading'}
            >
              {syncStatus === 'loading' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {syncStatus === 'loading' ? 'Adding...' : 'Add Group'}
            </button>
          </div>
        </form>
      </section>

      {/* Search Bar */}
      {groups.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded p-3"
          />
        </div>
      )}

      {/* Existing Templates */}
      <section className="bg-gray-50 border rounded shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 text-center mb-6">
          Saved Template Groups
        </h2>

        {filteredGroups.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            {searchQuery ? `No template groups match "${searchQuery}".` : `No template groups yet for ${selectedOrg.name}.`}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.id} className="border p-4 rounded shadow-sm bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{group.programName}</h3>
                    <p className="text-xs text-gray-500">
                      {group.category} • {group.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditDialog(group)}
                      disabled={syncStatus === 'loading'}
                      className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 border rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {syncStatus === 'loading' && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      )}
                      Edit
                    </button>
                    <button 
                      onClick={() => openDeleteDialog(group)}
                      disabled={syncStatus === 'loading'}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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