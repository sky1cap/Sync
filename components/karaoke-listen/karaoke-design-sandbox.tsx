"use client";

import { useState } from "react";

type Phase = "idle" | "listening" | "recognizing" | "karaoke" | "error";

const MOCK_LINES = [
  { time: 0, text: "Why do you do this? When in the moment" },
  { time: 4, text: "Couldn't see what we had, it was toxic for me" },
  { time: 8, text: "Eternal optimist, I make the best of it" },
  { time: 12, text: "Couldn't see what we had, it was toxic for me" },
  { time: 16, text: "♪" },
  { time: 20, text: "Why do you do this? When in the moment" },
  { time: 24, text: "Couldn't see what we had, it was toxic for me" },
  { time: 28, text: "Eternal optimist, I make the best of it" },
  { time: 32, text: "Couldn't see what we had, it was toxic for me" },
];

function fmt(seconds: number) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function KaraokeDesignSandbox() {
  const [phase, setPhase] = useState<Phase>("karaoke");
  const [activeIdx, setActiveIdx] = useState(5);
  const [progress, setProgress] = useState(0.52);

  const isKaraoke = phase === "karaoke";
  const elapsed = MOCK_LINES[Math.max(0, Math.min(activeIdx, MOCK_LINES.length - 1))]?.time ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: isKaraoke
          ? "linear-gradient(180deg, #05020e 0%, #0c0620 30%, #150a30 60%, #0a0418 100%)"
          : "linear-gradient(160deg, #0a0a0f 0%, #12101f 40%, #1a0e2e 70%, #0d0d14 100%)",
        color: "#e8e4f0",
        fontFamily: "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
        transition: "background 1s ease",
      }}
    >
      <style>{`
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 30px rgba(168,85,247,.7), 0 0 80px rgba(168,85,247,.25), 0 0 120px rgba(124,58,237,.15); }
          50% { text-shadow: 0 0 50px rgba(168,85,247,1), 0 0 100px rgba(168,85,247,.5), 0 0 160px rgba(124,58,237,.3); }
        }
        @keyframes breathe {
          0%, 100% { opacity: .5; transform: scale(1); }
          50% { opacity: .8; transform: scale(1.15); }
        }
        @keyframes rise { 0% { opacity:0; transform:translateY(30px) scale(.97); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse-ring {
          0% { transform:scale(1); opacity:.5; }
          100% { transform:scale(2.2); opacity:0; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .k-line { transition: all .35s cubic-bezier(.22,1,.36,1); cursor: pointer; }
        .k-active {
          color: #fff !important;
          font-weight: 800 !important;
          animation: glow 2s ease-in-out infinite;
          transform: scale(1.06);
        }
        .k-past { color: rgba(139,92,246,.28) !important; }
        .k-future { color: rgba(196,181,253,.42) !important; }
        .k-next { color: rgba(196,181,253,.55) !important; }

        .btn-sm {
          background: rgba(255,255,255,.06); color: #c4b5fd;
          border: 1px solid rgba(168,130,247,.18); border-radius: 10px;
          padding: 7px 14px; font-size: 12px; cursor: pointer;
          font-family: inherit; transition: all .15s; font-weight: 600;
        }
        .btn-sm:hover { background: rgba(168,130,247,.14); border-color: rgba(168,130,247,.35); }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 50,
          background: "rgba(10,10,20,.82)",
          border: "1px solid rgba(168,130,247,.24)",
          borderRadius: 12,
          padding: 10,
          width: 300,
          backdropFilter: "blur(10px)",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: "rgba(220,210,245,.85)", fontWeight: 700 }}>
          Design Sandbox
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {(["idle", "listening", "recognizing", "karaoke", "error"] as Phase[]).map((p) => (
            <button
              key={p}
              className="btn-sm"
              onClick={() => setPhase(p)}
              style={phase === p ? { borderColor: "#a855f7", color: "#f5edff" } : undefined}
            >
              {p}
            </button>
          ))}
        </div>
        <p style={{ margin: "10px 0 4px", fontSize: 11, color: "rgba(200,190,230,.6)" }}>Active lyric index</p>
        <input
          type="range"
          min={0}
          max={MOCK_LINES.length - 1}
          value={activeIdx}
          onChange={(e) => setActiveIdx(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <p style={{ margin: "8px 0 4px", fontSize: 11, color: "rgba(200,190,230,.6)" }}>Listening progress</p>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progress * 100)}
          onChange={(e) => setProgress(Number(e.target.value) / 100)}
          style={{ width: "100%" }}
        />
      </div>

      <div
        style={{
          position: "fixed",
          top: "-25%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,.07) 0%, transparent 65%)",
          pointerEvents: "none",
          animation: isKaraoke ? "breathe 8s ease-in-out infinite" : "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-30%",
          right: "-15%",
          width: "70vw",
          height: "70vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,.06) 0%, transparent 65%)",
          pointerEvents: "none",
          animation: isKaraoke ? "breathe 10s ease-in-out infinite 2s" : "none",
        }}
      />

      {phase === "idle" && (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            animation: "rise .6s ease-out",
          }}
        >
          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-1px",
              background: "linear-gradient(135deg, #e0d4fc 0%, #a855f7 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            karaoke
          </h1>
          <p style={{ color: "rgba(200,190,230,.4)", fontSize: 16, marginTop: 8, letterSpacing: "3px" }}>
            listen · recognize · sing
          </p>
        </div>
      )}

      {phase === "listening" && (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ position: "relative", width: 140, height: 140, marginBottom: 30 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(168,85,247,.3)", animation: "pulse-ring 1.5s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,.2), rgba(168,85,247,.1))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 54 }}>🎙️</span>
            </div>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Listening…</p>
          <div style={{ width: "100%", maxWidth: 280, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden", marginTop: 26 }}>
            <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)", width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      {phase === "recognizing" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ width: 52, height: 52, border: "3px solid rgba(168,130,247,.15)", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Identifying…</p>
        </div>
      )}

      {phase === "error" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(239,68,68,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>😕</div>
          <p style={{ fontSize: 16, color: "#fca5a5", margin: 0 }}>No match found. Try again.</p>
        </div>
      )}

      {phase === "karaoke" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px", gap: 8 }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>When You Were Young</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(200,190,230,.45)" }}>The Killers</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(200,190,230,.5)" }}>{fmt(elapsed)}</p>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "15vh 24px 30vh",
              maskImage: "linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)",
            }}
          >
            {MOCK_LINES.map((line, i) => {
              const isActive = i === activeIdx;
              const isPast = i < activeIdx;
              const isNext = i === activeIdx + 1;

              return (
                <p
                  key={`${line.time}-${i}`}
                  className={`k-line ${isActive ? "k-active" : isPast ? "k-past" : isNext ? "k-next" : "k-future"}`}
                  style={{
                    fontSize: isActive ? 32 : isNext ? 24 : 22,
                    fontWeight: isActive ? 800 : isNext ? 600 : 400,
                    margin: 0,
                    padding: isActive ? "18px 8px" : "12px 8px",
                    lineHeight: 1.45,
                    textAlign: "center",
                    borderRadius: 12,
                  }}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default KaraokeDesignSandbox;
