import { z } from "zod";
import { AuditReport } from "@/lib/types/report";

const severitySchema = z.enum(["Bassa", "Media", "Alta", "Critica"]);
const prioritySchema = z.enum(["P1", "P2", "P3"]);
const threatSchema = z.enum(["Bassa", "Media", "Alta"]);

const priorityItemSchema = z.object({
  title: z.string().min(4).max(180),
  detail: z.string().min(12).max(500),
  impact: z.string().min(10).max(320),
  severity: severitySchema,
  priority: prioritySchema,
});

const websiteIssueSchema = z.object({
  problem: z.string().min(6).max(220),
  whyItHurts: z.string().min(12).max(420),
  economicImpact: z.string().min(8).max(260),
  severity: severitySchema,
  recommendation: z.string().min(10).max(420),
  priority: prioritySchema,
});

const gbpIssueSchema = z.object({
  problem: z.string().min(6).max(220),
  whyItHurts: z.string().min(12).max(420),
  bookingImpact: z.string().min(8).max(320),
  severity: severitySchema,
  recommendation: z.string().min(10).max(420),
  priority: prioritySchema,
});

const bookingFactorSchema = z.object({
  factor: z.string().min(3).max(160),
  guestPerception: z.string().min(8).max(320),
  impact: z.string().min(8).max(320),
  severity: severitySchema,
  recommendation: z.string().min(10).max(420),
  priority: prioritySchema,
});

const competitorSchema = z.object({
  name: z.string().min(3).max(140),
  channel: z.string().min(3).max(120),
  strongerWhy: z.string().min(8).max(260),
  whereAhead: z.string().min(8).max(260),
  threatLevel: threatSchema,
});

const actionItemSchema = z.object({
  activity: z.string().min(8).max(240),
  objective: z.string().min(8).max(220),
  expectedImpact: z.string().min(8).max(220),
  priority: prioritySchema,
  area: z.string().min(3).max(120),
});

const llmPatchSchema = z
  .object({
    executiveSummary: z
      .object({
        topProblems: z.array(priorityItemSchema).max(8),
        topOpportunities: z.array(priorityItemSchema).max(8),
        mainEconomicRisk: z.string().min(12).max(500),
        mainGrowthOpportunity: z.string().min(12).max(500),
      })
      .partial()
      .optional(),
    websiteAnalysis: z
      .object({
        criticalIssues: z.array(websiteIssueSchema).max(8),
      })
      .partial()
      .optional(),
    gbpAnalysis: z
      .object({
        issues: z.array(gbpIssueSchema).max(8),
      })
      .partial()
      .optional(),
    bookingAnalysis: z
      .object({
        factors: z.array(bookingFactorSchema).max(8),
        physicalInterventions: z.array(z.string().min(8).max(260)).max(8),
        otaOptimizations: z.array(z.string().min(8).max(260)).max(8),
      })
      .partial()
      .optional(),
    competitors: z.array(competitorSchema).max(8).optional(),
    revenueInsights: z
      .object({
        directBookingLoss: z.string().min(8).max(360),
        otaDependencyRisk: z.string().min(8).max(360),
        marginDispersion: z.string().min(8).max(360),
        positioningLimits: z.string().min(8).max(360),
        growthOpportunity: z.string().min(8).max(420),
      })
      .partial()
      .optional(),
    actionPlan: z
      .object({
        from0to30: z.array(actionItemSchema).max(6),
        from30to60: z.array(actionItemSchema).max(6),
        from60to120: z.array(actionItemSchema).max(6),
        from3to6Months: z.array(actionItemSchema).max(6),
      })
      .partial()
      .optional(),
    emailSummary: z
      .object({
        subject: z.string().min(8).max(200),
        body: z.string().min(40).max(4000),
      })
      .partial()
      .optional(),
    assumptions: z.array(z.string().min(8).max(220)).max(5).optional(),
  })
  .partial();

type LlmPatch = z.infer<typeof llmPatchSchema>;

type ChatCompletionChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
};

const asLooseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.replace(/\s+/g, "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    if (!match?.[0]) return undefined;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const looseNumberSchema = z.any().optional().transform((value) => asLooseNumber(value));

const llmExtractionSchema = z
  .object({
    gbp: z
      .object({
        rating: looseNumberSchema,
        reviewCount: looseNumberSchema,
        category: z.string().min(2).max(120).optional(),
        positives: z.string().min(4).max(240).optional(),
        negatives: z.string().min(4).max(240).optional(),
      })
      .partial()
      .optional(),
    booking: z
      .object({
        rating: looseNumberSchema,
        reviewCount: looseNumberSchema,
        positives: z.string().min(4).max(240).optional(),
        negatives: z.string().min(4).max(240).optional(),
      })
      .partial()
      .optional(),
    assumptions: z.array(z.string().min(8).max(220)).max(5).optional(),
  })
  .partial();

export type LlmSourceExtraction = z.infer<typeof llmExtractionSchema>;

export type LlmSourceExtractionInput = {
  hotelName?: string;
  websiteUrl?: string;
  googleBusinessUrl?: string;
  bookingUrl?: string;
  gbpHtml?: string;
  bookingHtml?: string;
  sourceStatus?: {
    gbp?: string;
    booking?: string;
  };
};

const SYSTEM_PROMPT = `
Sei un consulente senior Hotel Target specializzato in SEO tecnico/local SEO, GBP optimization, UX/UI mobile-first, CRO prenotazioni dirette, performance web, revenue management e brand positioning hospitality.

Obiettivo: migliorare una bozza di report audit hotel con tono premium, tecnico, diretto, orientato a impatto economico, visibilità, prenotazioni dirette e marginalità.

Regole:
1) Usa SOLO i dati disponibili nel JSON di input. Non inventare metriche non verificabili.
2) Se una fonte è "not_provided", "blocked" o "partially_accessible", dichiaralo chiaramente nei testi pertinenti.
3) Ogni criticità deve includere impatto economico/business e soluzione concreta.
4) Mantieni linguaggio professionale, senza frasi vaghe.
5) Restituisci SOLO JSON valido, senza markdown o testo extra.
6) Mantieni coerenza con il modello dati esistente (sezioni e campi richiesti).
`;

const USER_INSTRUCTIONS = `
Migliora la narrativa del report secondo questa struttura:
- Executive Summary (5 problemi, 5 opportunità, rischio economico principale, opportunità di crescita principale)
- Analisi Sito Web (criticità con impatto e priorità)
- Analisi Google Business Profile (criticità e impatto prenotazioni/visibilità)
- Analisi Booking.com (fattori, interventi fisici, ottimizzazioni OTA)
- Competitor
- Analisi Commerciale e Revenue
- Piano d'Azione
- Email pronta da inviare

Vincoli:
- Non alterare punteggi e chart numerici già presenti nella bozza.
- Non aggiungere sezioni non richieste.
- Se alcuni dati mancano, proponi next step di raccolta dati senza inventare.
`;

const EXTRACTION_SYSTEM_PROMPT = `
Sei un motore di estrazione dati per audit hotel.
Devi estrarre SOLO evidenze esplicitamente presenti nei contenuti forniti (GBP/Booking).

Output JSON consentito:
{
  "gbp": { "rating": number, "reviewCount": number, "category": string, "positives": string, "negatives": string },
  "booking": { "rating": number, "reviewCount": number, "positives": string, "negatives": string },
  "assumptions": ["..."]
}

Regole:
1) Non inventare numeri o categorie.
2) Se un dato non è presente, ometti il campo.
3) Rating booking normalmente su 10, GBP su 5 (ma estrai il valore come trovato).
4) assumptions brevi e fattuali.
5) Solo JSON valido, nessun testo extra.
`;

const toInputSnapshot = (report: AuditReport) => ({
  input: report.input,
  sourceStatus: report.sourceStatus,
  scores: report.executiveSummary.scores,
  existingDraft: {
    executiveSummary: report.executiveSummary,
    websiteAnalysis: report.websiteAnalysis,
    gbpAnalysis: report.gbpAnalysis,
    bookingAnalysis: report.bookingAnalysis,
    competitors: report.competitors,
    revenueInsights: report.revenueInsights,
    actionPlan: report.actionPlan,
    emailSummary: report.emailSummary,
    assumptions: report.assumptions,
  },
});

const extractAssistantText = (payload: ChatCompletionResponse): string | undefined => {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
    return text || undefined;
  }
  return undefined;
};

const compactSnippet = (value?: string) => {
  if (!value) return undefined;
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 26_000);
};

const parseJsonLoose = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("invalid_json_from_llm");
  }
};

const mergeTopFive = <T,>(base: T[], next?: T[]) => {
  if (!next?.length) return base.slice(0, 5);
  return [...next, ...base].slice(0, 5);
};

const mergeTopSix = <T,>(base: T[], next?: T[]) => {
  if (!next?.length) return base.slice(0, 6);
  return [...next, ...base].slice(0, 6);
};

const callOpenAiJson = async (params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<unknown | undefined> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: params.temperature ?? 0.1,
      response_format: { type: "json_object" },
      max_tokens: params.maxTokens ?? 1600,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) return undefined;

  const payload = (await response.json()) as ChatCompletionResponse;
  const assistantText = extractAssistantText(payload);
  if (!assistantText) return undefined;
  return parseJsonLoose(assistantText);
};

