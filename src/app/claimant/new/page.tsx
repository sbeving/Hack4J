import { requireRole, getLocale } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/nav/BackLink";
import { PageTitle } from "@/components/ui";
import { NewClaimForm } from "@/components/claimant/NewClaimForm";

export default async function NewClaimPage() {
  const user = await requireRole("claimant");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const providers = await prisma.organization.findMany({
    where: { kind: "provider" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, nameAr: true, branding: true },
  });

  return (
    <AppShell user={user} locale={locale}>
      <BackLink
        href="/claimant"
        locale={locale}
        label={isAr ? "مطالبي" : "Mes réclamations"}
      />
      <PageTitle
        icon="plus"
        title={isAr ? "مطلب جديد" : "Nouvelle réclamation"}
        subtitle={
          isAr
            ? "صف مشكلتك بكلماتك — الذكاء الاصطناعي يتكفّل بالباقي."
            : "Décrivez votre problème avec vos mots — l'IA s'occupe du reste."
        }
      />
      <NewClaimForm providers={providers} locale={locale} />
    </AppShell>
  );
}
