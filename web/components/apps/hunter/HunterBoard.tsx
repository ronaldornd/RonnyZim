"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    CheckCircle2,
    XCircle,
    Loader2,
    Target,
    Activity,
    ChevronDown,
    FileText,
    BrainCircuit,
    Cpu,
    Zap,
    AlertTriangle,
    Trash2,
    ExternalLink
} from 'lucide-react';

interface HunterInsight {
    id: string;
    document_name: string;
    document_type: 'Job' | 'Resume';
    score: number;
    summary: string;
    key_points: string[];
    action_plan?: string;
    status: 'Evaluating' | 'Applied' | 'Rejected';
    created_at: string;
}

interface HunterBoardProps {
    userId: string;
}

export default function HunterBoard({ userId }: HunterBoardProps) {
    const [insights, setInsights] = useState<HunterInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Targets' | 'Profile'>('Targets');

    const supabase = createClient();

    const fetchInsights = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('hunter_insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setInsights(data as HunterInsight[]);
        } else {
            console.error('Failed to fetch insights:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (userId) fetchInsights();
    }, [userId]);

    const updateStatus = async (id: string, newStatus: HunterInsight['status']) => {
        setUpdatingId(id);
        const { error } = await supabase
            .from('hunter_insights')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setInsights(prev => prev.map(insight => insight.id === id ? { ...insight, status: newStatus } : insight));
        } else {
            console.error('Failed to update status:', error);
        }
        setUpdatingId(null);
    };

    const deleteInsight = async (id: string) => {
        if (!confirm("System Query: Delete this record permanently from the neural vault?")) return;
        setUpdatingId(id);
        const { error } = await supabase
            .from('hunter_insights')
            .delete()
            .eq('id', id);

        if (!error) {
            setInsights(prev => prev.filter(insight => insight.id !== id));
        } else {
            console.error('Failed to delete insight:', error);
        }
        setUpdatingId(null);
    };

    const openDocument = async (fileName: string) => {
        const { data } = supabase.storage.from('hunter_vault').getPublicUrl(fileName);
        if (data?.publicUrl) {
            window.open(data.publicUrl, '_blank');
        }
    };

    // Derived States
    const targetJobs = insights.filter(i => {
        const name = (i.document_name || "").toLowerCase();
        return !name.includes('curriculo') && !name.includes('currículo') && !name.includes('resume');
    });
    const myResumes = insights.filter(i => {
        const name = (i.document_name || "").toLowerCase();
        return name.includes('curriculo') || name.includes('currículo') || name.includes('resume');
    });
    const latestResume = myResumes.length > 0 ? myResumes[0] : null;

    // Helpers UI
    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Evaluating': return <Activity className="w-4 h-4 text-amber-400" />;
            case 'Applied': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'Rejected': return <XCircle className="w-4 h-4 text-rose-400" />;
            default: return <Target className="w-4 h-4 text-slate-400" />;
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] text-red-500/50">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <span className="font-mono text-sm tracking-widest uppercase">Decriptando CRM...</span>
            </div>
        );
    }

    // Cores temáticas dinâmicas com base na aba ativa
    const themeColor = activeTab === 'Targets' ? 'red' : 'cyan';
    const ThemeGlow = activeTab === 'Targets' ? 'from-transparent to-red-500' : 'from-transparent to-cyan-500';

    return (
        <div className={`w-full h-full bg-[#050505] flex flex-col text-slate-200 overflow-hidden font-sans border-4 ${activeTab === 'Targets' ? 'border-red-500/30 shadow-[inset_0_0_100px_rgba(239,68,68,0.05)]' : 'border-cyan-500/30 shadow-[inset_0_0_100px_rgba(6,182,212,0.05)]'} relative transition-colors duration-500`}>

            {/* Dynamic Inner Glow */}
            <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t ${ThemeGlow} transition-all duration-1000 ease-in-out`}></div>

            <header className={`h-24 border-b ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'} px-8 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-10 shrink-0`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border transition-colors duration-500 ${activeTab === 'Targets' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'}`}>
                        {activeTab === 'Targets' ? <Target className="h-8 w-8 text-red-400" /> : <BrainCircuit className="h-8 w-8 text-cyan-400" />}
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h1 className={`text-3xl font-bold tracking-tight leading-none transition-colors duration-500 ${activeTab === 'Targets' ? 'text-red-400' : 'text-cyan-400'}`}>The Hunter's Board</h1>

                        {/* Tabs de Navegação */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => setActiveTab('Targets')}
                                className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md transition-all ${activeTab === 'Targets' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Targets Acquired
                            </button>
                            <button
                                onClick={() => setActiveTab('Profile')}
                                className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md transition-all ${activeTab === 'Profile' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                My Resume Dash
                            </button>
                        </div>

                    </div>
                </div>
                <div className={`px-5 py-2 rounded-lg border font-mono text-xs flex items-center gap-3 transition-colors duration-500 ${activeTab === 'Targets' ? 'border-red-500/20 bg-red-500/5 text-red-400' : 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400'}`}>
                    <Briefcase className="w-4 h-4" />
                    <span>{insights.length} DOCUMENTS LOGGED</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">

                {/* 1. ABA TARGETS (Jobs / Vagas) */}
                {activeTab === 'Targets' && (
                    <>
                        {targetJobs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-red-500/20 rounded-2xl bg-red-500/5">
                                <Target className="w-16 h-16 text-red-500/40 mb-4" />
                                <h2 className="text-xl font-bold text-red-400 tracking-wider">NO ACTIVE TARGETS</h2>
                                <p className="text-slate-400 mt-2 font-mono text-sm max-w-md text-center">
                                    Transmita arquivos de Descrição de Vagas para a Vault e acione o protocolo HunterZim.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {targetJobs.map((insight) => (
                                        <motion.div
                                            key={insight.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex flex-col rounded-2xl border border-white/5 bg-[#0a0a0a] hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all overflow-hidden"
                                        >
                                            <div className="p-6 pb-4 border-b border-white/5 flex items-start justify-between">
                                                <div className="pr-4">
                                                    <h3 className="text-lg font-bold text-slate-200 line-clamp-1 truncate" title={insight.document_name}>
                                                        {insight.document_name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 font-mono mt-1">
                                                        ID: {insight.id.split('-')[0]} • {new Date(insight.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border ${getScoreColor(insight.score)}`}>
                                                    <span className="text-2xl font-black leading-none">{insight.score}</span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">Match</span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex-1 flex flex-col gap-4">
                                                <div>
                                                    <h4 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Summary</h4>
                                                    <p className="text-sm text-slate-300 leading-relaxed">
                                                        {insight.summary}
                                                    </p>
                                                </div>

                                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(insight.status)}
                                                        <span className={`text-xs font-bold uppercase tracking-widest ${insight.status === 'Applied' ? 'text-emerald-400' : insight.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400'}`}>
                                                            {insight.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => openDocument(insight.document_name)} className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors" title="Open Document">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => deleteInsight(insight.id)} disabled={updatingId === insight.id} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition-colors disabled:opacity-50" title="Delete Profile">
                                                            {updatingId === insight.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>

                                                        <div className="relative group ml-2">
                                                            <button disabled={updatingId === insight.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-colors disabled:opacity-50">
                                                                Update Status
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>

                                                            {/* Dropdown Menu on hover */}
                                                            <div className="absolute bottom-full right-0 mb-2 w-36 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                                <button onClick={() => updateStatus(insight.id, 'Evaluating')} className="w-full text-left px-4 py-2 text-xs font-mono text-amber-400 hover:bg-white/5 flex items-center gap-2">
                                                                    <Activity className="w-3 h-3" /> Evaluating
                                                                </button>
                                                                <button onClick={() => updateStatus(insight.id, 'Applied')} className="w-full text-left px-4 py-2 text-xs font-mono text-emerald-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5">
                                                                    <CheckCircle2 className="w-3 h-3" /> Applied
                                                                </button>
                                                                <button onClick={() => updateStatus(insight.id, 'Rejected')} className="w-full text-left px-4 py-2 text-xs font-mono text-rose-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5">
                                                                    <XCircle className="w-3 h-3" /> Rejected
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* 2. ABA PROFILE (Resumes) */}
                {activeTab === 'Profile' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="h-full flex flex-col"
                    >
                        {!latestResume ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/20 rounded-2xl bg-cyan-500/5">
                                <FileText className="w-16 h-16 text-cyan-500/40 mb-4" />
                                <h2 className="text-xl font-bold text-cyan-400 tracking-wider">NO RESUME FOUND</h2>
                                <p className="text-slate-400 mt-2 font-mono text-sm max-w-md text-center">
                                    Você não analisou nenhum Currículo ainda. Upe seu PDF de Currículo na Vault e solicite uma análise profunda.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header do Dash de Currículo */}
                                <div className="flex flex-col md:flex-row gap-6 p-8 border border-cyan-500/20 bg-black/40 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                                    <div className="flex flex-col items-center justify-center min-w-[200px] border-r border-white/5 pr-6">
                                        <div className="text-6xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                            {latestResume.score}
                                        </div>
                                        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-2 border border-white/10 px-3 py-1 rounded-full bg-white/5">
                                            Seniority Score
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center">
                                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                            <BrainCircuit className="w-6 h-6 text-cyan-500" />
                                            Análise de Perfil Analítico
                                        </h2>
                                        <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-cyan-500/50 pl-4 py-1">
                                            {latestResume.summary}
                                        </p>
                                        <p className="text-xs font-mono text-cyan-500/50 mt-4 flex items-center gap-1">
                                            <FileText className="w-3 h-3" /> Extraído de: {latestResume.document_name} em {new Date(latestResume.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Main Content Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Pontos Chave */}
                                    <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-6 hover:border-cyan-500/30 transition-colors group">
                                        <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 mb-4">
                                            <Cpu className="w-4 h-4 text-emerald-400 group-hover:text-cyan-400 transition-colors" />
                                            Radar de Forças Técnicas
                                        </h3>
                                        <div className="space-y-3">
                                            {latestResume.key_points && Array.isArray(latestResume.key_points) ? (
                                                latestResume.key_points.map((point, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                        <span className="text-sm text-slate-300">{point}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-slate-500 text-sm font-mono p-4">Nenhum ponto estruturado encontrado.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Plan */}
                                    <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-6 hover:border-cyan-500/30 transition-colors group">
                                        <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 mb-4">
                                            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:text-cyan-400 transition-colors" />
                                            Tactical Action Plan
                                        </h3>
                                        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-sm text-cyan-100/80 leading-relaxed max-w-full overflow-hidden">
                                            {latestResume.action_plan ? (
                                                <div dangerouslySetInnerHTML={{ __html: latestResume.action_plan.replace(/\n/g, '<br/>') }} />
                                            ) : (
                                                <span className="text-slate-500 font-mono">Nenhum plano de ação definido.</span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

            </main>
        </div>
    );
}
