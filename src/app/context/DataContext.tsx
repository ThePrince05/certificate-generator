// app/context/DataContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useOrganization } from './OrganizationContext';

export interface TemplateGroup {
  id: string;
  programName: string;
  achievementText: string;
  category: string;
  type: string;
}

export interface HistoryItem {
  id: string;
  organization: string;
  recipientName: string;
  email?: string;
  programName: string;
  category: string;
  fieldOfInterest: string;
  achievementText: string;
  certificateDate?: string;
  type?: string;
  generatedAt: string;
  createdAt?: string;
  contactInfo?: Record<string, unknown>;
}

export interface DemoCertificateData {
  recipientName: string;
  email: string;
  programName: string;
  category: string;
  achievementText: string;
  type: string;
  organization: string;
  fieldOfInterest?: string;
  certificateDate?: string;
}

interface DataContextType {
  // Data states
  groups: TemplateGroup[];
  fieldOfInterestOptions: string[];
  certificateTypes: string[];
  history: HistoryItem[];
  demoData: DemoCertificateData[]; 
  
  // Loading states
  loading: {
    groups: boolean;
    fieldOfInterest: boolean;
    certificateTypes: boolean;
    history: boolean;
    deletingHistory: boolean;
    demoData: boolean;
  };
  
  // Individual refresh functions
  refreshGroups: () => void;
  refreshCertificateTypes: () => void;
  refreshFieldOfInterest: () => void;
  refreshHistory: () => void;
  refreshDemoData: () => void;
  
  // Error states
  errors: {
    groups: string | null;
    fieldOfInterest: string | null;
    certificateTypes: string | null;
    history: string | null;
    demoData: string | null;
  };
  
  // Actions
  refreshData: () => void;
  isDataLoaded: boolean;
  
  // History actions
  saveHistory: (items: HistoryItem | HistoryItem[]) => Promise<boolean>;
  deleteHistoryItem: (id: string) => Promise<boolean>;
  clearHistory: () => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const SCRIPT_URL = "/api/google-sheets";

// UPDATED: fetchDemoDataFromSheets now uses organization name
const fetchDemoDataFromSheets = async (orgName: string): Promise<DemoCertificateData[]> => {
  try {
    // Build URL with organization name instead of ID
    const url = `${SCRIPT_URL}?action=getDemoData&orgId=${encodeURIComponent(orgName)}`;
  
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    
    if (!result.success) {
      return [];
    }

    const demoDataCount = result.demoData?.length || 0;
    
    if (demoDataCount > 0) {
      // Demo data loaded successfully
    }
    
    return result.demoData || [];
  } catch (error) {
    console.error(`💥 [DEMO DATA] Fetch error:`, error);
    return [];
  }
};

const fetchGroupsFromSheets = async (orgId: string): Promise<TemplateGroup[]> => {
  try { 
    const url = `${SCRIPT_URL}?action=getGroups&orgId=${orgId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed to fetch from Google Sheets: ${response.status}`);
      return [];
    }

    const result = await response.json();
    if (!result.success) {
      // Handle "Sheet not found" gracefully
      if (result.error?.includes('Sheet not found')) {
        console.log(`📝 No groups sheet found for ${orgId}, returning empty array`);
        return [];
      }
      console.error(`❌ Google Sheets error: ${result.error}`);
      return [];
    }

    return result.groups || [];
  } catch (error) {
    console.error(`💥 Error loading from Google Sheets:`, error);
    return [];
  }
};

const fetchFieldOfInterestOptions = async (orgId: string): Promise<string[]> => {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getFieldOfInterestOptions&orgId=${orgId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch field of interest options: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.fieldOfInterestOptions) {
      return data.fieldOfInterestOptions;
    } else {
      // Handle "Sheet not found" gracefully
      if (data.error?.includes('Sheet not found')) {
        console.log(`📝 No field of interest sheet found for ${orgId}, returning empty array`);
        return [];
      }
      throw new Error(data.error || 'Failed to load field of interest options');
    }
  } catch (error) {
    console.error('Error fetching field of interest options:', error);
    return [];
  }
};

const fetchCertificateTypesFromSheets = async (orgId: string): Promise<string[]> => {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getCertificateTypes&orgId=${orgId}`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch certificate types: ${response.status}`);
      return [];
    }

    const result = await response.json();
    if (!result.success) {
      // Handle "Sheet not found" gracefully
      if (result.error?.includes('Sheet not found')) {
        console.log(`📝 No certificate types sheet found for ${orgId}, returning empty array`);
        return [];
      }
      console.error(`❌ Google Sheets error: ${result.error}`);
      return [];
    }

    return result.certificateTypes || [];
  } catch (error) {
    console.error(`💥 Error loading certificate types:`, error);
    return [];
  }
};

