# Tunisian Legal References — "Mise en demeure" Generator (Moufehma)

> **Purpose.** Citable legal grounding for the bilingual (FR/AR) *mise en demeure* (formal notice)
> generator used by Tunisian MSMEs against commercial service providers (STEG, SONEDE, La Poste,
> telecoms, delivery firms).
>
> **Status: DEMO / MVP.** Everything here is a research scaffold. See the **CAVEAT** block at the end.
> Every claim below carries an article/law number and a URL that was actually opened during research
> (accessed 2026-09-12).

---

## 0. TL;DR for the product team

| Question | Answer (verified) | Source article |
|---|---|---|
| Which COC articles govern the *mise en demeure* / *demeure*? | **Arts. 268–274 COC** (definition, how demeure arises, exceptions, remedies). | COC 268–274 |
| Legal effect of the notice (when do interest/damages start)? | Moratory interest on money debts runs **"du jour de l'interpellation"** (from the day of the notice). | **COC art. 278** |
| Other effect worth citing | Debtor "en demeure" bears the risk of *cas fortuit / force majeure*. | **COC art. 280** |
| Is there a fixed statutory delay (8/15 days)? | **No.** COC art. 269 only requires a **"délai raisonnable."** 8–15 days is customary practice. | COC art. 269 |
| Fast-track for an undisputed debt? | **Injonction de payer**, CPCC arts. 59–67. A prior notice by *huissier* is mandatory when the debt > 150 DT (**5 franc-day** delay). | **CPCC arts. 59, 60** |
| Commercial court? | Tunisia has **no standalone Tribunal de Commerce** — commercial **chambers** sit inside the *Tribunal de première instance*. | **CPCC art. 40** |
| Consumer-protection statute | **Loi n° 92-117 du 7 décembre 1992.** | Loi 92-117 |
| Consumer bodies (amicable route) | **INC** (Institut National de la Consommation, est. 2008), **ODC** (Organisation de Défense du Consommateur); telecom disputes → **INTT** consumer portal. | see §4 |

---

## 1. Code des Obligations et des Contrats (COC) — *mise en demeure du débiteur*

**Section:** "De la mise en demeure du débiteur", COC arts. **268–281**.
**Source (opened):** <https://www.jurisitetunisie.com/tunisie/codes/coc/Coc1042.htm>
Full official code (PDF, opened as directory listing): <http://www.bna.tn/documents/Code_des_obligations_et_des_contrats.pdf>
ILO NATLEX copy: <https://www.ilo.org/dyn/natlex/docs/ELECTRONIC/65194/61345/F1279300680/TUN-65194.pdf>

### The core articles (short FR quotes, verbatim excerpts)

- **Art. 268 — Definition of *demeure*.**
  > « Le débiteur est en demeure lorsqu'il est en retard d'exécuter son obligation, en tout ou en
  > partie, sans cause valable. »

- **Art. 269 — How the *demeure* arises + required content of the notice.**
  The debtor is in default automatically at the *term's due date*; otherwise a formal notice
  (*interpellation*) is required. It must express:
  > 1. « … la requête adressée au débiteur d'exécuter son obligation **dans un délai raisonnable** ; »
  > 2. « … la déclaration que, passé ce délai, **le créancier se considérera comme dégagé** en ce qui
  >    le concerne. »

  Accepted form — written; may result:
  > « … même d'un télégramme, d'une lettre recommandée, d'une citation en justice, même devant un
  > juge incompétent. »

  → **Product note:** this is the article the deadline clause rests on. It fixes **no number of days**
  — only a *"délai raisonnable."* The 8–15 day figure the generator offers is **customary**, not
  statutory (see §5).

- **Art. 270 — When notice is NOT required.**
  > « Lorsque le débiteur a refusé formellement d'exécuter son obligation… » (or performance became
  > impossible) — no *interpellation* needed.

- **Art. 271 — Heirs.** After the debtor's death, heirs are put in *demeure* only by a notice
  addressed to them.

