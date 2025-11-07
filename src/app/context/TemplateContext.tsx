"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export interface TemplateGroup {
  id: string;
  programName: string;
  achievementText: string;
  category: string;
  type: string;
}

interface Template {
  backgroundUrl: string;
  name: string;
}

interface TemplateContextType {
  groups: TemplateGroup[];
  addGroup: (group: TemplateGroup, orgId: string) => Promise<boolean>;
  updateGroup: (id: string, updated: TemplateGroup, orgId: string) => Promise<boolean>;
  deleteGroup: (id: string, orgId: string) => Promise<boolean>;
  setGroups: (groups: TemplateGroup[], orgId: string) => void;
  loadGroups: (orgId: string) => Promise<void>;
  selectedTemplate: Template;
  setTemplate: React.Dispatch<React.SetStateAction<Template>>;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

// ⚠️ REPLACE WITH YOUR GOOGLE APPS SCRIPT URL ⚠️
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqWzg-h9NGaJnXtqhXl73m8kzJsivN_G6TF1X8pBQmraLSh4r7ZJS2kPaVbujUmI3xYg/exec";

// Function to fetch groups from Google Apps Script
// Function to fetch groups from Google Apps Script
const fetchGroupsFromSheets = async (orgId: string): Promise<TemplateGroup[]> => {
  try {
    console.debug(`🔍 fetchGroupsFromSheets called for orgId: ${orgId}`);
    
    const url = `${SCRIPT_URL}?action=getGroups&orgId=${orgId}`;
    console.debug(`🌐 Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    console.debug(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch from Google Sheets: ${response.status}`);
      return [];
    }

    const result = await response.json();
    console.debug(`📊 API Response:`, result);

    if (!result.success) {
      console.error(`❌ Google Sheets error: ${result.error}`);
      return [];
    }

    console.debug(`✨ Successfully fetched ${result.groups?.length || 0} groups from Google Sheets`);
    
    // Debug the first group to see all fields
    if (result.groups && result.groups.length > 0) {
      console.log('🔍 Sample group from Google Sheets:', result.groups[0]);
      console.log('Sample group fields:', {
        programName: result.groups[0].programName,
        achievementText: result.groups[0].achievementText,
        category: result.groups[0].category,
        fieldOfInterest: result.groups[0].fieldOfInterest,
        type: result.groups[0].type
      });
    }
    
    return result.groups || [];
  } catch (error) {
    console.error(`💥 Error loading from Google Sheets:`, error);
    return [];
  }
};

// Function to add group to Google Sheets
const addGroupToSheets = async (orgId: string, group: TemplateGroup): Promise<boolean> => {
  try {
    console.log('📤 SENDING TO GOOGLE APPS SCRIPT:');
    console.log('Organization:', orgId);
    console.log('Group data being sent:', group);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `action=addGroup&orgId=${orgId}&groupData=${encodeURIComponent(JSON.stringify(group))}`
    });

    console.log('📡 Response status:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📊 Google Apps Script response:', result);

    if (result.success) {
      console.log('✅ Successfully added group to Google Sheets');
      return true;
    } else {
      console.error(`❌ Failed to add group: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Error adding group to Google Sheets:`, error);
    return false;
  }
};

// Function to update group in Google Sheets
const updateGroupInSheets = async (orgId: string, groupId: string, group: TemplateGroup): Promise<boolean> => {
  try {
    console.debug(`✏️ Updating group in Google Sheets: ${groupId}`);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `action=updateGroup&orgId=${orgId}&groupId=${groupId}&groupData=${encodeURIComponent(JSON.stringify(group))}`
    });

    const result = await response.json();
    console.debug(`📊 Update group response:`, result);

    if (result.success) {
      console.debug(`✅ Successfully updated group in Google Sheets`);
      return true;
    } else {
      console.error(`❌ Failed to update group: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Error updating group in Google Sheets:`, error);
    return false;
  }
};

