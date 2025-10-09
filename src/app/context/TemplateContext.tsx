"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";

export interface TemplateGroup {
  id: string;
  programName: string;
  achievementText: string;
}

interface TemplateContextType {
  groups: TemplateGroup[];
  addGroup: (group: TemplateGroup, orgId: string) => void;
  updateGroup: (id: string, updated: TemplateGroup, orgId: string) => void;
  deleteGroup: (id: string, orgId: string) => void;
  setGroups: (groups: TemplateGroup[], orgId: string) => void;
  loadGroups: (orgId: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

const fetchGroupsFromCSV = async (orgId: string): Promise<TemplateGroup[]> => {
  const fileMap: Record<string, string> = {
    opop: "/data/opop.csv",
    pak: "/data/pak.csv",
  };

  const url = fileMap[orgId];
  if (!url) return [];

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const csvText = await response.text();

    const parsed = Papa.parse<{ programName: string; achievementText: string }>(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
    });

    return parsed.data
      .filter((row) => row.programName && row.achievementText)
      .map((row) => ({
        id: uuidv4(),
        programName: row.programName.trim(),
        achievementText: row.achievementText.trim(),
      }));
  } catch {
    return [];
  }
};

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroupsState] = useState<TemplateGroup[]>([]);

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
      value={{ groups, addGroup, updateGroup, deleteGroup, setGroups, loadGroups }}
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
