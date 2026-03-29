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
    AlertOctagon,
    Award,
    Trash2,
    ExternalLink,
    Mic
} from 'lucide-react';
import InterviewSimulator from './InterviewSimulator';
import TargetDossier from './TargetDossier';
import MarketOracle from './MarketOracle';

export interface HunterInsight {
    id: string;
    document_name: string;
    document_type: 'Job' | 'Resume';
    score: number;
    summary: string;
    key_points: string[];
    action_plan?: string[] | { steps: string[] };
    gap_analysis?: {
        match_percentage: number;
        missing_skills: string[];
        strong_matches: string[];
        risks?: string[];
    };
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
    const [userName, setUserName] = useState('Operador');


    // [Phase 8] Selection & Expansion States
    const [selectedJob, setSelectedJob] = useState<HunterInsight | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // [Phase 6] Interview States
    const [isInterviewOpen, setIsInterviewOpen] = useState(false);
    const [selectedInterviewJob, setSelectedInterviewJob] = useState<HunterInsight | null>(null);

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
        if (userId) {
            fetchInsights();
            fetchUserName();
        }
    }, [userId]);

    const fetchUserName = async () => {
        const { data, error } = await supabase
            .from('user_facts')
            .select('property_key, value')
            .eq('user_id', userId)
            .in('property_key', ['display_name', 'full_name']);

        if (!error && data && data.length > 0) {
            const displayObj = data.find(d => d.property_key === 'display_name');
            const fullObj = data.find(d => d.property_key === 'full_name');
            const rawName = displayObj?.value || fullObj?.value || 'Operador';
            
            // Pega apenas o primeiro nome para uma conversa mais casual
            setUserName(rawName.split(' ')[0]);
        }
    };

    const updateStatus = async (id: string, newStatus: HunterInsight['status']) => {
        setUpdatingId(id);
        const { error } = await supabase
            .from('hunter_insights')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setInsights(prev => prev.map(insight => insight.id === id ? { ...insight, status: newStatus } : insight));
            
            // [Phase 8] Update selection state to reflect status change immediately
            if (selectedJob?.id === id) {
                setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } else {
            console.error('Failed to update status:', error);
        }
        setUpdatingId(null);
    };

    const deleteInsight = async (id: string) => {
        if (!confirm("Consulta do Sistema: Excluir este registro permanentemente do cofre neural?")) return;
        setUpdatingId(id);
        const { error } = await supabase
            .from('hunter_insights')
            .delete()
            .eq('id', id);

        if (!error) {
            setInsights(prev => prev.filter(insight => insight.id !== id));
            // Reset index if we deleted the current job
            if (currentIndex >= targetJobs.length - 1) {
                setCurrentIndex(Math.max(0, targetJobs.length - 2));
            }
        } else {
            console.error('Failed to delete insight:', error);
        }
        setUpdatingId(null);
    };

    const openDocument = async (fileName: string) => {
        // Como o bucket hunter_vault pode ser privado, usamos createSignedUrl para acesso seguro (300s de expiração)
        const { data, error } = await supabase.storage.from('hunter_vault').createSignedUrl(fileName, 300);
        
        if (error) {
            console.error('Erro ao gerar link de acesso ao documento:', error);
            return;
        }

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
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
                <span className="font-mono text-sm tracking-widest uppercase">Descriptografando CRM...</span>
            </div>
        );
    }

    // Dynamic theme colors
    const themeColor = activeTab === 'Targets' ? 'red' : 'cyan';
    const ThemeGlow = activeTab === 'Targets' ? 'from-transparent to-red-500' : 'from-transparent to-cyan-500';

    return (
        <div className={`w-full h-screen bg-[#050505] flex flex-col text-slate-200 overflow-hidden font-sans border ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'} relative transition-colors duration-500`}>

            {/* Dynamic Inner Glow */}
            <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t ${ThemeGlow} transition-all duration-1000 ease-in-out`}></div>

            <header className={`h-20 border-b ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'} px-8 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-10 shrink-0`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border transition-colors duration-500 ${activeTab === 'Targets' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}>
                        {activeTab === 'Targets' ? <Target className="h-6 w-6 text-red-400" /> : <BrainCircuit className="h-6 w-6 text-cyan-400" />}
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h1 className={`text-2xl font-bold tracking-tight leading-none transition-colors duration-500 ${activeTab === 'Targets' ? 'text-red-400' : 'text-cyan-400'}`}>Mural do Caçador</h1>

                        {/* Tabs de Navegação */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => setActiveTab('Targets')}
                                className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md transition-all ${activeTab === 'Targets' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Alvos Adquiridos
                            </button>
                            <button
                                onClick={() => setActiveTab('Profile')}
                                className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md transition-all ${activeTab === 'Profile' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Painel de Currículos
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-5rem)]">
                
                {/* LEFT PANEL: SINGLE CARD (Expand to 12 if Profile) */}
                <div className={`h-full overflow-hidden p-4 transition-all duration-700 ${activeTab === 'Profile' ? 'md:col-span-12' : 'md:col-span-4'} ${isInterviewOpen ? 'hidden md:block' : 'block'}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full flex flex-col"
                        >
                            {activeTab === 'Targets' && (
                                <div className="h-full flex flex-col">
                                    {targetJobs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-red-500/20 rounded-[2.5rem] bg-red-500/5 p-12">
                                            <Target className="w-16 h-16 text-red-500/40 mb-4" />
                                            <h2 className="text-xl font-bold text-red-400 tracking-wider text-center">NENHUM ALVO ATIVO</h2>
                                            <p className="text-slate-400 mt-4 font-mono text-[10px] text-center uppercase tracking-widest leading-relaxed">
                                                Transmita arquivos de Descrição de Vagas para a Vault e acione o protocolo HunterZim.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col gap-4 relative h-full">
                                            {/* Job Card Display (Single) */}
                                            <div className="flex-1 overflow-hidden relative">
                                                <AnimatePresence mode="wait">
                                                    {targetJobs[currentIndex] && (
                                                        <motion.div
                                                            key={targetJobs[currentIndex].id}
                                                            initial={{ opacity: 0, x: 100 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -100 }}
                                                            drag="x"
                                                            dragConstraints={{ left: 0, right: 0 }}
                                                            onDragEnd={(_, info) => {
                                                                if (info.offset.x > 100 && currentIndex > 0) {
                                                                    setCurrentIndex(prev => prev - 1);
                                                                } else if (info.offset.x < -100 && currentIndex < targetJobs.length - 1) {
                                                                    setCurrentIndex(prev => prev + 1);
                                                                }
                                                            }}
                                                            className="h-full cursor-grab active:cursor-grabbing"
                                                        >
                                                            <JobCard 
                                                                insight={targetJobs[currentIndex]} 
                                                                onSelect={(job: HunterInsight) => {
                                                                    setSelectedJob(job);
                                                                    setIsExpanded(true);
                                                                }} 
                                                                onDelete={deleteInsight}
                                                                onUpdateStatus={updateStatus}
                                                                openDocument={openDocument}
                                                                getScoreColor={getScoreColor}
                                                                getStatusIcon={getStatusIcon}
                                                                updatingId={updatingId}
                                                                onStartInterview={(job: HunterInsight) => {
                                                                    setSelectedInterviewJob(job);
                                                                    setIsInterviewOpen(true);
                                                                }}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Navigation Controls */}
                                            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] rounded-2xl border border-white/5">
                                                <button
                                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                                    disabled={currentIndex === 0}
                                                    className={`p-2 rounded-xl transition-all ${currentIndex === 0 ? 'text-zinc-800' : 'text-red-500 hover:bg-red-500/10 active:scale-95'}`}
                                                >
                                                    <ChevronDown className="w-5 h-5 rotate-90" />
                                                </button>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                                                        Alvo {currentIndex + 1} de {targetJobs.length}
                                                    </span>
                                                    <div className="flex gap-1 mt-2">
                                                        {targetJobs.map((_, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-red-500' : 'w-1 bg-zinc-800'}`} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setCurrentIndex(prev => Math.min(targetJobs.length - 1, prev + 1))}
                                                    disabled={currentIndex === targetJobs.length - 1}
                                                    className={`p-2 rounded-xl transition-all ${currentIndex === targetJobs.length - 1 ? 'text-zinc-800' : 'text-red-500 hover:bg-red-500/10 active:scale-95'}`}
                                                >
                                                    <ChevronDown className="w-5 h-5 -rotate-90" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Profile' && (
                                <div className="h-full overflow-hidden">
                                    {!latestResume ? (
                                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/20 rounded-[2.5rem] bg-cyan-500/5">
                                            <FileText className="w-16 h-16 text-cyan-500/40 mb-4" />
                                            <h2 className="text-xl font-bold text-cyan-400 tracking-wider">NENHUM CURRÍCULO</h2>
                                        </div>
                                    ) : (
                                        <ProfileView latestResume={latestResume} />
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* RIGHT PANEL: SIMULATOR OR MARKET ORACLE / HEATMAP (8/12) - Hidden if Profile */}
                <div className={`transition-all duration-700 md:col-span-8 h-full overflow-hidden p-4 bg-black/10 backdrop-blur-[2px] ${activeTab === 'Profile' ? 'hidden md:hidden' : (isExpanded && selectedJob && !isInterviewOpen ? 'hidden md:block' : 'block')}`}>
                    <AnimatePresence mode="wait">
                        {isInterviewOpen ? (
                            <motion.div
                                key="simulator"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full"
                            >
                                <InterviewSimulator 
                                    isOpen={isInterviewOpen}
                                    onClose={() => setIsInterviewOpen(false)}
                                    jobId={selectedInterviewJob?.id || ''}
                                    jobDescription={selectedInterviewJob?.summary || ''}
                                    gapAnalysis={selectedInterviewJob?.gap_analysis || {}}
                                    userName={userName}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="oracle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col gap-4"
                            >
                                <div className="p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm flex-1 flex flex-col">
                                    <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase flex items-center gap-2 mb-4">
                                        <Cpu className="w-4 h-4 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                        Nexus de Inteligência de Mercado
                                    </h3>
                                    <div className="flex-1 overflow-hidden">
                                        <MarketOracle userId={userId} />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl border border-white/5 bg-red-500/5 backdrop-blur-md">
                                        <div className="text-3xl font-black text-red-500 tracking-tighter">{insights.length}</div>
                                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Insights Totais</div>
                                    </div>
                                    <div className="p-6 rounded-2xl border border-white/5 bg-cyan-500/5 backdrop-blur-md">
                                        <div className="text-3xl font-black text-cyan-400 tracking-tighter">{insights.filter(i => i.status === 'Applied').length}</div>
                                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Candidaturas Ativas</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* HERO EXPANSION OVERLAY */}
                <AnimatePresence>
                    {isExpanded && selectedJob && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-[#050505]"
                        >
                            <TargetDossier 
                                job={selectedJob}
                                userId={userId}
                                onClose={() => {
                                    setIsExpanded(false);
                                    setSelectedJob(null);
                                }}
                                onUpdateStatus={updateStatus}
                                openDocument={openDocument}
                                onStartInterview={(job: HunterInsight) => {
                                    setSelectedInterviewJob(job);
                                    setIsInterviewOpen(true);
                                    setIsExpanded(false);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function JobCard({ 
    insight, 
    onSelect, 
    onDelete, 
    onUpdateStatus, 
    openDocument, 
    getScoreColor, 
    getStatusIcon, 
    updatingId, 
    onStartInterview 
}: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col rounded-xl bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-500 group/card relative overflow-hidden active:scale-[0.99]"
        >
            {/* Subtle Inner Glow on Hover */}
            <div className="absolute inset-0 bg-red-500/0 group-hover/card:bg-red-500/[0.02] transition-colors duration-700 pointer-events-none" />
            
            <div 
                onClick={() => onSelect(insight)}
                className="p-4 pb-2 flex items-start justify-between cursor-pointer relative z-10"
            >
                <div className="pr-6 space-y-1">
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover/card:text-red-400 transition-colors duration-300" title={insight.document_name}>
                        {insight.document_name}
                    </h3>
                    <p className="text-[9px] text-zinc-500 font-mono flex items-center gap-2 opacity-60">
                        <span className="bg-white/5 px-2 py-0.5 rounded text-zinc-400">ID: {insight.id.split('-')[0]}</span>
                        <span>•</span>
                        <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                    </p>
                </div>
                <div className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-none transition-all duration-500 group-hover/card:shadow-[0_0_20px_rgba(239,68,68,0.15)] ${getScoreColor(insight.score)}`}>
                    <span className="text-2xl font-black leading-none">{insight.score}</span>
                    <span className="text-[8px] uppercase font-black tracking-[0.2em] mt-1.5 opacity-60">Match</span>
                </div>
            </div>

            <div className="p-4 pt-0 flex-1 flex flex-col gap-4 relative z-10">
                <div onClick={() => onSelect(insight)} className="cursor-pointer space-y-2">
                    <h4 className="text-[8px] uppercase tracking-[0.3em] font-black text-zinc-600">Sumário Executivo</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        {insight.summary}
                    </p>
                </div>

                {insight.gap_analysis && insight.gap_analysis.match_percentage !== undefined && (
                    <div className="mt-1 space-y-3">
                        <div className="flex items-center justify-between bg-red-500/[0.03] rounded-xl p-3 group/match transition-colors hover:bg-red-500/[0.08]">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Match de Combate</span>
                            </div>
                            <div className="text-xl font-black text-red-500 tracking-tighter">
                                {insight.gap_analysis.match_percentage}%
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="opacity-70">{getStatusIcon(insight.status)}</div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${insight.status === 'Applied' ? 'text-emerald-500' : insight.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'}`}>
                            {insight.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); openDocument(insight.document_name); }} className="p-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 transition-all duration-300">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(insight.id); }} disabled={updatingId === insight.id} className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-all duration-300">
                            {updatingId === insight.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); onStartInterview(insight); }}
                    className="w-full flex items-center justify-center gap-3 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all duration-500 group/btn relative overflow-hidden active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-red-500/0 group-hover/btn:bg-red-500/[0.05] transition-colors" />
                    <Mic className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[9px] font-black font-mono uppercase tracking-[0.3em]">Iniciar Simulação</span>
                </button>
            </div>
        </motion.div>
    );
}

