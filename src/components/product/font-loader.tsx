import { getFontPairing, googleFontsHref } from "@/lib/fonts";

/** Loads the Google Fonts for a pairing. Works in server and client components. */
export function FontLoader({ fontId }: { fontId: string }) {
  const pairing = getFontPairing(fontId);
  // eslint-disable-next-line @next/next/no-page-custom-font
  return <link rel="stylesheet" href={googleFontsHref(pairing)} />;
}
