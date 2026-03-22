"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleCheckBig,
  Menu,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { XeoHeroVisual } from "@/components/landing/xeo-hero-visual";
import { GraphicComponentsSection } from "@/components/landing/graphic-components";

type Problem = {
  title: string;
  copy: string;
  stat: string;
};

type Organ = {
  id?: string;
  code: string;
  title: string;
  copy: string;
};

type ModuleCard = {
  id?: string;
  title: string;
  subtitle: string;
  points: string[];
};

type Metric = {
  value: string;
  label: string;
};

type ComplianceStep = {
  year: string;
  title: string;
  detail: string;
};

type Plan = {
  name: string;
  price: string;
  focus: string;
  note: string;
  featured?: boolean;
};

const navItems = [
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "#marketplace", label: "Modules" },
  { href: "#haccp", label: "Compliance" },
  { href: "#pitch", label: "Demo" },
];

const problems: Problem[] = [
  {
    title: "Tassa di frammentazione",
    copy: "4+ software scollegati generano errori operativi su food cost, staffing e controllo cassa.",
    stat: "Fino al -10% di fatturato",
  },
  {
    title: "Caos HR",
    copy: "Turni e presenze gestiti su strumenti non integrati rallentano il servizio e alzano i costi.",
    stat: "Turnover settore servizi 47,1%",
  },
  {
    title: "Pressione normativa",
    copy: "Nuovi obblighi su tracciabilità e conformità rendono insufficiente la gestione manuale.",
    stat: "Multe 150€–2.000€+",
  },
];

const organs: Organ[] = [
  {
    code: "[C]",
    title: "Commerce",
    copy: "POS cloud-native e prenotazioni dirette per recuperare margine e proprietà del dato cliente.",
  },
  {
    code: "[U]",
    title: "Users & Logistics",
    copy: "Presenze HR, payroll e IoT HACCP in un unico flusso verificabile e continuo.",
  },
  {
    code: "[P]",
    title: "Processes",
    copy: "Intelligenza finanziaria e automazione SDI per decisioni operative in tempo reale.",
  },
];

const modules: ModuleCard[] = [
  {
    title: "Il Veggente",
    subtitle: "Previsioni incassi e food cost",
    points: [
      "Incrocia storico, meteo ed eventi locali.",
      "Genera liste ordine automatiche per fornitori.",
      "Stabilizza il food cost nel range target 28–32%.",
    ],
  },
  {
    id: "haccp",
    title: "Il Controllore",
    subtitle: "Conformità e sicurezza continua",
    points: [
      "Alert guasti fino a 72h prima su impianti critici.",
      "Sensori IoT integrati per monitoraggio 24/7.",
      "Registri HACCP digitali pronti per audit.",
    ],
  },
  {
    id: "marketplace",
    title: "Il Coach",
    subtitle: "HR compliance e vendite live",
    points: [
      "Time-tracking con geofencing conforme.",
      "Riduzione lavoro amministrativo fino al 60%.",
      "Suggerimenti upsell in tempo reale al POS.",
    ],
  },
];

const metrics: Metric[] = [
  { value: "+600%", label: "ROI potenziale dal primo mese (scenario deck)" },
  { value: "0%", label: "Commissioni su prenotazioni dirette" },
  { value: "+850€", label: "Cassa netta mensile stimata (Tier 3)" },
  { value: "88/100", label: "Sentient score operativo" },
];

const complianceSteps: ComplianceStep[] = [
  {
    year: "2025",
    title: "Transizione digitale",
    detail: "HACCP cloud, eliminazione progressiva carta, tracciabilità più rigorosa.",
  },
  {
    year: "2026",
    title: "Zero tolerance",
    detail: "Nuovi standard su sicurezza alimentare e imballaggi: serve controllo continuo.",
  },
  {
    year: "2027–2028",
    title: "Riutilizzo",
    detail: "Obblighi su packaging riutilizzabile e sistemi di deposito più strutturati.",
  },
  {
    year: "2029–2030",
    title: "Conformità totale",
    detail: "Raccolta differenziata 90% e tracciabilità sempre più nativa IoT + cloud.",
  },
];

