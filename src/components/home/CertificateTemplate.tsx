"use client";
import { headingFont, bodyFont } from "../../app/utils/fonts";

interface PDFOffsets {
  heading?: number;
  subheading?: number;
  pak?: number;
  name?: number;
  date?: number;
  signature?: number;
  signatory?: number;
}

interface CertificateProps {
  heading: string;
  subheading: string;
  name: string;
  certificateDate: string;
  pakText: string; 
  templateUrl?: string;
  pdfOffsets?: PDFOffsets;
}

// ✅ constants (instead of props)
const SIGNATURE_PATH = "/signature.png"; 
const SIGNATORY_NAME = "Authorized By Lyle Benjamin, PAK Founder";

export default function CertificateTemplate({
  heading,
  subheading,
  pakText,
  name,
  certificateDate,
  templateUrl = "/templates/certificate-template.jpg",
  pdfOffsets,
}: CertificateProps) {
  const mainColor = "#695511"; // main font color

  // Safely get optional offsets
  const offset = (key: keyof PDFOffsets) => pdfOffsets?.[key] ?? 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        overflow: "auto",
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
        {/* Background image */}
        <img
          src={templateUrl}
          alt="Certificate Template"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />

        {/* Heading */}
        <h1
          id="heading-text"
          className={headingFont.className}
          style={{
            position: "absolute",
            top: 90 + offset("heading"),
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
          {heading}
        </h1>

        {/* Subheading */}
      <h2
        id="subheading-text"
        className={bodyFont.className}
        style={{
          position: "absolute",
          top: 170 + offset("subheading"),
          left: 0,
          width: "800px",
          fontSize: "20px",
          lineHeight: 1.3,
          textAlign: "center",
          color: mainColor,
          fontWeight: 700,
        }}
      >
        {subheading.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )}
      </h2>


        {/* PAK Paragraph */}
        <p
          id="pak-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 208 + offset("pak"),
            left: "50%",
            transform: "translateX(-50%)",
            width: "650px",
            fontSize: "21px",
            lineHeight: 1.4,
            textAlign: "center",
            color: mainColor,
          }}
        >
          {pakText}
        </p>

        {/* Candidate Name */}
        <p
          id="name-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 335 + offset("name"),
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
          {name}
        </p>

        {/* Date */}
        <p
          id="date-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 390 + offset("date"),
            left: "15px",
            width: "800px",
            textAlign: "center",
            fontSize: "18px",
            lineHeight: 1.2,
            color: mainColor,
          }}
        >
          {certificateDate}
        </p>

        {/* Signature */}
        <div
          id="signature"
          style={{ 
            position: "absolute",
            top: 448 + offset("signature"),
            left: "44%",
            transform: "translateX(-10%)",
          }}
        >
          <img src={SIGNATURE_PATH} alt="Signature" style={{ width: "400px", height: "auto" }} />
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
