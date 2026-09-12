import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/session";
import { loginAs, toggleLocale } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { ROLE_LABEL, type Role, type Locale } from "@/lib/domain/constants";
import { DemoBadge } from "@/components/ui";

const ROLE_ORDER: Role[] = ["claimant", "provider_agent", "resolver", "admin"];
const ROLE_ICON: Record<Role, string> = {
  claimant: "🧑‍🔧",
  provider_agent: "🏢",
  resolver: "⚖️",
  admin: "🛠️",
};
const ROLE_DESC: Record<Role, Record<Locale, string>> = {
  claimant: {
    fr: "Déposer et suivre une réclamation contre un fournisseur.",
    ar: "إيداع ومتابعة مطلب ضد مزوّد.",
  },
  provider_agent: {
    fr: "Traiter les réclamations reçues, dans les délais (SLA).",
    ar: "معالجة المطالب الواردة ضمن الآجال.",
  },
  resolver: {
    fr: "Recevoir les dossiers escaladés et mener la médiation.",
    ar: "استقبال الملفات المصعّدة وإدارة الوساطة.",
  },
  admin: {
    fr: "Superviser le réseau, les SLA et les statistiques.",
    ar: "الإشراف على الشبكة والآجال والإحصائيات.",
  },
};

export default async function Home() {
  const locale = await getLocale();
  const users = await prisma.user.findMany({ include: { org: true } });
  users.sort(
    (a, b) => ROLE_ORDER.indexOf(a.role as Role) - ROLE_ORDER.indexOf(b.role as Role)
  );

  return (
    <div className="flex min-h-full flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white">
        <div className="absolute end-4 top-4">
          <form action={toggleLocale}>
            <button className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25">
              {t(locale, "nav.language")}
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="text-5xl font-black">صلح</span>
            <span className="text-4xl font-bold tracking-tight">Sulha</span>
          </div>
          <p className="mx-auto max-w-2xl text-base text-indigo-100 sm:text-lg">
            {t(locale, "app.tagline")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-indigo-100">
            <DemoBadge label={t(locale, "demo.badge")} />
            <span>Hack4Justice 2026 · Challenge B</span>
          </div>
        </div>
      </div>

      {/* Demo account picker */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold">{t(locale, "demo.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t(locale, "demo.subtitle")}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {users.map((u) => {
            const role = u.role as Role;
            const name = locale === "ar" && u.nameAr ? u.nameAr : u.name;
            const org = locale === "ar" && u.org?.nameAr ? u.org.nameAr : u.org?.name;
            return (
              <form key={u.id} action={loginAs.bind(null, u.id)}>
                <button
                  type="submit"
                  className="card group flex w-full items-center gap-4 p-5 text-start transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl">
                    {ROLE_ICON[role]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {ROLE_LABEL[role][locale]}
                    </div>
                    <div className="truncate text-base font-bold">{name}</div>
                    <div className="truncate text-xs text-muted">{org}</div>
                    <div className="mt-1 text-xs text-slate-500">{ROLE_DESC[role][locale]}</div>
                  </div>
                  <div className="shrink-0 text-brand opacity-0 transition group-hover:opacity-100">
                    →
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
