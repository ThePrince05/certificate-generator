// src/utils/fonts.ts
import localFont from "next/font/local";
import { Cinzel } from "next/font/google";

// 🎨 Heading Font (local Kingthings)
export const headingFont = localFont({
  src: "../../assets/fonts/Kingthings-foundation-heading.ttf",
  variable: "--font-heading",
  weight: "400",
});

// 🪶 Body Font (Google Cinzel)
export const bodyFont = Cinzel({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700"], // regular + bold
});

// ✒️ Signature Font (local Great Vibes)
export const signatureFont = localFont({
  src: "../../assets/fonts/GreatVibes-Regular-signature.ttf",
  variable: "--font-signature",
  weight: "400",
});
