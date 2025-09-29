// src/utils/fonts.ts
import localFont from "next/font/local";

export const headingFont = localFont({
  src: "../../assets/fonts/Plamieri-heading.ttf",
  variable: "--font-heading",
  weight: "400",
});

export const bodyFont = localFont({
  src: [
    { path: "../../assets/fonts/Roman-capitals-body.otf", weight: "400" },
    { path: "../../assets/fonts/Roman-capitals-body.otf", weight: "700" },
  ],
  variable: "--font-body",
});

export const signatureFont = localFont({
  src: "../../assets/fonts/America-calligraphy-signature.ttf",
  variable: "--font-signature",
  weight: "400",
});
