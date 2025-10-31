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
}: PersonSearchProps) {
  const [dbSearch, setDbSearch] = useState("");

  const suggestions = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();

    for (const contact of contactInfoList) {
      const name = contact?.recipientName?.trim();
      const email = contact?.email?.trim();
      
      if (!name || !email) continue;

      const key = email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name, email });
      }
    }

    return Array.from(map.values());
  }, [contactInfoList]);

  const filteredPersons = useMemo(() => {
    if (!dbSearch) return suggestions;
    
    const q = dbSearch.toLowerCase();
    return suggestions.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(q);
      const emailMatch = s.email && s.email.toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }, [dbSearch, suggestions]);

  const handleSelect = (s: { name: string; email?: string }) => {
    setSelectedPerson(s.name);
    setDbSearch("");

    const searchName = s.name.toLowerCase().trim();
    const searchEmail = s.email?.toLowerCase().trim();

    const certs = dbCertificates.filter((c) => {
      const certEmail = c.email?.toLowerCase().trim() || "";
      const certName = c.recipientName?.toLowerCase().trim() || "";

      const emailMatch = searchEmail && certEmail === searchEmail;
      const nameMatch = searchName && certName === searchName;
      
      return emailMatch || nameMatch;
    });

    setPersonCertificates(certs);

    if (certs.length > 0) {
      const firstCert: DemoCertificate = {
        ...certs[0],
        certificateDate: certs[0].certificateDate || getCertificateDate(),
      };

      setFormData(firstCert);

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
          {filteredPersons.map((s, index) => (
            <li
              key={`${s.email}-${index}`}
              onClick={() => handleSelect(s)}
              className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">{s.name}</span>
                  {s.email && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({s.email})
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
          <div className="font-semibold">No matching contacts found for "{dbSearch}".</div>
          <div className="text-xs mt-2 text-gray-400">
            Try searching by name or email address.
          </div>
        </div>
      )}
    </div>
  );
}