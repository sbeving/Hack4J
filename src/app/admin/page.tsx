import { requireRole, getLocale } from "@/lib/session";
import { getNetworkAnalytics } from "@/lib/domain/analytics";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card, Badge, SectionHead } from "@/components/ui";
import { CLAIM_TYPE_LABEL, label } from "@/lib/domain/constants";

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

function Stat({ value, labelText, tone }: { value: string; labelText: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className={`text-2xl font-display font-black ${tone ?? "text-ink"}`}>{value}</div>
      <div className="mt-1 text-xs text-ink-muted">{labelText}</div>
    </Card>
  );
}

function BarRow({ name, count, max }: { name: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-ink-muted">{name}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-sand">
        <div className="h-full rounded-full bg-primary" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
      </div>
      <span className="w-8 text-end font-semibold text-ink">{count}</span>
    </div>
  );
}

export default async function AdminHome() {
  const user = await requireRole("admin");
  const locale = await getLocale();
  const isAr = locale === "ar";
  const a = await getNetworkAnalytics();

  const maxType = Math.max(1, ...a.byType.map((t) => t.count));
  const maxProv = Math.max(1, ...a.byProvider.map((p) => p.count));

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        icon="network"
        title={isAr ? "الإشراف على الشبكة" : "Supervision du réseau"}
        subtitle={isAr ? "الحجم، الآجال، والمنفعة للمؤسسات." : "Volume, délais et bénéfice institutionnel."}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat value={String(a.total)} labelText={isAr ? "مطالب" : "Réclamations"} />
        <Stat value={String(a.resolvedCount + a.settledCount)} labelText={isAr ? "تمّت تسويتها" : "Réglées"} tone="text-success" />
        <Stat value={String(a.escalatedCount)} labelText={isAr ? "مصعّدة" : "Escaladées"} tone="text-warning" />
        <Stat value={a.avgResolutionDays.toFixed(1) + (isAr ? " ي" : " j")} labelText={isAr ? "متوسّط المعالجة" : "Délai moyen"} />
        <Stat value={pct(a.slaCompliance)} labelText={isAr ? "احترام الأجل" : "Respect SLA"} tone="text-primary" />
        <Stat value={pct(a.preEscalationRate)} labelText={isAr ? "حلّ قبل التصعيد" : "Résolu pré-escalade"} tone="text-primary" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHead className="mb-4">{isAr ? "حسب النوع" : "Par type de litige"}</SectionHead>
          <div className="space-y-3">
            {a.byType.map((t) => (
              <BarRow key={t.key} name={label(CLAIM_TYPE_LABEL, t.key, locale)} count={t.count} max={maxType} />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionHead className="mb-4">{isAr ? "حسب المزوّد" : "Par fournisseur"}</SectionHead>
          <div className="space-y-3">
            {a.byProvider.map((p) => (
              <BarRow key={p.name} name={p.name} count={p.count} max={maxProv} />
            ))}
          </div>
        </Card>
      </div>

      {/* Agency Benefit — the pitch centerpiece */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface-sand p-6">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-ink">{isAr ? "المنفعة للمؤسسة (Agency Benefit)" : "The Agency Benefit"}</h2>
          <Badge tone="brand">{isAr ? "نموذج شفّاف" : "modèle transparent"}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {isAr
            ? "ما توفّره كل مؤسسة متّصلة بـ Moufehma، مضروبًا في عدد الملفّات."
            : "Ce que chaque institution connectée à Moufehma économise, multiplié par le volume."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-3xl font-display font-black text-primary-deep">≈ {a.agency.hoursSaved} h</div>
            <div className="text-xs text-ink-muted">{isAr ? "ساعات موفّرة" : "heures économisées"}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-3xl font-display font-black text-primary-deep">≈ {a.agency.foldersSaved}</div>
            <div className="text-xs text-ink-muted">{isAr ? "ملفّات ورقية" : "dossiers papier évités"}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-3xl font-display font-black text-primary-deep">{a.agency.exchangesRemoved}</div>
            <div className="text-xs text-ink-muted">{isAr ? "تبادلات مُزالة" : "échanges évités"}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-3xl font-display font-black text-primary-deep">{a.total}</div>
            <div className="text-xs text-ink-muted">{isAr ? "ملفّات مُعالَجة" : "dossiers traités"}</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          {isAr ? "الفرضيات: " : "Hypothèses : "}
          {a.agency.minutesPerCase} {isAr ? "دقيقة/ملف" : "min/dossier"} · {a.agency.foldersPerCase}{" "}
          {isAr ? "ملف ورقي/ملف" : "dossier papier/dossier"} · {a.agency.exchangesRemovedPerCase}{" "}
          {isAr ? "تبادل مُزال/ملف" : "échanges évités/dossier"}.{" "}
          {isAr ? "أرقام توضيحية، تُستبدل بأرقام مُصادَق عليها." : "Chiffres illustratifs, à remplacer par des données validées."}
        </p>
      </div>
    </AppShell>
  );
}
