"use client";

import React, { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { CleanCertificateData } from "@/types/certificates";

type DemoCertificate = CleanCertificateData & { id: string };

interface PersonSearchProps {
  dbCertificates: DemoCertificate[];
  contactInfoList: Array<any>;
  setSelectedPersons: (names: string[]) => void;
  setPersonCertificates: (certs: DemoCertificate[]) => void;
  setFormData: (data: CleanCertificateData | null) => void;
  history: any[];
  saveHistory: (items: any[]) => void;
  getCertificateDate: () => string;
}

export default function PersonSearchBatch({
  dbCertificates,
  contactInfoList,
  setSelectedPersons,
  setPersonCertificates,
  setFormData,
  history,
  saveHistory,
  getCertificateDate,
}: PersonSearchProps) {
  const [dbSearch, setDbSearch] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [totalCertificatesCount, setTotalCertificatesCount] = useState(0); // Add local state for certificate count

  const suggestions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();

    for (const contact of contactInfoList) {
      const name = contact?.recipientName?.trim();
      const email = contact?.email?.trim();
      
      if (!name || !email) continue;

      const key = email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { 
          id: contact.id || uuidv4(),
          name, 
          email 
        });
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

  const selectedPersons = useMemo(() => {
    return suggestions.filter(s => selectedPersonIds.includes(s.id));
  }, [selectedPersonIds, suggestions]);

  const handlePersonToggle = (person: { id: string; name: string; email?: string }) => {
    const newSelectedIds = selectedPersonIds.includes(person.id)
      ? selectedPersonIds.filter(id => id !== person.id)
      : [...selectedPersonIds, person.id];
    
    setSelectedPersonIds(newSelectedIds);
    
    // Get all certificates for all selected persons
    const allCertificates = newSelectedIds.flatMap(personId => {
      const person = suggestions.find(s => s.id === personId);
      if (!person) return [];
      
      const searchName = person.name.toLowerCase().trim();
      const searchEmail = person.email?.toLowerCase().trim();

      return dbCertificates
        .filter((cert) => {
          const certEmail = cert.email?.toLowerCase().trim() || "";
          const certName = cert.recipientName?.toLowerCase().trim() || "";

          const emailMatch = searchEmail && certEmail === searchEmail;
          const nameMatch = searchName && certName === searchName;
          
          return emailMatch || nameMatch;
        })
        .map(cert => ({
          ...cert,
          id: `${personId}-${cert.id}`,
          recipientName: person.name,
        }));
    });

    // Update total certificate count
    setTotalCertificatesCount(allCertificates.length);

    // Update parent state
    setSelectedPersons(newSelectedIds.map(id => {
      const person = suggestions.find(s => s.id === id);
      return person?.name || id;
    }));
    setPersonCertificates(allCertificates);
    
    // Set form data to the first certificate for preview
    if (allCertificates.length > 0) {
      setFormData(allCertificates[0]);
      
      // Add to history if not already there
      const firstCert = allCertificates[0];
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

  const handleSelectAll = () => {
    if (selectedPersonIds.length === filteredPersons.length) {
      // Deselect all
      setSelectedPersonIds([]);
      setSelectedPersons([]);
      setPersonCertificates([]);
      setTotalCertificatesCount(0);
      setFormData(null);
    } else {
      // Select all filtered
      const allIds = filteredPersons.map(person => person.id);
      setSelectedPersonIds(allIds);
      
      const allCertificates = allIds.flatMap(personId => {
        const person = suggestions.find(s => s.id === personId);
        if (!person) return [];
        
        const searchName = person.name.toLowerCase().trim();
        const searchEmail = person.email?.toLowerCase().trim();

        return dbCertificates
          .filter((cert) => {
            const certEmail = cert.email?.toLowerCase().trim() || "";
            const certName = cert.recipientName?.toLowerCase().trim() || "";

            const emailMatch = searchEmail && certEmail === searchEmail;
            const nameMatch = searchName && certName === searchName;
            
            return emailMatch || nameMatch;
          })
          .map(cert => ({
            ...cert,
            id: `${personId}-${cert.id}`,
            recipientName: person.name,
          }));
      });

      // Update total certificate count
      setTotalCertificatesCount(allCertificates.length);

      setSelectedPersons(allIds.map(id => {
        const person = suggestions.find(s => s.id === id);
        return person?.name || id;
      }));
      setPersonCertificates(allCertificates);
      
      if (allCertificates.length > 0) {
        setFormData(allCertificates[0]);
      }
    }
  };

  const removeSelectedPerson = (personId: string) => {
    handlePersonToggle({ id: personId, name: "", email: "" });
  };

  return (
    <div className="p-6 bg-white rounded shadow border border-gray-200 space-y-4 mb-8">
      {/* Search Input and Select All Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search for people by name or email..."
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {filteredPersons.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap font-medium"
          >
            {selectedPersonIds.length === filteredPersons.length ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      {/* Selected Persons Chips */}
      {selectedPersons.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
          <span className="text-sm text-gray-600 font-medium mr-2">Selected:</span>
          {selectedPersons.map((person) => (
            <span
              key={person.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {person.name}
              <button
                onClick={() => removeSelectedPerson(person.id)}
                className="ml-1 hover:text-blue-900 text-blue-700 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Results */}
      {dbSearch && filteredPersons.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
          {filteredPersons.map((person, index) => (
            <div
              key={`${person.email}-${index}`}
              onClick={() => handlePersonToggle(person)}
              className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedPersonIds.includes(person.id) 
                  ? "bg-blue-50 border-blue-200" 
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedPersonIds.includes(person.id) 
                      ? "bg-blue-600 border-blue-600" 
                      : "bg-white border-gray-300"
                  }`}>
                    {selectedPersonIds.includes(person.id) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{person.name}</span>
                    {person.email && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({person.email})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {dbCertificates.filter(cert => {
                    const certEmail = cert.email?.toLowerCase().trim() || "";
                    const searchEmail = person.email?.toLowerCase().trim();
                    return searchEmail && certEmail === searchEmail;
                  }).length} certs
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dbSearch && filteredPersons.length === 0 && (
        <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
          <div className="font-semibold">No matching contacts found for "{dbSearch}".</div>
          <div className="text-xs mt-2 text-gray-400">
            Try searching by name or email address.
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedPersons.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium text-sm">
            {selectedPersons.length} person(s) selected • {totalCertificatesCount} total certificates
          </p>
        </div>
      )}
    </div>
  );
}