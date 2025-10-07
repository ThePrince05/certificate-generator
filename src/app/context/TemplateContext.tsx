"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export interface TemplateGroup {
  id: string;
  initiative: string;
  category: string;
  textField: string;
}

interface TemplateContextType {
  groups: TemplateGroup[];
  addGroup: (group: TemplateGroup) => void;
  updateGroup: (id: string, updated: TemplateGroup) => void;
  deleteGroup: (id: string) => void;
  setGroups: (groups: TemplateGroup[]) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const defaultGroups: TemplateGroup[] = [
    {
      id: uuidv4(),
      initiative: "Planned Acts of Kindness",
      category: "Karma Club Member",
      textField:
        "I Hereby Make a PAK to Treat Others with Respect & Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself.",
    },
    {
      id: uuidv4(),
      initiative: "One Planet - One People",
      category: "Global Ambassador",
      textField:
        "I hereby pledge I am committed to the Collaborative Sustainability initiatives of One Planet - One People & I Volunteer to actively work for the betterment of Kids, People & The Planet.",
    },
  ];

  const [groups, setGroupsState] = useState<TemplateGroup[]>(defaultGroups);

  // 🧩 Load from localStorage once (on first mount)
  useEffect(() => {
    const saved = localStorage.getItem("templateGroups");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setGroupsState(parsed);
      } catch (err) {
        console.error("Failed to load saved groups:", err);
      }
    }
  }, []);

  // 💾 Save to localStorage whenever groups change
  useEffect(() => {
    localStorage.setItem("templateGroups", JSON.stringify(groups));
  }, [groups]);

  const addGroup = (group: TemplateGroup) => setGroupsState((prev) => [...prev, group]);
  const updateGroup = (id: string, updated: TemplateGroup) =>
    setGroupsState((prev) => prev.map((g) => (g.id === id ? updated : g)));
  const deleteGroup = (id: string) =>
    setGroupsState((prev) => prev.filter((g) => g.id !== id));
  const setGroups = (groups: TemplateGroup[]) => setGroupsState(groups);

  return (
    <TemplateContext.Provider value={{ groups, addGroup, updateGroup, deleteGroup, setGroups }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplates must be used within TemplateProvider");
  return ctx;
};
