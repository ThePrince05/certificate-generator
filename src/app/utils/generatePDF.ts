// /app/utils/generatePDF.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PDFOffsets {
  organization?: number;
  programName?: number;
  achievementText?: number;
  recipientName?: number;
  certificateDate?: number;
  signature?: number;
  signatory?: number;
}

/**
 * Map logical offset keys (what you pass into generatePDF)
 * to actual element IDs in the DOM.
 */
const ID_MAP: Record<keyof PDFOffsets, string> = {
  organization: "organization-text",
  programName: "programName-text",
  achievementText: "achievement-text",
  recipientName: "recipientName-text",
  certificateDate: "certificateDate-text",
  signature: "signature-text",
  signatory: "signatory-text",
};

/** Wait until all images inside `el` are loaded (or errored). */
const waitForImages = (el: HTMLElement) => {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) return res();
          img.addEventListener("load", () => res());
          img.addEventListener("error", () => res());
        })
    )
  );
};

/**
 * Build a record of original top positions for each logical key
 * based on the live certificate (before cloning).
 */
const captureOriginalPositions = (certificateEl: HTMLElement) => {
  const positions: Record<string, number> = {};
  (Object.keys(ID_MAP) as Array<keyof PDFOffsets>).forEach((key) => {
    const el = certificateEl.querySelector<HTMLElement>(`#${ID_MAP[key]}`);
    positions[key] = el ? el.offsetTop : 0;
  });
  return positions;
};

/**
 * Apply offsets on the clone using the previously captured original positions.
 * Returns a cleanup function that restores original inline style.top values on the clone.
 */
const applyOffsetsOnClone = (
  clone: HTMLElement,
  originalPositions: Record<string, number>,
  offsets?: PDFOffsets
) => {
  if (!offsets) return () => {};

  const resetFns: (() => void)[] = [];

  (Object.keys(ID_MAP) as Array<keyof PDFOffsets>).forEach((key) => {
    const offset = offsets[key];
    if (offset == null) return;

    const id = ID_MAP[key];
    const el = clone.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;

    // Save old inline top so we can restore it later.
    const oldTop = el.style.top ?? "";
    const baseTop = originalPositions[key] ?? 0;

    el.style.top = `${baseTop + offset}px`;
    resetFns.push(() => (el.style.top = oldTop));
  });

  return () => resetFns.forEach((fn) => fn());
};

/**
 * Create an offscreen clone of the certificate element and return it.
 * The clone will have the same width as the original so absolute-positioning inside it behaves the same.
 */
const createOffscreenClone = (certificateEl: HTMLElement) => {
  const clone = certificateEl.cloneNode(true) as HTMLElement;

  // Make sure the clone has the same dimensions and is taken out of layout flow.
  clone.style.position = "absolute";
  clone.style.top = "-99999px";
  clone.style.left = "-99999px";
  clone.style.width = `${certificateEl.offsetWidth}px`;
  // Let height be auto (can be taller if fonts change), but setting explicit helps consistency
  clone.style.height = `${certificateEl.offsetHeight}px`;
  clone.style.overflow = "visible";

  document.body.appendChild(clone);
  return clone;
};

/**
 * Generate PDF from the certificate (preview is not affected).
 * Pass offsets using keys like { organization: -28, programName: -14, ... }.
 */
export const generatePDF = async (pdfOffsets?: PDFOffsets) => {
  const certificateElement = document.getElementById("certificate") as HTMLElement | null;
  if (!certificateElement) return;

  // 1) Capture original positions (on-screen) BEFORE cloning
  const originalPositions = captureOriginalPositions(certificateElement);

  // 2) Clone offscreen
  const clone = createOffscreenClone(certificateElement);

  try {
    // 3) Wait for fonts & images to be ready inside clone so layout matches preview
    await document.fonts.ready;
    await waitForImages(clone);

    // 4) Apply offsets on clone using original positions
    const resetOffsets = applyOffsetsOnClone(clone, originalPositions, pdfOffsets);

    // 5) Force a paint so the clone's styles are applied (safety)
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // 6) Use html2canvas to render the clone
    const scale = 2;
    const canvas = await html2canvas(clone, { scale, useCORS: true });

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

    // 7) cleanup applied offsets
    resetOffsets();
  } catch (err) {
    // If something goes wrong, still try to remove the clone
    console.error("Error generating PDF:", err);
  } finally {
    clone.remove();
  }
};

/**
 * Generate a JPEG from certificate (preview is not affected).
 */
export const generateJPEG = async (pdfOffsets?: PDFOffsets) => {
  const certificateElement = document.getElementById("certificate") as HTMLElement | null;
  if (!certificateElement) return;

  const originalPositions = captureOriginalPositions(certificateElement);
  const clone = createOffscreenClone(certificateElement);

  try {
    await document.fonts.ready;
    await waitForImages(clone);

    const resetOffsets = applyOffsetsOnClone(clone, originalPositions, pdfOffsets);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const scale = 2;
    const canvas = await html2canvas(clone, { scale, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const link = document.createElement("a");
    link.href = imgData;
    link.download = "certificate.jpeg";
    link.click();

    resetOffsets();
  } catch (err) {
    console.error("Error generating JPEG:", err);
  } finally {
    clone.remove();
  }
};
