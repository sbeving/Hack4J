import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/session";
import { dirOf } from "@/lib/domain/constants";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-ar",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const reemKufi = Reem_Kufi({
  variable: "--font-reem",
  subsets: ["arabic"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moufehma · مفاهمة — Règlement vérifié des litiges MSME",
  description:
    "Le registre neutre de règlement des litiges commerciaux pour les PME tunisiennes face aux fournisseurs (STEG, SONEDE, La Poste). Preuves vérifiées, mise en demeure, dossier scellé.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${bricolage.variable} ${plex.variable} ${plexArabic.variable} ${reemKufi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
