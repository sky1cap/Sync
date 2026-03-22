"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

type ActiveModal = "prophet" | "protect" | "controller" | "coach" | "score" | null;

// --- XEO Dashboard Component Integration ---
const XeoDashboard = () => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const icons = {
    prophet: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>,
    protect: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
    controller: <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>,
    coach: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </>
    ),
    score: (
      <>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </>
    ),
  };

  const metaData: Record<Exclude<ActiveModal, null>, { title: string; sub: string; color: string }> = {
    prophet: { title: "The Prophet", sub: "Deep Predictive Analytics", color: "var(--neon-cyan)" },
    protect: { title: "The Protect", sub: "Compliance & Safety Logs", color: "var(--t-100)" },
    controller: { title: "The Controller", sub: "IoT Hardware Diagnostics", color: "var(--neon-blue)" },
    coach: { title: "The Coach", sub: "HR & Workforce Intelligence", color: "var(--neon-blue)" },
    score: { title: "Sentient Nexus", sub: "Global System Health Overview", color: "var(--neon-cyan)" },
  };

  const currentMeta = activeModal ? metaData[activeModal] : null;

  return (
    <div className="xeo-theme xeo-container">
      {/* Scoped CSS for XEO Dashboard */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .xeo-theme {
          --bg-0:#080b11;--bg-1:#10141e;--bg-2:#151a26;--bg-3:#1a2130;
          --border-1:rgba(255,255,255,0.05);--border-2:rgba(255,255,255,0.08);--border-3:rgba(255,255,255,0.12);
          --t-100:#ffffff;--t-200:#d1d5db;--t-300:#9ca3af;--t-400:#6b7280;
          --neon-cyan:#00f2fe; --neon-cyan-glow:rgba(0,242,254,0.3); --neon-cyan-soft:rgba(0,242,254,0.1);
          --neon-gold:#ffb700; --neon-gold-glow:rgba(255,183,0,0.3); --neon-gold-soft:rgba(255,183,0,0.15);
          --neon-blue:#3b82f6; --neon-blue-glow:rgba(59,130,246,0.3); --neon-blue-soft:rgba(59,130,246,0.15);
          --r-md:12px;--r-lg:16px;--r-xl:24px;--r-full:999px;
          --ease:cubic-bezier(0.25,1,0.5,1);--fast:0.2s var(--ease);--med:0.5s var(--ease);
        }

        .xeo-container {
          font-family: 'Urbanist', sans-serif;
          background: var(--bg-0);
          color: var(--t-100);
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: grid;
          grid-template-columns: 72px 1fr;
        }

        .xeo-container *, .xeo-container *::before, .xeo-container *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        @keyframes xeo-fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes xeo-popIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .anim-up { animation: xeo-fadeInUp 0.6s var(--ease) backwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .anim-pop { animation: xeo-popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; animation-delay: 0.5s; }

        .xeo-sidebar { background:var(--bg-1); border-right:1px solid var(--border-1); display:flex; flex-direction:column; align-items:center; padding:20px 0; gap:8px; z-index:100; box-shadow:4px 0 24px rgba(0,0,0,0.3); }
        .xeo-logo { width:44px; height:44px; background:none; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:18px; color:var(--neon-cyan); margin-bottom:24px; letter-spacing:1px; text-shadow:0 0 12px var(--neon-cyan-glow); }
        .nav-btn { width:46px; height:46px; border-radius:var(--r-md); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--fast); color:var(--t-400); position:relative; border:none; background:none; }
        .nav-btn:hover { background:var(--bg-2); color:var(--t-200); transform:translateY(-2px); }
        .nav-btn.active { background:var(--neon-cyan-soft); color:var(--neon-cyan); box-shadow:inset 0 0 0 1px rgba(0,242,254,0.2); }
        .nav-btn.active::before { content:''; position:absolute; left:-16px; width:4px; height:24px; background:var(--neon-cyan); border-radius:0 4px 4px 0; box-shadow:0 0 12px var(--neon-cyan); }
        .nav-btn svg { width:22px; height:22px; stroke-width:1.8; }
        .nav-spacer { flex:1; }

        .xeo-main { display:flex; flex-direction:column; height:100%; overflow:hidden; position:relative; background:radial-gradient(circle at 50% 0%, var(--bg-1), var(--bg-0) 80%); }
        .xeo-topbar { display:flex; align-items:center; padding:0 28px; height:72px; flex-shrink:0; gap:24px; z-index:90; }
        .topbar-brand { font-size:24px; font-weight:900; letter-spacing:4px; color:var(--neon-cyan); text-shadow:0 0 16px var(--neon-cyan-glow); }

        .search-bar { background:var(--bg-2); border:1px solid var(--border-2); border-radius:var(--r-full); padding:8px 16px; display:flex; align-items:center; gap:10px; width:260px; margin:0 auto; box-shadow:inset 0 2px 8px rgba(0,0,0,0.2); transition: width var(--fast); }
        .search-bar:focus-within { width: 300px; }
        .search-bar svg { width:16px; height:16px; color:var(--t-400); flex-shrink:0; }
        .search-bar input { background:none; border:none; color:var(--t-100); font-family:'Urbanist'; font-size:13px; font-weight:600; outline:none; width:100%; }
        .search-bar input::placeholder { color:var(--t-400); }

        .tb-actions { display:flex; align-items:center; gap:16px; }
        .tb-icon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--t-300); background:var(--bg-2); border:1px solid var(--border-1); cursor:pointer; transition:all var(--fast); position:relative; }
        .tb-icon:hover { background:var(--bg-3); color:var(--t-100); }
        .tb-icon.alert::after { content:''; position:absolute; top:8px; right:8px; width:6px; height:6px; background:var(--neon-gold); border-radius:50%; box-shadow:0 0 6px var(--neon-gold); }
        .tb-avatar { width:36px; height:36px; border-radius:50%; background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%231a2130"/><circle cx="50" cy="40" r="20" fill="%23d1d5db"/><path d="M20 90 Q50 60 80 90" stroke="%23d1d5db" stroke-width="12" fill="none" stroke-linecap="round"/></svg>') center/cover; border:1px solid var(--border-2); cursor:pointer; }

        .ai-view { flex:1; padding:20px 28px 28px 28px; position:relative; overflow:hidden; }
        .ai-grid { display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:24px; height:100%; position:relative; }

        .ai-card { background:linear-gradient(145deg, rgba(21,26,38,0.7), rgba(16,20,30,0.85)); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); border-radius:var(--r-xl); padding:24px; display:flex; flex-direction:column; box-shadow:0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05); position:relative; overflow:hidden; z-index:1; cursor:pointer; transition:all var(--med); }
        .ai-card.prophet:hover { transform: translateY(-4px) scale(1.02); border-color: rgba(0,242,254,0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px var(--neon-cyan-soft); z-index: 5; }
        .ai-card.protect:hover { transform: translateY(-4px) scale(1.02); border-color: rgba(255,183,0,0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px var(--neon-gold-soft); z-index: 5; }
        .ai-card.controller:hover { transform: translateY(-4px) scale(1.02); border-color: rgba(59,130,246,0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px var(--neon-blue-soft); z-index: 5; }
        .ai-card.coach:hover { transform: translateY(-4px) scale(1.02); border-color: rgba(0,242,254,0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px var(--neon-cyan-soft); z-index: 5; }

        .card-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; z-index:2; position:relative; pointer-events:none; }
        .card-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:800; color:var(--t-100); }
        .card-title svg { width:18px; height:18px; color:var(--neon-cyan); }
        .card-subtitle { font-size:12px; font-weight:600; color:var(--t-400); margin-top:2px; padding-left:26px; }

        .center-ring-container { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:320px; height:320px; z-index:10; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(12, 16, 26, 0.75); backdrop-filter: blur(24px); border: 1px solid rgba(0, 242, 254, 0.2); box-shadow: inset 0 0 60px rgba(0, 242, 254, 0.05), 0 30px 60px rgba(0,0,0,0.8); cursor: pointer; transition: all var(--med); }
        .center-ring-container:hover { transform:translate(-50%, -50%) scale(1.05); box-shadow: inset 0 0 80px rgba(0, 242, 254, 0.1), 0 40px 80px rgba(0,0,0,0.9); }
        .ring-ambient-glow { position:absolute; inset:-40px; border-radius:50%; background:radial-gradient(circle, var(--neon-cyan-glow) 0%, transparent 70%); z-index:-1; filter:blur(24px); animation: ambientPulse 4s infinite alternate ease-in-out; pointer-events:none; }

        @keyframes ambientPulse { 0% { opacity: 0.5; transform: scale(0.95); } 100% { opacity: 0.9; transform: scale(1.05); } }
        @keyframes ringPulse { 0%{ filter:drop-shadow(0 0 8px var(--neon-cyan)); stroke-dashoffset: 180; } 100%{ filter:drop-shadow(0 0 32px var(--neon-cyan)); stroke-dashoffset: 80; } }

        .ring-svg { position:absolute; inset:-10px; width:calc(100% + 20px); height:calc(100% + 20px); transform:rotate(-90deg); filter:drop-shadow(0 0 12px var(--neon-cyan)); pointer-events:none; }
        .ring-bg { fill:none; stroke:var(--bg-3); stroke-width:8; }
        .ring-prog { fill:none; stroke:var(--neon-cyan); stroke-width:12; stroke-linecap:round; stroke-dasharray:600; stroke-dashoffset:120; animation:ringPulse 6s infinite alternate ease-in-out; }
        .sr-content { display:flex; flex-direction:column; align-items:center; z-index:2; pointer-events:none; }
        .sr-label { font-size:13px; font-weight:800; color:var(--t-200); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
        .sr-val { font-size:72px; font-weight:900; color:var(--t-100); line-height:1; letter-spacing:-2px; text-shadow:0 0 24px rgba(255,255,255,0.3); }
        .sr-sub { font-size:20px; font-weight:700; color:var(--t-400); }

        .ai-card.prophet { padding-right:60px; }
        .prophet-wrap { flex:1; position:relative; display:flex; flex-direction:column; justify-content:flex-end; pointer-events:none; }
        .p-chart-container { position:absolute; inset:0; top:10px; bottom:60px; }
        .p-svg { width:100%; height:100%; overflow:visible; }
        .p-area { fill:url(#cyanGrad); opacity:0.3; }
        .p-line-blue { fill:none; stroke:var(--neon-blue); stroke-width:3; filter:drop-shadow(0 4px 8px var(--neon-blue-glow)); }
        .p-line-gold { fill:none; stroke:var(--neon-gold); stroke-width:3; filter:drop-shadow(0 4px 8px var(--neon-gold-glow)); }
        .p-dot { fill:var(--neon-cyan); stroke:var(--bg-1); stroke-width:2; }
        .p-legend { display:flex; gap:16px; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--t-300); z-index:2; }
        .p-legend span { display:flex; align-items:center; gap:6px; }
        .p-legend span::before { content:''; width:8px; height:8px; border-radius:50%; }
        .p-legend span.c-blue::before { background:var(--neon-blue); box-shadow:0 0 6px var(--neon-blue); }
        .p-legend span.c-gold::before { background:var(--neon-gold); box-shadow:0 0 6px var(--neon-gold); }
        .p-text { font-size:12px; font-weight:600; color:var(--t-200); line-height:1.5; z-index:2; max-width: 80%; }
        .p-text span { color:var(--neon-cyan); font-weight:800; }

        .ai-card.protect { padding-left:80px; }
        .protect-content { flex:1; display:flex; flex-direction:column; justify-content:center; z-index:2; pointer-events:none; }
        .pr-header-row { display:flex; justify-content:space-between; font-size:10px; font-weight:800; color:var(--t-400); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
        .pr-list { display:flex; flex-direction:column; gap:14px; }
        .pr-row { display:flex; align-items:center; gap:12px; }
        .pr-label { width:40px; font-size:12px; font-weight:800; color:var(--t-200); }
        .pr-bar-bg { flex:1; height:12px; background:var(--bg-3); border-radius:var(--r-full); overflow:hidden; box-shadow:inset 0 2px 4px rgba(0,0,0,0.5); }
        .pr-bar-fill { height:100%; border-radius:var(--r-full); }
        .pr-val { width:60px; text-align:right; font-size:13px; font-weight:800; }
        .c-cyan { background:var(--neon-cyan); color:var(--neon-cyan); box-shadow:0 0 10px var(--neon-cyan-glow); }
        .c-gold { background:var(--neon-gold); color:var(--neon-gold); box-shadow:0 0 10px var(--neon-gold-glow); }
        .c-blue { background:var(--neon-blue); color:var(--neon-blue); box-shadow:0 0 10px var(--neon-blue-glow); }
        .pr-alert { background:var(--bg-2); border:1px solid rgba(255,255,255,0.05); border-radius:var(--r-md); padding:12px 16px; margin-top:16px; }
        .pr-alert-title { font-size:12px; font-weight:800; color:var(--neon-cyan); margin-bottom:4px; display:flex; align-items:center; gap:6px; }
        .pr-alert-text { font-size:11px; font-weight:600; color:var(--t-300); line-height:1.4; }

        .ai-card.controller .card-head { padding-right:80px; }
        .ctrl-wrap { flex:1; position:relative; pointer-events:none; }
        .ctrl-badge { background:var(--neon-gold-soft); border:1px solid var(--neon-gold); color:var(--neon-gold); font-size:10px; font-weight:800; padding:4px 8px; border-radius:var(--r-full); display:flex; align-items:center; gap:4px; box-shadow: 0 0 12px var(--neon-gold-glow); }
        .ctrl-badge::before { content:''; width:6px; height:6px; background:var(--neon-gold); border-radius:50%; box-shadow:0 0 6px var(--neon-gold); }
        .ctrl-chart { position:absolute; inset:0; top:40px; }
        .cc-svg { width:100%; height:100%; overflow:visible; }
        .cc-grid { stroke:var(--border-2); stroke-width:1; stroke-dasharray:4 4; }
        .cc-area { fill:url(#blueGrad); opacity:0.4; }
        .cc-line { fill:none; stroke:var(--neon-cyan); stroke-width:3; filter:drop-shadow(0 4px 8px var(--neon-cyan-glow)); }
        .cc-line-gold { fill:none; stroke:var(--neon-gold); stroke-width:3; filter:drop-shadow(0 4px 8px var(--neon-gold-glow)); }
        .highlight-box { position:absolute; left:45%; top:10%; width:20%; height:80%; background:var(--neon-gold-soft); border:1px solid var(--neon-gold); border-radius:8px; z-index:1; box-shadow:0 0 20px var(--neon-gold-glow); display:flex; justify-content:center; backdrop-filter: blur(4px); }
        .hb-label { position:absolute; top:-24px; background:var(--neon-gold); color:var(--bg-0); font-size:11px; font-weight:800; padding:4px 10px; border-radius:4px; white-space:nowrap; box-shadow:0 4px 12px var(--neon-gold-glow); }
        .hb-tooltip { position:absolute; top:30%; left:105%; width:190px; background:rgba(30,22,10,0.95); border:1px solid var(--neon-gold); border-radius:var(--r-md); padding:12px; box-shadow:0 8px 32px rgba(0,0,0,0.8); z-index:3; }
        .hb-tt-text { font-size:11px; font-weight:700; color:var(--neon-gold); line-height:1.4; }
        .hb-tt-text span { color:var(--t-100); display:block; margin-top:4px; font-weight:600; }
        .x-axis { position:absolute; bottom:-10px; left:0; width:100%; display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:var(--t-400); padding:0 20px; z-index:2; }

        .ai-card.coach { padding-left:80px; }
        .coach-list { display:flex; flex-direction:column; gap:16px; margin-top:10px; z-index:2; position:relative; justify-content:center; flex:1; pointer-events:none; }
        .ch-item { display:flex; align-items:center; gap:16px; background:var(--bg-2); border:1px solid var(--border-1); padding:12px 16px; border-radius:var(--r-md); transition:all var(--fast); }
        .ch-avatar { width:44px; height:44px; border-radius:50%; background-size:cover; border:2px solid var(--bg-1); flex-shrink:0; position:relative; box-shadow: 0 4px 8px rgba(0,0,0,0.4);}
        .ch-avatar.a1 { background-image:linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); }
        .ch-avatar.a2 { background-image:linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%); }
        .ch-info { flex:1; display:flex; flex-direction:column; gap:4px; }
        .ch-name { font-size:14px; font-weight:800; color:var(--t-100); display:flex; align-items:center; gap:8px; }
        .ch-name span { color:var(--neon-cyan); font-size:12px; }
        .ch-text { font-size:12px; font-weight:600; color:var(--t-300); }
        .ch-badge { width:24px; height:24px; display:flex; align-items:center; justify-content:center; }
        .ch-badge svg { width:100%; height:100%; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }

        .xeo-modal-overlay { position:absolute; inset:0; background:rgba(8,11,17,0.85); backdrop-filter:blur(12px); z-index:1000; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .xeo-modal-overlay.open { opacity:1; pointer-events:auto; }
        .xeo-modal-box { width:90%; height:85%; background:linear-gradient(145deg, rgba(21,26,38,0.95), rgba(16,20,30,0.98)); border:1px solid rgba(255,255,255,0.1); border-radius:var(--r-xl); box-shadow:0 32px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05); transform:translateY(40px) scale(0.95); transition:all 0.5s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column; overflow:hidden; position:relative; }
        .xeo-modal-overlay.open .xeo-modal-box { transform:translateY(0) scale(1); }

        .modal-close { position:absolute; top:24px; right:24px; width:40px; height:40px; border-radius:50%; background:var(--bg-3); border:1px solid var(--border-2); color:var(--t-200); cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; transition:all var(--fast); }
        .modal-close:hover { background:var(--t-100); color:var(--bg-0); transform:rotate(90deg); }
        .modal-header { padding:32px 40px; border-bottom:1px solid var(--border-1); display:flex; align-items:center; gap:16px; background:rgba(0,0,0,0.2); }
        .modal-icon { width:48px; height:48px; border-radius:var(--r-md); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(0,0,0,0.3); }
        .modal-icon svg { width:24px; height:24px; color:white; }
        .modal-title { font-size:28px; font-weight:900; letter-spacing:-1px; color:var(--t-100); line-height:1; }
        .modal-subtitle { font-size:14px; font-weight:600; color:var(--t-400); margin-top:6px; }

        .xeo-modal-body { flex:1; padding:40px; overflow-y:auto; display:none; }
        .xeo-modal-body.active { display:flex; flex-direction:column; gap:32px; animation: xeo-fadeInUp 0.5s var(--ease) backwards; }
        .m-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; }
        .m-panel { background:var(--bg-2); border:1px solid var(--border-1); border-radius:var(--r-lg); padding:24px; }
        .m-panel-title { font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--t-300); margin-bottom:20px; border-bottom:1px solid var(--border-1); padding-bottom:12px; }
        .m-table { width:100%; border-collapse:collapse; }
        .m-table th { text-align:left; font-size:11px; font-weight:800; color:var(--t-400); text-transform:uppercase; padding-bottom:12px; border-bottom:1px solid var(--border-1); }
        .m-table td { padding:16px 0; border-bottom:1px solid var(--border-1); font-size:14px; font-weight:600; color:var(--t-200); }
        .m-table .pos { color:var(--neon-cyan); font-weight:800; }
        .m-table .neg { color:var(--neon-gold); font-weight:800; }
        .m-metric-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; }
        .m-metric { background:var(--bg-1); padding:16px; border-radius:var(--r-md); border:1px solid var(--border-1); text-align:center; }
        .m-metric .val { font-size:28px; font-weight:900; color:var(--t-100); line-height:1; margin-bottom:8px; text-shadow:0 0 16px rgba(255,255,255,0.1); }
        .m-metric .lbl { font-size:11px; font-weight:700; color:var(--t-400); text-transform:uppercase; letter-spacing:0.5px; }
        .m-list { display:flex; flex-direction:column; gap:12px; }
        .m-list-item { display:flex; justify-content:space-between; align-items:center; background:var(--bg-1); padding:16px 20px; border-radius:var(--r-md); border:1px solid var(--border-1); }
        .m-list-title { font-size:14px; font-weight:800; color:var(--t-100); }
        .m-list-sub { font-size:12px; font-weight:600; color:var(--t-400); margin-top:4px; }
        .m-status { padding:4px 12px; border-radius:var(--r-full); font-size:11px; font-weight:800; text-transform:uppercase; }
      `,
        }}
      />

      {/* SIDEBAR */}
      <nav className="xeo-sidebar">
        <div className="xeo-logo">XEO</div>
        <button className="nav-btn active" title="AI Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </button>
        <button className="nav-btn" title="Analytics">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </button>
        <button className="nav-btn" title="Systems">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
        </button>
        <div className="nav-spacer"></div>
        <button className="nav-btn" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      </nav>

      {/* MAIN */}
      <div className="xeo-main">
        {/* TOPBAR */}
        <header className="xeo-topbar">
          <span className="topbar-brand">XEO</span>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search AI insights..." />
          </div>
          <div className="tb-actions">
            <div className="tb-icon alert"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></div>
            <div className="tb-avatar"></div>
          </div>
        </header>

        {/* AI DASHBOARD VIEW */}
        <div className="ai-view">
          <div className="ai-grid">

            {/* CENTER RING */}
            <div className="center-ring-container anim-pop" onClick={() => setActiveModal("score")}>
              <div className="ring-ambient-glow"></div>
              <svg className="ring-svg" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="115" fill="none" stroke="var(--neon-cyan-soft)" strokeWidth="1" strokeDasharray="2 6"></circle>
                <circle className="ring-bg" cx="120" cy="120" r="95"></circle>
                <circle className="ring-prog" cx="120" cy="120" r="95"></circle>
                <circle cx="120" cy="120" r="80" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeDasharray="6 4" opacity="0.4"></circle>
                <circle cx="120" cy="120" r="72" fill="none" stroke="var(--neon-cyan)" strokeWidth="1" opacity="0.2"></circle>
              </svg>
              <div className="sr-content">
                <span className="sr-label">Sentient Score</span>
                <div className="sr-val">88<span className="sr-sub">/100</span></div>
              </div>
            </div>

            {/* CARD 1: THE PROPHET */}
            <div className="ai-card prophet anim-up delay-1" onClick={() => setActiveModal("prophet")}>
              <div className="card-head">
                <div>
                  <div className="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> The Prophet</div>
                  <div className="card-subtitle">Predictive AI</div>
                </div>
              </div>
              <div className="prophet-wrap">
                <div className="p-chart-container">
                  <svg className="p-svg" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <defs><linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--neon-cyan)"></stop><stop offset="100%" stopColor="transparent"></stop></linearGradient></defs>
                    <path className="p-area" d="M0,150 L0,100 Q40,80 80,120 T160,60 T240,110 T320,40 T400,20 L400,150 Z" />
                    <path className="p-line-blue" d="M0,100 Q40,80 80,120 T160,60 T240,110 T320,40 T400,20" />
                    <path className="p-line-gold" d="M0,130 Q50,110 100,130 T200,90 T300,100 T400,50" />
                    <circle className="p-dot" cx="320" cy="40" r="4" />
                    <circle className="p-dot" cx="400" cy="20" r="4" />
                    <circle className="p-dot" cx="400" cy="50" r="4" stroke="var(--neon-gold)" fill="var(--neon-gold)" />
                  </svg>
                </div>
                <div className="p-legend"><span className="c-blue">Predictive Revenue</span><span className="c-gold">Actual Revenue</span></div>
                <div className="p-text">Forecast: <span>+12%</span> vs Yesterday.<br/>Rain expected from 8 PM.<br/>Suggest: Activate Delivery Promos at 4 PM.</div>
              </div>
            </div>

            {/* CARD 2: THE PROTECT */}
            <div className="ai-card protect anim-up delay-2" onClick={() => setActiveModal("protect")}>
              <div className="card-head" style={{ justifyContent: "flex-end" }}>
                <div>
                  <div className="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--t-100)" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> The Protect</div>
                  <div className="card-subtitle" style={{ textAlign: "right", paddingLeft: 0, paddingRight: "6px" }}>HACCP & Safety</div>
                </div>
              </div>
              <div className="protect-content">
                <div className="pr-header-row"><span>Temperature</span><span>Actual Revenue</span></div>
                <div className="pr-list">
                  <div className="pr-row"><span className="pr-label">POS</span><div className="pr-bar-bg"><div className="pr-bar-fill c-cyan" style={{ width: "75%" }}></div></div><span className="pr-val" style={{ color: "var(--neon-cyan)" }}>+12,120</span></div>
                  <div className="pr-row"><span className="pr-label">HR</span><div className="pr-bar-bg"><div className="pr-bar-fill c-gold" style={{ width: "82%" }}></div></div><span className="pr-val" style={{ color: "var(--neon-gold)" }}>82/100</span></div>
                  <div className="pr-row"><span className="pr-label">BOH</span><div className="pr-bar-bg"><div className="pr-bar-fill c-blue" style={{ width: "90%" }}></div></div><span className="pr-val" style={{ color: "var(--neon-blue)" }}>90/100</span></div>
                  <div className="pr-row"><span className="pr-label">CRM</span><div className="pr-bar-bg"><div className="pr-bar-fill c-blue" style={{ width: "58%" }}></div></div><span className="pr-val" style={{ color: "var(--neon-blue)" }}>58/100</span></div>
                </div>
                <div className="pr-alert">
                  <div className="pr-alert-title"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Alert! Is revenue: -12%</div>
                  <div className="pr-alert-text">Predictive life: 42 hours.<br/>Suggest: 4 PM.</div>
                </div>
              </div>
            </div>

            {/* CARD 3: THE CONTROLLER */}
            <div className="ai-card controller anim-up delay-3" onClick={() => setActiveModal("controller")}>
              <div className="card-head">
                <div>
                  <div className="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--neon-blue)" }}><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> The Controller</div>
                  <div className="card-subtitle">HACCP & Safety</div>
                </div>
                <div className="ctrl-badge">real-time</div>
              </div>
              <div className="ctrl-wrap">
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-300)", marginBottom: "10px" }}>Fridge Temperatures</div>
                <div className="ctrl-chart">
                  <svg className="cc-svg" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <defs><linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--neon-blue)"></stop><stop offset="100%" stopColor="transparent"></stop></linearGradient></defs>
                    <line className="cc-grid" x1="0" y1="20" x2="400" y2="20" /><line className="cc-grid" x1="0" y1="60" x2="400" y2="60" /><line className="cc-grid" x1="0" y1="100" x2="400" y2="100" />
                    <path className="cc-area" d="M0,150 L0,90 Q30,40 60,90 T120,90 T180,90 L180,150 Z" />
                    <path className="cc-line" d="M0,90 Q30,40 60,90 T120,90 T180,90" />
                    <path className="cc-line-gold" d="M180,90 Q220,120 260,80 T340,90" />
                    <path className="cc-area" d="M260,150 L260,80 Q290,40 320,90 T380,90 T400,70 L400,150 Z" />
                    <path className="cc-line" d="M260,80 Q290,40 320,90 T380,90 T400,70" />
                    <circle cx="180" cy="90" r="3" fill="var(--neon-gold)" /><circle cx="260" cy="80" r="3" fill="var(--neon-gold)" />
                  </svg>
                  <div className="highlight-box">
                    <div className="hb-label">Fridge 3<br/><span style={{ fontSize: "9px", fontWeight: 600, opacity: 0.9 }}>(Meat)</span></div>
                    <div className="hb-tooltip"><div className="hb-tt-text">Compressor Anomaly Detected<br/><span>Predictive life: 42 hours.<br/>Call technician?</span></div></div>
                  </div>
                  <div className="x-axis"><span>Unit 1</span><span>Fridge 2</span><span>Fridge 3</span><span>Fridge 4</span><span>Fridge 5</span></div>
                </div>
              </div>
            </div>

            {/* CARD 4: THE COACH */}
            <div className="ai-card coach anim-up delay-4" onClick={() => setActiveModal("coach")}>
              <div className="card-head" style={{ justifyContent: "flex-end" }}>
                <div>
                  <div className="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--neon-blue)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> The Coach</div>
                  <div className="card-subtitle" style={{ textAlign: "right", paddingLeft: 0 }}>HR & CRM</div>
                </div>
              </div>
              <div className="coach-list">
                <div className="ch-item">
                  <div className="ch-avatar a1"></div>
                  <div className="ch-info">
                    <div className="ch-name">Chiara: <span>+5 Dessert</span></div>
                    <div className="ch-text">Upsells tonight.</div>
                  </div>
                  <div className="ch-badge" style={{ color: "var(--neon-cyan)" }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.2l-3.5 2.1 1.3-4.1-3.4-2.5h4.2l1.4-4.2 1.4 4.2h4.2l-3.4 2.5 1.3 4.1z"/></svg></div>
                </div>
                <div className="ch-item">
                  <div className="ch-avatar a2"></div>
                  <div className="ch-info">
                    <div className="ch-name">Marco: <span>Top</span></div>
                    <div className="ch-text">Efficiency Score.</div>
                  </div>
                  <div className="ch-badge" style={{ color: "var(--neon-gold)" }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.2l-3.5 2.1 1.3-4.1-3.4-2.5h4.2l1.4-4.2 1.4 4.2h4.2l-3.4 2.5 1.3 4.1z"/></svg></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      <div className={`xeo-modal-overlay ${activeModal ? "open" : ""}`} onClick={(e) => { if(e.target === e.currentTarget) setActiveModal(null); }}>
        <div className="xeo-modal-box">
          <button className="modal-close" onClick={() => setActiveModal(null)}><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>

          <div className="modal-header">
            <div className="modal-icon" style={{ background: currentMeta?.color ?? "var(--neon-cyan)" }}>
              <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                {activeModal ? icons[activeModal] : null}
              </svg>
            </div>
            <div>
              <div className="modal-title">{currentMeta?.title}</div>
              <div className="modal-subtitle">{currentMeta?.sub}</div>
            </div>
          </div>

          {/* PROPHET MODAL BODY */}
          <div className={`xeo-modal-body ${activeModal === "prophet" ? "active" : ""}`}>
            <div className="m-metric-grid">
              <div className="m-metric"><div className="val" style={{ color: "var(--neon-cyan)" }}>+18.4%</div><div className="lbl">Predicted Growth</div></div>
              <div className="m-metric"><div className="val">€14,240</div><div className="lbl">Forecasted Revenue</div></div>
              <div className="m-metric"><div className="val" style={{ color: "var(--neon-gold)" }}>94%</div><div className="lbl">Model Accuracy</div></div>
            </div>
            <div className="m-grid">
              <div className="m-panel" style={{ gridColumn: "span 2" }}>
                <div className="m-panel-title">Hourly Variance Analysis</div>
                <table className="m-table">
                  <thead><tr><th>Time Period</th><th>Predicted (AI)</th><th>Actual</th><th>Variance</th><th>Driver Insight</th></tr></thead>
                  <tbody>
                    <tr><td>18:00 - 19:00</td><td>€2,400</td><td>€2,550</td><td className="pos">+€150 (6.2%)</td><td>Early walk-ins due to rain</td></tr>
                    <tr><td>19:00 - 20:00</td><td>€4,100</td><td>€4,050</td><td className="neg">-€50 (1.2%)</td><td>Table turn delay (T-14)</td></tr>
                    <tr><td>20:00 - 21:00</td><td>€5,200</td><td>€5,800</td><td className="pos">+€600 (11.5%)</td><td>High cocktail attach rate</td></tr>
                    <tr><td>21:00 - 22:00</td><td>€3,100</td><td>Processing</td><td>—</td><td>Delivery surge expected</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PROTECT MODAL BODY */}
          <div className={`xeo-modal-body ${activeModal === "protect" ? "active" : ""}`}>
            <div className="m-grid">
              <div className="m-panel">
                <div className="m-panel-title">Compliance Matrix</div>
                <div className="m-list">
                  <div className="m-list-item">
                    <div><div className="m-list-title">BOH Temp Logs</div><div className="m-list-sub">Last updated 12 mins ago</div></div>
                    <div className="m-status" style={{ background: "var(--neon-blue-soft)", color: "var(--neon-blue)", border: "1px solid var(--neon-blue)" }}>Verified</div>
                  </div>
                  <div className="m-list-item">
                    <div><div className="m-list-title">Prep Station Sanitization</div><div className="m-list-sub">Schedule variance detected</div></div>
                    <div className="m-status" style={{ background: "var(--neon-gold-soft)", color: "var(--neon-gold)", border: "1px solid var(--neon-gold)" }}>Pending</div>
                  </div>
                  <div className="m-list-item">
                    <div><div className="m-list-title">Staff Certifications</div><div className="m-list-sub">2 expiring this month</div></div>
                    <div className="m-status" style={{ background: "var(--neon-cyan-soft)", color: "var(--neon-cyan)", border: "1px solid var(--neon-cyan)" }}>Action Req</div>
                  </div>
                </div>
              </div>
              <div className="m-panel">
                <div className="m-panel-title">Live Threat Assessment</div>
                <div style={{ padding: "20px", textAlign: "center" }}>
                   <svg viewBox="0 0 100 100" style={{ width: "140px", height: "140px", filter: "drop-shadow(0 0 20px var(--neon-gold-glow))", margin: "0 auto 16px" }}>
                     <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-3)" strokeWidth="8"></circle>
                     <circle cx="50" cy="50" r="40" fill="none" stroke="var(--neon-gold)" strokeWidth="8" strokeDasharray="250" strokeDashoffset="60" strokeLinecap="round"></circle>
                     <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="900" fill="var(--t-100)">76%</text>
                   </svg>
                   <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-200)", lineHeight: 1.5 }}>Supply chain delay on fresh produce.<br/><span style={{ color: "var(--neon-gold)" }}>Risk: Medium. Suggest menu pivot to frozen stock.</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLLER MODAL BODY */}
          <div className={`xeo-modal-body ${activeModal === "controller" ? "active" : ""}`}>
            <div className="m-metric-grid">
              <div className="m-metric"><div className="val" style={{ color: "var(--neon-blue)" }}>14</div><div className="lbl">Active Sensors</div></div>
              <div className="m-metric"><div className="val" style={{ color: "var(--neon-gold)" }}>1</div><div className="lbl">Anomalies Detected</div></div>
              <div className="m-metric"><div className="val">99.9%</div><div className="lbl">System Uptime</div></div>
            </div>
            <div className="m-panel">
              <div className="m-panel-title">Detailed Fridge 3 Diagnostic (Meat Storage)</div>
              <div style={{ height: "200px", position: "relative", marginTop: "20px" }}>
                 <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                   <rect x="0" y="80" width="800" height="40" fill="var(--neon-blue-soft)"></rect>
                   <line x1="0" y1="40" x2="800" y2="40" stroke="var(--neon-gold)" strokeDasharray="4 4" strokeWidth="2"></line>
                   <path d="M0,100 Q100,90 200,100 T400,90 T600,40 T800,20" fill="none" stroke="var(--neon-cyan)" strokeWidth="4" filter="drop-shadow(0 0 8px var(--neon-cyan-glow))"></path>
                   <circle cx="600" cy="40" r="6" fill="var(--neon-gold)" stroke="var(--bg-1)" strokeWidth="2"></circle>
                   <circle cx="800" cy="20" r="6" fill="var(--neon-gold)" stroke="var(--bg-1)" strokeWidth="2"></circle>
                 </svg>
                 <div style={{ position: "absolute", right: "10px", top: 0, background: "var(--neon-gold-soft)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--neon-gold)" }}>
                   <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--neon-gold)" }}>Current: 4.8°C (Critical)</span>
                 </div>
              </div>
            </div>
          </div>

          {/* COACH MODAL BODY */}
          <div className={`xeo-modal-body ${activeModal === "coach" ? "active" : ""}`}>
            <div className="m-grid">
              <div className="m-panel">
                <div className="m-panel-title">Live Shift Leaderboard</div>
                <table className="m-table">
                  <thead><tr><th>Rank</th><th>Employee</th><th>Upsell Rate</th><th>Efficiency</th></tr></thead>
                  <tbody>
                    <tr><td><span style={{ color: "var(--neon-gold)", fontWeight: 900 }}>#1</span></td><td>Marco (Bar)</td><td className="pos">28%</td><td>96/100</td></tr>
                    <tr><td><span style={{ color: "var(--t-200)", fontWeight: 900 }}>#2</span></td><td>Chiara (Floor)</td><td className="pos">24%</td><td>92/100</td></tr>
                    <tr><td><span style={{ color: "var(--t-400)", fontWeight: 900 }}>#3</span></td><td>Luca (Floor)</td><td>15%</td><td>88/100</td></tr>
                    <tr><td><span style={{ color: "var(--t-400)", fontWeight: 900 }}>#4</span></td><td>Giulia (Host)</td><td>--</td><td>85/100</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="m-panel">
                <div className="m-panel-title">AI Behavioral Coaching</div>
                <div className="m-list">
                  <div className="m-list-item" style={{ borderLeft: "4px solid var(--neon-cyan)" }}>
                    <div><div className="m-list-title">Pacing Recommendation</div><div className="m-list-sub">Tell Luca to slow down table 4 clearing.</div></div>
                  </div>
                  <div className="m-list-item" style={{ borderLeft: "4px solid var(--neon-gold)" }}>
                    <div><div className="m-list-title">Upsell Opportunity</div><div className="m-list-sub">Chiara has high success with Table 12 demographics. Suggest premium wine.</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SCORE MODAL BODY */}
          <div className={`xeo-modal-body ${activeModal === "score" ? "active" : ""}`}>
            <div className="m-metric-grid">
              <div className="m-metric" style={{ gridColumn: "span 3", padding: "40px", background: "radial-gradient(circle, var(--neon-cyan-soft), transparent)" }}>
                 <div style={{ fontSize: "80px", fontWeight: 900, color: "var(--t-100)", textShadow: "0 0 30px var(--neon-cyan-glow)" }}>88<span style={{ fontSize: "32px", color: "var(--neon-cyan)" }}>/100</span></div>
                 <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--t-300)", textTransform: "uppercase", letterSpacing: "2px", marginTop: "12px" }}>Global Sentient Health Index</div>
              </div>
            </div>
            <div className="m-grid">
              <div className="m-panel" style={{ gridColumn: "span 2" }}>
                <div className="m-panel-title">System Weighting & Analytics</div>
                <table className="m-table">
                   <thead><tr><th>Module</th><th>Health Score</th><th>Impact Weight</th><th>Status</th></tr></thead>
                   <tbody>
                     <tr><td>The Prophet (Revenue)</td><td>94/100</td><td>35%</td><td className="pos">Optimized</td></tr>
                     <tr><td>The Protect (Compliance)</td><td>88/100</td><td>25%</td><td className="pos">Stable</td></tr>
                     <tr><td>The Controller (Systems)</td><td><span className="neg">76/100</span></td><td>20%</td><td className="neg">Anomaly Detected</td></tr>
                     <tr><td>The Coach (HR)</td><td>92/100</td><td>20%</td><td className="pos">High Performance</td></tr>
                   </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function XeoHeroVisual() {
  const [mounted, setMounted] = useState(false);
  const [tabScale, setTabScale] = useState(0.82);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const TABLET_WIDTH = 900;
    const TABLET_HEIGHT = 600;
    const SAFE_PADDING = 56;
    const SHADOW_WIDTH_FACTOR = 1.18;
    const SHADOW_HEIGHT_FACTOR = 1.28;

    const updateScale = () => {
      const rect = scene.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const availableWidth = Math.max(rect.width - SAFE_PADDING, 280);
      const availableHeight = Math.max(rect.height - SAFE_PADDING, 280);

      const widthScale = availableWidth / (TABLET_WIDTH * SHADOW_WIDTH_FACTOR);
      const heightScale = availableHeight / (TABLET_HEIGHT * SHADOW_HEIGHT_FACTOR);
      const nextScale = Math.min(1.05, widthScale, heightScale);

      setTabScale(Math.max(0.42, nextScale));
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(scene);
    window.addEventListener("resize", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const sceneScaleStyle: CSSProperties = {
    perspective: "2000px",
    ["--tab-scale" as string]: tabScale,
  };

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-[28px] bg-white font-sans lg:h-[620px]">
      {/* Import Plus Jakarta Sans for structural elements */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
      `,
        }}
      />

      {/* --- CENTER SECTION: 3D XEO Dashboard --- */}
      <div ref={sceneRef} className="relative flex h-full w-full items-center justify-center px-2 sm:px-4 lg:px-6">
        {/* CSS for Deep 3D Animations, Scalable Variables, and White-Theme Edges */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* Responsive scale variables for the 3D scene */
          .responsive-3d-scene {
            --tab-scale: 0.82;
            transform-style: preserve-3d;
          }

          @keyframes tilt-in {
            0% {
              opacity: 0;
              transform: translateY(300px) translateZ(-800px) rotateX(70deg) rotateY(15deg) rotateZ(-10deg) scale(0.2);
            }
            100% {
              opacity: 1;
              transform: translateY(0px) translateZ(0px) rotateX(25deg) rotateY(-20deg) rotateZ(8deg) scale(var(--tab-scale));
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px) translateZ(0px) rotateX(25deg) rotateY(-20deg) rotateZ(8deg) scale(var(--tab-scale));
            }
            50% {
              transform: translateY(-15px) translateZ(20px) rotateX(26deg) rotateY(-19deg) rotateZ(8deg) scale(var(--tab-scale));
            }
          }

          .animate-tilt {
            animation: tilt-in 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .animate-float {
            animation: tilt-in 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, float 6s ease-in-out 1.8s infinite;
          }

          .tablet-depth {
            box-shadow:
              inset 0px 0px 0px 1px rgba(255, 255, 255, 0.2),
              1px 1px 0px #3a3a3a,
              2px 2px 0px #333333,
              3px 3px 0px #2a2a2a,
              4px 4px 0px #222222,
              5px 5px 0px #1c1c1c,
              6px 6px 0px #181818,
              7px 7px 0px #141414,
              8px 8px 0px #0f0f0f,
              9px 9px 0px #0a0a0a,
              10px 10px 0px #050505,
              11px 11px 0px #000000,
              12px 12px 0px #000000,
              20px 40px 60px rgba(0, 0, 0, 0.4),
              0px 0px 120px rgba(0, 242, 254, 0.15);
          }
        `,
          }}
        />

        {/* Optional subtle light background glow to replace the dark ambient glow */}
        <div
          className={`absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 blur-[150px] transition-opacity duration-1000 lg:h-[700px] lg:w-[700px] lg:blur-[200px] ${mounted ? "opacity-100" : "opacity-0"}`}
        ></div>

        {/* 3D Scene Container with responsive scaling scope */}
        <div className="responsive-3d-scene relative" style={sceneScaleStyle}>
          {/* The Tablet Frame */}
          <div
            className={`tablet-depth relative h-[600px] w-[900px] rounded-[2.5rem] border border-gray-600 bg-gradient-to-br from-gray-800 to-black p-5 transform-style-3d ${mounted ? "animate-float" : "opacity-0"}`}
          >
            {/* Hardware elements (Camera, buttons) */}
            <div className="absolute -left-2 top-1/2 h-12 w-1 -translate-y-1/2 transform rounded-l-md bg-gray-800 shadow-sm"></div>

            {/* Front Camera nested inside the tablet bezel */}
            <div className="absolute right-[10px] top-1/2 z-50 flex h-3 w-3 -translate-y-1/2 transform items-center justify-center rounded-full border border-gray-800 bg-black shadow-inner">
              <div className="h-1 w-1 rounded-full bg-blue-900/50"></div>
            </div>
            <div className="absolute -top-1 left-32 h-1 w-16 rounded-t-md bg-gray-800 shadow-sm"></div>

            {/* Fully Engulfing Tablet Screen */}
            <div className="relative box-border flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border-[6px] border-[#050505] bg-[#080b11] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {/* Glass Reflection Overlay - Adds realism */}
              <div className="pointer-events-none absolute inset-0 z-50 bg-gradient-to-br from-white/[0.08] via-transparent to-black/40"></div>

              {/* Embedded XEO Dashboard (Scaled seamlessly into the full panel) */}
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                <div style={{ width: "1280px", height: "833px", transform: "scale(0.671875)", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
                  <XeoDashboard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default XeoHeroVisual;
