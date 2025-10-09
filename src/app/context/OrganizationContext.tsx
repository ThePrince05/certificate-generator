"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  templateUrl?: string;
  signaturePath?: string;
  signatoryName?: string;
}

interface OrganizationContextType {
  selectedOrg: Organization | null;
  selectOrg: (org: Organization) => void;
  clearOrg: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedOrg = localStorage.getItem("selectedOrg");
    if (storedOrg) {
      setSelectedOrg(JSON.parse(storedOrg));
    }
  }, []);

  // Save to localStorage whenever selectedOrg changes
  useEffect(() => {
    if (selectedOrg) {
      localStorage.setItem("selectedOrg", JSON.stringify(selectedOrg));
    } else {
      localStorage.removeItem("selectedOrg");
    }
  }, [selectedOrg]);

  const selectOrg = (org: Organization) => setSelectedOrg(org);
  const clearOrg = () => setSelectedOrg(null);

  return (
    <OrganizationContext.Provider value={{ selectedOrg, selectOrg, clearOrg }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within OrganizationProvider");
  return context;
}
