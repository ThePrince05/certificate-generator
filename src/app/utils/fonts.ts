// src/utils/fonts.ts
import localFont from "next/font/local";

export const headingFont = localFont({
  src: "../../assets/fonts/Kingthings-foundation-heading.ttf",
  variable: "--font-heading",
  weight: "400",
});

export const bodyFont = localFont({
  src: [
    { path: "../../assets/fonts/cinzel.regular.ttf", weight: "400" },
    { path: "../../assets/fonts/jt-alvito-bold-body.otf", weight: "700" },
  ],
  variable: "--font-body",
});

export const signatureFont = localFont({
  src: "../../assets/fonts/GreatVibes-Regular-signature.ttf",
  variable: "--font-signature",
  weight: "400",
});
