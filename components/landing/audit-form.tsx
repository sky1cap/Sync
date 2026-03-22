"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, Laptop, MapPin, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LOADING_STEPS, LoadingOverlay } from "@/components/landing/loading-overlay";
import { GenerateAuditResponse } from "@/lib/types/report";
import { saveReport } from "@/lib/utils/report-storage";
import { auditInputClientSchema, AuditInputClientFormValues } from "@/lib/validations/audit";

export function AuditForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const form = useForm<AuditInputClientFormValues>({
    resolver: zodResolver(auditInputClientSchema),
    defaultValues: {
      hotelName: "",
      websiteUrl: "",
      googleBusinessUrl: "",
      bookingUrl: "",
      gbpRating: undefined,
      gbpReviewCount: undefined,
      gbpPrimaryCategory: "",
      gbpPositiveHighlights: "",
      gbpNegativeHighlights: "",
      bookingRating: undefined,
      bookingReviewCount: undefined,
      bookingPositiveHighlights: "",
      bookingNegativeHighlights: "",
      recipientEmail: "",
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      setSubmitError(null);
      setIsLoading(true);
      setLoadingStep(0);

      try {
        const responsePromise = fetch("/api/generate-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const animationPromise = (async () => {
          for (let step = 0; step < LOADING_STEPS.length; step += 1) {
            setLoadingStep(step);
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
        })();

        const [response] = await Promise.all([responsePromise, animationPromise]);

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          setSubmitError(payload.error ?? "Errore durante la generazione del report");
          setIsLoading(false);
          return;
        }

        const payload = (await response.json()) as GenerateAuditResponse;
        saveReport(payload.report);
        router.push(`/report/${payload.report.id}`);
      } catch {
        setSubmitError("Errore di rete durante la generazione del report. Riprova.");
        setIsLoading(false);
      }
    },
    () => {
      setSubmitError("Controlla i campi obbligatori e correggi gli errori evidenziati.");
    },
  );

  return (
    <>
      <LoadingOverlay active={isLoading} loadingStep={loadingStep} />

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-extrabold text-slate-700">
            URL Sito Ufficiale <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Laptop className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-bold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
              placeholder="URL Sito Ufficiale (https://...)"
              {...form.register("websiteUrl")}
            />
          </div>
          {form.formState.errors.websiteUrl ? (
            <p className="mt-2 text-xs font-bold text-red-500">{form.formState.errors.websiteUrl.message as string}</p>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <p className="mb-4 text-center text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Dati aggiuntivi (3 campi)
          </p>

          <div className="group relative">
            <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#95C11F]" />
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
              placeholder="Nome Struttura"
              {...form.register("hotelName")}
            />
          </div>
          {form.formState.errors.hotelName ? (
            <p className="text-xs font-bold text-red-500">{form.formState.errors.hotelName.message as string}</p>
          ) : null}

          <div className="group relative">
            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#95C11F]" />
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
              placeholder="URL Google Business Profile"
              {...form.register("googleBusinessUrl")}
            />
          </div>
          {form.formState.errors.googleBusinessUrl ? (
            <p className="text-xs font-bold text-red-500">{form.formState.errors.googleBusinessUrl.message as string}</p>
          ) : null}

          <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Fallback GBP (se URL bloccato)
            </summary>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                  placeholder="Punteggio GBP (es. 4.3)"
                  {...form.register("gbpRating")}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                  placeholder="Numero recensioni GBP (es. 860)"
                  {...form.register("gbpReviewCount")}
                />
              </div>
              {form.formState.errors.gbpRating ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.gbpRating.message as string}</p>
              ) : null}
              {form.formState.errors.gbpReviewCount ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.gbpReviewCount.message as string}</p>
              ) : null}

              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                placeholder="Categoria principale (es. Hotel 4 stelle)"
                {...form.register("gbpPrimaryCategory")}
              />
              {form.formState.errors.gbpPrimaryCategory ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.gbpPrimaryCategory.message as string}</p>
              ) : null}

              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                placeholder="Pattern positivi GBP (es. posizione, staff, servizi)"
                {...form.register("gbpPositiveHighlights")}
              />
              {form.formState.errors.gbpPositiveHighlights ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.gbpPositiveHighlights.message as string}</p>
              ) : null}

              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                placeholder="Pattern negativi GBP (es. attese, pulizia, risposte)"
                {...form.register("gbpNegativeHighlights")}
              />
              {form.formState.errors.gbpNegativeHighlights ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.gbpNegativeHighlights.message as string}</p>
              ) : null}
            </div>
          </details>

          <div className="group relative">
            <Star className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#95C11F]" />
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
              placeholder="URL Pagina Booking.com"
              {...form.register("bookingUrl")}
            />
          </div>
          {form.formState.errors.bookingUrl ? (
            <p className="text-xs font-bold text-red-500">{form.formState.errors.bookingUrl.message as string}</p>
          ) : null}

          <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Fallback Booking (se URL bloccato)
            </summary>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                  placeholder="Punteggio Booking (es. 8.4)"
                  {...form.register("bookingRating")}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                  placeholder="Numero recensioni (es. 1240)"
                  {...form.register("bookingReviewCount")}
                />
              </div>
              {form.formState.errors.bookingRating ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.bookingRating.message as string}</p>
              ) : null}
              {form.formState.errors.bookingReviewCount ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.bookingReviewCount.message as string}</p>
              ) : null}

              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                placeholder="Pattern positivi (es. colazione, posizione, staff)"
                {...form.register("bookingPositiveHighlights")}
              />
              {form.formState.errors.bookingPositiveHighlights ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.bookingPositiveHighlights.message as string}</p>
              ) : null}

              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#95C11F] focus:outline-none focus:ring-4 focus:ring-[#95C11F]/10"
                placeholder="Pattern negativi (es. rumore, pulizia, bagno)"
                {...form.register("bookingNegativeHighlights")}
              />
              {form.formState.errors.bookingNegativeHighlights ? (
                <p className="text-xs font-bold text-red-500">{form.formState.errors.bookingNegativeHighlights.message as string}</p>
              ) : null}
            </div>
          </details>
        </div>

        {submitError ? <p className="rounded-lg bg-red-50 py-2 text-center text-sm font-bold text-red-500">{submitError}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#95C11F] py-4 text-lg font-black text-white shadow-[0_10px_20px_-10px_rgba(149,193,31,0.5)] transition-all hover:bg-[#85AD1A] hover:shadow-[0_15px_25px_-10px_rgba(149,193,31,0.6)]"
        >
          {isLoading ? "Generazione in corso..." : "Genera Report AI"}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </>
  );
}
