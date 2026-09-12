import "server-only";
import puppeteer, { type Browser } from "puppeteer";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    });
  }
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