function ProfileView({ latestResume }: { latestResume: HunterInsight }) {
    if (!latestResume) return null;

    const gapAnalysis = latestResume.gap_analysis || { missing_skills: [], match_percentage: 0, risks: [] };
    const actionPlan = latestResume.action_plan || { steps: [] };

    return (
        <div className="h-full flex flex-col gap-4 p-2 overflow-hidden">
            {/* Header Hero - Compacto */}
            <div className="flex flex-col md:flex-row gap-6 p-6 border border-cyan-500/20 bg-cyan-500/[0.02] rounded-[2.5rem] backdrop-blur-md relative overflow-hidden shrink-0 transition-all hover:bg-cyan-500/[0.04]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col items-center justify-center min-w-[140px] border-r border-white/5 pr-6">
                    <div className="text-6xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] leading-none italic">{latestResume.score}</div>
                    <div className="text-[10px] font-black font-mono text-cyan-500/60 uppercase tracking-[0.3em] mt-3">Índice Alpha</div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Estratégia de Infiltração: {latestResume.document_name}</h2>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-3xl font-medium tracking-wide">
                        {latestResume.summary}
                    </p>
                </div>
            </div>

            {/* Grid de Inteligência - 3 Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
                {/* Coluna 1: Forças e Gaps */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    {/* Forças */}
                    <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-3xl p-5 flex flex-col overflow-hidden">
                        <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> Vetores de Ataque (Forças)
                        </h3>
                        <div className="flex flex-wrap gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            {(latestResume.key_points || []).map((point, i) => (
                                <span key={i} className="text-[10px] px-3 py-1.5 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-cyan-300 font-bold uppercase tracking-wider">
                                    {point}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Gaps */}
                    <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-3xl p-5 flex flex-col overflow-hidden">
                        <h3 className="text-[10px] font-black text-rose-500/70 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" /> Pontos Cego (Gaps)
                        </h3>
                        <div className="flex flex-wrap gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            {(gapAnalysis.missing_skills || []).map((skill, i) => (
                                <span key={i} className="text-[10px] px-3 py-1.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-rose-400/80 font-bold uppercase tracking-wider">
                                    {skill}
                                </span>
                            ))}
                            {(!gapAnalysis.missing_skills || gapAnalysis.missing_skills.length === 0) && (
                                <p className="text-[10px] text-slate-600 italic uppercase">Nenhum ponto cego detectado.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna 2: Riscos e Plano de Ação */}
                <div className="flex flex-col gap-4 md:col-span-2 overflow-hidden">
                    {/* Plano de Ação */}
                    <div className="flex-1 border border-white/5 bg-black/20 rounded-3xl p-5 flex flex-col overflow-hidden relative">
                        <div className="absolute top-4 right-4 text-[8px] font-mono text-cyan-500/30 tracking-widest">ENCRYPTED_PLAN.DRV</div>
                        <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5" /> Sequência de Intervenção (Action Plan)
                        </h3>
                        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {(Array.isArray(actionPlan) ? actionPlan : (actionPlan?.steps || [])).map((step: string, i: number) => (
                                <div key={i} className="flex gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:border-cyan-500/20 group">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500/5 flex items-center justify-center text-xs font-black font-mono text-cyan-500 border border-cyan-500/10 group-hover:bg-cyan-500/20 transition-all">
                                        0{i + 1}
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed py-1">
                                        {step}
                                    </p>
                                </div>
                            ))}
                            {((Array.isArray(actionPlan) ? actionPlan.length : (actionPlan?.steps?.length || 0)) === 0) && (
                                <p className="text-[10px] text-slate-600 italic uppercase p-4">Nenhuma intervenção tática necessária.</p>
                            )}
                        </div>
                    </div>

                    {/* Rodapé de Riscos */}
                    <div className="h-20 shrink-0 border border-rose-500/10 bg-rose-500/[0.02] rounded-3xl p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-rose-500/10">
                            <AlertOctagon className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                Atenção Crítica (Riscos)
                                <span className="inline-block w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            </p>
                            <div className="text-[10px] text-slate-400 font-medium leading-tight overflow-y-auto max-h-12 custom-scrollbar pr-2">
                                {(Array.isArray(gapAnalysis.risks) && gapAnalysis.risks.length > 0) ? (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        {gapAnalysis.risks.map((risk: string, i: number) => (
                                            <span key={i} className="flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-rose-500/30 before:rounded-full">
                                                {risk}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="italic opacity-50">Nenhum risco tático identificado para esta configuração estratégica.</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Confiança</p>
                            <p className="text-xl font-black text-slate-400 italic">{(latestResume.score * 0.9).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
