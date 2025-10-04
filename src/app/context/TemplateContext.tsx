"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export interface TemplateGroup {
  id: string;
  heading: string;
  subheading: string;
  pakText: string;
}

interface TemplateContextType {
  groups: TemplateGroup[];
  addGroup: (group: TemplateGroup) => void;
  updateGroup: (id: string, updated: TemplateGroup) => void;
  deleteGroup: (id: string) => void;
  setGroups: (groups: TemplateGroup[]) => void; // Added setGroups
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroupsState] = useState<TemplateGroup[]>([
    {
      id: uuidv4(),
      heading: "Planned Acts of Kindness",
      subheading: "Karma Club Member",
      pakText:
        "I Hereby Make a PAK to Treat Others with Respect & Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself.",
    },
    {
      id: uuidv4(),
      heading: "One Planet - One People",
      subheading: "Global Ambassador",
      pakText:
        "I hereby pledge I am committed to the Collaborative Sustainability initiatives of One Planet - One People & I Volunteer to actively work for the betterment of Kids, People & The Planet.",
    },
  ]);

  const addGroup = (group: TemplateGroup) => setGroupsState((prev) => [...prev, group]);
  const updateGroup = (id: string, updated: TemplateGroup) =>
    setGroupsState((prev) => prev.map((g) => (g.id === id ? updated : g)));
  const deleteGroup = (id: string) =>
    setGroupsState((prev) => prev.filter((g) => g.id !== id));

  // Expose setGroups directly
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
