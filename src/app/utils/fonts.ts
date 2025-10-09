// src/utils/fonts.ts
import localFont from "next/font/local";
import { Cinzel } from "next/font/google";

// 🎨 Heading Font (local Kingthings)
export const headingFont = localFont({
  src: "../../assets/fonts/Kingthings-foundation-heading.ttf",
  variable: "--font-heading",
  weight: "400",
  style: "normal",
  display: "swap",
});


// 🪶 Body Font (Google Cinzel)
export const bodyFont = Cinzel({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700"], // regular + bold
});

