"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Zap, 
    Target, 
    Activity, 
    CheckCircle2, 
    AlertTriangle, 
    ExternalLink, 
    Mic, 
    FileText, 
    ChevronRight,
    ClipboardList,
    ShieldCheck,
    Cpu,
    Save,
    Hammer,
    Loader2,
    Radar,
    Search,
    Copy,
    Check,
    LayoutDashboard,
    Trophy,
    MessageSquare,
    Globe
} from 'lucide-react';
import SearchTerminal from './SearchTerminal';
import SkillScanCard from '../identity/SkillScanCard';
import CVForgeModal from './CVForgeModal';
import ListeningRoom from './ListeningRoom';
import { HunterInsight } from './HunterBoard';


interface TargetDossierProps {
    job: HunterInsight;
    userId: string;
    onClose: () => void;
    onStartInterview: (job: HunterInsight) => void;
    onUpdateStatus: (id: string, status: HunterInsight['status']) => void;
    openDocument: (name: string) => void;
}

import { updateJobForgeAction } from '@/app/actions/profile';

type TabType = 'Intel' | 'Estratégia' | 'Treinamento' | 'Radar' | 'Logística';

export default function TargetDossier({ job, userId, onClose, onStartInterview, onUpdateStatus, openDocument }: TargetDossierProps) {
    const [activeTab, setActiveTab] = useState<TabType>('Intel');
    const [summaryPage, setSummaryPage] = useState(0);
    const charsPerPage = 700;
    const summaryPages = job.summary.match(new RegExp(`.{1,${charsPerPage}}`, 'g')) || [job.summary];

    const [notes, setNotes] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`hunter_notes_${job.id}`) || '';
        }
        return '';
    });

    const [isForging, setIsForging] = useState(false);
    const [forgeData, setForgeData] = useState<{coverLetter: string, resumeSummary: string} | null>(null);

    // Sync forge data from props (cache recognition)
    useEffect(() => {
        if (job.forge_cv && job.forge_objective) {
            setForgeData({
                coverLetter: job.forge_cv,
                resumeSummary: job.forge_objective
            });
        }
    }, [job.forge_cv, job.forge_objective]);
    const [isScanning, setIsScanning] = useState(false);
    const [radarData, setRadarData] = useState<{targets: string[], dm_template: string} | null>(null);
    const [copied, setCopied] = useState(false);

    const saveNotes = () => {
        localStorage.setItem(`hunter_notes_${job.id}`, notes);
    };

    const handleRadarScan = async () => {
        setIsScanning(true);
        try {
            const res = await fetch('/api/radar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    company_name: job.document_name.split('.')[0],
                    job_description: job.summary + '\n' + job.key_points.join('\n'),
                    strong_matches: job.gap_analysis?.strong_matches || []
                })
            });
            if (res.ok) {
                const data = await res.json();
                setRadarData(data);
            }
        } catch(e) {
            console.error('Radar Scan Failed:', e);
        } finally {
            setIsScanning(false);
        }
    };

    const handleForge = async () => {
        // 1. Check for cached arsenal (Local state or Props)
        const cachedCV = forgeData?.coverLetter || job.forge_cv;
        const cachedObjective = forgeData?.resumeSummary || job.forge_objective;

        if (cachedCV && cachedObjective) {
            if (!forgeData) {
                setForgeData({ 
                    coverLetter: cachedCV, 
                    resumeSummary: cachedObjective 
                });
            }
            return;
        }

        setIsForging(true);
        try {
            const res = await fetch('/api/forge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_requirements: job.summary + '\n' + job.key_points.join('\n'),
                    strong_matches: job.gap_analysis?.strong_matches || [],
                    missing_skills: job.gap_analysis?.missing_skills || []
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                const cv = data.cover_letter;
                const objective = data.resume_summary;
                
                setForgeData({ coverLetter: cv, resumeSummary: objective });

                // 2. Persist to cache (Supabase)
                await updateJobForgeAction(job.id, cv, objective);
            }
        } catch (e) {
            console.error('Forge Failed:', e);
        } finally {
            setIsForging(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-400 bg-emerald-500/10';
        if (score >= 70) return 'text-amber-400 bg-amber-500/10';
        return 'text-rose-400 bg-rose-500/10';
    };

    const tabs: {id: TabType, label: string, icon: any}[] = [
        { id: 'Intel', label: 'Intel', icon: LayoutDashboard },
        { id: 'Estratégia', label: 'Estratégia', icon: Trophy },
        { id: 'Treinamento', label: 'Treinamento', icon: Mic },
        { id: 'Radar', label: 'Radar', icon: Radar },
        { id: 'Logística', label: 'Logística', icon: Hammer },
    ];

    return (
        <section 
            aria-labelledby="dossier-title"
            className="w-full h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans"
        >
            {/* Glossy Header */}
            <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-3xl px-6 flex items-center justify-between shrink-0 relative z-30">
                <div className="flex items-center gap-6">
                    <div 
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-white/5 shadow-2xl ${getScoreColor(job.score)}`}
                        aria-label={`Score de Match: ${job.score}`}
                    >
                        <span className="text-2xl font-black leading-none" aria-hidden="true">{job.score}</span>
                        <span className="text-[8px] uppercase font-black tracking-[0.2em] mt-1 opacity-60" aria-hidden="true">Match</span>
                    </div>
                    <div>
                        <h2 id="dossier-title" className="text-xl font-black text-white tracking-tighter uppercase leading-tight max-w-xl">
                            {job.document_name.replace(/\.[^/.]+$/, "")}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5" aria-label={`Data de análise: ${new Date(job.created_at).toLocaleDateString()}`}>
                                <Target size={12} className="text-red-500" aria-hidden="true" /> Analisado: {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            <span className="bg-white/5 px-2 py-0.5 rounded text-zinc-400 border border-white/5">Vault ID: {job.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => openDocument(job.document_name)} 
                        aria-label="Abrir Documento Original"
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 shadow-lg border border-white/5"
                    >
                        <ExternalLink size={16} aria-hidden="true" />
                    </button>
                    <button 
                        onClick={onClose} 
                        aria-label="Fechar Dossiê"
                        className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-95 shadow-lg border border-red-500/20"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
            </header>

            {/* Tab Navigation Dock */}
            <nav className="h-14 bg-white/[0.02] border-b border-white/5 flex items-center justify-center gap-2 px-4 shrink-0 z-20" aria-label="Abas de Inteligência">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-500 relative group ${
                                isActive ? 'text-red-500 bg-red-500/5' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Icon size={14} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} aria-hidden="true" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                            {isActive && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                        </button>
                    );
                })}
            </nav>

            {/* Tab Content Area */}
            <main className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_rgba(239,68,68,0.03)_0%,_transparent_50%)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="h-full w-full p-6 max-w-[95%] mx-auto overflow-hidden flex flex-col"
                    >
                        {activeTab === 'Intel' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                                <section className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col">
                                    <h3 className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} /> Sumário Executivo
                                    </h3>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex-1 text-zinc-400 text-lg leading-relaxed font-medium space-y-4">
                                            <p>{summaryPages[summaryPage]}</p>
                                        </div>
                                        
                                        {summaryPages.length > 1 && (
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                <button 
                                                    onClick={() => setSummaryPage(p => Math.max(0, p - 1))}
                                                    disabled={summaryPage === 0}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${summaryPage === 0 ? 'text-zinc-800' : 'text-red-500 hover:bg-red-500/10'}`}
                                                >
                                                    Anterior
                                                </button>
                                                <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                                                    Fragmento {summaryPage + 1} de {summaryPages.length}
                                                </span>
                                                <button 
                                                    onClick={() => setSummaryPage(p => Math.min(summaryPages.length - 1, p + 1))}
                                                    disabled={summaryPage === summaryPages.length - 1}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${summaryPage === summaryPages.length - 1 ? 'text-zinc-800' : 'text-red-500 hover:bg-red-500/10'}`}
                                                >
                                                    Próximo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>
                                <section className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col">
                                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <Cpu size={14} /> Requisitos Chave
                                    </h3>
                                    <div className="flex-1 space-y-3">
                                        {job.key_points.map((point, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-colors">
                                                <ChevronRight size={16} className="text-red-500 shrink-0 mt-0.5" />
                                                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'Estratégia' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                                <section className="p-6 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col">
                                    <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={14} /> Pontos Fortes
                                    </h3>
                                    <div className="flex flex-wrap gap-4 content-start">
                                        {job.gap_analysis?.strong_matches.map((skill, idx) => (
                                            <span key={idx} className="px-6 py-2.5 rounded-2xl text-[11px] font-black font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                                <section className="p-6 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 flex flex-col">
                                    <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} /> Gaps Técnicos
                                    </h3>
                                    <div className="flex flex-wrap gap-4 content-start">
                                        {job.gap_analysis?.missing_skills.map((skill, idx) => (
                                            <span key={idx} className="px-6 py-2.5 rounded-2xl text-[11px] font-black font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xl">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'Treinamento' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-y-auto custom-scrollbar pb-2">
                                <div className="lg:col-span-12 flex flex-col shrink-0">
                                    {/* Simulador CTA - Compact */}
                                    <section className="p-4 md:p-6 rounded-[2rem] bg-white/[0.02] border border-red-500/10 flex items-center gap-5 group hover:border-red-500/30 transition-all">
                                        <button 
                                            onClick={() => onStartInterview(job)}
                                            className="relative shrink-0 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-red-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            <div className="relative z-10 w-16 h-16 rounded-2xl bg-red-600 border border-white/20 shadow-[0_10px_40px_rgba(239,68,68,0.2)] flex items-center justify-center group-hover:scale-105 transition-transform duration-500 active:scale-95">
                                                <Mic size={28} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                                            </div>
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1.5">Simulador de Entrevista</h3>
                                            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-lg mb-3">
                                                O HunterZim Agent faz perguntas técnicas baseadas nos requisitos da vaga e nos seus gaps identificados. 
                                                Você responde por voz e recebe avaliação com score.
                                            </p>
                                            <button 
                                                onClick={() => onStartInterview(job)}
                                                className="px-5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 inline-flex"
                                            >
                                                Iniciar Sessão de Treino
                                            </button>
                                        </div>
                                    </section>
                                </div>
                                
                                <section className="lg:col-span-12 p-4 md:p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shrink-0 h-fit">
                                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <Zap size={14} /> Plano de Ação
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {(Array.isArray(job.action_plan) ? job.action_plan : (job.action_plan?.steps || []))?.map((step: string, idx: number) => (
                                            <div key={idx} className="p-4 md:p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all flex flex-col">
                                                <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-500 mb-3 shrink-0">{idx + 1}</div>
                                                <p className="text-[11px] md:text-xs text-zinc-400 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'Radar' && (
                            <div className="h-full flex flex-col gap-6 overflow-hidden">
                                <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                                    <div className="p-6 rounded-[2rem] bg-red-500/[0.02] border border-red-500/10 flex flex-col relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                                            <Radar size={100} className="text-red-500" />
                                        </div>
                                        <h3 className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <Search size={14} /> Networking Radar
                                        </h3>
                                        
                                        {!radarData && !isScanning && (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                                <div className="p-8 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse">
                                                    <Radar size={40} className="text-red-500" />
                                                </div>
                                                <button 
                                                    onClick={handleRadarScan}
                                                    className="px-10 py-5 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-red-500 transition-all active:scale-95"
                                                >
                                                    Escaneamento Neural
                                                </button>
                                            </div>
                                        )}

                                        {isScanning && (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                                <Loader2 size={48} className="text-red-500 animate-spin" />
                                                <span className="text-[10px] font-mono font-black text-red-500/60 tracking-[0.5em] animate-pulse">CALIBRANDO FREQUÊNCIAS...</span>
                                            </div>
                                        )}

                                        {radarData && (
                                            <div className="flex-1 space-y-8">
                                                <div className="space-y-4">
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Alvos de Contato</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {radarData.targets.map((t, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-[10px] font-mono font-black text-red-400">@{t.toUpperCase()}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Script de Infiltração (LinkedIn)</span>
                                                    <div className="relative">
                                                        <div className="bg-black/40 rounded-3xl p-8 pr-16 text-xs text-zinc-400 leading-relaxed font-mono italic shadow-inner border border-white/5">
                                                            {radarData.dm_template}
                                                        </div>
                                                        <button 
                                                            onClick={() => copyToClipboard(radarData.dm_template)}
                                                            className={`absolute top-6 right-6 p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500 hover:text-red-400'}`}
                                                        >
                                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-blue-500/[0.02] border border-blue-500/10 flex flex-col">
                                        <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <MessageSquare size={14} /> Listening Room
                                        </h3>
                                        <div className="flex-1 overflow-hidden">
                                            <ListeningRoom jobId={job.id} />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'Logística' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
                                <div className="lg:col-span-5 flex flex-col gap-6">
                                    <section className="flex-1 p-6 rounded-[2.5rem] bg-cyan-500/5 border border-cyan-500/10 flex flex-col items-center justify-center text-center">
                                        <Hammer size={48} className="text-cyan-400 mb-6" />
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">A Forja</h3>
                                        <p className="text-xs text-cyan-400/60 mb-8 max-w-xs leading-relaxed">Gere currículos e cartas de apresentação hiper-customizados para esta vaga.</p>
                                        <button 
                                            onClick={handleForge}
                                            disabled={isForging}
                                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-cyan-500 text-black font-black uppercase text-[9px] tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                                        >
                                            {isForging ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                            {isForging ? 'FORJANDO...' : 'ACESSAR ARMAMENTO'}
                                        </button>
                                    </section>
                                </div>
                                <div className="lg:col-span-7">
                                    <section className="h-full p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col group">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <ClipboardList size={14} /> Notas Táticas
                                            </h3>
                                            <button 
                                                onClick={saveNotes}
                                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all shadow-xl"
                                            >
                                                <Save size={18} />
                                            </button>
                                        </div>
                                        <label htmlFor="tactical-notes" className="sr-only">Notas Táticas</label>
                                        <textarea 
                                            id="tactical-notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Registrar insights de guerra..."
                                            className="flex-1 w-full bg-black/40 rounded-2xl p-6 text-sm text-zinc-400 font-sans resize-none focus:outline-none transition-all placeholder:text-zinc-800 leading-relaxed font-medium border border-white/5"
                                        />
                                    </section>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Micro Status Bar */}
            <footer className="h-10 bg-black/60 border-t border-white/5 flex items-center justify-between px-6 shrink-0 z-20" aria-label="Status Neural">
                <div className="flex items-center gap-6 text-[9px] font-mono font-black text-zinc-700 uppercase tracking-[0.3em]">
                    <span className="flex items-center gap-2"><Globe size={10} className="text-zinc-800" aria-hidden="true" /> Link Neural Ativo</span>
                    <span>Sinc 99%</span>
                </div>
                <div className="text-[8px] font-mono text-zinc-800 uppercase tracking-[0.2em]">HunterOS Modular v2.1</div>
            </footer>

            <AnimatePresence>
                {forgeData && (
                    <CVForgeModal 
                        coverLetter={forgeData.coverLetter}
                        resumeSummary={forgeData.resumeSummary}
                        onClose={() => setForgeData(null)}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
