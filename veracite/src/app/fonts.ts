import { Archivo, Literata, Martian_Mono, Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";

// Concept A · Watermark Vault
export const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
export const literata = Literata({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-literata", display: "swap" });
export const martian = Martian_Mono({ subsets: ["latin"], variable: "--font-martian", display: "swap" });

// Concept B · Neural Crew
export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
export const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const fontVariables = [archivo, literata, martian, bricolage, instrument, plexMono].map((f) => f.variable).join(" ");
