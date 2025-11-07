"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";

export interface TemplateGroup {
  id: string;
  programName: string;
  achievementText: string;
  category: string;
  fieldOfInterest: string;
  type: string;
}

interface Template {
  backgroundUrl: string;
  name: string;
}

interface TemplateContextType {
  groups: TemplateGroup[];
  addGroup: (group: TemplateGroup, orgId: string) => void;
  updateGroup: (id: string, updated: TemplateGroup, orgId: string) => void;
  deleteGroup: (id: string, orgId: string) => void;
  setGroups: (groups: TemplateGroup[], orgId: string) => void;
  loadGroups: (orgId: string) => Promise<void>;

   // ✅ Add these for background template switching
  selectedTemplate: Template;
  setTemplate: React.Dispatch<React.SetStateAction<Template>>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

const fetchGroupsFromCSV = async (orgId: string): Promise<TemplateGroup[]> => {
  console.debug(`🔍 fetchGroupsFromCSV called for orgId: ${orgId}`);
  
  // Google Sheets published to web URLs
  const fileMap: Record<string, string> = {
    opop: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRStK-QgO2W0MK8hPHrZiB5YUL2hJ2JWzOgSwvsu_bnaKDQrYcPJ7XilrmcgBjAZA/pub?output=csv",
    pak: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRs9NPi-odMP89D-VQtJVLv8pW0tuoM4KRqSvHflMq8B5WdH-qahTqOw4-y7lxJmA/pub?output=csv",
  };

  const url = fileMap[orgId];
  console.debug(`🌐 Fetching from URL: ${url}`);
  
  if (!url) {
    console.debug(`❌ No URL found for orgId: ${orgId}`);
    return [];
  }

  try {
    console.debug(`🚀 Starting fetch request...`);
    const response = await fetch(url);
    console.debug(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch CSV: ${response.status}`);
      return [];
    }

    const csvText = await response.text();
    console.debug(`📄 CSV text length: ${csvText.length} characters`);
    console.debug(`📄 First 200 chars of CSV:`, csvText.substring(0, 200));

    console.debug(`🔨 Parsing CSV with PapaParse...`);
    const parsed = Papa.parse<{
      programName: string;
      achievementText: string;
      category?: string;
      fieldOfInterest?: string;
      type?: string;
    }>(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
    });

    console.debug(`📊 Parse results:`, {
      dataLength: parsed.data.length,
      errors: parsed.errors,
      meta: parsed.meta
    });

    const filteredData = parsed.data.filter((row) => row.programName && row.achievementText);
    console.debug(`🎯 Filtered data: ${filteredData.length} rows (from ${parsed.data.length} total)`);

    const finalResult = filteredData.map((row) => ({
      id: uuidv4(),
      programName: row.programName.trim(),
      achievementText: row.achievementText.trim(),
      category: row.category?.trim() || "General",
      fieldOfInterest: row.fieldOfInterest?.trim() || "Unspecified",
      type: row.type?.trim() || "TemplateContext",
    }));

    console.debug(`✨ Final result: ${finalResult.length} TemplateGroup objects created`);
    console.debug(`📋 Sample result:`, finalResult.length > 0 ? finalResult[0] : 'No results');
    
    return finalResult;
  } catch (error) {
    console.error(`💥 Error loading CSV:`, error);
    return [];
  }
};

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroupsState] = useState<TemplateGroup[]>([]);


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
    const saved = localStorage.getItem("templateGroupsByOrg");
    const parsed: Record<string, TemplateGroup[]> = saved ? JSON.parse(saved) : {};
    let groupsForOrg = parsed[orgId] || [];

    if (groupsForOrg.length === 0) {
      groupsForOrg = await fetchGroupsFromCSV(orgId);
      parsed[orgId] = groupsForOrg;
      localStorage.setItem("templateGroupsByOrg", JSON.stringify(parsed));
    }

    setGroupsState(groupsForOrg);
  }, []);

  const addGroup = useCallback(
    (group: TemplateGroup, orgId: string) => {
      setGroupsState((prev) => {
        const updated = [...prev, group];
        saveGroups(updated, orgId);
        return updated;
      });
    },
    [saveGroups]
  );

  const updateGroup = useCallback(
    (id: string, updatedGroup: TemplateGroup, orgId: string) => {
      setGroupsState((prev) => {
        const updated = prev.map((g) => (g.id === id ? updatedGroup : g));
        saveGroups(updated, orgId);
        return updated;
      });
    },
    [saveGroups]
  );

  const deleteGroup = useCallback(
    (id: string, orgId: string) => {
      setGroupsState((prev) => {
        const updated = prev.filter((g) => g.id !== id);
        saveGroups(updated, orgId);
        return updated;
      });
    },
    [saveGroups]
  );

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

        // ✅ Provide template state
        selectedTemplate,
        setTemplate,
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
