"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Organization {
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
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const selectOrg = (org: Organization) => setSelectedOrg(org);

  return (
    <OrganizationContext.Provider value={{ selectedOrg, selectOrg }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within OrganizationProvider");
  return context;
}
