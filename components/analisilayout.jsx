"use client";

import React, { useState } from "react";
import {
    BarChart3,
    Map as MapIcon,
    Settings,
    Bell,
    Download,
    ChevronDown,
    Home,
    Users,
    Hotel,
    TrendingUp,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Search,
    Calendar,
    Filter,
    LogOut,
    Bed,
    AlignLeft,
    X,
    CreditCard,
    Briefcase,
    MoreHorizontal,
    ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";

// ---------------------------------
// MOCK DATA
// ---------------------------------
const revenueData = [
    { name: "Gen", revenue: 4200, target: 3800 },
    { name: "Feb", revenue: 3800, target: 4000 },
    { name: "Mar", revenue: 5100, target: 4500 },
    { name: "Apr", revenue: 6200, target: 5800 },
    { name: "Mag", revenue: 7800, target: 7200 },
    { name: "Giu", revenue: 9500, target: 8900 },
    { name: "Lug", revenue: 11200, target: 10500 },
];

const sourceData = [
    { name: "Booking.com", bookings: 450, color: "#2563eb" }, // Blue
    { name: "Diretto", bookings: 320, color: "#10b981" },     // Emerald
    { name: "Expedia", bookings: 150, color: "#f59e0b" },     // Amber
    { name: "Airbnb", bookings: 100, color: "#ef4444" },      // Red
];

// Sparkline dummy data
const sparkData1 = [{ v: 10 }, { v: 15 }, { v: 12 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 22 }];
const sparkData2 = [{ v: 40 }, { v: 30 }, { v: 35 }, { v: 25 }, { v: 30 }, { v: 20 }, { v: 25 }]; // Going down
const sparkData3 = [{ v: 60 }, { v: 62 }, { v: 65 }, { v: 66 }, { v: 70 }, { v: 75 }, { v: 86 }];
const sparkData4 = [{ v: 20 }, { v: 18 }, { v: 15 }, { v: 16 }, { v: 14 }, { v: 12 }, { v: 12 }]; // CPA going down (good)

const kpiData = [
    {
        title: "Ricavi Totali",
        value: "€124.5K",
        change: "+12.5%",
        trend: "up",
        icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
        color: "bg-indigo-50 border-indigo-100 ring-indigo-50 text-indigo-600",
        sparkline: sparkData1,
        sparkColor: "#4f46e5"
    },
    {
        title: "ADR (Tariffa Media)",
        value: "€142",
        change: "+5.2%",
        trend: "up",
        icon: <Target className="w-5 h-5 text-emerald-600" />,
        color: "bg-emerald-50 border-emerald-100 ring-emerald-50 text-emerald-600",
        sparkline: sparkData3,
        sparkColor: "#10b981"
    },
    {
        title: "Occupazione",
        value: "86%",
        change: "+2.1%",
        trend: "up",
        icon: <Bed className="w-5 h-5 text-amber-600" />,
        color: "bg-amber-50 border-amber-100 ring-amber-50 text-amber-600",
        sparkline: sparkData3,
        sparkColor: "#f59e0b"
    },
    {
        title: "CPA Stimato",
        value: "€12.50",
        change: "-1.4%",
        trend: "up", // Treated as positive since lower cost is better
        icon: <TrendingUp className="w-5 h-5 text-rose-600" />,
        color: "bg-rose-50 border-rose-100 ring-rose-50 text-rose-600",
        sparkline: sparkData4,
        sparkColor: "#e11d48"
    },
];

const aiInsights = [
    {
        text: "Notata un'impennata di richieste per soggiorni di lunga durata a Giugno. Potenziali ricavi nascosti.",
        type: "opportunity"
    },
    {
        text: "Il weekend del 15 Luglio ha un pricing del 12% inferiore rispetto ai competitor locali di pari livello.",
        type: "alert"
    },
    {
        text: "Consigliamo di avviare una campagna flash per l'ultima settimana di Maggio (occupazione attuale ferma al 65%).",
        type: "action"
    },
];

const recentActivity = [
    { title: "Nuova prenotazione Suite", time: "10 min fa", amount: "€450", source: "Booking.com" },
    { title: "Cancellazione Standard", time: "1 ora fa", amount: "€120", source: "Expedia" },
    { title: "Upgrade camera (Diretto)", time: "2 ore fa", amount: "+€80", source: "Diretto" },
];

// ---------------------------------
// COMPONENTS
// ---------------------------------
export default function AnalisiLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900 selection:bg-indigo-100">

            {/* MOBILE OVERLAY */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white border-r border-slate-200/60 
        flex flex-col shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                {/* LOGO AREA */}
                <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100/60 mt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-md">
                            <Hotel className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">
                            HotelTarget
                        </span>
                    </div>
                    <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* NAV LINKS */}
                <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-1">
                    <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Generale</p>
                    <NavItem active icon={<Home />} label="Panoramica" />
                    <NavItem icon={<BarChart3 />} label="Analisi Vendite" />
                    <NavItem icon={<MapIcon />} label="Mercato & Competitor" />

                    <div className="h-px bg-slate-100/80 my-5 mx-4"></div>

                    <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ottimizzazione</p>
                    <NavItem icon={<Sparkles />} label="Insight AI" badge="Nuovo" />
                    <NavItem icon={<Target />} label="Regole Pricing" />
                    <NavItem icon={<Briefcase />} label="Pacchetti & Offerte" />

                    <div className="h-px bg-slate-100/80 my-5 mx-4"></div>

                    <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Impostazioni</p>
                    <NavItem icon={<Users />} label="Team & Accessi" />
                    <NavItem icon={<Settings />} label="Preferenze Sistema" />
                </div>

                {/* BOTTOM USER PROFILE */}
                <div className="p-4 m-4 mt-0 bg-slate-50 rounded-2xl border border-slate-100/80">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                            MR
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">Mario Rossi</p>
                            <p className="text-xs text-slate-500 truncate">Manager Resort</p>
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">

                {/* TOP HEADER */}
                <header className="h-[76px] bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <AlignLeft className="w-5 h-5" />
                        </button>

                        {/* Context Breadcrumb */}
                        <div className="hidden sm:flex flex-col">
                            <span className="text-xs font-medium text-slate-500 mb-0.5">Report Direzionale</span>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                                Panoramica Performance
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="hidden md:flex relative group">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cerca transazioni, alert..."
                                className="pl-10 pr-4 py-2 w-72 bg-slate-100/80 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                            </button>

                            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                            <Button className="hidden sm:flex bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm hover:shadow-md transition-all">
                                <Download className="w-4 h-4 mr-2" />
                                Scarica Report
                            </Button>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE INNER AREA */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-[1600px] mx-auto p-6 lg:p-10">

                        {/* HEADER CONTROLS */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
                            <div className="max-w-xl">
                                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Il tuo andamento, a colpo d'occhio.</h2>
                                <p className="text-sm lg:text-base text-slate-500 mt-2 leading-relaxed">
                                    Qui trovi la sintesi delle metriche chiave per <strong className="font-semibold text-slate-700">HotelTarget Grand Resort</strong>. L'intelligenza artificiale ha elaborato 3 nuove raccomandazioni oggi.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex items-center">
                                    <button className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 text-slate-800 transition-colors">30 Giorni</button>
                                    <button className="px-4 py-1.5 text-sm font-medium rounded-lg text-slate-500 hover:text-slate-700 transition-colors">Trimestre</button>
                                    <button className="px-4 py-1.5 text-sm font-medium rounded-lg text-slate-500 hover:text-slate-700 transition-colors">Anno</button>
                                </div>

                                <Button variant="outline" className="bg-white border-slate-200 text-slate-600 shadow-sm rounded-xl px-4 py-2 font-medium h-auto flex items-center gap-2 hover:bg-slate-50">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>Personalizza</span>
                                </Button>
                            </div>
                        </div>

                        {/* KPI GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            {kpiData.map((kpi, index) => (
                                <Card key={index} className="border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-2xl overflow-hidden group">
                                    <CardContent className="p-6 relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ring-4 ${kpi.color} bg-white transition-transform group-hover:scale-110 duration-300`}>
                                                {kpi.icon}
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${kpi.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                                                {kpi.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                {kpi.change}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</p>
                                            <h3 className="text-slate-500 text-sm font-medium mt-1">{kpi.title}</h3>
                                        </div>

                                        {/* Miniature Sparkline */}
                                        <div className="h-10 w-full mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={kpi.sparkline}>
                                                    <defs>
                                                        <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor={kpi.sparkColor} stopOpacity={0.2} />
                                                            <stop offset="100%" stopColor={kpi.sparkColor} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="v" stroke={kpi.sparkColor} strokeWidth={2} fill={`url(#grad-${index})`} isAnimationActive={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* CHARTS & COMPLEX DATA ROW */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* MAIN CHART */}
                            <Card className="lg:col-span-2 shadow-sm border-slate-200/60 rounded-2xl bg-white flex flex-col">
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Ricavi vs Target Atteso</CardTitle>
                                            <CardDescription className="text-slate-500 mt-1 font-medium">
                                                Storico degli ultimi 7 mesi. Performance superiore al target del 4.2% in media.
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-1.5 px-2 py-1">
                                                <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"></div>
                                                <span className="text-xs font-semibold text-slate-700">Ricavi Reali</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1">
                                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                                <span className="text-xs font-semibold text-slate-600">Target Previsto</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-8 flex-1 min-h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.1} />
                                                    <stop offset="100%" stopColor="#f8fafc" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={15} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dx={-10} tickFormatter={(value) => `€${value / 1000}k`} />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" activeDot={false} />
                                            <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5', stroke: '#c7d2fe' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* RIGHT COLUMN: DISTRIBUTION & AI */}
                            <div className="flex flex-col gap-8 h-full">

                                {/* AI INSIGHTS HIGHLIGHT */}
                                <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white shadow-sm shadow-indigo-100/50 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors"></div>
                                    <CardHeader className="p-6 pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-indigo-100/80 rounded-lg text-indigo-700">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">AI Insights</CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-none font-bold">3 Nuovi</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-4">
                                        <div className="space-y-4">
                                            {aiInsights.map((insight, i) => (
                                                <div key={i} className="flex gap-3 group/item">
                                                    <div className={`
                            w-2 h-2 rounded-full mt-2 shrink-0
                            ${insight.type === 'alert' ? 'bg-rose-500' : insight.type === 'opportunity' ? 'bg-emerald-500' : 'bg-indigo-500'}
                          `}></div>
                                                    <p className="text-sm font-medium text-slate-600 leading-relaxed group-hover/item:text-slate-900 transition-colors">
                                                        {insight.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <Button className="w-full mt-6 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm font-semibold rounded-xl">
                                            Visualizza tutte le azioni
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* CHANNEL MIX */}
                                <Card className="shadow-sm border-slate-200/60 rounded-2xl bg-white flex-1 flex flex-col">
                                    <CardHeader className="p-6 pb-2 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-bold text-slate-900">Mix Canali</CardTitle>
                                            <button className="text-slate-400 hover:text-slate-700">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1 flex flex-col justify-center min-h-[250px]">

                                        {/* Horizontal Bar Breakdown Visualization manually created for cleaner look */}
                                        <div className="space-y-5 w-full">
                                            {sourceData.map((channel, i) => {
                                                const total = sourceData.reduce((acc, curr) => acc + curr.bookings, 0);
                                                const percent = Math.round((channel.bookings / total) * 100);

                                                return (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="font-semibold text-slate-700">{channel.name}</span>
                                                            <span className="font-bold text-slate-900">{percent}% <span className="text-slate-400 font-medium ml-1">({channel.bookings})</span></span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${percent}%`, backgroundColor: channel.color }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                    </CardContent>
                                </Card>

                            </div>
                        </div>

                        {/* BOTTOM SECTION: RECENT ACTIVITY */}
                        <div className="mt-8">
                            <Card className="shadow-sm border-slate-200/60 rounded-2xl bg-white">
                                <CardHeader className="p-6 border-b border-slate-100">
                                    <CardTitle className="text-lg font-bold text-slate-900">Attività Recente</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {recentActivity.map((activity, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                        {activity.amount.includes("-") || activity.title.includes("Cancellazione") ? (
                                                            <ArrowDownRight className="w-5 h-5 text-rose-500" />
                                                        ) : (
                                                            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                                                        <p className="text-xs font-medium text-slate-500 mt-0.5">{activity.source} • {activity.time}</p>
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-bold ${activity.title.includes("Cancellazione") ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {activity.title.includes("Cancellazione") ? "-" : "+"}{activity.amount}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center rounded-b-2xl">
                                        <Button variant="link" className="text-indigo-600 font-semibold text-sm">Vedi tutte le transazioni</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>

        </div>
    );
}

// ---------------------------------
// SUBCOMPONENTS
// ---------------------------------
function NavItem({ icon, label, active = false, badge }) {
    return (
        <a
            href="#"
            className={`
        flex items-center justify-between px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 group relative
        ${active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
      `}
        >
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full"></div>
            )}
            <div className="flex items-center gap-3">
                <span className={`
          [&>svg]:w-5 [&>svg]:h-5 transition-transform duration-200
          ${active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}
        `}>
                    {icon}
                </span>
                <span className="font-semibold text-sm">{label}</span>
            </div>
            {badge && (
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {badge}
                </span>
            )}
        </a>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[160px]">
                <p className="text-sm font-bold text-slate-900 mb-3">{label} 2026</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                {entry.name === 'revenue' ? 'Ricavi Reali' : 'Target'}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                                €{entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
