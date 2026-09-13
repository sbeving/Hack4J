import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/session";
import { loginAs, toggleLocale } from "@/lib/actions";
import { ROLE_LABEL, type Role, type Locale } from "@/lib/domain/constants";
import { Icon, type IconName } from "@/components/Icon";
import { Wordmark } from "@/components/brand/Wordmark";
import { Seal } from "@/components/brand/Seal";
import { KhatamField } from "@/components/brand/Khatam";
import { Badge } from "@/components/ui";

const ROLE_ORDER: Role[] = ["claimant", "provider_agent", "resolver", "admin"];
const ROLE_ICON: Record<Role, IconName> = {
  claimant: "workshop",
  provider_agent: "tower",
  resolver: "scales",
  admin: "network",
};
const ROLE_DESC: Record<Role, Record<Locale, string>> = {
  claimant: { fr: "Déposer et suivre un litige contre un fournisseur.", ar: "إيداع ومتابعة نزاع ضدّ مزوّد." },
  provider_agent: { fr: "Traiter les réclamations reçues dans les délais.", ar: "معالجة المطالب الواردة ضمن الآجال." },
  resolver: { fr: "Recevoir les dossiers escaladés et médier.", ar: "استقبال الملفّات المصعّدة وإدارة الوساطة." },
  admin: { fr: "Superviser le réseau et le bénéfice institutionnel.", ar: "الإشراف على الشبكة والمنفعة المؤسّسية." },
};

const FLOW: { icon: IconName; fr: string; ar: string }[] = [
  { icon: "document", fr: "Déposer", ar: "الإيداع" },
  { icon: "stamp", fr: "Mise en demeure", ar: "الإنذار" },
  { icon: "clock", fr: "Délai fournisseur", ar: "أجل المزوّد" },
  { icon: "scales", fr: "Médiation neutre", ar: "الوساطة" },
  { icon: "shield", fr: "Dossier scellé", ar: "ملفّ مختوم" },
];

function DocumentArtifact({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <div className="overlay relative w-full max-w-[380px] p-6" dir="ltr">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg font-bold text-ink">Mise en demeure</div>
          <div className="mt-0.5 text-xs text-ink-muted">Réf. SLH-2026-0912</div>
        </div>
        <Seal size={44} />
      </div>
      <div className="gold-rule my-3.5" />
      <div className="space-y-2.5 text-[13px] leading-relaxed text-ink-muted">
        <p>
          À l&apos;attention du représentant légal de <span className="font-semibold text-ink">STEG</span> —
        </p>
        <div className="h-2 rounded bg-surface-sand" />
        <div className="h-2 w-11/12 rounded bg-surface-sand" />
        <div className="h-2 w-4/6 rounded bg-surface-sand" />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-tint px-3.5 py-2.5">
        <span className="text-sm font-medium text-primary-deep">Montant contesté</span>
        <span className="font-display text-base font-bold text-primary-deep">900,000 TND</span>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-ink-muted">
        <Icon name="anchor" size={14} className="text-primary" />
        <span>keccak256</span>
        <span className="font-medium text-ink">0x9f2c…a7e1</span>
        <Badge tone="success" dot className="ms-auto">
          {isAr ? "مختوم" : "scellé"}
        </Badge>
      </div>
    </div>
  );
}

