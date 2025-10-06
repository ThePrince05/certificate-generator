"use client";
import { headingFont, bodyFont } from "../../app/utils/fonts";

interface PDFOffsets {
  initiative?: number;
  category?: number;
  textfield?: number;
  recipientName?: number;
  certificateDate?: number;
  signature?: number;
  signatory?: number;
}

interface CertificateProps {
  initiative: string;
  category: string;
  textfield: string;
  recipientName: string;
  certificateDate: string;
  templateUrl?: string;
  pdfOffsets?: PDFOffsets;
}

// ✅ constants (instead of props)
const SIGNATURE_PATH = "/signature.png"; 
const SIGNATORY_NAME = "Authorized By Lyle Benjamin, PAK Founder";

export default function CertificateTemplate({
  initiative,
  category,
  textfield,
  recipientName,
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

        {/* Initiative (Heading) */}
        <h1
          id="initiative-text"
          className={headingFont.className}
          style={{
            position: "absolute",
            top: 90 + offset("initiative"),
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
          {initiative}
        </h1>

        {/* Category (Subheading) */}
        <h2
          id="category-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 170 + offset("category"),
            left: 0,
            width: "800px",
            fontSize: "20px",
            lineHeight: 1.3,
            textAlign: "center",
            color: mainColor,
            fontWeight: 700,
          }}
        >
          {category.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          )}
        </h2>

        {/* Textfield (PAK Paragraph) */}
        <p
          id="textfield-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 208 + offset("textfield"),
            left: "50%",
            transform: "translateX(-50%)",
            width: "650px",
            fontSize: "21px",
            lineHeight: 1.4,
            textAlign: "center",
            color: mainColor,
          }}
        >
          {textfield}
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

        {/* Awarded Date */}
        <p
          id="awardedDate-text"
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: 390 + offset("certificateDate"),
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