- **Art. 272 — Ineffective notice.**
  > « L'interpellation du créancier n'a aucun effet si elle est faite à un moment ou dans un lieu où
  > l'exécution n'est pas due. »

- **Art. 273 — Creditor's remedies.** The creditor may compel performance where possible; otherwise
  seek *résolution* + damages.
  > « La résolution du contrat n'a pas lieu de plein droit, mais **doit être prononcée en justice**. »

- **Art. 274 — Agreed résolution.** Where the parties stipulated it,
  > « … la résolution du contrat s'opère de plein droit par le seul fait de l'inexécution. »

### The *effect* articles (interest & damages) — the reason to send a notice

- **Art. 277 — Damages for delay even without bad faith.**
  > « … encore qu'il n'y ait aucune mauvaise foi de la part du débiteur. »

- **Art. 278 — (modified by Loi n° 59-148 du 7 novembre 1959) — KEY EFFECT.**
  Damages = the effective loss + the gain of which the creditor was deprived
  (« la perte effective que le créancier a éprouvée et le gain dont il a été privé »). For **monetary
  obligations**, damages are limited to the legally-fixed interest, due only
  > « … **du jour de l'interpellation** faite par le créancier au débiteur. »

  → **This is the single most important citation for the product:** sending the *mise en demeure* is
  what starts the clock on moratory interest. Cite arts. **268–274** (the notice itself) and **278**
  (its financial effect) in the generator's `legalBasis` field.

- **Art. 280 — Risk transfer.**
  > « Le débiteur en demeure répond du cas fortuit et de la force majeure. »
  Once in *demeure*, the debtor bears risks it would otherwise be excused from.

*(Arts. 279 and 281 concern third-party claims and valuation of a perished thing — less relevant to
billing/service disputes.)*

---

## 2. Consumer protection — Loi n° 92-117 du 7 décembre 1992

**Loi n° 92-117 du 7 décembre 1992, relative à la protection du consommateur** — published JORT
n° 83 du 15 décembre 1992.
**Sources (opened):**
- FAOLEX full-text PDF: <https://faolex.fao.org/docs/pdf/Tun190410.pdf> (and record page
  <https://www.fao.org/faolex/results/details/en/c/LEX-FAOC190410/>)
- Juridoc record: <https://www.juridoc.tn/document/loi-n--1992-117-du-7-decembre-1992-relative-a-la-protection-du-consommateur/26006>
- Ministère du commerce (scope): <http://www.commerce.gov.tn/Fr/controle-de-la-qualite-des-produits-et-des-services_11_126>

**Scope & relevance:**
- The law covers **all products, *including services*** — so it is on-point for the Moufehma use cases
  (utilities, delivery, telecom services). Product categories are defined at **art. 2** (industrial,
  agricultural or artisanal products, components, etc.).
- It establishes the consumer's **right to information and to a guarantee (garantie)**, bans
  **misleading advertising (publicité mensongère)**, and empowers *contrôle économique* agents to
  record infractions.
- Sanctions: **art. 38** doubles penalties on repeat offence; **art. 41** lets the court order
  temporary/definitive closure of the offender's premises.

→ **Product note:** 92-117 is the *statutory backdrop* for a consumer's position, but it is primarily
a **public-order / control-and-sanction** statute. A private *mise en demeure* between an MSME and a
provider rests on **contract + COC** (arts. 268–278), with 92-117 cited as supporting context where
the claimant is a consumer of the service. Do **not** over-rely on 92-117 for a debt-recovery notice.

---

## 3. Commercial recovery paths (context only — the generator does not file anything)

### 3.1 Injonction de payer (fast-track for an undisputed, fixed debt)

**Basis:** Code de Procédure Civile et Commerciale (CPCC), **arts. 59–67**. Originally regulated by
**décret-loi n° 73-15 du 29 octobre 1973**; arts. 59–60 modified by **loi n° 86-87 du 1er septembre
1986**, art. 60 further modified by **loi n° 2002-82 du 3 août 2002**.
**Source (opened):** <https://www.jurisitetunisie.com/tunisie/codes/cpcc/cpcc1055.htm>
Full CPCC (droit-afrique PDF): <http://droit-afrique.com/upload/doc/tunisie/Tunisie-Code-2010-procedure-civile.pdf>

