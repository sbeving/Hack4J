import { Suspense } from "react";
import { MediatorCard } from "@/components/mediation/MediatorCard";
import { MediatorChat } from "@/components/mediation/MediatorChat";
import { MediationReport } from "@/components/mediation/MediationReport";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  getOrCreateMediationBrief,
  getMediationMessages,
  buildMediationReport,
  type Party,
} from "@/lib/domain/mediation";
import type { Locale } from "@/lib/domain/constants";

/**
 * The AI mediator block. Wrapped in Suspense and keyed by the mediation
 * fingerprint so the rest of the case page paints (and refreshes) immediately:
 * when the negotiation moves, the panels re-mount and stream in as the model
 * answers instead of holding the whole page hostage.
 */
export function MediationSection({
  caseId,
  party,
  fingerprint,
  canPropose = false,
  locale,
}: {
  caseId: string;
  party: Party;
  fingerprint: string;
  canPropose?: boolean;
  locale: Locale;
}) {
  return (
    <Suspense key={fingerprint} fallback={<MediationPending locale={locale} />}>
      <MediationPanels caseId={caseId} party={party} canPropose={canPropose} locale={locale} />
    </Suspense>
  );
}

async function MediationPanels({
  caseId,
  party,
  canPropose,
  locale,
}: {
  caseId: string;
  party: Party;
  canPropose: boolean;
  locale: Locale;
}) {
  const [brief, messages, report] = await Promise.all([
    getOrCreateMediationBrief(caseId),
    getMediationMessages(caseId, party),
    buildMediationReport(caseId),
  ]);
  if (!brief) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <MediatorCard brief={brief} party={party} canUseCompromise={canPropose} locale={locale} />
        <MediatorChat caseId={caseId} party={party} messages={messages} locale={locale} />
      </div>
      {report ? (
        <MediationReport
          caseId={caseId}
          party={party}
          report={report}
          reviewRequested={report.events.some((e) => e.type === "human_review_requested")}
          locale={locale}
        />
      ) : null}
    </div>
  );
}

function MediationPending({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <Card className="flex items-center gap-3 border-s-[3px] border-s-cobalt bg-cobalt-tint p-5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-cobalt text-white">
        <Icon name="handshake" size={17} />
      </span>
      <div>
        <div className="text-[15px] font-semibold text-cobalt">
          {isAr ? "الوسيط الآلي" : "Médiateur IA"}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-ink-muted">
          <span className="dot bg-cobalt animate-pulse" />
          {isAr ? "جارٍ تحليل الوضع…" : "Analyse de la position des deux parties…"}
        </div>
      </div>
    </Card>
  );
}
