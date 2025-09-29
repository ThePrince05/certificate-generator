// /app/utils/generatePDF.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const generatePDF = async () => {
  const certificateElement = document.getElementById("certificate");
  if (!certificateElement) return;

  const canvas = await html2canvas(certificateElement, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save("certificate.pdf");
};

export const generateJPEG = async () => {
  const certificateElement = document.getElementById("certificate");
  if (!certificateElement) return;

  const canvas = await html2canvas(certificateElement, { scale: 2 });
  const imgData = canvas.toDataURL("image/jpeg", 1.0); // JPEG format, full quality

  const link = document.createElement("a");
  link.href = imgData;
  link.download = "certificate.jpeg";
  link.click();
};
