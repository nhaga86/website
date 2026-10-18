export interface FontPairing {
  id: string;
  label: string;
  heading: string;
  body: string;
  /** Closest built-in PDF font family for each role */
  pdfHeading: "times" | "helvetica" | "courier";
  pdfBody: "times" | "helvetica" | "courier";
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: "playfair-inter", label: "Playfair Display + Inter", heading: "Playfair Display", body: "Inter", pdfHeading: "times", pdfBody: "helvetica" },
  { id: "dmserif-dmsans", label: "DM Serif Display + DM Sans", heading: "DM Serif Display", body: "DM Sans", pdfHeading: "times", pdfBody: "helvetica" },
  { id: "montserrat-opensans", label: "Montserrat + Open Sans", heading: "Montserrat", body: "Open Sans", pdfHeading: "helvetica", pdfBody: "helvetica" },
  { id: "lora-sourcesans", label: "Lora + Source Sans 3", heading: "Lora", body: "Source Sans 3", pdfHeading: "times", pdfBody: "helvetica" },
  { id: "poppins-nunito", label: "Poppins + Nunito", heading: "Poppins", body: "Nunito", pdfHeading: "helvetica", pdfBody: "helvetica" },
  { id: "cormorant-karla", label: "Cormorant Garamond + Karla", heading: "Cormorant Garamond", body: "Karla", pdfHeading: "times", pdfBody: "helvetica" },
  { id: "spacegrotesk-inter", label: "Space Grotesk + Inter", heading: "Space Grotesk", body: "Inter", pdfHeading: "helvetica", pdfBody: "helvetica" },
  { id: "librebaskerville-lato", label: "Libre Baskerville + Lato", heading: "Libre Baskerville", body: "Lato", pdfHeading: "times", pdfBody: "helvetica" },
  { id: "archivo-merriweather", label: "Archivo Black + Merriweather", heading: "Archivo Black", body: "Merriweather", pdfHeading: "helvetica", pdfBody: "times" },
  { id: "fraunces-worksans", label: "Fraunces + Work Sans", heading: "Fraunces", body: "Work Sans", pdfHeading: "times", pdfBody: "helvetica" },
];

export function getFontPairing(id: string | null | undefined): FontPairing {
  return FONT_PAIRINGS.find((f) => f.id === id) ?? FONT_PAIRINGS[0];
}

const SINGLE_WEIGHT = new Set(["DM Serif Display", "Archivo Black"]);

export function googleFontsHref(pairing: FontPairing) {
  const fam = (name: string) => `family=${name.replace(/ /g, "+")}${SINGLE_WEIGHT.has(name) ? "" : ":wght@400;700"}`;
  const families = pairing.heading === pairing.body ? [fam(pairing.heading)] : [fam(pairing.heading), fam(pairing.body)];
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