export const extractSourceSignalsWithLlm = async (
  input: LlmSourceExtractionInput,
): Promise<LlmSourceExtraction | undefined> => {
  const gbpSnippet = compactSnippet(input.gbpHtml);
  const bookingSnippet = compactSnippet(input.bookingHtml);
  if (!gbpSnippet && !bookingSnippet) return undefined;

  try {
    const raw = await callOpenAiJson({
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          hotelName: input.hotelName,
          websiteUrl: input.websiteUrl,
          googleBusinessUrl: input.googleBusinessUrl,
          bookingUrl: input.bookingUrl,
          sourceStatus: input.sourceStatus,
          gbpSnippet,
          bookingSnippet,
        },
        null,
        2,
      ),
      temperature: 0,
      maxTokens: 900,
    });
    if (!raw) return undefined;
    const parsed = llmExtractionSchema.safeParse(raw);
    if (!parsed.success) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const applyPatch = (report: AuditReport, patch: LlmPatch) => {
  const merged: AuditReport = structuredClone(report);

  if (patch.executiveSummary?.topProblems) {
    merged.executiveSummary.topProblems = mergeTopFive(
      merged.executiveSummary.topProblems,
      patch.executiveSummary.topProblems,
    );
  }
  if (patch.executiveSummary?.topOpportunities) {
    merged.executiveSummary.topOpportunities = mergeTopFive(
      merged.executiveSummary.topOpportunities,
      patch.executiveSummary.topOpportunities,
    );
  }
  if (patch.executiveSummary?.mainEconomicRisk) {
    merged.executiveSummary.mainEconomicRisk = patch.executiveSummary.mainEconomicRisk;
  }
  if (patch.executiveSummary?.mainGrowthOpportunity) {
    merged.executiveSummary.mainGrowthOpportunity = patch.executiveSummary.mainGrowthOpportunity;
  }

  if (patch.websiteAnalysis?.criticalIssues) {
    merged.websiteAnalysis.criticalIssues = mergeTopFive(
      merged.websiteAnalysis.criticalIssues,
      patch.websiteAnalysis.criticalIssues,
    );
  }

  if (patch.gbpAnalysis?.issues) {
    merged.gbpAnalysis.issues = mergeTopFive(merged.gbpAnalysis.issues, patch.gbpAnalysis.issues);
  }

  if (patch.bookingAnalysis?.factors) {
    merged.bookingAnalysis.factors = mergeTopFive(
      merged.bookingAnalysis.factors,
      patch.bookingAnalysis.factors,
    );
  }
  if (patch.bookingAnalysis?.physicalInterventions) {
    merged.bookingAnalysis.physicalInterventions = mergeTopSix(
      merged.bookingAnalysis.physicalInterventions,
      patch.bookingAnalysis.physicalInterventions,
    );
  }
  if (patch.bookingAnalysis?.otaOptimizations) {
    merged.bookingAnalysis.otaOptimizations = mergeTopSix(
      merged.bookingAnalysis.otaOptimizations,
      patch.bookingAnalysis.otaOptimizations,
    );
  }

  if (patch.competitors?.length) {
    merged.competitors = mergeTopSix(merged.competitors, patch.competitors);
  }

  if (patch.revenueInsights) {
    merged.revenueInsights = {
      ...merged.revenueInsights,
      ...patch.revenueInsights,
    };
  }

  if (patch.actionPlan) {
    merged.actionPlan = {
      from0to30: mergeTopSix(merged.actionPlan.from0to30, patch.actionPlan.from0to30),
      from30to60: mergeTopSix(merged.actionPlan.from30to60, patch.actionPlan.from30to60),
      from60to120: mergeTopSix(merged.actionPlan.from60to120, patch.actionPlan.from60to120),
      from3to6Months: mergeTopSix(merged.actionPlan.from3to6Months, patch.actionPlan.from3to6Months),
    };
  }

  if (patch.emailSummary) {
    merged.emailSummary = {
      ...merged.emailSummary,
      ...patch.emailSummary,
    };
  }

  if (patch.assumptions?.length) {
    merged.assumptions = [...patch.assumptions, ...merged.assumptions].slice(0, 12);
  }

  return merged;
};

export const enhanceReportWithLlm = async (report: AuditReport): Promise<AuditReport> => {
  if (!process.env.OPENAI_API_KEY) return report;

  try {
    const raw = await callOpenAiJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `${USER_INSTRUCTIONS}\n\nINPUT JSON:\n${JSON.stringify(
        toInputSnapshot(report),
      )}\n\nOutput atteso: JSON con patch dei campi narrativi coerenti col report.`,
      temperature: 0.2,
      maxTokens: 3200,
    });
    if (!raw) return report;
    const parsedPatch = llmPatchSchema.safeParse(raw);
    if (!parsedPatch.success) return report;

    return applyPatch(report, parsedPatch.data);
  } catch {
    return report;
  }
};
