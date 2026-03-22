"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Laptop,
  Mail,
  ShieldAlert,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ComponentType } from "react";
import { SourceStatusBadge } from "@/components/report/source-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AuditReport } from "@/lib/types/report";

const severityVariant = {
  Bassa: "neutral",
  Media: "warning",
  Alta: "danger",
  Critica: "danger",
} as const;

function getScoreSignal(value: number) {
  const benchmark = 80;
  const gap = benchmark - value;

  if (gap >= 25) {
    return {
      tone: "negative" as const,
      text: `↓ -${gap}% sotto benchmark`,
      detail: "Rischio alto di perdita conversione",
    };
  }

  if (gap >= 12) {
    return {
      tone: "negative" as const,
      text: `↓ -${gap}% sotto benchmark`,
      detail: "Trend negativo da correggere subito",
    };
  }

  if (gap > 0) {
    return {
      tone: "warning" as const,
      text: `↘ -${gap}% dal target`,
      detail: "Migliorabile con ottimizzazioni rapide",
    };
  }

  return {
    tone: "positive" as const,
    text: `↗ +${Math.abs(gap)}% sopra benchmark`,
    detail: "Posizionamento competitivo",
  };
}

function getProjectedOutcome(
  item: AuditReport["actionPlan"]["from0to30"][number],
) {
  const context = `${item.activity} ${item.area}`.toLowerCase();

  if (context.includes("mobile") || context.includes("sito") || context.includes("cro")) {
    return "+6-12% conversione diretta stimata";
  }
  if (context.includes("google") || context.includes("seo") || context.includes("gbp")) {
    return "+10-18% visibilità locale qualificata";
  }
  if (context.includes("ota") || context.includes("booking")) {
    return "-6-10 punti dipendenza OTA nel mix canali";
  }
  if (context.includes("crm") || context.includes("marketing") || context.includes("revenue")) {
    return "+5-11% quota diretta e marginalità";
  }

  return "+3-7% miglioramento RevPAR potenziale";
}

