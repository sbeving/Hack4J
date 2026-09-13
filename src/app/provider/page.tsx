import Link from "next/link";
import { requireRole, getLocale } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Card, StatTile, Badge, cn } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { SlaCountdown } from "@/components/SlaCountdown";
import { formatMillimes } from "@/lib/money";
import {
  CLAIM_TYPE_LABEL,
  STATE_LABEL,
  PRIORITY_LABEL,
  label,
  type CaseState,
  type ClaimType,
  type Priority,
  type Locale,
} from "@/lib/domain/constants";

// ── Classification buckets (Jira-style swimlanes) ────────────────────────────
const BUCKETS = {
  todo: ["filed", "notice_sent", "provider_review"],
  negotiation: ["resolution_proposed", "resolution_agreed"],
  escalated: ["escalation_pending", "dossier_filed", "in_mediation", "settlement_pending"],
  done: ["resolved", "settled", "closed_unsettled", "withdrawn"],
} as const;
type Bucket = keyof typeof BUCKETS;

const BUCKET_LABEL: Record<Bucket, Record<Locale, string>> = {
  todo: { fr: "À traiter", ar: "للمعالجة" },
  negotiation: { fr: "En négociation", ar: "قيد التفاوض" },
  escalated: { fr: "Escaladé", ar: "مُصعّد" },
  done: { fr: "Réglé", ar: "مُسوّى" },
};
const BUCKET_BAR: Record<Bucket, string> = {
  todo: "bg-primary",
  negotiation: "bg-gold",
  escalated: "bg-cobalt",
  done: "bg-success",
};
function bucketOf(s: string): Bucket {
  return (Object.keys(BUCKETS) as Bucket[]).find((b) => (BUCKETS[b] as readonly string[]).includes(s)) ?? "todo";
}

const SLA_STATES: CaseState[] = ["notice_sent", "provider_review", "resolution_proposed"];
const OPEN_STATES = [...BUCKETS.todo, ...BUCKETS.negotiation, ...BUCKETS.escalated] as readonly string[];

// Per-type classification tag colors.
const TYPE_ICON: Record<ClaimType, IconName> = {
  billing_error: "braces",
  service_interruption: "tower",
  delivery_failure: "dossier",
  deposit_refund: "anchor",
  service_damage: "alert",
};
const TYPE_TAG: Record<ClaimType, string> = {
  billing_error: "bg-warning-tint text-warning-deep",
  service_interruption: "bg-cobalt-tint text-cobalt",
  delivery_failure: "bg-primary-tint text-primary-deep",
  deposit_refund: "bg-success-tint text-success",
  service_damage: "bg-danger-tint text-seal",
};

function stateTone(s: CaseState) {
  if (s === "resolved" || s === "settled") return "success" as const;
  if (s === "closed_unsettled" || s === "withdrawn") return "danger" as const;
  if (s === "escalation_pending" || s === "dossier_filed" || s === "in_mediation" || s === "settlement_pending")
    return "cobalt" as const;
  if (s === "resolution_proposed" || s === "resolution_agreed") return "warning" as const;
  if (s === "filed") return "neutral" as const;
  return "brand" as const;
}

const PRIORITY_TONE: Record<Priority, "danger" | "warning" | "neutral"> = {
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  low: "neutral",
};

function relDate(from: Date, now: number, isAr: boolean): string {
  const d = Math.max(0, Math.floor((now - from.getTime()) / 86400000));
  if (d === 0) return isAr ? "اليوم" : "auj.";
  if (d === 1) return isAr ? "أمس" : "hier";
  if (d < 30) return isAr ? `منذ ${d} ي` : `il y a ${d} j`;
  const m = Math.floor(d / 30);
  return isAr ? `منذ ${m} ش` : `il y a ${m} mois`;
}

const PAGE_SIZE = 8;

