"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type ListeningOrbProps = {
  phase: "idle" | "requesting" | "recording" | "uploading" | "done" | "error";
  secondsLeft: number;
};

const statusCopy: Record<ListeningOrbProps["phase"], string> = {
  idle: "Tap to arm the mic",
  requesting: "Waiting for microphone access",
  recording: "Capturing your 10-second sample",
  uploading: "Fingerprinting and matching your clip",
  done: "Recognition complete",
  error: "Try another clip",
};

export function ListeningOrb({ phase, secondsLeft }: ListeningOrbProps) {
  const isActive = phase === "requesting" || phase === "recording" || phase === "uploading";
  const ringClassName =
    phase === "error"
      ? "border-rose-400/40 shadow-[0_0_48px_rgba(244,63,94,0.18)]"
      : "border-emerald-300/25 shadow-[0_0_60px_rgba(52,211,153,0.22)]";

  return (
    <div className="relative flex flex-col items-center justify-center gap-6">
      <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border bg-emerald-300/6 blur-sm",
            ringClassName,
          )}
          animate={
            isActive
              ? {
                  scale: [1, 1.06, 1],
                  opacity: [0.55, 0.92, 0.55],
                }
              : {
                  scale: 1,
                  opacity: 0.72,
                }
          }
          transition={{
            duration: 2.8,
            ease: "easeInOut",
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          }}
        />

        <motion.div
          className="absolute inset-5 rounded-full border border-white/8 bg-white/4"
          animate={
            phase === "recording"
              ? {
                  scale: [1, 0.97, 1],
                  rotate: [0, 8, -8, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: phase === "recording" ? Number.POSITIVE_INFINITY : 0,
          }}
        />

        <motion.div
          className={cn(
            "glass-panel relative flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(97,242,194,0.34),transparent_55%),linear-gradient(180deg,rgba(14,20,38,0.96),rgba(6,8,20,0.98))]",
            phase === "error" && "border-rose-400/30",
          )}
          animate={
            isActive
              ? {
                  boxShadow: [
                    "0 0 0 rgba(97,242,194,0.18)",
                    "0 0 38px rgba(97,242,194,0.22)",
                    "0 0 0 rgba(97,242,194,0.18)",
                  ],
                }
              : {}
          }
          transition={{
            duration: 2.2,
            ease: "easeInOut",
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,rgba(97,242,194,0)_0deg,rgba(97,242,194,0.45)_120deg,rgba(97,242,194,0)_300deg)] opacity-50" />

          <div className="relative flex flex-col items-center gap-1">
            <span className="font-mono-alt text-[0.7rem] uppercase tracking-[0.34em] text-emerald-100/70">
              {phase === "recording" ? "Recording" : "Listening"}
            </span>
            <span className="font-display text-4xl font-semibold tracking-tight text-white">
              {phase === "recording" ? String(secondsLeft).padStart(2, "0") : "10s"}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="space-y-2 text-center">
        <motion.p
          className="font-display text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]"
          animate={
            isActive
              ? {
                  opacity: [0.7, 1, 0.7],
                }
              : {}
          }
          transition={{
            duration: 1.8,
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          Listening...
        </motion.p>
        <p className="mx-auto max-w-xs text-sm leading-6 text-slate-300">
          {statusCopy[phase]}
        </p>
      </div>
    </div>
  );
}
