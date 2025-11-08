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
  certificateTypes: string[];
  loadCertificateTypes: (orgId: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

// ⚠️ REPLACE WITH YOUR GOOGLE APPS SCRIPT URL ⚠️
const SCRIPT_URL = "/api/google-sheets";

// Function to fetch groups from Google Apps Script
const fetchGroupsFromSheets = async (orgId: string): Promise<TemplateGroup[]> => {
    try {
      console.debug(`🔍 fetchGroupsFromSheets called for orgId: ${orgId}`);
      
      const url = `${SCRIPT_URL}?action=getGroups&orgId=${orgId}`;
      console.debug(`🌐 Fetching from proxy URL: ${url}`);
      
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
      return result.groups || [];
    } catch (error) {
      console.error(`💥 Error loading from Google Sheets:`, error);
      return [];
    }
};

// Add this function to fetch certificate types from Google Sheets
// Update this function in template-context.tsx
const fetchCertificateTypesFromSheets = async (orgId: string): Promise<string[]> => {
  try {
    console.debug(`🔍 fetchCertificateTypesFromSheets called for orgId: ${orgId}`);
    
    const url = `${SCRIPT_URL}?action=getCertificateTypes&orgId=${orgId}`;
    console.debug(`🌐 Fetching certificate types from proxy URL: ${url}`);
    
    const response = await fetch(url);
    console.debug(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch certificate types: ${response.status}`);
      return [];
    }

    const result = await response.json();
    console.debug(`📊 Certificate Types API Response:`, result);

    if (!result.success) {
      console.error(`❌ Google Sheets error: ${result.error}`);
      return [];
    }

    console.debug(`✨ Successfully fetched ${result.certificateTypes?.length || 0} certificate types`);
    return result.certificateTypes || [];
  } catch (error) {
    console.error(`💥 Error loading certificate types:`, error);
    return [];
  }
};

// Function to add group to Google Sheets
const addGroupToSheets = async (orgId: string, group: TemplateGroup): Promise<boolean> => {
  try {
    console.log('📤 SENDING TO PROXY:');
    console.log('Organization:', orgId);
    console.log('Group data being sent:', group);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `action=addGroup&orgId=${orgId}&groupData=${encodeURIComponent(JSON.stringify(group))}`
    });

    console.log('📡 Proxy response status:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📊 Proxy response:', result);

    if (result.success) {
      console.log('✅ Successfully added group via proxy');
      return true;
    } else {
      console.error(`❌ Failed to add group: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Error adding group via proxy:`, error);
    return false;
  }
};

// Function to update group in Google Sheets
const updateGroupInSheets = async (orgId: string, groupId: string, group: TemplateGroup): Promise<boolean> => {
  try {
    console.debug(`✏️ Updating group via proxy: ${groupId}`);
    
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
      console.debug(`✅ Successfully updated group via proxy`);
      return true;
    } else {
      console.error(`❌ Failed to update group: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Error updating group via proxy:`, error);
    return false;
  }
};

// Function to delete group from Google Sheets
const deleteGroupFromSheets = async (orgId: string, groupId: string): Promise<boolean> => {
  try {
    console.debug(`🗑️ Deleting group via proxy: ${groupId}`);
    
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
      console.debug(`✅ Successfully deleted group via proxy`);
      return true;
    } else {
      console.error(`❌ Failed to delete group: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Error deleting group via proxy:`, error);
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

  const [certificateTypes, setCertificateTypes] = useState<string[]>([]);
  const loadCertificateTypes = useCallback(async (orgId: string) => {
    try {
      console.debug(`🔄 loadCertificateTypes called for orgId: ${orgId}`);
      const types = await fetchCertificateTypesFromSheets(orgId);
      
      // If no types from Google Sheets, use fallback
      if (types.length === 0) {
        console.debug(`📦 Using fallback certificate types for ${orgId}`);
        const fallbackTypes = ["Achievement", "Appreciation", "Partnership"];
        setCertificateTypes(fallbackTypes);
      } else {
        setCertificateTypes(types);
      }
      
      console.debug(`✅ Loaded ${types.length} certificate types for ${orgId}`);
    } catch (error) {
      console.error(`💥 Error in loadCertificateTypes:`, error);
      // Use fallback on error
      const fallbackTypes = ["Achievement", "Appreciation", "Partnership"];
      setCertificateTypes(fallbackTypes);
    }
  }, []);

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
        certificateTypes, 
        loadCertificateTypes, 
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