- **Art. 59 (nouveau)** — available for
  > « toute demande en paiement de créance… d'un montant déterminé [et qui] a une cause
  > contractuelle » — or arising from a **chèque, lettre de change, billet à ordre** or their *aval*.
- **Art. 60 (nouveau)** — mandatory prior notice:
  > « Lorsque la créance dépasse **cent cinquante dinars** », the creditor must
  > « notifier à son débiteur **par exploit d'huissier-notaire** » that, failing payment within a
  > **« délai franc de 5 jours »**, the injonction procedure will follow. The *sommation de payer*
  > must be accompanied by the *titre de créance*. Delay raised to **30 days** if the debtor is
  > domiciled abroad.
- **Art. 61** — exclusive jurisdiction: the judge of the debtor's (real or elected) domicile.
- **Art. 62** — split between *juge cantonal* and *président du tribunal de première instance* by
  amount.
- **Art. 64** — the judge orders payment within **3 days** where the debt is established.

→ **Applies when:** the debt is *liquid, certain and contractual* and essentially undisputed.
The generator's notice can double as the **art. 60 pre-notice** *only if served by huissier-notaire*
and the amount exceeds 150 DT — a **human/huissier step**, not something the demo performs.

### 3.2 Tribunal de Commerce / commercial chamber

**Important correction:** Tunisia has **no autonomous "Tribunal de Commerce"** on the French model.
Commercial disputes are heard by **chambres commerciales created inside the *Tribunal de première
instance*** (magistrates + two *commerçants* with consultative voice).
**Basis:** **CPCC art. 40** (commercial chambers may be created by decree at the TPI; defines a
*litige commercial* as an action between *commerçants* concerning their commercial activity).
**Source (opened):** <https://www.jurisitetunisie.com/tunisie/codes/cpcc/cpcc1030.htm>
Corroborating analysis (Leaders, "Justice commerciale, vingt-cinq ans après"):
<https://www.leaders.com.tn/article/29956-issam-yahyaoui-justice-commerciale-vingt-cinq-ans-apres-l-inevitable-refonte>

→ **Applies when:** the dispute is between *commerçants* over their commercial activity and is
genuinely contested (i.e., not a candidate for the injonction fast-track).

---

## 4. Amicable settlement — mediation / conciliation bodies

**Sources (opened):**
- INC & consumer bodies overview: <https://linstant-m.tn/single-article/ar10232_consommateurs-en-tunisie-connaitre-et-defendre-vos-droits>
- Telecom consumer complaints portal (INTT): <https://intt-info-conso.tn/fr/comment-deposer-une-plainte/>
- On the state of ADR/mediation in Tunisian law (Souilah, Chambre Internationale de Médiation):
  <https://cim-imc.com/wp-content/uploads/2021/02/Le-legislateur-tunisien-et-la-mediation.pdf>

Verified facts:
- **INC — Institut National de la Consommation** (created **2008**), a **public establishment under
  the Ministry of Commerce**: advises and informs consumers, runs comparative studies. Consumers
  address complaints to it and to consumer associations.
- **ODC — Organisation de Défense du Consommateur**: the main Tunisian consumer NGO; a channel for
  complaints (registered letter with acknowledgement, or filed against receipt).
- **Sector-specific routes:** telecom disputes have the **INTT** (*Instance Nationale des
  Télécommunications*) consumer-complaint portal; banking disputes have a *médiateur bancaire*.
