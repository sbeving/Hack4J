import "server-only";
import puppeteer, { type Browser } from "puppeteer";

const LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"];

let browserPromise: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  try {
    return await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
  } catch (bundledError) {
    // The bundled Chromium download can be absent or incomplete (on Windows an
    // antivirus may quarantine it mid-extract). Fall back to a system Chrome
    // before failing the render.
    try {
      return await puppeteer.launch({ headless: true, args: LAUNCH_ARGS, channel: "chrome" });
    } catch {
      throw bundledError;
    }
  }
}

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    try {
      const existing = await browserPromise;
      if (existing.connected) return existing;
    } catch {
      // A cached failure (or a crashed browser) must not poison every later render.
    }
    browserPromise = null;
  }
  browserPromise = launchBrowser();
  return browserPromise;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    // Ensure embedded (data-URI) fonts are ready before printing.
    await page.evaluate(async () => {
      await (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready;
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
