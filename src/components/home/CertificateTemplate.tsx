"use client";
import { headingFont, bodyFont } from "../../app/utils/fonts";

interface PDFOffsets {
  heading?: number;
  subheading?: number;
  pak?: number;
  name?: number;
  nameLetter?: number; 
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
const SIGNATORY_NAME = "AUTHORIZED BY LYLE BENJAMIN, PAK FOUNDER";

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
    height: "auto", // Let height adjust dynamically
    aspectRatio: "838 / 670", // Keeps correct proportions
    flexShrink: 0,
    position: "relative",
    backgroundImage: `url(${templateUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain", // Fit the full image without cropping
    backgroundPosition: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    color: mainColor,
  }}
>

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
            textTransform: "uppercase",
            fontWeight: 700, // <-- bold
          }}
        >
          {subheading}
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
        top: 338 + offset("name"),
        left: "20px",
        width: "800px",
        textAlign: "center",
        fontWeight: 600,
        lineHeight: 1.2,
        color: "#363636",
        textTransform: "uppercase",
        display: "flex",
        justifyContent: "center",
        gap: "6px",
      }}
    >
      {name.split(" ").map((word, i) => (
        <span key={i} style={{ margin: "0 6px", display: "inline-flex", alignItems: "flex-end" }}>
          <span style={{ fontSize: "32px", lineHeight: 1 }}>{word.charAt(0)}</span>
          <span
            style={{
              fontSize: "28px",
              lineHeight: 1,
              transform: `translateY(${offset("nameLetter") || -1}px)`, // <-- PDF-specific offset
            }}
          >
            {word.slice(1)}
          </span>
        </span>
      ))}
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

        {/* Signature (locked constant) */}
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


        {/* Signatory (locked constant) */}
        <p
          id="signatory-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 528 + offset("signatory"),
            left: "62%",
            transform: "translateX(-50%)",
            width: "500px",
            fontSize: "16px",
            lineHeight: 2,
            color: mainColor,
            textAlign: "center",
            wordBreak: "break-word",
            textTransform: "uppercase",
          }}
        >
          {SIGNATORY_NAME}
        </p>
      </div>
    </div>
  );
}
