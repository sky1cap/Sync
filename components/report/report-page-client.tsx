"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditReport } from "@/lib/types/report";
import { loadReport } from "@/lib/utils/report-storage";

export function ReportPageClient({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<AuditReport | null>(null);

  useEffect(() => {
    setReport(loadReport(reportId));
  }, [reportId]);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#95C11F] shadow-md shadow-[#95C11F]/20">
                <Target className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-black tracking-tight text-slate-900">HotelTarget</p>
            </div>
            <Link href="/">
              <Button>Nuova analisi</Button>
            </Link>
          </div>
        </header>

        <div className="mx-auto flex max-w-3xl items-center px-4 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Report non trovato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-slate-600">
                Questo report non è disponibile nello storage locale. Esegui una nuova analisi dalla landing page.
              </p>
              <Link href="/">
                <Button>Nuova analisi</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#95C11F] shadow-md shadow-[#95C11F]/20">
              <Target className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-900">HotelTarget</p>
          </Link>

          <Link href="/">
            <Button variant="outline">Nuova analisi</Button>
          </Link>
        </div>
      </header>

      <ReportDashboard report={report} />
    </main>
  );
}
