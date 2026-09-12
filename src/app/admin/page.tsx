import { requireRole, getLocale } from "@/lib/session";
import { getNetworkAnalytics } from "@/lib/domain/analytics";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card, Badge } from "@/components/ui";
import { CLAIM_TYPE_LABEL, label } from "@/lib/domain/constants";

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

function Stat({ value, labelText, tone }: { value: string; labelText: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className={`text-2xl font-black ${tone ?? "text-foreground"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{labelText}</div>
    </Card>
  );
}

function BarRow({ name, count, max }: { name: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-muted">{name}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
      </div>
      <span className="w-8 text-end font-semibold">{count}</span>
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
        title={isAr ? "الإشراف على الشبكة" : "Supervision du réseau"}
        subtitle={isAr ? "الحجم، الآجال، والمنفعة للمؤسسات." : "Volume, délais et bénéfice institutionnel."}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat value={String(a.total)} labelText={isAr ? "مطالب" : "Réclamations"} />
        <Stat value={String(a.resolvedCount + a.settledCount)} labelText={isAr ? "تمّت تسويتها" : "Réglées"} tone="text-emerald-600" />
        <Stat value={String(a.escalatedCount)} labelText={isAr ? "مصعّدة" : "Escaladées"} tone="text-amber-600" />
        <Stat value={a.avgResolutionDays.toFixed(1) + (isAr ? " ي" : " j")} labelText={isAr ? "متوسّط المعالجة" : "Délai moyen"} />
        <Stat value={pct(a.slaCompliance)} labelText={isAr ? "احترام الأجل" : "Respect SLA"} tone="text-brand" />
        <Stat value={pct(a.preEscalationRate)} labelText={isAr ? "حلّ قبل التصعيد" : "Résolu pré-escalade"} tone="text-brand" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">{isAr ? "حسب النوع" : "Par type de litige"}</h3>
          <div className="space-y-3">
            {a.byType.map((t) => (
              <BarRow key={t.key} name={label(CLAIM_TYPE_LABEL, t.key, locale)} count={t.count} max={maxType} />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">{isAr ? "حسب المزوّد" : "Par fournisseur"}</h3>
          <div className="space-y-3">
            {a.byProvider.map((p) => (
              <BarRow key={p.name} name={p.name} count={p.count} max={maxProv} />
            ))}
          </div>
        </Card>
      </div>

      {/* Agency Benefit — the pitch centerpiece */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{isAr ? "المنفعة للمؤسسة (Agency Benefit)" : "The Agency Benefit"}</h2>
          <Badge tone="warning">{isAr ? "نموذج شفّاف" : "modèle transparent"}</Badge>
        </div>
        <p className="mt-1 text-sm text-indigo-100">
          {isAr
            ? "ما توفّره كل مؤسسة متّصلة بـ Sulha، مضروبًا في عدد الملفّات."
            : "Ce que chaque institution connectée à Sulha économise, multiplié par le volume."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-3xl font-black">≈ {a.agency.hoursSaved} h</div>
            <div className="text-xs text-indigo-100">{isAr ? "ساعات موفّرة" : "heures économisées"}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-3xl font-black">≈ {a.agency.foldersSaved}</div>
            <div className="text-xs text-indigo-100">{isAr ? "ملفّات ورقية" : "dossiers papier évités"}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-3xl font-black">{a.agency.exchangesRemoved}</div>
            <div className="text-xs text-indigo-100">{isAr ? "تبادلات مُزالة" : "échanges évités"}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-3xl font-black">{a.total}</div>
            <div className="text-xs text-indigo-100">{isAr ? "ملفّات مُعالَجة" : "dossiers traités"}</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-indigo-100">
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
