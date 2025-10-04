// /app/utils/generatePDF.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PDFOffsets {
  heading?: number;
  subheading?: number;
  pak?: number;
  name?: number;
  nameLetter?: number; // ✅ NEW offset for small letters
  date?: number;
  signature?: number;
  signatory?: number;
}

const applyOffsets = (offsets?: PDFOffsets) => {
  if (!offsets) return () => {};

  const originalPositions: Record<string, string> = {};
  const originalTransforms: string[] = [];

  const apply = (id: string, offset?: number) => {
    const el = document.getElementById(id);
    if (el && offset) {
      originalPositions[id] = el.style.top; // save original top
      const currentTop = parseInt(el.style.top || "0", 10);
      el.style.top = `${currentTop + offset}px`;
    }
  };

  apply("heading-text", offsets.heading);
  apply("subheading-text", offsets.subheading);
  apply("pak-text", offsets.pak);
  apply("name-text", offsets.name);
  apply("date-text", offsets.date);
  apply("signature-text", offsets.signature);
  apply("signatory-text", offsets.signatory);

  // ✅ Handle individual letter offset (for name small letters)
  if (offsets.nameLetter) {
    const letterSpans = document.querySelectorAll("#name-text span:nth-child(2)");
    letterSpans.forEach((span, i) => {
      const el = span as HTMLElement;
      originalTransforms[i] = el.style.transform;
      const currentY = parseInt(
        el.style.transform.replace(/[^-0-9]/g, "") || "0",
        10
      );
     el.style.transform = `translateY(${currentY + (offsets.nameLetter ?? 0)}px)`;
    });
  }

  // return reset function
  return () => {
    // restore top positions
    for (const id in originalPositions) {
      const el = document.getElementById(id);
      if (el) el.style.top = originalPositions[id];
    }

    // restore name letter transforms
    if (offsets.nameLetter) {
      const letterSpans = document.querySelectorAll("#name-text span:nth-child(2)");
      letterSpans.forEach((span, i) => {
        const el = span as HTMLElement;
        el.style.transform = originalTransforms[i] || "";
      });
    }
  };
};

export const generatePDF = async (pdfOffsets?: PDFOffsets) => {
  const certificateElement = document.getElementById("certificate");
  if (!certificateElement) return;

  const resetOffsets = applyOffsets(pdfOffsets);

  await document.fonts.ready;

  const scale = 2;
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

  resetOffsets(); // restore original positions
};

export const generateJPEG = async (pdfOffsets?: PDFOffsets) => {
  const certificateElement = document.getElementById("certificate");
  if (!certificateElement) return;

  const resetOffsets = applyOffsets(pdfOffsets);

  await document.fonts.ready;

  const scale = 2;
  const canvas = await html2canvas(certificateElement, { scale });
  const imgData = canvas.toDataURL("image/jpeg", 1.0); // full quality JPEG

  const link = document.createElement("a");
  link.href = imgData;
  link.download = "certificate.jpeg";
  link.click();

  resetOffsets(); // restore original positions
};
