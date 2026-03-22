"use client";

import React, { useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  Lock,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";

type ChecklistItemProps = {
  title: string;
  active: boolean;
};

export function FlowHomePage() {
  const [captureActive, setCaptureActive] = useState(false);

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-zinc-100 selection:bg-cyan-500/30">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col overflow-hidden rounded-[3rem] border-[8px] border-zinc-900 bg-black shadow-2xl">
        <div className="z-50 flex h-14 w-full items-center justify-between bg-black px-7 text-xs font-semibold text-zinc-400">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-4 rounded-[3px] bg-zinc-400" />
            <div className="h-3 w-3 rounded-full bg-zinc-400" />
            <div className="relative flex h-2.5 w-5 items-center rounded-[3px] border border-zinc-400 p-[1px]">
              <div className="h-full w-3.5 rounded-[1px] bg-zinc-400" />
            </div>
          </div>
        </div>

        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto px-6 pb-10">
          <div className="flex items-center justify-between pb-8 pt-4">
            <h1 className="flex items-center gap-2 font-[var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-white">
              Flow AI
            </h1>
            <button className="text-zinc-500 transition-colors hover:text-white" type="button">
              <Settings size={22} strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative mb-8 flex flex-col items-center justify-center py-10">
            {captureActive ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[60px] animate-pulse" />
            ) : null}

            <button
              className={`z-10 flex h-32 w-32 flex-col items-center justify-center gap-3 rounded-full transition-all duration-500 ${
                captureActive
                  ? "scale-95 bg-zinc-900 text-cyan-400 shadow-[0_0_0_1px_rgba(6,182,212,0.3)]"
                  : "border border-zinc-800 bg-[#0a0a0a] text-zinc-400 hover:bg-[#111]"
              }`}
              onClick={() => setCaptureActive((value) => !value)}
              type="button"
            >
              {captureActive ? (
                <Activity size={32} strokeWidth={1.5} className="animate-pulse" />
              ) : (
                <Sparkles size={32} strokeWidth={1.5} />
              )}
            </button>

            <div className="z-10 mt-8 text-center">
              <h2
                className={`mb-2 text-xl font-bold transition-colors duration-500 ${
                  captureActive ? "text-white" : "text-zinc-300"
                }`}
              >
                {captureActive ? "Flow is Active" : "AI Dormant"}
              </h2>
              <p className="mx-auto max-w-[240px] text-sm font-medium leading-relaxed text-zinc-500">
                {captureActive
                  ? "Ready to analyze context when you tap Flow on the keyboard."
                  : "Tap to activate the context engine for your keyboard."}
              </p>
            </div>
          </div>

          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-zinc-900 bg-[#0a0a0a] p-4">
            <Lock size={16} className="mt-0.5 shrink-0 text-zinc-500" />
            <p className="text-xs font-medium leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-200">Privacy strictly enforced.</span>{" "}
              Screen data is completely ignored until manually triggered. Nothing is saved or
              continuously monitored.
            </p>
          </div>

          <div className="mb-10">
            <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              System Requirements
            </h3>
            <div className="flex flex-col gap-1">
              <ChecklistItem title="Enable in iOS Settings" active />
              <ChecklistItem title="Allow Full Access" active />
              <ChecklistItem title="Activate Flow Engine" active={captureActive} />
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3">
            <div className="flex h-28 flex-col justify-between rounded-2xl border border-zinc-900 bg-[#0a0a0a] p-4">
              <BarChart3 size={16} className="text-zinc-600" />
              <div>
                <div className="mb-0.5 text-2xl font-bold text-white">142</div>
                <div className="text-xs font-medium text-zinc-500">Replies sent</div>
              </div>
            </div>
            <div className="flex h-28 flex-col justify-between rounded-2xl border border-zinc-900 bg-[#0a0a0a] p-4">
              <Shield size={16} className="text-zinc-600" />
              <div>
                <div className="mb-0.5 text-2xl font-bold text-white">100%</div>
                <div className="text-xs font-medium text-zinc-500">Private &amp; secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ title, active }: ChecklistItemProps) {
  return (
    <div className="group flex items-center gap-4 py-3">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300 ${
          active
            ? "bg-zinc-100 text-black"
            : "border border-zinc-800 bg-[#0a0a0a] text-transparent"
        }`}
      >
        <Check size={12} strokeWidth={3} className={active ? "opacity-100" : "opacity-0"} />
      </div>
      <span
        className={`text-sm font-semibold transition-colors duration-300 ${
          active ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400"
        }`}
      >
        {title}
      </span>
    </div>
  );
}
