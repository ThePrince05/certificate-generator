"use client";
import { headingFont, bodyFont, signatureFont } from "../../app/utils/fonts";

interface CertificateProps {
  heading: string;
  subheading: string;
  name: string;
  certificateDate: string;
  signature: string;
  signatory: string;
  templateUrl?: string;
}

export default function CertificateTemplate({
  heading,
  subheading,
  name,
  certificateDate,
  signature,
  signatory,
  templateUrl = "/templates/certificate-template.jpg",
}: CertificateProps) {
  const mainColor = "#6E5513"; // main font color

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        overflowX: "hidden",
      }}
    >
      <div
        id="certificate"
        style={{
          width: "800px",
          height: "600px",
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
          className={headingFont.className}
          style={{
            position: "absolute",
            top: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "40px",
            fontWeight: "bold",
            color: mainColor,
          }}
        >
          {heading}
        </h1>

        {/* Subheading */}
        <h2
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "24px",
            color: mainColor,
          }}
        >
          {subheading}
        </h2>

        {/* PAK paragraph */}
        <p
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: "180px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            fontSize: "16px",
            fontStyle: "italic",
            textAlign: "center",
            color: mainColor,
          }}
        >
          I Hereby Make a PAK to Treat Others with Respect & Kindness and to Go Through Life from this Day Forward Acting Towards Others as I Wish to Be Treated Myself
        </p>

        {/* Candidate Name */}
        <p
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: "287px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "32px",
            fontWeight: "600",
            color: "#111827", // candidate name remains dark
          }}
        >
          {name}
        </p>

        {/* Date */}
        <p
          className={bodyFont.className}
          style={{
            position: "absolute",
            top: "340px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "16px",
            color: mainColor,
          }}
        >
        {certificateDate}
        </p>

        {/* Signature */}
        <p
          className={signatureFont.className}
          style={{
            position: "absolute",
            bottom: "94px",
            left: "62%",
            transform: "translateX(-50%)",
            fontSize: "50px",
            color: "#111827", // signature stays dark
          }}
        >
          {signature}
        </p>

        {/* Signatory */}
        <p
          className={bodyFont.className}
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "20px",
            fontWeight: "700",
            color: mainColor,
          }}
        >
          {signatory}
        </p>
      </div>
    </div>
  );
}
