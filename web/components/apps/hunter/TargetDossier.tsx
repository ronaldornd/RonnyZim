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
    Check
} from 'lucide-react';
import CVForgeModal from './CVForgeModal';
import ListeningRoom from './ListeningRoom';

interface HunterInsight {
    id: string;
    document_name: string;
    document_type: 'Job' | 'Resume';
    score: number;
    summary: string;
    key_points: string[];
    action_plan?: string[];
    gap_analysis?: {
        match_percentage: number;
        missing_skills: string[];
        strong_matches: string[];
    };
    status: 'Evaluating' | 'Applied' | 'Rejected';
    created_at: string;
}

interface TargetDossierProps {
    job: HunterInsight;
    userId: string;
    onClose: () => void;
    onStartInterview: (job: HunterInsight) => void;
    onUpdateStatus: (id: string, status: HunterInsight['status']) => void;
    openDocument: (name: string) => void;
}

export default function TargetDossier({ job, userId, onClose, onStartInterview, onUpdateStatus, openDocument }: TargetDossierProps) {
    const [notes, setNotes] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`hunter_notes_${job.id}`) || '';
        }
        return '';
    });

    const saveNotes = () => {
        localStorage.setItem(`hunter_notes_${job.id}`, notes);
        // Feedback visual sutil poderia ser adicionado aqui
    };

    const [isForging, setIsForging] = useState(false);
    const [forgeData, setForgeData] = useState<{coverLetter: string, resumeSummary: string} | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [radarData, setRadarData] = useState<{targets: string[], dm_template: string} | null>(null);
    const [copied, setCopied] = useState(false);

    const handleRadarScan = async () => {
        setIsScanning(true);
        try {
            const res = await fetch('/api/radar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    company_name: job.document_name.split('.')[0], // Extracting name from file
                    job_description: job.summary + '\n' + job.key_points.join('\n'),
                    strong_matches: job.gap_analysis?.strong_matches || []
                })
            });
            if (res.ok) {
                const data = await res.json();
                setRadarData(data);
            } else {
                const errData = await res.json();
                console.error('❌ Radar Error:', errData);
                alert(`Erro no Radar: ${errData.details || 'Falha no modelo'}. Tente novamente.`);
            }
        } catch(e) {
            console.error('❌ Radar Fatal:', e);
            alert('Falha crítica no Link Neural. Verifique sua conexão ou API Key.');
        } finally {
            setIsScanning(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    const handleForge = async () => {
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
                setForgeData({ coverLetter: data.cover_letter, resumeSummary: data.resume_summary });
            } else {
                alert('Erro ao forjar Armamento.');
            }
        } catch(e) {
            console.error(e);
            alert('Falha na conexão com a Forja.');
        } finally {
            setIsForging(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'Evaluating': return 'Avaliando';
            case 'Applied': return 'Candidatado';
            case 'Rejected': return 'Rejeitado';
            default: return status;
        }
    };

    return (
        <>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0514]/95 backdrop-blur-xl overflow-y-auto custom-scrollbar flex flex-col"
        >
            {/* Header / Top Bar */}
            <div className="sticky top-0 z-20 bg-[#0B0514]/90 backdrop-blur-xl border-b border-red-500/20 px-8 py-6 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-6 overflow-hidden">
                    <div className={`px-4 py-2 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(job.score)}`}>
                        <span className="text-2xl font-black leading-none">{job.score}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Match</span>
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase leading-none mb-2 truncate max-w-2xl" title={job.document_name.replace(/\.[^/.]+$/, "")}>
                            {job.document_name.replace(/\.[^/.]+$/, "")}
                        </h1>
                        <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-500 uppercase tracking-widest overflow-hidden">
                            <span className="flex items-center gap-1"><FileText size={12} className="text-red-500" /> ID: {job.id.split('-')[0]}</span>
                            <span className="flex items-center gap-1"><Activity size={12} className="text-red-500" /> Analisado em {new Date(job.created_at).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2 ml-4">
                                <span className={job.status === 'Applied' ? 'text-emerald-400' : job.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400'}>
                                    Status: {translateStatus(job.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => openDocument(job.document_name)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
                        title="Ver Documento Original"
                    >
                        <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-500 transition-all group"
                        title="Fechar Dossiê"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* COLUMN 1: THE INTEL (Left, 4 Span) */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target size={120} className="text-red-500" />
                        </div>
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ShieldCheck size={14} /> Resumo Executivo
                        </h3>
                        <p className="text-zinc-300 text-sm leading-relaxed relative z-10">
                            {job.summary}
                        </p>
                    </section>

                    <section className="p-6 rounded-2xl bg-[#120a1d] border border-red-500/10">
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Cpu size={14} /> Insights Neurais
                        </h3>
                        <div className="space-y-3">
                            {job.key_points.map((point, idx) => (
                                <div key={idx} className="flex gap-3 text-sm text-zinc-400 group/point">
                                    <ChevronRight size={14} className="text-red-500 shrink-0 mt-1 transition-transform group-hover/point:translate-x-1" />
                                    <span>{point}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* COLUMN 2: THE STRATEGY (Middle, 4 Span) */}
                <div className="lg:col-span-4 space-y-8">
                    {job.gap_analysis && (
                        <section className="space-y-4">
                            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Pontos Fortes
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.gap_analysis.strong_matches.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                                <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Gaps Técnicos
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.gap_analysis.missing_skills.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                        <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Zap size={14} /> Plano de Ação Tático
                        </h3>
                        <div className="space-y-4">
                            {job.action_plan?.map((step, idx) => (
                                <div key={idx} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all">
                                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500 border border-amber-500/30 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-snug">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* COLUMN 3: ACTION CENTER (Right, 4 Span) */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Zap size={14} className="animate-pulse" /> Protocolo de Preparação
                        </h3>
                        
                        <button 
                            onClick={() => onStartInterview(job)}
                            className="w-full flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <Mic size={48} className="relative z-10 group-hover:scale-110 transition-transform mb-2" />
                            <span className="relative z-10 text-lg font-black tracking-tight uppercase">Manual de Interrogatório</span>
                            <span className="relative z-10 text-xs font-mono opacity-80 font-bold">Lançar HunterZim IA de Voz</span>
                        </button>

                        <button 
                            onClick={handleForge}
                            disabled={isForging}
                            className="w-full mt-4 flex items-center justify-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors font-bold tracking-widest uppercase text-xs"
                        >
                            {isForging ? <Loader2 size={18} className="animate-spin" /> : <Hammer size={18} />}
                            {isForging ? 'Forjando...' : 'Forjar Armamento (CV Forge)'}
                        </button>

                        <div className="mt-8 pt-8 border-t border-red-500/10">
                            <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Radar size={14} className={isScanning ? "animate-spin" : "animate-pulse"} /> ⚡ RADAR DE NETWORKING
                            </h3>

                            {!radarData && !isScanning && (
                                <button 
                                    onClick={handleRadarScan}
                                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-bold tracking-[0.15em] uppercase text-[10px]"
                                >
                                    <Search size={16} />
                                    Ativar Radar (Scan)
                                </button>
                            )}

                            {isScanning && (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <div className="relative">
                                        <Loader2 size={32} className="text-red-500 animate-spin" />
                                        <div className="absolute inset-0 animate-ping rounded-full border border-red-500/50" />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-red-400 animate-pulse tracking-widest">RASTREAMENTO NEURAL...</span>
                                </div>
                            )}

                            {radarData && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Alvos Prioritários (Bounties)</span>
                                        <div className="flex flex-wrap gap-2">
                                            {radarData.targets.map((target, idx) => (
                                                <span key={idx} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 font-mono">
                                                    @{target.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Mensagem de Conexão</span>
                                        <div className="relative group/dm">
                                            <div className="w-full bg-black/60 border border-red-500/20 rounded-xl p-4 pr-12 font-mono text-[11px] text-red-100/80 leading-relaxed shadow-inner">
                                                {radarData.dm_template}
                                            </div>
                                            <button 
                                                onClick={() => copyToClipboard(radarData.dm_template)}
                                                className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                                                    copied ? 'bg-emerald-500 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                                }`}
                                                title="Copiar para o Clipboard"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleRadarScan}
                                        className="w-full text-[9px] text-zinc-600 hover:text-red-400 transition-colors uppercase font-bold tracking-widest flex items-center justify-center gap-1"
                                    >
                                        <Activity size={10} /> Escanear Novamente
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Listening Room Section */}
                        <div className="mt-8 pt-8 border-t border-red-500/10">
                            <ListeningRoom jobId={job.id} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-6">
                            {(['Evaluating', 'Applied', 'Rejected'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onUpdateStatus(job.id, s)}
                                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-tight border transition-all ${
                                        job.status === s 
                                        ? 'bg-white/10 border-white/30 text-white' 
                                        : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20'
                                    }`}
                                >
                                    {translateStatus(s)}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="p-6 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col h-[280px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <ClipboardList size={14} /> Inteligência Pessoal
                            </h3>
                            <button 
                                onClick={saveNotes}
                                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                                title="Salvar Notas"
                            >
                                <Save size={16} />
                            </button>
                        </div>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Anote detalhes da vaga, salário pretendido, ou pontos de contato aqui..."
                            className="flex-1 w-full bg-zinc-950/50 rounded-xl p-4 text-sm text-zinc-300 font-sans resize-none border border-white/5 focus:border-red-500/30 focus:outline-none transition-all placeholder:text-zinc-700"
                        />
                    </section>
                </div>

            </main>

            {/* Footer Status Bar */}
            <div className="bg-black/50 border-t border-white/5 px-8 py-3 flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-auto">
                <div className="flex gap-6">
                    <span>Sinal: Forte</span>
                    <span>Conexão Criptografada</span>
                </div>
                <div>Motor de Dossiê HunterOS v2.0</div>
            </div>
        </motion.div>
            <AnimatePresence>
                {forgeData && (
                    <CVForgeModal 
                        coverLetter={forgeData.coverLetter}
                        resumeSummary={forgeData.resumeSummary}
                        onClose={() => setForgeData(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