const plans: Plan[] = [
  {
    name: "Tier 1 · Safe",
    price: "49€ / mese",
    focus: "Solo HACCP e sicurezza.",
    note: "Ingresso rapido per esigenze normative.",
  },
  {
    name: "Tier 2 · Intelligence",
    price: "99€ / mese",
    focus: "HACCP + previsioni magazzino.",
    note: "Bilancia controllo e crescita operativa.",
    featured: true,
  },
  {
    name: "Tier 3 · Full XEO",
    price: "149€ / mese",
    focus: "POS, HR, CRM e AI predittiva completa.",
    note: "La CPU completa del locale.",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <Reveal className="max-w-3xl">
      <p className="font-mono-alt text-[11px] uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl tracking-[-0.02em] text-slate-950 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
    </Reveal>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  return (
    <div className="relative overflow-x-clip bg-[#f6f7fb] text-[#0d1b2a]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_88%_5%,rgba(37,99,235,0.11),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f6f7fb_35%,#eff2f7_100%)]" />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-slate-200/80 bg-white/85 shadow-[0_10px_35px_-25px_rgba(15,23,42,0.55)] backdrop-blur-lg"
            : "border-transparent bg-white/65 backdrop-blur",
        )}
      >
        <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Homepage XEO">
            <span className="font-display text-2xl font-semibold tracking-[-0.02em]">XEO</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono-alt text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Sentient OS
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-display text-[13px] tracking-[0.04em] text-slate-700 transition hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <a
              href="#pitch"
              className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-4 py-2.5 font-display text-xs text-white transition hover:bg-[#020617]"
            >
              Richiedi Demo <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white/95 px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2 font-display text-sm text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-28 sm:px-6 md:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono-alt text-[11px] uppercase tracking-[0.15em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              X-Efficienza Operativa
            </div>

            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-6xl">
              XEO, la CPU senziente per la ristorazione moderna
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-700">
              Un sistema operativo unificato che connette vendite, operations, HACCP e workforce: meno attrito,
              più margine, più controllo in tempo reale.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/analisi"
                className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-3 font-display text-sm text-white transition hover:bg-black"
              >
                Richiedi demo <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#ecosystem"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-display text-sm text-slate-800 transition hover:border-slate-400"
              >
                Scopri la piattaforma <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <XeoHeroVisual />
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Main Challenges"
            title="Le frizioni strutturali che XEO risolve"
            subtitle="Le dinamiche emerse da business plan e deck: frammentazione, pressione HR e compliance crescente."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {problems.map((problem, idx) => (
              <Reveal key={problem.title} delay={idx * 80}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                  <TriangleAlert className="h-5 w-5 text-rose-500" />
                  <h3 className="mt-4 font-display text-2xl tracking-[-0.01em] text-slate-950">{problem.title}</h3>
                  <p className="mt-3 text-slate-600">{problem.copy}</p>
                  <p className="mt-5 inline-flex rounded-full bg-rose-50 px-3 py-1 font-mono-alt text-[11px] uppercase tracking-[0.12em] text-rose-700">
                    {problem.stat}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="ecosystem" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Single Source Of Truth"
            title="Un’unica architettura, tre organi vitali"
            subtitle="Il modello C/U/P sostituisce i silos e sincronizza ogni decisione operativa nello stesso sistema." 
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {organs.map((organ, idx) => (
              <Reveal key={organ.code} delay={idx * 90}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="font-display text-2xl text-slate-950">{organ.code}</p>
                  <h3 className="mt-3 font-display text-xl text-slate-950">{organ.title}</h3>
                  <p className="mt-3 text-slate-600">{organ.copy}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Impact"
            title="Risultati operativi visibili da subito"
            subtitle="I principali outcome business evidenziati nei materiali: margine, controllo e velocità decisionale."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => (
              <Reveal key={metric.label} delay={idx * 70}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-display text-4xl tracking-[-0.03em] text-slate-950">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{metric.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Graphic Layer"
            title="Componenti visivi dati-driven"
            subtitle="Un layer grafico che rende leggibili segnali, connessioni e stato salute della piattaforma."
          />
          <Reveal className="mt-8">
            <GraphicComponentsSection />
          </Reveal>
        </section>

        <section id="marketplace" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Modules"
            title="Tre moduli AI, una sola regia"
            subtitle="Veggente, Controllore e Coach lavorano in continuità per previsione, protezione e performance del team."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {modules.map((module, idx) => (
              <Reveal key={module.title} delay={idx * 90}>
                <article id={module.id} className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-display text-2xl tracking-[-0.01em] text-slate-950">{module.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{module.subtitle}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {module.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="haccp" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Compliance Path"
            title="Roadmap normativa in vista: meglio essere già pronti"
            subtitle="Dal 2025 al 2030, la compliance diventa sempre più operativa. XEO nasce per gestirla nativamente."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {complianceSteps.map((step, idx) => (
              <Reveal key={step.year} delay={idx * 70}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-mono-alt text-[11px] uppercase tracking-[0.14em] text-emerald-700">{step.year}</p>
                  <h3 className="mt-2 font-display text-xl text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Pricing"
            title="Modello SaaS scalabile"
            subtitle="Tre livelli progressivi per partire subito e crescere senza cambiare stack." 
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {plans.map((plan, idx) => (
              <Reveal key={plan.name} delay={idx * 80}>
                <article
                  className={cn(
                    "h-full rounded-2xl border p-6",
                    plan.featured
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900",
                  )}
                >
                  <p className={cn("font-display text-2xl", plan.featured ? "text-white" : "text-slate-900")}>{plan.name}</p>
                  <p className={cn("mt-3 font-display text-4xl tracking-[-0.02em]", plan.featured ? "text-white" : "text-slate-900")}>{plan.price}</p>
                  <p className={cn("mt-3 text-sm", plan.featured ? "text-slate-200" : "text-slate-600")}>{plan.focus}</p>
                  <p className={cn("mt-3 text-sm", plan.featured ? "text-slate-300" : "text-slate-500")}>{plan.note}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="pitch" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Reveal className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="font-mono-alt text-[11px] uppercase tracking-[0.16em] text-slate-500">Start Now</p>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.02em] text-slate-950 sm:text-4xl">
                  Porta XEO nel tuo locale
                </h2>
                <p className="mt-3 text-slate-600">
                  Demo guidata, analisi operativa iniziale e piano di attivazione modulare senza fermare il servizio.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/analisi"
                    className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-3 font-display text-sm text-white transition hover:bg-black"
                  >
                    Prenota demo <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="mailto:hello@xeo.ai"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-display text-sm text-slate-800 transition hover:border-slate-400"
                  >
                    Contatta il team
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="font-display text-xl text-slate-950">Perché ora</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {[
                    "Normativa e compliance in accelerazione.",
                    "Margini compressi e costi in volatilità continua.",
                    "Finestra ideale per passare da gestione reattiva a cognitiva.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CircleCheckBig className="mt-0.5 h-4 w-4 text-emerald-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-600" />
            <p className="text-sm text-slate-600">XEO Sentient Restaurant Intelligence</p>
          </div>
          <p className="font-mono-alt text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Website edition · product-first messaging
          </p>
          <p className="text-sm text-slate-500">© 2026 XEO Technologies</p>
        </div>
      </footer>
    </div>
  );
}
