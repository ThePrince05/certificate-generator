"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "../context/OrganizationContext";
import { useTemplates } from "../context/TemplateContext";
import CertificateForm from "@/components/home/CertificateForm";
import CertificateTemplate from "@/components/home/CertificateTemplate";
import { generatePDF, generateJPEG } from "../utils/generatePDF";
import { CleanCertificateData } from "@/types/certificates";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { handleMultiDownload } from "@/app/utils/multiDownload";


/** Returns true when viewport is desktop width or larger. Tailwind 'lg' == 1024px. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(e.matches);
    onChange(mq);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isDesktop;
}

type PastCertificate = CleanCertificateData & {
  id: string;
  generatedAt: string;
};

type DemoCertificate = CleanCertificateData & {
  id: string;
};

export default function GenerateSingle() {
  const [mode, setMode] = useState<"manual" | "database">("database");
  const [dbCertificates, setDbCertificates] = useState<DemoCertificate[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personCertificates, setPersonCertificates] = useState<DemoCertificate[]>([]);
  const [dbSearch, setDbSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);



  const { selectedOrg } = useOrganization();
  const { groups, loadGroups, selectedTemplate } = useTemplates();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);



  const [formData, setFormData] = useState<CleanCertificateData | null>(null);
  const [forcePreview, setForcePreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<PastCertificate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("certificateHistory_v1");
      return raw ? (JSON.parse(raw) as PastCertificate[]) : [];
    } catch {
      return [];
    }
  });

  const saveHistory = (items: PastCertificate[]) => {
    setHistory(items);
    try {
      localStorage.setItem("certificateHistory_v1", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save certificate history", e);
    }
  };
const handleGenerateFromDatabase = (cert: DemoCertificate) => {
  const newItem: PastCertificate = {
    ...cert,
    id: uuidv4(),
    generatedAt: new Date().toISOString(),
  };

  // Check for duplicates
  const alreadyExists = history.some(
    (h) =>
      h.recipientName === cert.recipientName &&
      h.programName === cert.programName
  );

  if (!alreadyExists) {
    saveHistory([newItem, ...history]);
  }

  setFormData(cert);
};


  const getCertificateDate = () => {
    const today = new Date();
    const month = today.toLocaleString("en-GB", { month: "long" });
    const year = today.getFullYear();
    return `Awarded ${month} ${year}`;
  };

  // Filter history by search
  const filteredHistory = history.filter((h) =>
    [h.recipientName, h.programName, h.category, h.fieldOfInterest]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedOrg) {
      router.push("/generate");
      return;
    }
    loadGroups(selectedOrg.id);
  }, [selectedOrg, router, loadGroups]);

  // Handle new certificate generation
const handleGenerate = (data: CleanCertificateData) => {
  const exists = history.some(
    (h) =>
      h.recipientName === data.recipientName &&
      h.programName === data.programName
  );

  if (!exists) {
    const item: PastCertificate = {
      ...data,
      id: uuidv4(),
      generatedAt: new Date().toISOString(),
    };

    const updatedHistory = [item, ...history];
    saveHistory(updatedHistory);
  }

  setFormData(data); // still update form preview even if duplicate
};


  const handleDeleteHistory = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
  };

  const doDownloadPDF = (item: PastCertificate) => {
    setFormData(item);
    setTimeout(() => {
      generatePDF({
        organization: -30,
        programName: -14,
        achievementText: -15,
        recipientName: -16,
        certificateDate: -10,
        signatory: -10,
      });
    }, 250);
  };

  const doDownloadJPEG = (item: PastCertificate) => {
    setFormData(item);
    setTimeout(() => {
      generateJPEG({
        organization: -30,
        programName: -14,
        achievementText: -15,
        recipientName: -16,
        certificateDate: -10,
        signatory: -10,
      });
    }, 250);
  };

  const filteredPersons = Array.from(new Set(dbCertificates.map(c => c.recipientName)))
    .filter(p => p.toLowerCase().includes(dbSearch.toLowerCase()));

  useEffect(() => {
    if (!selectedPerson) {
      setPersonCertificates([]);
      return;
    }
    setPersonCertificates(dbCertificates.filter(c => c.recipientName === selectedPerson));
  }, [selectedPerson, dbCertificates]);

  if (!selectedOrg) return <p className="p-8 text-center text-gray-600">Redirecting...</p>;

  useEffect(() => {
    const demoCSV = `
recipientName;programName;category;achievementText
Robert Adamo;STEP-01: E-QL Education;Human Services;In recognition of achievement in holistic well-being education. This intern demonstrated training in mental, physical, and social health principles, developed quality of life strategies, and improved socialization skills.
Bob Smith;STEP-02: Social Responsibility Clubs;Social Impact & Policy;In recognition of leadership in community engagement and global citizenship. This volunteer demonstrated skill in organizing activities, developing leadership capabilities, and contributing to community projects.
Alice Johnson;STEP-03: Internship & Mentorship;Professional Services;In recognition of professional development through internship and mentorship. This intern demonstrated hands-on experience with PMOROS Project Management, built essential professional skills, and enhanced career prospects.
Charlie Brown;STEP-04: Health Happiness & Wellness;Human Services;In recognition of service and dedication to enhancing well-being through kindness. This volunteer demonstrated engagement in promoting mental health, wellness initiatives, and fostering positive community relationships.
Diana Prince;STEP-10: PMOROS Project Management;Professional Services;In recognition of mastery in project management and productivity strategies. This intern demonstrated proficiency in planning, executing, and managing projects efficiently using PMOROS and enhanced AI research techniques.
Robert Adamo;STEP-11: Essential 8 Disciplines;Business & Finance;In recognition of achievement in developing critical professional competencies across eight disciplines. This intern demonstrated collaborative training in communication, business, marketing, management, research, and problem-solving.
Fiona Gallagher;STEP-12: Career Prep & Interview Skills;Professional Services;In recognition of preparation for professional career advancement. This intern demonstrated development of interview skills, professional resumes and portfolios, and effective strategies for obtaining recommendations.
George Martin;STEP-13: Work Placement Services;Professional Services;In recognition of successfully navigating the job market through work placement training. This intern demonstrated practical skills in sourcing opportunities, securing appointments, and reviewing employment contracts.
Helen Carter;STEP-14: U.S. Study Abroad Program;Professional Services;In recognition of international career development through the U.S. Study Abroad program. This intern demonstrated hands-on field experience, enhanced global perspective, and developed cross-cultural competencies significantly.
Ian Wright;STEP-20: English Conversational;Marketing & Communications;In recognition of achievement in developing English conversational skills and language fluency. This intern demonstrated practical communication techniques for everyday interactions and gained confidence in speaking English.
Charlie Brown;STEP-21: English Business Communication;Marketing & Communications;In recognition of proficiency in professional English communication for business settings. This intern demonstrated mastery in business writing, presentation skills, negotiation techniques, and business language etiquette.
Alice Johnson;STEP-22: English Language Immersion;Marketing & Communications;In recognition of language proficiency gained through intensive English immersion in American culture. This intern demonstrated comprehensive language instruction, cultural engagement, and real-world practice in authentic environments.
Robert Adamo;STEP-30: Work/Life Balance & CSR;Business & Finance;In recognition of training in work/life balance and CSR integration. This volunteer demonstrated expertise in PMOROS, career development strategies, and team building initiatives supporting ESG and SDG goals.
Fiona Gallagher;STEP-32: Health & Wellness Focus;Human Services;In recognition of focus on personal and community well-being through Project KOPE. This volunteer demonstrated strategies for maintaining health, happiness, wellness including relationship building, mental health, and stress reduction.
George Martin;STEP-33: Financial Literacy & Planning;Business & Finance;In recognition of achievement in financial literacy and planning fundamentals. This intern demonstrated comprehensive training in budgeting, savings strategies, investment principles, and financial decision-making for long-term security.
Helen Carter;STEP-34: Corporate Social Responsibility;Social Impact & Policy;In recognition of understanding CSR principles and ethical business practices. This intern demonstrated knowledge of how businesses can operate ethically and sustainably while increasing ROI and making positive societal impacts.
Ian Wright;STEP-35: Volunteer & Team Building;Professional Services;In recognition of contributions to corporate culture through volunteerism and team building. This volunteer demonstrated how these activities enhance productivity, strengthen team dynamics, and improve organizational ROI.
Charlie Brown;STEP-40: Train the Trainer;Education;In recognition of development as an effective trainer and educator. This intern demonstrated comprehensive training in instructional design, delivery techniques, and assessment methods with opportunities to earn income.
Alice Johnson;STEP-41: Database Management;Technology & Digital;In recognition of mastery in database management principles and data organization. This intern demonstrated practical skills in data storage, retrieval, analysis, and security while ensuring data integrity and effective management.
Robert Adamo;STEP-42: Web Development;Technology & Digital;In recognition of achievement in web development skills and modern web technologies. This intern demonstrated ability to create and maintain functional websites using HTML, CSS, and contemporary design principles.
Fiona Gallagher;STEP-43: Software Development;Technology & Digital;In recognition of achievement in software development and programming excellence. This intern demonstrated extensive knowledge in programming languages, software design principles, and application development through hands-on experience.
George Martin;STEP-44: Product Development;Engineering & Product;In recognition of mastery in the complete product development lifecycle from concept to market. This intern demonstrated proficiency in ideation, design, prototyping, market research, and product launching processes.
`.trim();

    const lines = demoCSV.split("\n");
    const headers = lines[0].split(";");

    const data: DemoCertificate[] = lines.slice(1).map((line) => {
      const cols = line.split(";");
      return {
        id: uuidv4(), // ✅ must include id
        recipientName: cols[0],
        programName: cols[1],
        category: cols[2],
        achievementText: cols[3],
        fieldOfInterest: "", // optional
        certificateDate: `Awarded ${new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })}`,
        organization: selectedOrg?.name || "",
      };
    });

    setDbCertificates(data); // ✅ now matches DemoCertificate[]
  }, [selectedOrg]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="generate-single"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="p-8 space-y-8"
      >
        <div className="p-6 space-y-8">
          <button
            onClick={() => router.push("/generate")}
            className="fixed top-6 left-6 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-md z-50"
          >
            ← Change Generation
          </button>

          <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold text-center mb-4">Generate Single Certificate</h1>
            <h2 className="text-2xl text-center text-gray-600 mb-8">{selectedOrg.name}</h2>

            <div className="flex justify-center gap-4 mb-6">
              <button
                className={`px-4 py-2 rounded ${mode === "database" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setMode("database")}
              >
                Load from Database
              </button>
              <button
                className={`px-4 py-2 rounded ${mode === "manual" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setMode("manual")}
              >
                Manual Input
              </button>
            </div>

            {/* Manual Mode */}
            {mode === "manual" && (
              <div className="mt-12">
                <CertificateForm
                  initialValues={{ organization: selectedOrg.name }}
                  onSubmit={handleGenerate}
                />
              </div>
            )}

      {/* Database Mode */}
      {mode === "database" && (
        <div className="mt-12 max-w-3xl mx-auto p-6 bg-white rounded shadow border border-black-300 space-y-6">
          {/* Search Field */}
          <input
            type="text"
            placeholder="Search for a person..."
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
            className="w-full border rounded p-3"
          />

          {/* Person List */}
          {dbSearch && (
            <ul className="border rounded max-h-60 overflow-y-auto divide-y divide-gray-200">
              {filteredPersons.map((p) => (
                <li
                  key={p}
                  onClick={() => {
                    setSelectedPerson(p);
                    setDbSearch("");
                    const firstCert = dbCertificates.find(c => c.recipientName === p);
                    if (firstCert) setFormData(firstCert);
                  }}
                  className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
          {personCertificates.length > 0 && (
  <div className="flex justify-end mb-2">
    <button
      onClick={() =>
        setSelectedCertificates(
          selectedCertificates.length === personCertificates.length
            ? []
            : personCertificates.map(c => c.id)
        )
      }
      className="text-blue-600 hover:underline text-sm"
    >
      {selectedCertificates.length === personCertificates.length
        ? "Deselect All"
        : "Select All"}
    </button>
  </div>
)}

          {/* Certificates for selected person */}
          {selectedPerson && personCertificates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">{selectedPerson}'s Certificates</h3>
              <div className="space-y-3">
               {personCertificates.map(cert => {
  const isSelected = selectedCertificates.includes(cert.id);
  return (
    <div
      key={cert.id}
      className={`border rounded p-6 shadow bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isSelected ? "border-blue-500 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {
            setSelectedCertificates(prev =>
              isSelected
                ? prev.filter(id => id !== cert.id)
                : [...prev, cert.id]
            );
          }}
          className="mt-1 accent-blue-500 scale-110"
        />
        <div>
          <p className="font-bold text-gray-900">{cert.programName}</p>
          <p className="text-sm text-gray-500">{cert.category}</p>
          <p className="text-sm text-gray-600 mt-1">{cert.achievementText}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm"
          onClick={() => setFormData(cert)}
        >
          Preview
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
          onClick={() => {
            handleGenerateFromDatabase(cert);
            setTimeout(() =>
              generatePDF({
                organization: -25,       // <- custom offset for this button
                programName: -12,
                achievementText: -14,
                recipientName: -18,
                certificateDate: -10,
                signatory: -8,
              }),
              200
            );
          }}
        >
          PDF
        </button>
       <button
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition text-sm"
        onClick={() => {
          handleGenerateFromDatabase(cert);
          setTimeout(() =>
            generateJPEG({
              organization: -25,       // <- custom offset for this button
              programName: -12,
              achievementText: -14,
              recipientName: -18,
              certificateDate: -10,
              signatory: -8,
            }),
            200
          );
        }}
      >
        JPEG
      </button>
      </div>
    </div>
  );
})}

          {selectedCertificates.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t pt-4">
          <p className="text-gray-700">
            {selectedCertificates.length} certificate
            {selectedCertificates.length > 1 ? "s" : ""} selected
          </p>

          <div className="flex gap-3">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          onClick={() => {
            const selected = personCertificates.filter(c =>
              selectedCertificates.includes(c.id)
            );

            // ✅ Pass string safely with fallback
            handleMultiDownload(
              selected,
              "pdf",
              selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"
            );
          }}
        >
          Generate PDFs (ZIP)
        </button>

        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
          onClick={() => {
            const selected = personCertificates.filter(c =>
              selectedCertificates.includes(c.id)
            );

            handleMultiDownload(
              selected,
              "jpeg",
              selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"
            );
          }}
        >
          Generate JPEGs (ZIP)
        </button>
      </div>
      </div>
    )}

              </div>
            </div>
          )}
        </div>
      )}

          </div>

          {formData && (
            <div className="mt-6 text-center space-y-4">
              {!isDesktop && !forcePreview ? (
                <>
                  <p className="text-sm text-gray-500">
                    Preview is disabled on small/tablet screens to improve performance and prevent layout issues.
                  </p>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() =>
                        generatePDF({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Download PDF
                    </button>

                    <button
                      onClick={() =>
                        generateJPEG({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Download JPEG
                    </button>
                  </div>

                  <button
                    onClick={() => setForcePreview(true)}
                    className="mt-2 text-sm underline text-blue-600"
                  >
                    Show preview anyway
                  </button>
                </>
              ) : (
                <>
                  <div className="w-full flex justify-center overflow-x-auto py-4">
                    <div className="flex-shrink-0">
                      <CertificateTemplate
                        {...formData}
                        templateUrl={selectedTemplate?.backgroundUrl ?? "/templates/one-planet-one-people/certificate-template.jpg"}
                        isPreview
                        certificateDate={formData.certificateDate ?? getCertificateDate()}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() =>
                        generatePDF({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Download PDF
                    </button>

                    <button
                      onClick={() =>
                        generateJPEG({
                          organization: -30,
                          programName: -14,
                          achievementText: -15,
                          recipientName: -16,
                          certificateDate: -10,
                          signatory: -10,
                        })
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Download JPEG
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        {/* Toggle History Button */}
{history.length > 0 && (
  <div className="flex justify-center mb-4">
    <button
      onClick={() => setShowHistory(prev => !prev)}
      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
    >
      {showHistory ? "Hide History" : "Show History"}
    </button>
  </div>
)}

{showHistory && (
  <section className="max-w-3xl mx-auto bg-gray-50 border rounded shadow p-6 mt-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-700">Certificate History</h2>
      {history.length > 0 && (
        <button
          onClick={() => saveHistory([])}
          className="text-sm text-red-600 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>

    {/* Search */}
    {history.length > 0 && (
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search certificates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded p-3"
        />
      </div>
    )}

    {filteredHistory.length === 0 ? (
      <p className="text-gray-500 text-center py-6">
        {searchQuery
          ? `No certificates match "${searchQuery}".`
          : "No certificates generated yet."}
      </p>
    ) : (
      <div className="space-y-4">
        {filteredHistory.map((h) => (
          <div
            key={h.id}
            className="border p-4 rounded shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setFormData(h)} // entire box clickable
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold">{h.recipientName || h.programName}</h3>
                <p className="text-xs text-gray-500">
                  {h.category} · {h.fieldOfInterest} ·{" "}
                  {new Date(h.generatedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent triggering box click
                    doDownloadPDF(h);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
                >
                  PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    doDownloadJPEG(h);
                  }}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition text-sm"
                >
                  JPEG
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHistory(h.id);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border rounded transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 whitespace-pre-line">{h.achievementText}</p>
          </div>
        ))}
      </div>
    )}
  </section>
)}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}