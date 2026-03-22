"use client";

import {
  Activity,
  CheckCircle2,
  Laptop,
  LayoutDashboard,
  MapPin,
  Search,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export const LOADING_STEPS = [
  { text: "Inizializzazione Motore AI...", icon: Zap },
  { text: "Scansione architettura sito web...", icon: Laptop },
  { text: "Analisi metrica Core Web Vitals...", icon: Activity },
  { text: "Estrazione dati Google Business...", icon: MapPin },
  { text: "Analisi semantica recensioni OTA...", icon: Star },
  { text: "Calcolo metriche di revenue...", icon: TrendingUp },
  { text: "Generazione report strategico...", icon: LayoutDashboard },
];

export function LoadingOverlay({
  active,
  loadingStep,
}: {
  active: boolean;
  loadingStep: number;
}) {
  const safeStep = Math.min(Math.max(loadingStep, 0), LOADING_STEPS.length - 1);
  const progress = Math.round(((safeStep + 1) / LOADING_STEPS.length) * 100);

  if (!active) return null;

  return (
    <div className="animate-fade-in-soft fixed inset-0 z-[70] min-h-screen overflow-hidden bg-[#F8FAFC] p-6">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#95C11F] shadow-md shadow-[#95C11F]/20">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">HotelTarget</h1>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <span className="cursor-pointer text-sm font-bold text-slate-500 transition-colors hover:text-slate-900">Website Audit</span>
            <span className="cursor-pointer text-sm font-bold text-slate-500 transition-colors hover:text-slate-900">Local SEO</span>
            <span className="cursor-pointer text-sm font-bold text-slate-500 transition-colors hover:text-slate-900">Reputation</span>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg md:flex">
            <LayoutDashboard className="h-4 w-4" />
            Login
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#95C11F]/5 blur-[120px]" />

      <div className="animate-fade-up-soft relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg flex-col items-center justify-center pb-20">
          <div className="relative mb-10 mt-8 flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-4 border-[#95C11F]/20" />
            <div className="absolute inset-4 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_500ms] rounded-full border-4 border-[#95C11F]/40" />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-slate-50 bg-white shadow-2xl">
              <Search className="h-8 w-8 animate-pulse text-[#95C11F]" />
            </div>
            <div className="absolute inset-0 z-20 overflow-hidden rounded-full">
              <div className="h-1/2 w-full origin-bottom animate-[spin_2s_linear_infinite] bg-gradient-to-b from-transparent to-[#95C11F]/20" />
            </div>
          </div>

          <h2 className="mb-8 text-center text-3xl font-black tracking-tight text-slate-900">Analisi Salute in corso...</h2>

          <div className="relative h-[240px] w-full overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-16 bg-gradient-to-t from-white to-transparent" />

            <div
              className="absolute left-0 right-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ top: "88px", transform: `translateY(-${safeStep * 64}px)` }}
            >
              {LOADING_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === safeStep;
                const isPast = index < safeStep;

                return (
                  <div
                    key={step.text}
                    className={`flex h-[64px] w-full items-center gap-4 px-6 transition-all duration-500 md:px-8 ${
                      isActive
                        ? "scale-100 opacity-100"
                        : isPast
                          ? "-translate-y-2 scale-95 opacity-30"
                          : "translate-y-2 scale-95 opacity-30"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
                        isPast
                          ? "bg-[#95C11F] text-white shadow-md shadow-[#95C11F]/30"
                          : isActive
                            ? "bg-[#95C11F]/10 text-[#95C11F]"
                            : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isActive ? "animate-bounce" : ""}`} />
                      )}
                    </div>

                    <span className={`flex-grow text-base font-bold md:text-lg ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                      {step.text}
                    </span>

                    {isActive ? <div className="h-6 w-6 shrink-0 animate-spin rounded-full border-4 border-slate-100 border-t-[#95C11F]" /> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 w-full space-y-3 px-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Progresso Audit</span>
              <span className="text-sm font-black text-[#95C11F]">{progress}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full border border-slate-200/50 bg-slate-100 shadow-inner">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#7A9D17] to-[#95C11F] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 h-full w-full animate-[move_1s_linear_infinite] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
