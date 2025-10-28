import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import ReactDOM from "react-dom/client";
import CertificateTemplate from "@/components/generate-single/CertificateTemplate";
import { CertificateData as AppCertificateData } from "@/types/certificates";

// Local type for rendering
interface LocalCertificateData extends AppCertificateData {
  id: string;
  [key: string]: any;
}

interface PdfOffsets {
  organizationOffset?: number;
  programNameOffset?: number;
  achievementTextOffset?: number;
  recipientNameOffset?: number;
  certificateDateOffset?: number;
  signatureOffset?: number;
  signatoryOffset?: number;
}

export async function handleMultiDownload(
  certificates: LocalCertificateData[],
  format: "pdf" | "jpeg",
  selectedOrgTemplate: string // just the org's default template URL
) {
  const zip = new JSZip();

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];

    // Pick template per certificate
    const templateUrl =
      cert.category === "Gaming & Development"
        ? "/templates/one-planet-one-people-games/certificate-template.jpg"
        : selectedOrgTemplate;

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(
      <CertificateTemplate
        {...cert}
        templateUrl={templateUrl}
        certificateDate={cert.certificateDate || ""}
        pdfOffsets={{
          organization: -30,
          programName: -15,
          achievementText: -15,
          recipientName: -16,
          certificateDate: -8,
          signature: 1,
          signatory: -10,
        }}
      />
    );

    // Wait for React to render
    await new Promise((res) => setTimeout(res, 300));

    const certificateEl = container.querySelector("#certificate") as HTMLElement;
    if (certificateEl) {
      const canvas = await html2canvas(certificateEl, { scale: 2, useCORS: true });

      const safeName = `${(cert.recipientName || "certificate").replace(/\s+/g, "_")}_${i + 1}`;

      if (format === "pdf") {
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
        zip.file(`${safeName}.pdf`, pdf.output("arraybuffer"));
      } else {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const blob = await (await fetch(imgData)).blob();
        zip.file(`${safeName}.jpeg`, blob);
      }
    }

    root.unmount();
    document.body.removeChild(container);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `Certificates_${format.toUpperCase()}.zip`);
}
