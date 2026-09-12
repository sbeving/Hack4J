import "server-only";
import fs from "fs";
import path from "path";

// Embed fonts as data URIs so PDFs render identically on any machine
// (the Windows teammate included), independent of system fonts.
function readB64(rel: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "node_modules/@fontsource", rel)).toString("base64");
  } catch {
    return null;
  }
}

let cached: string | null = null;

export function fontFaceCss(): string {
  if (cached !== null) return cached;
  const faces: string[] = [];
  const add = (family: string, weight: number, rel: string) => {
    const data = readB64(rel);
    if (data) {
      faces.push(
        `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');}`
      );
    }
  };
  add("Noto Serif", 400, "noto-serif/files/noto-serif-latin-400-normal.woff2");
  add("Noto Serif", 700, "noto-serif/files/noto-serif-latin-700-normal.woff2");
  add("Noto Sans Arabic", 400, "noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2");
  add("Noto Sans Arabic", 700, "noto-sans-arabic/files/noto-sans-arabic-arabic-700-normal.woff2");
  cached = faces.join("\n");
  return cached;
}