- **Legal-framework reality:** Tunisia has **no general statutory ADR/mediation code**, *except
  arbitration* — the **Code de l'arbitrage, loi n° 93-42 du 26 avril 1993**. Tunisian texts often
  **conflate *médiation*, *conciliation* and *transaction***; amicable settlement (*transaction /
  règlement à l'amiable*) appears piecemeal across sector codes.
- **STEG / SONEDE / La Poste** are **public establishments**; a dedicated statutory *médiation* route
  specific to them was **not** verified in this pass (flagged below).

### On the "PV de Conciliation" specifically — PARTIALLY VERIFIED / FLAGGED

- A **procès-verbal de conciliation** is a standard output of **judicial conciliation** (e.g. before
  the *juge cantonal*), and of formal mediation once a settlement is reached.
- **What could NOT be verified in this pass:** a *specific Tunisian statutory basis* for a **consumer
  "PV de Conciliation" issued by the INC** (i.e. that the INC is legally empowered to issue a binding
  *PV de conciliation*). The INC is documented as an **information/advisory** body, not clearly as a
  conciliation authority that issues an enforceable PV. **Re-verify with the INC's own enabling
  decree before presenting the INC as the PV-issuing authority.** For the demo, present the amicable
  route as "complaint to INC/ODC and/or judicial conciliation," not as "INC issues a binding PV."

---

## 5. Typical notice delay (the "{{deadlineDays}}" slot)

- **Tunisian statutory anchor:** COC **art. 269** requires a **"délai raisonnable"** — it fixes **no
  specific number of days**.
- **Only hard Tunisian statutory delay found:** the **5 franc-day** notice before an *injonction de
  payer* for debts > 150 DT (**CPCC art. 60**; 30 days if the debtor is abroad).
- **The customary 8–15 days** commonly quoted for a *mise en demeure* is **practice/jurisprudential
  custom** (documented mainly under French law, COC art. 269's Tunisian equivalent of a "reasonable
  delay"), **not** a Tunisian statutory figure. Sources:
  <https://www.litige.fr/articles/quel-delai-pour-une-mise-en-demeure>
- **Recommendation for the generator:** default **`deadlineDays` = 15** (conservative, clearly
  "reasonable"); allow the user to shorten to **8** for a simple monetary claim. Anchor the clause on
  COC art. 269 ("délai raisonnable"), **not** on a claimed statutory 8/15-day rule.

---

## 6. Form of the notice (evidence value)

Not strictly required by COC art. 269 (which even accepts a *lettre recommandée* or *télégramme*),
but for probative strength in Tunisia:
- **Lettre recommandée avec accusé de réception (LRAR)** — recommended minimum for proof of receipt.
- **Exploit / acte d'huissier-notaire** — strongest evidence, and **mandatory** for the injonction-de-payer
  pre-notice above 150 DT (CPCC art. 60).
- Huissier profession governed by **loi n° 95-29 du 13 mars 1995**:
  <https://legislation-securite.tn/latest-laws/loi-n95-29-du-13-mars-1995-portant-organisation-de-la-profession-des-huissiers-de-justice/>

---

## CAVEAT — READ BEFORE SHIPPING

1. **DEMO ONLY.** This document and the generated notices are **templates for a hackathon MVP**. They
   are **not legal advice** and must be **validated by a qualified Tunisian lawyer / legal mentor**
   before any real-world use.
2. **Re-verify article numbers against an official source.** Numbers here were read from
   *jurisitetunisie.com* and cross-checked against FAOLEX/ILO/BNA copies, but the **official JORT /
   Imprimerie Officielle text** is the only authority. Confirm each cited article (esp. COC 268–274,
   278, 280; CPCC 40, 59, 60) against the current consolidated code.
3. **Items explicitly NOT verified (do not present as fact):**
   - A specific statutory basis for an **INC-issued "PV de Conciliation"** (see §4). The INC's role as
     a *binding conciliation authority* is **unconfirmed**.
   - The **8–15 day delay as Tunisian statutory law** — verified only as *customary*; COC art. 269
     says "délai raisonnable" (see §5).
   - The **exact legal/moratory interest rate** referenced by COC art. 278 (set by separate texts) —
     **not researched here**; do not state a rate.
   - A **dedicated médiation route for STEG / SONEDE / La Poste** — not verified (§4).
4. **The generator must never emit free-written legal conclusions.** It fills vetted slot templates
   (`legal/clauses.json`) and cites the COC basis in the `legalBasis` field only.

---

*Compiled 2026-09-12 for the Moufehma MVP. All URLs above were opened during research.*