export default async function Home() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const users = await prisma.user.findMany({
    where: { id: { in: ["user-amira", "user-sami", "user-karim", "user-admin"] } },
    include: { org: true },
  });
  users.sort((a, b) => ROLE_ORDER.indexOf(a.role as Role) - ROLE_ORDER.indexOf(b.role as Role));

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Wordmark size={34} />
        <form action={toggleLocale}>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-sand">
            <Icon name="globe" size={15} />
            {isAr ? "Français" : "العربية"}
          </button>
        </form>
      </header>

      {/* Hero — the letterhead */}
      <section className="relative overflow-hidden border-b border-border">
        <KhatamField id="hero" className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" opacity={0.045} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[13px] font-medium text-ink-muted ring-1 ring-border">
              <span className="dot bg-seal" />
              {isAr ? "الشبكة المحايدة للتسوية" : "Réseau neutre de règlement"}
            </span>
            <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[3.1rem]">
              {isAr ? "نزاع مؤسّستك، محسوم على السجلّ." : "Le litige de votre PME, réglé sur le registre."}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-muted">
              {isAr
                ? "اعترض على STEG أو SONEDE أو البريد دون محامٍ: أدلّة موثّقة، إنذار آلي، وساطة محايدة — وملفّ مختوم يمكن التحقّق منه ببصمة."
                : "Contestez STEG, SONEDE ou La Poste sans avocat : preuves vérifiées, mise en demeure automatique, médiation neutre — et un dossier scellé, vérifiable par empreinte."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#roles"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
              >
                {isAr ? "ابدأ العرض" : "Voir la démonstration"}
                <Icon name="arrow" size={17} className="rtl:-scale-x-100" />
              </Link>
              <Link
                href="#flow"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-sand"
              >
                {isAr ? "كيف يعمل" : "Le déroulé"}
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
              <span>{isAr ? "مصمَّم لـ" : "Conçu pour"}</span>
              <span className="font-semibold text-ink">STEG</span>
              <span className="font-semibold text-ink">SONEDE</span>
              <span className="font-semibold text-ink">La Poste</span>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <DocumentArtifact locale={locale} />
          </div>
        </div>
      </section>

      {/* Flow — a real lifecycle sequence */}
      <section id="flow" className="border-b border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {FLOW.map((step, i) => (
              <li key={step.icon} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-primary">
                  <Icon name={step.icon} size={20} />
                </span>
                <div>
                  <div className="text-xs text-ink-muted">{String(i + 1).padStart(2, "0")}</div>
                  <div className="text-sm font-semibold text-ink">{isAr ? step.ar : step.fr}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Demo picker */}
      <section id="roles" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            {isAr ? "اختر دورًا للعرض" : "Choisissez un rôle de démonstration"}
          </h2>
          <p className="mt-2 text-[15px] text-ink-muted">
            {isAr
              ? "كل حساب يفتح مساحة عمل حقيقية مع تحقّق فعلي من الصلاحيات."
              : "Chaque compte ouvre un espace de travail réel, avec de vraies vérifications d'accès."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {users.map((u) => {
            const role = u.role as Role;
            const name = isAr && u.nameAr ? u.nameAr : u.name;
            const org = isAr && u.org?.nameAr ? u.org.nameAr : u.org?.name;
            return (
              <form key={u.id} action={loginAs.bind(null, u.id)}>
                <button
                  type="submit"
                  className="card group flex w-full items-center gap-4 p-5 text-start transition-all hover:border-primary hover:shadow-[var(--elev-overlay)]"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary-deep">
                    <Icon name={ROLE_ICON[role]} size={24} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-primary">{ROLE_LABEL[role][locale]}</div>
                    <div className="truncate text-base font-bold text-ink">{name}</div>
                    <div className="truncate text-sm text-ink-muted">{org}</div>
                    <div className="mt-1 text-[13px] text-ink-muted">{ROLE_DESC[role][locale]}</div>
                  </div>
                  <Icon
                    name="chevron"
                    size={20}
                    className="text-ink-muted transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
                  />
                </button>
              </form>
            );
          })}
        </div>
      </section>

      {/* Footer — the legitimacy lockup */}
      <footer className="border-t border-border bg-surface-sand">
        <div className="gold-rule" />
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3 md:px-8">
          <div>
            <Wordmark size={30} />
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              {isAr
                ? "الشبكة المحايدة لتسوية النزاعات التجارية للمؤسسات الصغرى والمتوسطة التونسية."
                : "Le réseau neutre de règlement des litiges commerciaux pour les PME tunisiennes."}
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">{isAr ? "مربوط بـ" : "Ancré chez"}</div>
            <ul className="mt-2 space-y-1 text-sm text-ink-muted">
              <li>STEG — Électricité & Gaz</li>
              <li>SONEDE — Eaux</li>
              <li>La Poste Tunisienne</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">{isAr ? "السجلّ" : "Le registre"}</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm text-ink-muted ring-1 ring-border">
              <Icon name="shield" size={16} className="text-primary" />
              {isAr ? "موثّق ببصمة keccak256" : "vérifié par empreinte keccak256"}
            </div>
            <p className="mt-3 text-xs text-ink-muted">Hack4Justice 2026 · Challenge B · {isAr ? "بيانات عرض" : "données de démonstration"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
