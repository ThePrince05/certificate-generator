// /app/utils/generatePDF.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PDFOffsets {
  organization?: number;
  programName?: number;     // renamed from category
  achievementText?: number; // renamed from textField
  recipientName?: number;
  certificateDate?: number;
  signature?: number;
  signatory?: number;
}

const applyOffsets = (offsets?: PDFOffsets) => {
  if (!offsets) return () => {};

  const originalPositions: Record<string, string> = {};

  const apply = (id: string, offset?: number) => {
    const el = document.getElementById(id);
    if (el && offset) {
      originalPositions[id] = el.style.top; // save original top
      const currentTop = parseInt(el.style.top || "0", 10);
      el.style.top = `${currentTop + offset}px`;
    }
  };

  apply("organization-text", offsets.organization);
  apply("programName-text", offsets.programName);
  apply("achievement-text", offsets.achievementText);
  apply("recipientName-text", offsets.recipientName);
  apply("certificateDate-text", offsets.certificateDate);
  apply("signature-text", offsets.signature);
  apply("signatory-text", offsets.signatory);

  // return reset function
  return () => {
    for (const id in originalPositions) {
      const el = document.getElementById(id);
      if (el) el.style.top = originalPositions[id];
    }
  };
};

export const generatePDF = async (pdfOffsets?: PDFOffsets) => {
  const certificateElement = document.getElementById("certificate");
  if (!certificateElement) return;

  const resetOffsets = applyOffsets(pdfOffsets);
  await document.fonts.ready;

  const scale = 4;
  const canvas = await html2canvas(certificateElement, { scale });
  const imgData = canvas.toDataURL("image/png");

  const pdfWidth = canvas.width;
  const pdfHeight = canvas.height;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("certificate.pdf");

  resetOffsets();
};

export const generateJPEG = async (pdfOffsets?: PDFOffsets) => {
  const certificateElement = document.getElementById("certificate");
  if (!certificateElement) return;

  const resetOffsets = applyOffsets(pdfOffsets);
  await document.fonts.ready;

  const scale = 3;
  const canvas = await html2canvas(certificateElement, { scale });
  const imgData = canvas.toDataURL("image/jpeg", 1.0);

  const link = document.createElement("a");
  link.href = imgData;
  link.download = "certificate.jpeg";
  link.click();

  resetOffsets();
};
