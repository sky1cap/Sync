"use client";

import { Activity, Cpu, ShieldCheck } from "lucide-react";

const signalBars = [36, 52, 44, 68, 74, 62, 88, 76];

const nodePoints = [
  { label: "POS", x: 18, y: 22 },
  { label: "HACCP", x: 78, y: 20 },
  { label: "HR", x: 16, y: 78 },
  { label: "FIN", x: 80, y: 76 },
  { label: "XEO", x: 50, y: 50, core: true },
];

export function GraphicComponentsSection() {
  const score = 88;
  const scoreDeg = score * 3.6;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-35px_rgba(2,6,23,0.45)]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-mono-alt text-[10px] uppercase tracking-[0.14em] text-sky-700">
          <Activity className="h-3.5 w-3.5" />
          Live Signal
        </div>
        <h3 className="font-display text-xl text-slate-950">Flusso Operativo in Tempo Reale</h3>
        <p className="mt-2 text-sm text-slate-600">
          Visualizzazione immediata di throughput ordini, check HACCP e saturazione team.
        </p>
        <div className="mt-6 flex h-36 items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          {signalBars.map((value, index) => (
            <div key={`bar-${index}`} className="relative flex-1">
              <div
                className="xeo-signal-bar w-full rounded-md bg-gradient-to-t from-cyan-500 to-blue-500"
                style={{
                  height: `${value}%`,
                  animationDelay: `${index * 0.14}s`,
                }}
              />
            </div>
          ))}
        </div>
      </article>

      <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-35px_rgba(2,6,23,0.45)]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono-alt text-[10px] uppercase tracking-[0.14em] text-indigo-700">
          <Cpu className="h-3.5 w-3.5" />
          Node Mesh
        </div>
        <h3 className="font-display text-xl text-slate-950">Mappa Nodi C/U/P</h3>
        <p className="mt-2 text-sm text-slate-600">
          Commercio, utenti e processi collegati in una mesh unica con core centrale senziente.
        </p>
        <div className="relative mt-6 h-36 rounded-xl border border-slate-100 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_58%)]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <path className="xeo-flow-path" d="M18 22 Q50 10 78 20" />
            <path className="xeo-flow-path" d="M18 78 Q50 88 80 76" />
            <path className="xeo-flow-path" d="M18 22 Q36 50 50 50" />
            <path className="xeo-flow-path" d="M78 20 Q63 48 50 50" />
            <path className="xeo-flow-path" d="M16 78 Q35 62 50 50" />
            <path className="xeo-flow-path" d="M80 76 Q66 62 50 50" />
          </svg>

          {nodePoints.map((node) => (
            <div
              key={node.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div
                className={
                  node.core
                    ? "h-7 w-7 rounded-full border border-cyan-300 bg-cyan-100 shadow-[0_0_0_6px_rgba(34,211,238,0.2)]"
                    : "h-3.5 w-3.5 rounded-full border border-slate-200 bg-white shadow-[0_0_0_4px_rgba(148,163,184,0.18)]"
                }
              />
              <span className="mt-1 block text-center font-mono-alt text-[9px] uppercase tracking-[0.12em] text-slate-500">
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-35px_rgba(2,6,23,0.45)]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono-alt text-[10px] uppercase tracking-[0.14em] text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Sentient Score
        </div>
        <h3 className="font-display text-xl text-slate-950">Indice Salute Sistema</h3>
        <p className="mt-2 text-sm text-slate-600">
          Score aggregato compliance, uptime sensori e performance operativa globale.
        </p>
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div
            className="relative h-24 w-24 rounded-full"
            style={{
              background: `conic-gradient(#06b6d4 0deg ${scoreDeg}deg, #e2e8f0 ${scoreDeg}deg 360deg)`,
            }}
          >
            <div className="absolute inset-[8px] flex items-center justify-center rounded-full bg-white font-display text-2xl text-slate-950">
              {score}
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-display text-lg text-slate-900">88/100</p>
            <p className="font-mono-alt text-[11px] uppercase tracking-[0.12em] text-slate-500">
              Livello enterprise
            </p>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
              <div className="xeo-progress h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
            </div>
          </div>
        </div>
      </article>

      <style jsx>{`
        .xeo-signal-bar {
          animation: xeo-rise 2.4s ease-in-out infinite alternate;
          transform-origin: bottom;
          box-shadow: 0 8px 22px -8px rgba(14, 165, 233, 0.6);
        }

        .xeo-flow-path {
          stroke: rgba(14, 116, 144, 0.45);
          stroke-width: 1.3;
          stroke-dasharray: 4 4;
          animation: xeo-flow 2.8s linear infinite;
        }

        .xeo-progress {
          width: 88%;
          animation: xeo-pulse 2.6s ease-in-out infinite;
        }

        @keyframes xeo-rise {
          0% {
            transform: scaleY(0.72);
            opacity: 0.66;
          }
          100% {
            transform: scaleY(1.08);
            opacity: 1;
          }
        }

        @keyframes xeo-flow {
          from {
            stroke-dashoffset: 16;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes xeo-pulse {
          0%,
          100% {
            filter: saturate(0.9);
          }
          50% {
            filter: saturate(1.2);
          }
        }
      `}</style>
    </div>
  );
}
