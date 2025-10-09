"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

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
  loadGroups: (orgId: string) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

const ORG_DEFAULTS: Record<string, TemplateGroup[]> = {
  "opop": [
    {
      id: uuidv4(),
      programName: "Global Ambassador",
      achievementText:
        "I hereby pledge I am committed to the Collaborative Sustainability initiatives of One Planet - One People & I Volunteer to actively work for the betterment of Kids, People & The Planet.",
    },
    {
      id: uuidv4(),
      programName: "Sustainability Champion",
      achievementText: "Recognizing commitment to environmental and social initiatives.",
    },
  ],
  "pak": [
    {
      id: uuidv4(),
      programName: "Karma Club Member",
      achievementText:
        "I Hereby Make a PAK to Treat Others with Respect & Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself.",
    },
    {
      id: uuidv4(),
      programName: "Kindness Ambassador",
      achievementText: "Awarded for outstanding contributions to Planned Acts of Kindness programs.",
    },
  ],
};

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroupsState] = useState<TemplateGroup[]>([]);

  const saveGroups = useCallback((groups: TemplateGroup[], orgId: string) => {
    const saved = localStorage.getItem("templateGroupsByOrg");
    const parsed: Record<string, TemplateGroup[]> = saved ? JSON.parse(saved) : {};
    parsed[orgId] = groups;
    localStorage.setItem("templateGroupsByOrg", JSON.stringify(parsed));
    console.log("[TemplateContext] Saved groups for org:", orgId, groups);
  }, []);

  const loadGroups = useCallback((orgId: string) => {
    console.log("[TemplateContext] loadGroups called for org:", orgId);

    const saved = localStorage.getItem("templateGroupsByOrg");
    const parsed: Record<string, TemplateGroup[]> = saved ? JSON.parse(saved) : {};
    console.log("[TemplateContext] localStorage keys:", Object.keys(parsed));

    let groupsForOrg = parsed[orgId] || [];
    if (groupsForOrg.length === 0) {
      console.log("[TemplateContext] No saved groups, using defaults...");
      groupsForOrg = (ORG_DEFAULTS[orgId] || []).map((g) => ({ ...g, id: uuidv4() }));
      parsed[orgId] = groupsForOrg;
      localStorage.setItem("templateGroupsByOrg", JSON.stringify(parsed));
      console.log("[TemplateContext] Default groups loaded for org:", orgId, groupsForOrg);
    }

    setGroupsState((prev) => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(groupsForOrg);
      if (prevStr === newStr) return prev; // prevents double updates
      console.log("[TemplateContext] Setting groupsState:", groupsForOrg);
      return groupsForOrg;
    });
  }, []);

  const addGroup = useCallback(
    (group: TemplateGroup, orgId: string) => {
      setGroupsState((prev) => {
        const updated = [...prev, group];
        saveGroups(updated, orgId);
        console.log("[TemplateContext] Added group:", group);
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
        console.log("[TemplateContext] Updated group:", updatedGroup);
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
        console.log("[TemplateContext] Deleted group id:", id);
        return updated;
      });
    },
    [saveGroups]
  );

  const setGroups = useCallback(
    (newGroups: TemplateGroup[], orgId: string) => {
      setGroupsState(() => {
        saveGroups(newGroups, orgId);
        console.log("[TemplateContext] setGroups called:", newGroups);
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
