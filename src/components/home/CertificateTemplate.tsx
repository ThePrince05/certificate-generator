"use client";
import { useEffect, useRef, useState } from "react";
import { headingFont, bodyFont } from "../../app/utils/fonts";

interface PDFOffsets {
  organization?: number;
  programName?: number;
  achievementText?: number;
  recipientName?: number;
  certificateDate?: number;
  signature?: number;
  signatory?: number;
}

interface CertificateProps {
  organization: string;
  programName: string;
  fieldOfInterest: string;
  achievementText: string;
  recipientName: string;
  certificateDate: string;
  templateUrl?: string;
  pdfOffsets?: PDFOffsets;
  isPreview?: boolean;
}

const SIGNATURE_PATH = "/signature.png";
const SIGNATORY_NAME = "Authorized By Lyle Benjamin, PAK Founder";

export default function CertificateTemplate({
  organization,
  programName,
  fieldOfInterest,
  achievementText,
  recipientName,
  certificateDate,
  templateUrl,
  pdfOffsets,
  isPreview = false,
}: CertificateProps) {
  const mainColor = "#695511";

  const offset = (key: keyof PDFOffsets) =>
    isPreview ? 0 : pdfOffsets?.[key] ?? 0;

  const cleanProgramName = programName
    .replace(/^STEP[-:\s]*\d*[:\s-]*/i, "")
    .trim();

  const fullProgramText = `${cleanProgramName} : ${fieldOfInterest}`;

  // 🧠 Detect actual line wrapping in the DOM
  const programRef = useRef<HTMLHeadingElement>(null);
  const [isTwoLineProgram, setIsTwoLineProgram] = useState(false);

  useEffect(() => {
    const el = programRef.current;
    if (!el) return;

    // Compare actual scrollHeight to single-line height
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const wraps = el.scrollHeight > lineHeight * 1.5;
    setIsTwoLineProgram(wraps);
  }, [fullProgramText]);

  // 🎨 Conditional achievementText formatting
  const achievementStyle = {
    top: (isTwoLineProgram ? 225 : 200) + offset("achievementText"),
    fontSize: isTwoLineProgram ? "18px" : "20px",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#fff",
        overflowX: "auto",
        overflowY: "auto",
        padding: "1rem 0",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
      }}
    >
      <div
        id="certificate"
        style={{
          width: "838px",
          height: "auto",
          position: "relative",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          color: mainColor,
        }}
      >
        {/* Background */}
        <img
          src={templateUrl}
          alt="Certificate Template"
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* Organization */}
        <h1
          id="organization-text"
          className={headingFont.className}
          style={{
            position: "absolute",
            top: 90 + offset("organization"),
            left: "20px",
            width: "800px",
            padding: "0 20px",
            fontSize: "60px",
            lineHeight: 1.2,
            textAlign: "center",
            color: mainColor,
            wordBreak: "break-word",
          }}
        >
          {organization}
        </h1>

        {/* Program Name */}
        <h2
          ref={programRef}
          id="programName-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 165 + offset("programName"),
            left: "50%",
            transform: "translateX(-50%)",
            width: "650px",
            textAlign: "center",
            color: mainColor,
            fontWeight: 600,
            lineHeight: 1.4,
            fontSize: "20px",
          }}
        >
          {cleanProgramName} : {fieldOfInterest}
        </h2>

        {/* Achievement Text */}
        <p
          id="achievement-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "650px",
            lineHeight: 1.2,
            textAlign: "center",
            color: mainColor,
            ...achievementStyle,
          }}
        >
          {achievementText}
        </p>

        {/* Recipient Name */}
        <p
          id="recipientName-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 335 + offset("recipientName"),
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            textAlign: "center",
            fontWeight: 600,
            lineHeight: 1.2,
            fontSize: "32px",
            color: "#363636",
          }}
        >
          {recipientName}
        </p>

        {/* Certificate Date */}
        <p
          id="certificateDate-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 390 + offset("certificateDate"),
            left: "15px",
            width: "800px",
            textAlign: "center",
            fontSize: "20px",
            lineHeight: 1.2,
            color: mainColor,
          }}
        >
          {certificateDate}
        </p>

        {/* Signature */}
        <div
          id="signature-text"
          style={{
            position: "absolute",
            top: 448 + offset("signature"),
            left: "44%",
            transform: "translateX(-10%)",
          }}
        >
          <img
            src={SIGNATURE_PATH}
            alt="Signature"
            style={{ width: "400px", height: "auto" }}
          />
        </div>

        {/* Signatory */}
        <p
          id="signatory-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 527 + offset("signatory"),
            left: "62%",
            transform: "translateX(-50%)",
            width: "500px",
            fontSize: "16px",
            lineHeight: 2,
            color: mainColor,
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {SIGNATORY_NAME}
        </p>
      </div>
    </div>
  );
}
