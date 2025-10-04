// app/context/TemplateContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface TemplateGroup {
  heading: string;
  subheading: string;
  pakText: string;
}

interface TemplateContextType {
  groups: TemplateGroup[];
  addGroup: (group: TemplateGroup) => void;
  updateGroup: (heading: string, updated: TemplateGroup) => void;
  deleteGroup: (heading: string) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroups] = useState<TemplateGroup[]>([
    {
      heading: "Planned Acts of Kindness",
      subheading: "Karma Club Member",
      pakText:
        "I Hereby Make a PAK to Treat Others with Respect & Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself.",
    },
    {
      heading: "One Planet - One People",
      subheading: "Global Ambassador",
      pakText:
        "I hereby pledge I am committed to the Collaborative Sustainability initiatives of One Planet - One People & I Volunteer to actively work for the betterment of Kids, People & The Planet.",
    },
  ]);

  const addGroup = (group: TemplateGroup) => setGroups((prev) => [...prev, group]);

  const updateGroup = (heading: string, updated: TemplateGroup) =>
    setGroups((prev) => prev.map((g) => (g.heading === heading ? updated : g)));

  const deleteGroup = (heading: string) =>
    setGroups((prev) => prev.filter((g) => g.heading !== heading));

  return (
    <TemplateContext.Provider value={{ groups, addGroup, updateGroup, deleteGroup }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplates must be used within TemplateProvider");
  return ctx;
};
