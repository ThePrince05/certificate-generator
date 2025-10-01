"use client";
import { headingFont, bodyFont, signatureFont } from "../../app/utils/fonts";

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
  signature: string;
  signatory: string;
  templateUrl?: string;
  pdfOffsets?: {
    heading?: number;
    subheading?: number;
    pak?: number;
    name?: number;
    date?: number;
    signature?: number;
    signatory?: number;
  };
}

export default function CertificateTemplate({
  heading,
  subheading,
  name,
  certificateDate,
  signature,
  signatory,
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
    overflow: "auto", // allow scroll if screen smaller
  }}
>
  <div
    id="certificate"
    style={{
      width: "800px",   // locked design size
      height: "600px",  // locked design size
      flexShrink: 0,    // prevent shrinking
      position: "relative",
      backgroundImage: `url(${templateUrl})`,
      backgroundSize: "cover",
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
            top: 60 + offset("heading"),
            left: 0,
            width: "800px",
            padding: "0 20px",
            fontSize: "50px",
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
            top: 135 + offset("subheading"),
            left: 0,
            width: "800px",
            fontSize: "20px",
            lineHeight: 1.3,
            textAlign: "center",
            color: mainColor,
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
            top: 180 + offset("pak"),
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            fontSize: "20px",
            lineHeight: 1.4,
            textAlign: "center",
            color: mainColor,
          }}
        >
          I Hereby Make a PAK to Treat Others with Respect and Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself
        </p>

        {/* Candidate Name */}
        <p
          id="name-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 300 + offset("name"),
            left: 0,
            width: "800px",
            textAlign: "center",
            fontSize: "32px",
            fontWeight: 600,
            lineHeight: 1.2,
            color: "#111827",
            textTransform: "uppercase",
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
            top: 350 + offset("date"),
            left: 0,
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
        <p
          id="signature-text"
          className={signatureFont.className}
          style={{
            position: "absolute",
            top: 430 + offset("signature"),
            left: "61%",
            transform: "translateX(-50%)",
            fontSize: "50px",
            lineHeight: 1.2,
            color: "#111827",
            width: "400px",
            textAlign: "center",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {signature}
        </p>

        {/* Signatory */}
        <p
          id="signatory-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 485 + offset("signatory"),
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
          {signatory}
        </p>
      </div>
    </div>
  );
}
