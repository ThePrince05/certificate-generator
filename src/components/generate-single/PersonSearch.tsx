"use client";

import React, { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { CleanCertificateData } from "@/types/certificates";

type DemoCertificate = CleanCertificateData & { id: string };

interface PersonSearchProps {
  dbCertificates: DemoCertificate[];
  contactInfoList: Array<any>;
  setSelectedPerson: (name: string | null) => void;
  setPersonCertificates: (certs: DemoCertificate[]) => void;
  setFormData: (data: CleanCertificateData | null) => void;
  history: any[];
  saveHistory: (items: any[]) => void;
  getCertificateDate: () => string;
  organization?: string;
}

export default function PersonSearch({
  dbCertificates,
  contactInfoList,
  setSelectedPerson,
  setPersonCertificates,
  setFormData,
  history,
  saveHistory,
  getCertificateDate,
  organization,
}: PersonSearchProps) {
  const [dbSearch, setDbSearch] = useState("");

  // Improved suggestions that combine data from both sources
  const suggestions = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();

    // First, filter certificates by selected organization and add unique people
    dbCertificates
      .filter(cert => cert.organization === organization) // Filter by organization passed as prop
      .forEach(cert => {
        const name = cert.recipientName?.trim();
        const email = cert.email?.trim();
        
        if (name && email) {
          const key = `${name.toLowerCase()}|${email.toLowerCase()}`;
          if (!map.has(key)) {
            map.set(key, { name, email });
          }
        }
      });

    // Then add matching contacts from contactInfoList
    const validEmails = new Set(
      Array.from(map.values()).map(person => person.email.toLowerCase())
    );

    contactInfoList.forEach(contact => {
      const name = contact?.recipientName?.trim() || contact?.name?.trim();
      const email = contact?.email?.trim();
      
      if (name && email && validEmails.has(email.toLowerCase())) {
        const key = `${name.toLowerCase()}|${email.toLowerCase()}`;
        map.set(key, { name, email });
      }
    });

    return Array.from(map.values());
  }, [dbCertificates, contactInfoList]);

  const filteredPersons = useMemo(() => {
    if (!dbSearch.trim()) return suggestions;
    
    const query = dbSearch.toLowerCase().trim();
    return suggestions.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(query);
      const emailMatch = s.email.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [dbSearch, suggestions]);

  const handleSelect = (person: { name: string; email: string }) => {
    console.log("Selected person:", person);
    setSelectedPerson(person.email);
    setDbSearch("");

    // More flexible matching - check both name and email with normalization
    const normalizedName = person.name.toLowerCase().trim();
    const normalizedEmail = person.email.toLowerCase().trim();

    const matchingCerts = dbCertificates.filter((cert) => {
      // First check if the certificate belongs to the correct organization
      if (cert.organization !== organization) {
        return false;
      }

      const certName = cert.recipientName?.toLowerCase().trim() || "";
      const certEmail = cert.email?.toLowerCase().trim() || "";

      // Match if either name OR email matches (with some flexibility)
      const nameMatch = certName === normalizedName || 
                       certName.includes(normalizedName) || 
                       normalizedName.includes(certName);
      
      const emailMatch = certEmail === normalizedEmail;

      return nameMatch || emailMatch;
    });

    console.log("Found matching certificates:", matchingCerts);
    setPersonCertificates(matchingCerts);

    if (matchingCerts.length > 0) {
      const firstCert: DemoCertificate = {
        ...matchingCerts[0],
        certificateDate: matchingCerts[0].certificateDate || getCertificateDate(),
      };

      setFormData(firstCert);

      // Add to history if not exists
      const alreadyExists = history.some(
        (h) =>
          h.recipientName === firstCert.recipientName &&
          h.programName === firstCert.programName &&
          h.email === firstCert.email
      );

      if (!alreadyExists) {
        const newHistoryItem = {
          ...firstCert,
          id: uuidv4(),
          generatedAt: new Date().toISOString(),
        };
        saveHistory([newHistoryItem, ...history]);
      }
    } else {
      setFormData(null);
      console.log("No certificates found for:", person);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow border border-gray-200 space-y-4 mb-8">
      <input
        type="text"
        placeholder="Search for a person or email..."
        value={dbSearch}
        onChange={(e) => setDbSearch(e.target.value)}
        className="w-full border rounded p-3"
      />

      {dbSearch && filteredPersons.length > 0 && (
        <ul className="border rounded max-h-60 overflow-y-auto divide-y divide-gray-200">
          {filteredPersons.map((person, index) => (
            <li
              key={`${person.email}-${index}`}
              onClick={() => handleSelect(person)}
              className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">{person.name}</span>
                  {person.email && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({person.email})
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dbSearch && filteredPersons.length === 0 && (
        <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
          <div className="font-semibold">No matching contacts found for "{dbSearch}"</div>
          <div className="text-xs mt-2 text-gray-400">
            Try searching by name or email address. Found {suggestions.length} total contacts in database.
          </div>
        </div>
      )}

   
    </div>
  );
}