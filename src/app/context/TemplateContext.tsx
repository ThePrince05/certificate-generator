"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
  // Template management only
  selectedTemplate: Template;
  setTemplate: React.Dispatch<React.SetStateAction<Template>>;
  
  // CRUD operations (these will work with external data from DataContext)
  addGroup: (group: TemplateGroup, orgId: string, refreshData?: () => void) => Promise<boolean>;
  updateGroup: (id: string, updated: TemplateGroup, orgId: string, refreshData?: () => void) => Promise<boolean>;
  deleteGroup: (id: string, orgId: string, refreshData?: () => void) => Promise<boolean>;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

// Function to add group to Google Sheets
const addGroupToSheets = async (group: TemplateGroup, orgId: string): Promise<boolean> => {
  console.log('🚀 SENDING GROUP DATA TO GOOGLE SHEETS:');
  console.log('Full group object:', group);
  
  try {
    const url = `/api/google-sheets?action=addGroup&orgId=${encodeURIComponent(orgId)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });

    console.log('📡 Proxy response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to add group:', errorData.error);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Successfully added group to sheets:', result);
    return result.success;
    
  } catch (error) {
    console.error('💥 Error adding group to sheets:', error);
    throw error;
  }
};

// Function to update group in Google Sheets
const updateGroupInSheets = async (groupId: string, group: TemplateGroup, orgId: string): Promise<boolean> => {
  try {
    console.log('✏️ UPDATING GROUP DATA TO GOOGLE SHEETS:');
    
    const url = `/api/google-sheets?action=updateGroup&orgId=${encodeURIComponent(orgId)}&groupId=${encodeURIComponent(groupId)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });

    console.log('📡 Update response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to update group:', errorData.error);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Successfully updated group in sheets:', result);
    return result.success;
    
  } catch (error) {
    console.error('💥 Error updating group in sheets:', error);
    throw error;
  }
};

// Function to delete group from Google Sheets
const deleteGroupFromSheets = async (groupId: string, orgId: string): Promise<boolean> => {
  try {
    console.log('🗑️ DELETING GROUP FROM GOOGLE SHEETS:');
    
    const url = `/api/google-sheets?action=deleteGroup&orgId=${encodeURIComponent(orgId)}&groupId=${encodeURIComponent(groupId)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Delete response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to delete group:', errorData.error);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Successfully deleted group from sheets:', result);
    return result.success;
    
  } catch (error) {
    console.error('💥 Error deleting group from sheets:', error);
    throw error;
  }
};

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Template state only
  const [selectedTemplate, setTemplate] = useState<Template>({
    backgroundUrl: "/templates/one-planet-one-people/certificate-template.jpg",
    name: "Default Template",
  });

  const addGroup = useCallback(async (group: TemplateGroup, orgId: string, refreshData?: () => void): Promise<boolean> => {
    setSyncStatus('loading');
    try {
      const sheetsSuccess = await addGroupToSheets(group, orgId);
      
      if (sheetsSuccess) {
        console.log('✅ Successfully added to Google Sheets');
        // ✅ Refresh data after successful add
        if (refreshData) {
          refreshData();
        }
        setSyncStatus('success');
        return true;
      } else {
        console.log('❌ Google Sheets add failed');
        setSyncStatus('error');
        return false;
      }
    } catch (error) {
      console.error('💥 Error in addGroup:', error);
      setSyncStatus('error');
      return false;
    }
  }, []);

  const updateGroup = useCallback(async (id: string, updatedGroup: TemplateGroup, orgId: string, refreshData?: () => void): Promise<boolean> => {
    setSyncStatus('loading');
    try {
      const sheetsSuccess = await updateGroupInSheets(id, updatedGroup, orgId);
      
      if (sheetsSuccess) {
        console.log('✅ Successfully updated in Google Sheets');
        // ✅ Refresh data after successful update
        if (refreshData) {
          refreshData();
        }
        setSyncStatus('success');
        return true;
      } else {
        console.log('❌ Google Sheets update failed');
        setSyncStatus('error');
        return false;
      }
    } catch (error) {
      console.error('💥 Error in updateGroup:', error);
      setSyncStatus('error');
      return false;
    }
  }, []);

  const deleteGroup = useCallback(async (id: string, orgId: string, refreshData?: () => void): Promise<boolean> => {
    setSyncStatus('loading');
    try {
      const sheetsSuccess = await deleteGroupFromSheets(id, orgId);
      
      if (sheetsSuccess) {
        console.log('✅ Successfully deleted from Google Sheets');
        // ✅ Refresh data after successful delete
        if (refreshData) {
          refreshData();
        }
        setSyncStatus('success');
        return true;
      } else {
        console.log('❌ Google Sheets delete failed');
        setSyncStatus('error');
        return false;
      }
    } catch (error) {
      console.error('💥 Error in deleteGroup:', error);
      setSyncStatus('error');
      return false;
    }
  }, []);

  return (
    <TemplateContext.Provider
      value={{
        selectedTemplate,
        setTemplate,
        addGroup,
        updateGroup,
        deleteGroup,
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