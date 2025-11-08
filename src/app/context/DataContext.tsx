// app/context/DataContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';

export interface TemplateGroup {
  id: string;
  programName: string;
  achievementText: string;
  category: string;
  type: string;
}

interface DataContextType {
  // Data states
  groups: TemplateGroup[];
  fieldOfInterestOptions: string[];
  certificateTypes: string[];
  
  // Loading states
  loading: {
    groups: boolean;
    fieldOfInterest: boolean;
    certificateTypes: boolean;
  };
  
  // Error states
  errors: {
    groups: string | null;
    fieldOfInterest: string | null;
    certificateTypes: string | null;
  };
  
  // Actions
  refreshData: () => void;
  isDataLoaded: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ⚠️ REPLACE WITH YOUR GOOGLE APPS SCRIPT URL ⚠️
const SCRIPT_URL = "/api/google-sheets";

// Fetch functions (moved from TemplateContext)
const fetchGroupsFromSheets = async (orgId: string): Promise<TemplateGroup[]> => {
  try {
    console.debug(`🔍 fetchGroupsFromSheets called for orgId: ${orgId}`);
    const url = `${SCRIPT_URL}?action=getGroups&orgId=${orgId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed to fetch from Google Sheets: ${response.status}`);
      return [];
    }

    const result = await response.json();
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
      console.error(`❌ Google Sheets error: ${result.error}`);
      return [];
    }

    return result.certificateTypes || [];
  } catch (error) {
    console.error(`💥 Error loading certificate types:`, error);
    return [];
  }
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { selectedOrg } = useOrganization();
  
  // State for all data types
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [fieldOfInterestOptions, setFieldOfInterestOptions] = useState<string[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<string[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    groups: false,
    fieldOfInterest: false,
    certificateTypes: false
  });
  
  // Error states
  const [errors, setErrors] = useState({
    groups: null as string | null,
    fieldOfInterest: null as string | null,
    certificateTypes: null as string | null
  });

  // Individual fetch functions
  const fetchGroups = async (orgId: string): Promise<TemplateGroup[]> => {
    try {
      setLoading(prev => ({ ...prev, groups: true }));
      setErrors(prev => ({ ...prev, groups: null }));
      
      const groupsData = await fetchGroupsFromSheets(orgId);
      return groupsData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, groups: errorMessage }));
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
      setErrors(prev => ({ ...prev, fieldOfInterest: errorMessage }));
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
      setErrors(prev => ({ ...prev, certificateTypes: errorMessage }));
      console.error('Error fetching certificate types:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, certificateTypes: false }));
    }
  };

  // Main data loading function
  const loadOrganizationData = async (orgId: string) => {
    if (!orgId) return;

    console.log(`🔄 Loading data for organization: ${orgId}`);
    
    // Fetch all data in parallel for better performance
    const [groupsData, fieldOfInterestData, certificateTypesData] = await Promise.all([
      fetchGroups(orgId),
      fetchFieldOfInterest(orgId),
      fetchCertificateTypesData(orgId)
    ]);

    setGroups(groupsData);
    setFieldOfInterestOptions(fieldOfInterestData);
    setCertificateTypes(certificateTypesData);

    console.log(`✅ Data loaded for ${orgId}:`, {
      groups: groupsData.length,
      fieldOfInterestOptions: fieldOfInterestData.length,
      certificateTypes: certificateTypesData.length
    });
  };

  const refreshData = () => {
    if (selectedOrg) {
      loadOrganizationData(selectedOrg.id);
    }
  };

  // Check if all essential data is loaded
  const isDataLoaded = 
    !loading.groups && 
    !loading.fieldOfInterest && 
    !loading.certificateTypes;

  // Load data when organization changes
  useEffect(() => {
    if (selectedOrg) {
      loadOrganizationData(selectedOrg.id);
    } else {
      // Clear data when no organization is selected
      setGroups([]);
      setFieldOfInterestOptions([]);
      setCertificateTypes([]);
      setLoading({
        groups: false,
        fieldOfInterest: false,
        certificateTypes: false
      });
      setErrors({
        groups: null,
        fieldOfInterest: null,
        certificateTypes: null
      });
    }
  }, [selectedOrg]);

  return (
    <DataContext.Provider value={{ 
      groups,
      fieldOfInterestOptions,
      certificateTypes,
      loading,
      errors,
      refreshData,
      isDataLoaded
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