// Function to delete group from Google Sheets
const deleteGroupFromSheets = async (orgId: string, groupId: string): Promise<boolean> => {
  try {
    console.debug(`🗑️ Deleting group from Google Sheets: ${groupId}`);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `action=deleteGroup&orgId=${orgId}&groupId=${groupId}`
    });

    const result = await response.json();
    console.debug(`📊 Delete group response:`, result);

    if (result.success) {
      console.debug(`✅ Successfully deleted group from Google Sheets`);
      return true;
    } else {
      console.error(`❌ Failed to delete group: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Error deleting group from Google Sheets:`, error);
    return false;
  }
};

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroupsState] = useState<TemplateGroup[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // ✅ Add template state
  const [selectedTemplate, setTemplate] = useState<Template>({
    backgroundUrl: "/templates/one-planet-one-people/certificate-template.jpg",
    name: "Default Template",
  });

  const saveGroups = useCallback((groups: TemplateGroup[], orgId: string) => {
    const saved = localStorage.getItem("templateGroupsByOrg");
    const parsed: Record<string, TemplateGroup[]> = saved ? JSON.parse(saved) : {};
    parsed[orgId] = groups;
    localStorage.setItem("templateGroupsByOrg", JSON.stringify(parsed));
  }, []);

  const loadGroups = useCallback(async (orgId: string) => {
    setSyncStatus('loading');
    try {
      console.debug(`🔄 loadGroups called for orgId: ${orgId}`);
      
      // Try to load from Google Sheets first
      let groupsForOrg = await fetchGroupsFromSheets(orgId);
      
      // Fallback to localStorage if Google Sheets is empty or fails
      if (groupsForOrg.length === 0) {
        console.debug(`📦 Falling back to localStorage for ${orgId}`);
        const saved = localStorage.getItem("templateGroupsByOrg");
        const parsed: Record<string, TemplateGroup[]> = saved ? JSON.parse(saved) : {};
        groupsForOrg = parsed[orgId] || [];
      }

      setGroupsState(groupsForOrg);
      saveGroups(groupsForOrg, orgId);
      setSyncStatus('success');
      console.debug(`✅ Loaded ${groupsForOrg.length} groups for ${orgId}`);
    } catch (error) {
      console.error(`💥 Error in loadGroups:`, error);
      setSyncStatus('error');
    }
  }, [saveGroups]);

 const addGroup = useCallback(async (group: TemplateGroup, orgId: string): Promise<boolean> => {
  console.log('🚀 SENDING GROUP DATA TO GOOGLE SHEETS:');
  console.log('Full group object:', group);
  console.log('programName:', group.programName);
  console.log('achievementText:', group.achievementText);
  console.log('category:', group.category);

  console.log('type:', group.type);
  
  setSyncStatus('loading');
  try {
    // Try to add to Google Sheets first
    const sheetsSuccess = await addGroupToSheets(orgId, group);
    
    if (sheetsSuccess) {
      console.log('✅ Successfully added to Google Sheets, refreshing data...');
      // Success! Refresh data from Google Sheets to get the updated list
      const updatedGroups = await fetchGroupsFromSheets(orgId);
      console.log('🔄 Refreshed groups from Google Sheets:', updatedGroups);
      
      // Check if the new data includes all fields
      if (updatedGroups.length > 0) {
        const latestGroup = updatedGroups[updatedGroups.length - 1];
        console.log('📊 Latest group from Google Sheets:', latestGroup);
        console.log('Fields check - achievementText:', latestGroup.achievementText);
        console.log('Fields check - category:', latestGroup.category);
      }
      
      setGroupsState(updatedGroups);
      saveGroups(updatedGroups, orgId);
      setSyncStatus('success');
      return true;
    } else {
      // Fallback to localStorage only
      console.debug(`📦 Google Sheets add failed, using localStorage fallback`);
      console.log('💾 Saving to localStorage:', group);
      setGroupsState((prev) => {
        const updated = [...prev, group];
        saveGroups(updated, orgId);
        return updated;
      });
      setSyncStatus('success');
      return true;
    }
  } catch (error) {
    console.error(`💥 Error in addGroup:`, error);
    setSyncStatus('error');
    return false;
  }
}, [saveGroups]);

  const updateGroup = useCallback(async (id: string, updatedGroup: TemplateGroup, orgId: string): Promise<boolean> => {
    setSyncStatus('loading');
    try {
      // Try to update in Google Sheets first
      const sheetsSuccess = await updateGroupInSheets(orgId, id, updatedGroup);
      
      if (sheetsSuccess) {
        // Update local state
        setGroupsState((prev) => {
          const updated = prev.map((g) => (g.id === id ? updatedGroup : g));
          saveGroups(updated, orgId);
          return updated;
        });
        setSyncStatus('success');
        return true;
      } else {
        // Fallback to localStorage
        setGroupsState((prev) => {
          const updated = prev.map((g) => (g.id === id ? updatedGroup : g));
          saveGroups(updated, orgId);
          return updated;
        });
        setSyncStatus('success');
        return true;
      }
    } catch (error) {
      console.error(`💥 Error in updateGroup:`, error);
      setSyncStatus('error');
      return false;
    }
  }, [saveGroups]);

  const deleteGroup = useCallback(async (id: string, orgId: string): Promise<boolean> => {
    setSyncStatus('loading');
    try {
      // Try to delete from Google Sheets first
      const sheetsSuccess = await deleteGroupFromSheets(orgId, id);
      
      if (sheetsSuccess) {
        // Update local state
        setGroupsState((prev) => {
          const updated = prev.filter((g) => g.id !== id);
          saveGroups(updated, orgId);
          return updated;
        });
        setSyncStatus('success');
        return true;
      } else {
        // Fallback to localStorage
        setGroupsState((prev) => {
          const updated = prev.filter((g) => g.id !== id);
          saveGroups(updated, orgId);
          return updated;
        });
        setSyncStatus('success');
        return true;
      }
    } catch (error) {
      console.error(`💥 Error in deleteGroup:`, error);
      setSyncStatus('error');
      return false;
    }
  }, [saveGroups]);

  const setGroups = useCallback(
    (newGroups: TemplateGroup[], orgId: string) => {
      setGroupsState(() => {
        saveGroups(newGroups, orgId);
        return newGroups;
      });
    },
    [saveGroups]
  );

  return (
    <TemplateContext.Provider
      value={{
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        setGroups,
        loadGroups,
        selectedTemplate,
        setTemplate,
        syncStatus,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplates must be used within TemplateProvider");
  return ctx;
};