function CircularScore({
  value,
  label,
  delay = 0,
}: {
  value: number;
  label: string;
  delay?: number;
}) {
  const size = 116;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const signal = getScoreSignal(value);
  const strokeColor =
    signal.tone === "negative" ? "#dc2626" : signal.tone === "warning" ? "#d97706" : "#95C11F";

  return (
    <div className="animate-fade-up-soft flex flex-col items-center" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-slate-100" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none transition-all duration-1000"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-slate-900">{value}</p>
          <p className="text-xs font-bold text-slate-400">/100</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-extrabold uppercase tracking-wider text-slate-600">{label}</p>
      <div
        className={`mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
          signal.tone === "negative"
            ? "border border-red-300 bg-red-100 text-red-700 shadow-[0_6px_18px_-10px_rgba(220,38,38,0.7)]"
            : signal.tone === "warning"
              ? "border border-amber-200 bg-amber-50 text-amber-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {signal.tone === "positive" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {signal.text}
      </div>
      <p className={`mt-1 text-center text-[11px] font-bold ${signal.tone === "negative" ? "text-red-600" : "text-slate-400"}`}>
        {signal.detail}
      </p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-7 w-7 text-[#95C11F]" />
      <h3 className="text-2xl font-black tracking-tight text-slate-900">{title}</h3>
    </div>
  );
}

function TimelineCard({
  title,
  rows,
}: {
  title: string;
  rows: AuditReport["actionPlan"]["from0to30"];
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100 bg-slate-50 pb-4">
        <CardTitle className="text-lg font-black tracking-tight text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {rows.map((row) => (
          <div key={`${title}-${row.activity}`} className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#95C11F]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#7A9D17]">
                {row.area}
              </span>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Priorità: {row.priority}
              </span>
            </div>
            <p className="font-extrabold text-slate-900">{row.activity}</p>
            <p className="text-sm font-semibold text-slate-500">{row.objective}</p>
            <p className="mt-1 text-sm font-bold text-[#7A9D17]">{row.expectedImpact}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReportDashboard({ report }: { report: AuditReport }) {
  const { executiveSummary: summary } = report;
  const hasGbpData = report.sourceStatus.gbp !== "not_provided";
  const hasBookingData = report.sourceStatus.booking !== "not_provided";
  const scoreCards = [
    { label: "Score globale", value: summary.scores.global },
    { label: "Sito web", value: summary.scores.website },
    { label: "Brand", value: summary.scores.brand },
    { label: "Conversione", value: summary.scores.directConversion },
  ];
  if (hasGbpData) {
    scoreCards.splice(2, 0, { label: "Google My Biz", value: summary.scores.gbp });
  }
  if (hasBookingData) {
    scoreCards.splice(hasGbpData ? 3 : 2, 0, { label: "Booking.com", value: summary.scores.booking });
  }
  const actionPlanItems = [
    ...report.actionPlan.from0to30,
    ...report.actionPlan.from30to60,
    ...report.actionPlan.from60to120,
    ...report.actionPlan.from3to6Months,
  ];
  const projectedOutcomes = actionPlanItems.slice(0, 4).map((item) => ({
    timeframe: item.area,
    activity: item.activity,
    impact: getProjectedOutcome(item),
    expected: item.expectedImpact,
  }));

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(`${report.emailSummary.subject}\n\n${report.emailSummary.body}`);
  };

  return (
    <div className="bg-[#f8fafc] pb-24 text-slate-900">
      <div className="border-b border-slate-200 bg-white py-10 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#95C11F]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#7A9D17]">
                Report Audit AI
              </span>
              <span className="text-sm font-bold text-slate-400">{new Date(report.generatedAt).toLocaleDateString("it-IT")}</span>
              <SourceStatusBadge state={report.sourceStatus.website} />
              {hasGbpData ? <SourceStatusBadge state={report.sourceStatus.gbp} /> : null}
              {hasBookingData ? <SourceStatusBadge state={report.sourceStatus.booking} /> : null}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{report.input.hotelName}</h1>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-semibold text-slate-500">
              {report.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
          <Button variant="outline" className="h-11 rounded-xl border-2 border-slate-200 px-6 font-extrabold">
            <Download className="h-4 w-4" />
            Scarica PDF
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-12">
        <RevealOnScroll delay={40}>
          <section className="space-y-6">
          <SectionTitle icon={Activity} title="Executive Summary" />

          <Card>
            <CardContent className="grid grid-cols-2 gap-8 p-8 md:grid-cols-3 lg:grid-cols-6">
              {scoreCards.map((item, index) => (
                <CircularScore key={item.label} value={item.value} label={item.label} delay={80 + index * 70} />
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <ShieldAlert className="h-6 w-6 text-red-500" /> Criticità ad alto impatto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {summary.topProblems.map((problem) => (
                    <li key={problem.title} className="flex gap-3 text-sm font-semibold text-slate-600">
                      <span className="mt-0.5 font-black text-red-500">•</span>
                      <span>{problem.detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <TrendingUp className="h-6 w-6 text-[#95C11F]" /> Opportunità immediate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {summary.topOpportunities.map((opportunity) => (
                    <li key={opportunity.title} className="flex gap-3 text-sm font-semibold text-slate-600">
                      <span className="mt-0.5 font-black text-[#95C11F]">•</span>
                      <span>{opportunity.detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden border-2 border-slate-200">
            <div className="absolute left-0 top-0 h-full w-2 bg-[#95C11F]" />
            <CardContent className="flex flex-col gap-4 p-7 md:flex-row md:items-center">
              <div className="w-fit rounded-2xl bg-slate-50 p-3">
                <Zap className="h-8 w-8 text-[#95C11F]" />
              </div>
              <div>
                <h4 className="mb-1 text-xl font-black tracking-tight">Impatto economico e dispersione</h4>
                <p className="font-semibold text-slate-600">{summary.mainEconomicRisk}</p>
                <p className="mt-2 text-lg font-black text-[#7A9D17]">{summary.mainGrowthOpportunity}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#95C11F]/40">
            <CardHeader className="border-b border-slate-100 bg-[#95C11F]/5">
              <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <ArrowUpRight className="h-5 w-5 text-[#7A9D17]" />
                Outcome Positivi Stimati dal Piano d&apos;Azione
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 md:grid-cols-2">
              {projectedOutcomes.map((item) => (
                <div key={`${item.activity}-${item.timeframe}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-[#7A9D17]">{item.timeframe}</p>
                  <p className="text-sm font-extrabold text-slate-900">{item.activity}</p>
                  <p className="mt-2 text-sm font-bold text-emerald-700">{item.impact}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Deliverable piano: {item.expected}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={70}>
          <section className="space-y-6">
          <SectionTitle icon={Laptop} title="Analisi Sito Web Ufficiale" />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Matrice Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={report.charts.websiteRadar}>
                    <PolarGrid stroke="#dbe2ea" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <Radar dataKey="score" fill="#95C11F" fillOpacity={0.2} stroke="#95C11F" strokeWidth={2.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-slate-100 bg-slate-50 pb-4">
                <CardTitle className="text-lg font-black tracking-tight">Log delle criticità</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.websiteAnalysis.criticalIssues.map((issue, index) => (
                  <div key={issue.problem} className={`p-6 ${index ? "border-t border-slate-100" : ""}`}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h5 className="max-w-[80%] text-base font-extrabold text-slate-900">{issue.problem}</h5>
                      <Badge variant={severityVariant[issue.severity]}>{issue.severity}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">{issue.whyItHurts}</p>
                    <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impatto economico</p>
                        <p className="font-extrabold text-red-600">{issue.economicImpact}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Soluzione · Priorità {issue.priority}
                        </p>
                        <p className="font-extrabold text-[#7A9D17]">{issue.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          </section>
        </RevealOnScroll>

        {hasGbpData ? (
          <RevealOnScroll delay={80}>
            <section className="space-y-6">
            <SectionTitle icon={BarChart3} title="Analisi Google Business Profile" />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Performance locale</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.charts.gbpBars}>
                  <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} stroke="#cbd5e1" />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip />
                  <Bar dataKey="score" fill="#95C11F" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Criticità GBP</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problema rilevato</TableHead>
                    <TableHead>Perché penalizza ranking o fiducia</TableHead>
                    <TableHead>Impatto su visibilità / prenotazioni</TableHead>
                    <TableHead>Gravità</TableHead>
                    <TableHead>Soluzione consigliata</TableHead>
                    <TableHead>Priorità</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.gbpAnalysis.issues.map((issue) => (
                    <TableRow key={issue.problem}>
                      <TableCell>{issue.problem}</TableCell>
                      <TableCell>{issue.whyItHurts}</TableCell>
                      <TableCell>{issue.bookingImpact}</TableCell>
                      <TableCell>
                        <Badge variant={severityVariant[issue.severity]}>{issue.severity}</Badge>
                      </TableCell>
                      <TableCell>{issue.recommendation}</TableCell>
                      <TableCell>{issue.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Competitor locali</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome competitor</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Recensioni</TableHead>
                    <TableHead>Punto di forza</TableHead>
                    <TableHead>Livello minaccia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.gbpAnalysis.localCompetitors.length ? (
                    report.gbpAnalysis.localCompetitors.map((row) => (
                      <TableRow key={row.competitor}>
                        <TableCell>{row.competitor}</TableCell>
                        <TableCell>{row.rating}</TableCell>
                        <TableCell>{row.reviews}</TableCell>
                        <TableCell>{row.strength}</TableCell>
                        <TableCell>{row.threat}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="font-semibold text-slate-500">
                        Fonte Google Business non disponibile: competitor locali non verificabili.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </section>
          </RevealOnScroll>
        ) : null}

        {hasBookingData ? (
          <RevealOnScroll delay={90}>
            <section className="space-y-6">
            <SectionTitle icon={Star} title="Sentiment Booking.com & Reputazione" />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Distribuzione Sentiment Ospiti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mb-2 flex h-6 overflow-hidden rounded-full shadow-inner">
                  <div
                    className="flex items-center justify-center bg-[#95C11F] text-[11px] font-black text-white"
                    style={{ width: `${report.charts.bookingSentiment.find((item) => item.name === "Positivo")?.value ?? 0}%` }}
                  >
                    {report.charts.bookingSentiment.find((item) => item.name === "Positivo")?.value ?? 0}% POSITIVO
                  </div>
                  <div
                    className="flex items-center justify-center bg-red-500 text-[11px] font-black text-white"
                    style={{ width: `${report.charts.bookingSentiment.find((item) => item.name === "Negativo")?.value ?? 0}%` }}
                  >
                    {report.charts.bookingSentiment.find((item) => item.name === "Negativo")?.value ?? 0}%
                  </div>
                </div>

                <div>
                  <h5 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Fattori Positivi (Driver di vendita)
                  </h5>
                  <div className="space-y-3">
                    {report.bookingAnalysis.factors
                      .filter((item) => item.severity === "Bassa" || item.severity === "Media")
                      .slice(0, 2)
                      .map((factor) => (
                        <div key={factor.factor} className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#95C11F]" />
                          <p className="text-sm font-semibold text-slate-600">
                            <strong className="font-extrabold text-slate-900">{factor.factor}:</strong> {factor.guestPerception}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h5 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Pattern Negativi (Freni all&apos;acquisto)
                  </h5>
                  <div className="space-y-3">
                    {report.bookingAnalysis.factors
                      .filter((item) => item.severity === "Alta" || item.severity === "Critica")
                      .slice(0, 2)
                      .map((factor) => (
                        <div key={factor.factor} className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                          <p className="text-sm font-semibold text-slate-600">
                            <strong className="font-extrabold text-slate-900">{factor.factor}:</strong> {factor.impact}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                  <Building2 className="h-5 w-5 text-[#95C11F]" /> Interventi fisici consigliati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.bookingAnalysis.physicalInterventions.map((item) => (
                    <li key={item} className="flex gap-3 text-sm font-semibold text-slate-600">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#95C11F]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                  <Laptop className="h-5 w-5 text-[#95C11F]" /> Ottimizzazioni pagina OTA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.bookingAnalysis.otaOptimizations.map((item) => (
                    <li key={item} className="flex gap-3 text-sm font-semibold text-slate-600">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#95C11F]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Fattori analizzati</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fattore analizzato</TableHead>
                    <TableHead>Percezione degli ospiti</TableHead>
                    <TableHead>Impatto su reputazione e conversione</TableHead>
                    <TableHead>Gravità</TableHead>
                    <TableHead>Miglioramento consigliato</TableHead>
                    <TableHead>Priorità</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.bookingAnalysis.factors.map((factor) => (
                    <TableRow key={factor.factor}>
                      <TableCell>{factor.factor}</TableCell>
                      <TableCell>{factor.guestPerception}</TableCell>
                      <TableCell>{factor.impact}</TableCell>
                      <TableCell>
                        <Badge variant={severityVariant[factor.severity]}>{factor.severity}</Badge>
                      </TableCell>
                      <TableCell>{factor.recommendation}</TableCell>
                      <TableCell>{factor.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </section>
          </RevealOnScroll>
        ) : null}

        <RevealOnScroll delay={100}>
          <section className="space-y-6">
          <SectionTitle icon={TrendingUp} title="Competitor" />
          <Card>
            <CardContent className="overflow-x-auto p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome competitor</TableHead>
                    <TableHead>Canale</TableHead>
                    <TableHead>Perché è più forte</TableHead>
                    <TableHead>Dove supera l&apos;hotel</TableHead>
                    <TableHead>Livello di minaccia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasGbpData || hasBookingData ? (
                    report.competitors.map((competitor) => (
                      <TableRow key={competitor.name}>
                        <TableCell>{competitor.name}</TableCell>
                        <TableCell>{competitor.channel}</TableCell>
                        <TableCell>{competitor.strongerWhy}</TableCell>
                        <TableCell>{competitor.whereAhead}</TableCell>
                        <TableCell>{competitor.threatLevel}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="font-semibold text-slate-500">
                        Competitor non verificabili: fornire almeno una fonte GBP o Booking.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={110}>
          <section className="space-y-6">
          <SectionTitle icon={AlertTriangle} title="Analisi Commerciale" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Perdita probabile di prenotazioni dirette</CardTitle>
              </CardHeader>
              <CardContent className="font-semibold text-slate-600">{report.revenueInsights.directBookingLoss}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Rischio dipendenza da OTA</CardTitle>
              </CardHeader>
              <CardContent className="font-semibold text-slate-600">{report.revenueInsights.otaDependencyRisk}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Dispersione di marginalità</CardTitle>
              </CardHeader>
              <CardContent className="font-semibold text-slate-600">{report.revenueInsights.marginDispersion}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Limiti del posizionamento percepito</CardTitle>
              </CardHeader>
              <CardContent className="font-semibold text-slate-600">{report.revenueInsights.positioningLimits}</CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Opportunità per ADR, RevPAR e quota diretta</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-[#7A9D17]">{report.revenueInsights.growthOpportunity}</CardContent>
          </Card>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={120}>
          <section className="space-y-6">
          <SectionTitle icon={BarChart3} title="Piano d&apos;Azione" />
          <div className="grid gap-6 lg:grid-cols-2">
            <TimelineCard title="0-30 giorni" rows={report.actionPlan.from0to30} />
            <TimelineCard title="30-60 giorni" rows={report.actionPlan.from30to60} />
            <TimelineCard title="60-120 giorni" rows={report.actionPlan.from60to120} />
            <TimelineCard title="3-6 mesi" rows={report.actionPlan.from3to6Months} />
          </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={130}>
          <section className="pt-8">
          <Card className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-0 text-center text-white">
            <div className="pointer-events-none absolute -right-12 -top-14 h-64 w-64 rounded-full bg-[#95C11F]/20 blur-3xl" />
            <CardContent className="relative z-10 space-y-6 p-10 md:p-14">
              <h3 className="text-3xl font-black tracking-tight md:text-5xl">Inizia la trasformazione.</h3>
              <p className="mx-auto max-w-3xl text-lg font-semibold text-slate-300 md:text-xl">
                Hotel Target ti aiuta ad aumentare la visibilità organica, incrementare le prenotazioni dirette,
                ridurre le commissioni OTA e scalare il RevPAR.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button className="h-12 rounded-xl px-8 text-base font-black">Richiedi consulenza privata</Button>
                <Button variant="outline" className="h-12 rounded-xl border-slate-700 bg-transparent px-8 text-base font-bold text-white hover:bg-slate-800">
                  <Mail className="h-5 w-5" /> Condividi via email
                </Button>
              </div>
            </CardContent>
          </Card>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={140}>
          <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Email pronta da inviare</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={report.emailSummary.body} className="min-h-72" />
              <div className="mt-4 flex justify-end">
                <Button onClick={handleCopyEmail}>
                  <CheckCircle2 className="h-4 w-4" /> Copia testo email
                </Button>
              </div>
            </CardContent>
          </Card>
          </section>
        </RevealOnScroll>
      </main>
    </div>
  );
}