export default async function ProviderHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string; q?: string }>;
}) {
  const user = await requireRole("provider_agent");
  const locale = await getLocale();
  const isAr = locale === "ar";
  const sp = await searchParams;
  const now = Date.now();
  const serverNowISO = new Date().toISOString();

  const activeBucket = (["todo", "negotiation", "escalated", "done"] as string[]).includes(sp.status ?? "")
    ? (sp.status as Bucket)
    : "all";
  const activeType = sp.type && sp.type in CLAIM_TYPE_LABEL ? (sp.type as ClaimType) : null;
  const q = (sp.q ?? "").trim();
  const qLower = q.toLowerCase();

  const all = await prisma.case.findMany({
    where: { providerOrgId: user.orgId ?? "" },
    orderBy: { updatedAt: "desc" }, // latest first
    include: { claimantUser: { include: { org: true } }, evidence: { select: { id: true } } },
  });

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const counts: Record<Bucket, number> = { todo: 0, negotiation: 0, escalated: 0, done: 0 };
  let slaRisk = 0;
  for (const c of all) {
    counts[bucketOf(c.state)]++;
    if (OPEN_STATES.includes(c.state) && c.slaDueAt) {
      const hrs = (new Date(c.slaDueAt).getTime() - now) / 3600000;
      if (hrs < 24) slaRisk++;
    }
  }
  const total = all.length;

  // ── Filter + paginate ───────────────────────────────────────────────────────
  const filtered = all.filter((c) => {
    if (activeBucket !== "all" && bucketOf(c.state) !== activeBucket) return false;
    if (activeType && c.claimType !== activeType) return false;
    if (qLower) {
      const ctl = CLAIM_TYPE_LABEL[c.claimType as ClaimType];
      const hay = [
        c.caseNumber,
        c.claimantUser.org?.name ?? "",
        c.claimantUser.org?.nameAr ?? "",
        ctl?.fr ?? "",
        ctl?.ar ?? "",
        c.reference ?? "",
        c.narrative ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(qLower)) return false;
    }
    return true;
  });
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clamped = Math.min(page, pageCount);
  const rows = filtered.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const status = patch.status ?? (activeBucket === "all" ? undefined : activeBucket);
    const type = "type" in patch ? patch.type : (activeType ?? undefined);
    const query = "q" in patch ? patch.q : (q || undefined);
    const pg = patch.page;
    if (status) p.set("status", status);
    if (type) p.set("type", type);
    if (query) p.set("q", query);
    if (pg && pg !== "1") p.set("page", pg);
    const s = p.toString();
    return s ? `/provider?${s}` : "/provider";
  };

  const KPIS: { label: string; value: number; tone: "brand" | "cobalt" | "warning" | "success" | "neutral"; icon: IconName }[] = [
    { label: isAr ? "إجمالي التذاكر" : "Tickets", value: total, tone: "neutral", icon: "dossier" },
    { label: BUCKET_LABEL.todo[locale], value: counts.todo, tone: "brand", icon: "stamp" },
    { label: BUCKET_LABEL.escalated[locale], value: counts.escalated, tone: "cobalt", icon: "scales" },
    { label: isAr ? "أجل على وشك الانتهاء" : "SLA à risque", value: slaRisk, tone: "warning", icon: "clock" },
    { label: BUCKET_LABEL.done[locale], value: counts.done, tone: "success", icon: "check" },
  ];

  const TABS: { key: string; label: string; count: number }[] = [
    { key: "all", label: isAr ? "الكل" : "Tous", count: total },
    { key: "todo", label: BUCKET_LABEL.todo[locale], count: counts.todo },
    { key: "negotiation", label: BUCKET_LABEL.negotiation[locale], count: counts.negotiation },
    { key: "escalated", label: BUCKET_LABEL.escalated[locale], count: counts.escalated },
    { key: "done", label: BUCKET_LABEL.done[locale], count: counts.done },
  ];

  return (
    <AppShell user={user} locale={locale}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">
            {isAr ? "لوحة القيادة" : "Tableau de bord"}
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            {isAr ? "تذاكر المطالب الواردة وحالة معالجتها." : "Tickets de réclamations et leur traitement."}
          </p>
        </div>
        <Badge tone="brand" dot>
          {isAr ? "مكتب المزوّد" : "Guichet fournisseur"}
        </Badge>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KPIS.map((k) => (
          <StatTile key={k.label} value={String(k.value)} label={k.label} tone={k.tone} icon={k.icon} />
        ))}
      </div>

      {/* Status distribution bar */}
      {total > 0 ? (
        <Card className="mt-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">{isAr ? "توزيع الحالات" : "Répartition par statut"}</span>
            <span className="text-xs text-ink-muted">{total} {isAr ? "تذكرة" : "tickets"}</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sand">
            {(Object.keys(BUCKETS) as Bucket[]).map((b) =>
              counts[b] ? (
                <div key={b} className={cn(BUCKET_BAR[b])} style={{ width: `${(counts[b] / total) * 100}%` }} title={BUCKET_LABEL[b][locale]} />
              ) : null
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {(Object.keys(BUCKETS) as Bucket[]).map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                <span className={cn("dot", BUCKET_BAR[b])} />
                {BUCKET_LABEL[b][locale]} <span className="font-semibold text-ink">{counts[b]}</span>
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Search */}
      <form action="/provider" className="mt-6">
        {activeBucket !== "all" ? <input type="hidden" name="status" value={activeBucket} /> : null}
        {activeType ? <input type="hidden" name="type" value={activeType} /> : null}
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-ink-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            dir="auto"
            placeholder={isAr ? "ابحث عن تذكرة (مرجع، مؤسسة، نوع…)" : "Rechercher un ticket (clé, réclamant, type…)"}
            aria-label={isAr ? "بحث عن تذكرة" : "Rechercher un ticket"}
            className="w-full rounded-lg border border-border bg-surface py-2.5 ps-10 pe-9 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
          />
          {q ? (
            <Link
              href={qs({ q: undefined, page: "1" })}
              aria-label={isAr ? "مسح البحث" : "Effacer la recherche"}
              className="absolute inset-y-0 end-2 grid place-items-center text-ink-muted hover:text-ink"
            >
              <Icon name="close" size={15} />
            </Link>
          ) : null}
        </div>
      </form>

      {/* Classification tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const on = activeBucket === t.key || (t.key === "all" && activeBucket === "all");
          return (
            <Link
              key={t.key}
              href={qs({ status: t.key === "all" ? undefined : t.key, page: "1" })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                on ? "border-primary bg-primary-tint text-primary-deep" : "border-border bg-surface text-ink-muted hover:bg-surface-sand"
              )}
            >
              {t.label}
              <span className={cn("rounded px-1.5 text-xs font-semibold", on ? "bg-primary text-surface" : "bg-surface-sand text-ink-muted")}>
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Type classification chips */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-ink-muted">{isAr ? "النوع:" : "Type :"}</span>
        <Link
          href={qs({ type: undefined, page: "1" })}
          className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-colors", !activeType ? "bg-ink text-surface" : "bg-surface-sand text-ink-muted hover:text-ink")}
        >
          {isAr ? "الكل" : "Tous"}
        </Link>
        {(Object.keys(CLAIM_TYPE_LABEL) as ClaimType[]).map((ct) => (
          <Link
            key={ct}
            href={qs({ type: activeType === ct ? undefined : ct, page: "1" })}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
              activeType === ct ? TYPE_TAG[ct] : "bg-surface-sand text-ink-muted hover:text-ink"
            )}
          >
            <Icon name={TYPE_ICON[ct]} size={12} />
            {CLAIM_TYPE_LABEL[ct][locale]}
          </Link>
        ))}
      </div>

      {/* Ticket table */}
      <Card className="mt-3 overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            {isAr ? "لا توجد تذاكر مطابقة." : "Aucun ticket correspondant."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-ink-muted">
                  <th className="px-4 py-2.5 text-start font-medium">{isAr ? "المرجع" : "Clé"}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{isAr ? "النوع" : "Type"}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{isAr ? "المشتكي" : "Réclamant"}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{isAr ? "الأولوية" : "Priorité"}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{isAr ? "الحالة" : "Statut"}</th>
                  <th className="px-4 py-2.5 text-start font-medium">SLA</th>
                  <th className="px-4 py-2.5 text-end font-medium">{isAr ? "المبلغ" : "Montant"}</th>
                  <th className="px-4 py-2.5 text-end font-medium">{isAr ? "آخر تحديث" : "MàJ"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const state = c.state as CaseState;
                  const ct = c.claimType as ClaimType;
                  const prio = c.priority as Priority;
                  const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;
                  return (
                    <tr key={c.id} className="group border-b border-border/60 last:border-0 transition-colors hover:bg-surface-sand/50">
                      <td className="px-4 py-3">
                        <Link href={`/provider/cases/${c.id}`} className="font-semibold text-ink group-hover:text-primary">
                          {c.caseNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", TYPE_TAG[ct])}>
                          <Icon name={TYPE_ICON[ct]} size={12} />
                          {label(CLAIM_TYPE_LABEL, c.claimType, locale)}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-ink">{business}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                          <span
                            className={cn(
                              "dot",
                              PRIORITY_TONE[prio] === "danger" ? "bg-seal" : PRIORITY_TONE[prio] === "warning" ? "bg-warning" : "bg-ink-muted/50"
                            )}
                          />
                          {label(PRIORITY_LABEL, c.priority, locale)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={stateTone(state)}>{label(STATE_LABEL, c.state, locale)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {c.slaDueAt && SLA_STATES.includes(state) ? (
                          <SlaCountdown dueAtISO={new Date(c.slaDueAt).toISOString()} serverNowISO={serverNowISO} locale={locale} />
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end font-semibold text-ink">{formatMillimes(c.amountMillimes, locale)}</td>
                      <td className="px-4 py-3 text-end text-xs text-ink-muted">{relDate(c.updatedAt, now, isAr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-muted">
            {isAr
              ? `${(clamped - 1) * PAGE_SIZE + 1}–${Math.min(clamped * PAGE_SIZE, filtered.length)} من ${filtered.length}`
              : `${(clamped - 1) * PAGE_SIZE + 1}–${Math.min(clamped * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
          </span>
          <div className="flex items-center gap-2">
            {clamped > 1 ? (
              <Link href={qs({ page: String(clamped - 1) })} className="inline-flex items-center gap-1 rounded-lg border border-border-strong bg-surface px-3 py-1.5 font-medium text-ink hover:bg-surface-sand">
                <Icon name="chevron" size={15} className="rotate-180 rtl:rotate-0" />
                {isAr ? "السابق" : "Préc."}
              </Link>
            ) : null}
            <span className="text-xs text-ink-muted">{isAr ? `صفحة ${clamped}/${pageCount}` : `Page ${clamped} / ${pageCount}`}</span>
            {clamped < pageCount ? (
              <Link href={qs({ page: String(clamped + 1) })} className="inline-flex items-center gap-1 rounded-lg border border-border-strong bg-surface px-3 py-1.5 font-medium text-ink hover:bg-surface-sand">
                {isAr ? "التالي" : "Suiv."}
                <Icon name="chevron" size={15} className="rtl:rotate-180" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