// HISTORY FUNCTIONS - USE ORGANIZATION NAME
const fetchHistoryFromSheets = async (orgName: string): Promise<HistoryItem[]> => {
  try {
    const url = `${SCRIPT_URL}?action=getHistory&orgId=${encodeURIComponent(orgName)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch history: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.history) {
      return data.history;
    } else {
      console.error('❌ API returned success: false', data.error);
      throw new Error(data.error || 'Failed to load history');
    }
  } catch (error) {
    console.error('💥 Error fetching history:', error);
    return [];
  }
};

const saveHistoryToSheets = async (orgName: string, historyData: HistoryItem | HistoryItem[]): Promise<boolean> => {
  console.log('🌐 saveHistoryToSheets called');
  console.log('🔑 Organization Name:', orgName);
  console.log('📦 History data to save:', historyData);
  
  try {
    const url = `${SCRIPT_URL}?action=saveHistory&orgId=${encodeURIComponent(orgName)}`;
    console.log('🔗 Making request to:', url);
    
    const requestBody = `historyData=${encodeURIComponent(JSON.stringify(historyData))}`;
    console.log('📤 Request body prepared, length:', requestBody.length);
    
    console.log('🔄 Sending fetch request...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    });

    console.log('📡 Response received');
    console.log('✅ Response status:', response.status);
    console.log('✅ Response ok:', response.ok);
    
    if (!response.ok) {
      console.error('❌ Fetch response not OK');
      return false;
    }
    
    console.log('📄 Parsing response JSON...');
    const result = await response.json();
    console.log('📄 Response data:', result);
    
    if (result.success) {
      console.log('✅ API call successful - history saved to Google Sheets');
      return true;
    } else {
      console.error('❌ API returned success: false');
      return false;
    }
  } catch (error) {
    console.error('💥 Fetch error occurred:', error);
    return false;
  }
};

const deleteHistoryItemFromSheets = async (orgName: string, historyId: string): Promise<boolean> => {
  try {
    const url = `${SCRIPT_URL}?action=deleteHistoryItem&orgId=${encodeURIComponent(orgName)}&historyId=${historyId}`;
    console.log('🗑️ Deleting history item:', { orgName, historyId });
    
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('✅ Delete response:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error deleting history item:', error);
    return false;
  }
};

const clearHistoryFromSheets = async (orgName: string): Promise<boolean> => {
  try {
    const url = `${SCRIPT_URL}?action=clearHistory&orgId=${encodeURIComponent(orgName)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};

// Helper function for duplicate detection (keeping for reference but not using)
const isDuplicateCertificate = (_existingHistory: HistoryItem[], _newCert: HistoryItem): boolean => {
  // This function is defined but not used in the current implementation
  return false;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { selectedOrg } = useOrganization();
  
  // State for all data types
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [fieldOfInterestOptions, setFieldOfInterestOptions] = useState<string[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [demoData, setDemoData] = useState<DemoCertificateData[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    groups: false,
    fieldOfInterest: false,
    certificateTypes: false,
    history: false,
    deletingHistory: false,
    demoData: false 
  });
  
  // Error states
  const [errors, setErrors] = useState({
    groups: null as string | null,
    fieldOfInterest: null as string | null,
    certificateTypes: null as string | null,
    history: null as string | null,
    demoData: null as string | null 
  });

  // UPDATED: fetchDemoData now uses organization name
  const fetchDemoData = async (orgName: string): Promise<DemoCertificateData[]> => {
    try {
      setLoading(prev => ({ ...prev, demoData: true }));
      setErrors(prev => ({ ...prev, demoData: null }));
      
      const demoDataResult = await fetchDemoDataFromSheets(orgName);
      
      if (demoDataResult.length > 0) {
        // Demo data loaded successfully
      }
      
      return demoDataResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`💥 [DEMO DATA] Error in fetchDemoData:`, error);
      
      // Only set error if it's not an expected empty state
      if (!errorMessage.includes('Sheet not found') && !errorMessage.includes('DemoData sheet not found')) {
        setErrors(prev => ({ ...prev, demoData: errorMessage }));
      }
      return [];
    } finally {
      setLoading(prev => ({ ...prev, demoData: false }));
    }
  };

  const fetchGroups = async (orgId: string): Promise<TemplateGroup[]> => {
    try {
      setLoading(prev => ({ ...prev, groups: true }));
      setErrors(prev => ({ ...prev, groups: null }));
      
      const groupsData = await fetchGroupsFromSheets(orgId);
      return groupsData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Only set error if it's not an expected empty state
      if (!errorMessage.includes('Sheet not found')) {
        setErrors(prev => ({ ...prev, groups: errorMessage }));
      }
      console.error('Error fetching groups:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const fetchFieldOfInterest = async (orgId: string): Promise<string[]> => {
    try {
      setLoading(prev => ({ ...prev, fieldOfInterest: true }));
      setErrors(prev => ({ ...prev, fieldOfInterest: null }));
      
      const fieldOfInterestData = await fetchFieldOfInterestOptions(orgId);
      return fieldOfInterestData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('Sheet not found')) {
        setErrors(prev => ({ ...prev, fieldOfInterest: errorMessage }));
      }
      console.error('Error fetching field of interest options:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, fieldOfInterest: false }));
    }
  };

  const fetchCertificateTypesData = async (orgId: string): Promise<string[]> => {
    try {
      setLoading(prev => ({ ...prev, certificateTypes: true }));
      setErrors(prev => ({ ...prev, certificateTypes: null }));
      
      const certificateTypesData = await fetchCertificateTypesFromSheets(orgId);
      return certificateTypesData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('Sheet not found')) {
        setErrors(prev => ({ ...prev, certificateTypes: errorMessage }));
      }
      console.error('Error fetching certificate types:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, certificateTypes: false }));
    }
  };

  // History fetch function - USE ORGANIZATION NAME
  const fetchHistory = async (orgName: string): Promise<HistoryItem[]> => {
    try {
      setLoading(prev => ({ ...prev, history: true }));
      setErrors(prev => ({ ...prev, history: null }));
      
      const historyData = await fetchHistoryFromSheets(orgName);
      return historyData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, history: errorMessage }));
      console.error('Error fetching history:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  // Individual refresh functions
  const refreshGroups = useCallback(async () => {
    if (selectedOrg?.id) {
      console.log('🔄 Refreshing groups data...');
      const groupsData = await fetchGroups(selectedOrg.id);
      setGroups(groupsData);
    }
  }, [selectedOrg?.id]);

  const refreshCertificateTypes = useCallback(async () => {
    if (selectedOrg?.id) {
      console.log('🔄 Refreshing certificate types data...');
      const certificateTypesData = await fetchCertificateTypesData(selectedOrg.id);
      setCertificateTypes(certificateTypesData);
    }
  }, [selectedOrg?.id]);

  const refreshFieldOfInterest = useCallback(async () => {
    if (selectedOrg?.id) {
      console.log('🔄 Refreshing field of interest data...');
      const fieldOfInterestData = await fetchFieldOfInterest(selectedOrg.id);
      setFieldOfInterestOptions(fieldOfInterestData);
    }
  }, [selectedOrg?.id]);

  // Refresh history function - USE ORGANIZATION NAME
  const refreshHistory = useCallback(async () => {
    if (selectedOrg?.name) {
      console.log('🔄 Refreshing history data...');
      const historyData = await fetchHistory(selectedOrg.name);
      setHistory(historyData);
    }
  }, [selectedOrg?.name]);

  // UPDATED: refreshDemoData now uses organization name
  const refreshDemoData = useCallback(async () => {
    if (selectedOrg?.name) {
      const demoDataResult = await fetchDemoData(selectedOrg.name);
      setDemoData(demoDataResult);
    }
  }, [selectedOrg?.name]);

  // UPDATED: Enhanced main data loading function
  const loadOrganizationData = useCallback(async (orgId: string, orgName: string) => {
    if (!orgId || !orgName) return;

    // Fetch all data in parallel
    const [groupsData, fieldOfInterestData, certificateTypesData, historyData, demoDataResult] = await Promise.all([
      fetchGroups(orgId),                    // Use orgId for groups
      fetchFieldOfInterest(orgId),           // Use orgId for field of interest
      fetchCertificateTypesData(orgId),      // Use orgId for certificate types
      fetchHistory(orgName),                 // Use orgName for history
      fetchDemoData(orgName)                 // UPDATED: Use orgName for demo data
    ]);

    setGroups(groupsData);
    setFieldOfInterestOptions(fieldOfInterestData);
    setCertificateTypes(certificateTypesData);
    setHistory(historyData);
    
    // Enhanced demo data state setting with detailed logging
    if (demoDataResult.length > 0) {
      // Demo data loaded successfully
    }
    setDemoData(demoDataResult);
  }, []);

  // Main refreshData function
  const refreshData = useCallback(() => {
    if (selectedOrg?.id && selectedOrg?.name) {
      console.log('🔄 Refreshing all data...');
      loadOrganizationData(selectedOrg.id, selectedOrg.name);
    }
  }, [selectedOrg?.id, selectedOrg?.name, loadOrganizationData]);

  // In DataContext.tsx - replace the generateId function
  const generateId = (): string => {
    // More robust ID generation
    return `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9)}`;
  };

  // Enhanced saveHistory with date updating for duplicates
  const saveHistory = useCallback(async (items: HistoryItem | HistoryItem[]): Promise<boolean> => {
    if (!selectedOrg?.name) return false;
    
    try {
      const itemsArray = Array.isArray(items) ? items : [items];
      
      console.log('💾 Saving history items:', itemsArray.length);
      
      // Generate unique IDs and prepare items
      const itemsToSave = itemsArray.map(item => ({
        ...item,
        id: item.id || generateId(),
        organization: selectedOrg.name,
        createdAt: item.createdAt || new Date().toISOString(),
        generatedAt: new Date().toISOString(), // Always use current timestamp
      }));

      // Log IDs for debugging
      console.log('🔑 Items to save IDs:', itemsToSave.map(item => item.id));

      // Check for duplicate IDs in the batch itself
      const idSet = new Set();
      const uniqueItems = itemsToSave.filter(item => {
        if (idSet.has(item.id)) {
          console.warn('🚫 Removing duplicate ID from batch:', item.id);
          return false;
        }
        idSet.add(item.id);
        return true;
      });

      if (uniqueItems.length !== itemsToSave.length) {
        console.log(`🧹 Removed ${itemsToSave.length - uniqueItems.length} duplicate IDs from batch`);
      }

      // Save to Google Sheets
      const success = await saveHistoryToSheets(selectedOrg.name, uniqueItems);
      
      if (success) {
        // Update local state - replace existing items with same IDs, add new ones
        setHistory(prevHistory => {
          const historyMap = new Map(prevHistory.map(item => [item.id, item]));
          
          // Update or add new items
          uniqueItems.forEach(item => {
            historyMap.set(item.id, item);
          });

          const updatedHistory = Array.from(historyMap.values())
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

          console.log('✅ History updated. Total items:', updatedHistory.length);
          return updatedHistory;
        });
      }

      return success;
    } catch (error) {
      console.error('❌ Error saving history:', error);
      return false;
    }
  }, [selectedOrg?.name]);

  // Enhanced deleteHistoryItem with loading state
  const deleteHistoryItem = useCallback(async (id: string): Promise<boolean> => {
    if (!selectedOrg?.name) return false;
    
    try {
      setLoading(prev => ({ ...prev, deletingHistory: true }));
      const success = await deleteHistoryItemFromSheets(selectedOrg.name, id);
      if (success) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting history item:', error);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, deletingHistory: false }));
    }
  }, [selectedOrg?.name]);

  const clearHistory = useCallback(async (): Promise<boolean> => {
    if (!selectedOrg?.name) return false;
    
    try {
      setLoading(prev => ({ ...prev, deletingHistory: true }));
      const success = await clearHistoryFromSheets(selectedOrg.name);
      if (success) {
        setHistory([]);
      }
      return success;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, deletingHistory: false }));
    }
  }, [selectedOrg?.name]);

  const isDataLoaded = 
    !loading.groups && 
    !loading.fieldOfInterest && 
    !loading.certificateTypes &&
    !loading.history &&
    !loading.demoData;

  // Enhanced data loading effect
  useEffect(() => {
    if (selectedOrg) {
      loadOrganizationData(selectedOrg.id, selectedOrg.name);
    } else {
      // Clear data when no organization is selected
      setGroups([]);
      setFieldOfInterestOptions([]);
      setCertificateTypes([]);
      setHistory([]);
      setDemoData([]);
      setLoading({
        groups: false,
        fieldOfInterest: false,
        certificateTypes: false,
        history: false,
        deletingHistory: false,
        demoData: false
      });
      setErrors({
        groups: null,
        fieldOfInterest: null,
        certificateTypes: null,
        history: null,
        demoData: null
      });
    }
  }, [selectedOrg, loadOrganizationData]);

  return (
    <DataContext.Provider value={{ 
      groups,
      fieldOfInterestOptions,
      certificateTypes,
      history,
      demoData,
      loading,
      errors,
      refreshGroups,
      refreshCertificateTypes,
      refreshFieldOfInterest,
      refreshHistory,
      refreshDemoData,
      refreshData,
      isDataLoaded,
      saveHistory,
      deleteHistoryItem,
      clearHistory
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}