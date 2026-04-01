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

    // Insights List Modal
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);

    // Styled Delete Confirmation
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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

    const deleteInsight = (id: string) => {
        setItemToDelete(id);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const id = itemToDelete;
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
        setItemToDelete(null);
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
        <section 
            id="hunter-board"
            aria-labelledby="hunter-title"
            className={`w-full h-screen bg-[#050505] flex flex-col text-slate-200 overflow-hidden font-sans border ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'} relative transition-colors duration-500`}
        >

            {/* Dynamic Inner Glow */}
            <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t ${ThemeGlow} transition-all duration-1000 ease-in-out`} aria-hidden="true"></div>

            <header className={`h-20 border-b ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'} px-8 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-10 shrink-0`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border transition-colors duration-500 ${activeTab === 'Targets' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}>
                        {activeTab === 'Targets' ? <Target className="h-6 w-6 text-red-400" aria-hidden="true" /> : <BrainCircuit className="h-6 w-6 text-cyan-400" aria-hidden="true" />}
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h2 id="hunter-title" className={`text-2xl font-bold tracking-tight leading-none transition-colors duration-500 ${activeTab === 'Targets' ? 'text-red-400' : 'text-cyan-400'}`}>
                            Mural do Caçador
                        </h2>

                        {/* Tabs de Navegação */}
                        <nav className="flex items-center gap-4 mt-2" aria-label="Abas do Mural">
                            <button
                                onClick={() => setActiveTab('Targets')}
                                aria-current={activeTab === 'Targets' ? 'page' : undefined}
                                className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md transition-all ${activeTab === 'Targets' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Alvos Adquiridos
                            </button>
                            <button
                                onClick={() => setActiveTab('Profile')}
                                aria-current={activeTab === 'Profile' ? 'page' : undefined}
                                className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md transition-all ${activeTab === 'Profile' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Painel de Currículos
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative z-10 flex h-[calc(100vh-5rem)]">
                
                {/* LEFT PANEL: SINGLE CARD (Expand to 12 if Profile) */}
                <motion.div 
                    layout
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full overflow-hidden p-4 border-r border-cyan-500/10 bg-black/20 ${isInterviewOpen ? 'hidden md:block' : 'block'}`}
                    style={{ 
                        width: activeTab === 'Profile' ? '100%' : '33.333%',
                        flexShrink: 0
                    }}
                >
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
                </motion.div>

                {/* RIGHT PANEL: SIMULATOR OR MARKET ORACLE / HEATMAP (8/12) - Hidden if Profile */}
                <AnimatePresence>
                    {activeTab !== 'Profile' && (
                        <motion.div 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '66.666%' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full overflow-hidden p-4 bg-black/10 backdrop-blur-[2px] hidden md:block border-l border-white/5"
                        >
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
                                className="h-full flex flex-col gap-2"
                            >
                                <div className="p-2 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
                                    <h3 className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase flex items-center gap-2 mb-2">
                                        <Cpu className="w-4 h-4 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                        Nexus de Inteligência de Mercado
                                    </h3>
                                    <div className="flex-1 overflow-hidden">
                                        <MarketOracle userId={userId} />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6 shrink-0">
                                    <motion.button
                                        initial={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsInsightsModalOpen(true)}
                                        className="p-6 rounded-2xl border border-white/5 backdrop-blur-md text-left transition-all hover:border-red-500/30 group"
                                    >
                                        <div className="text-3xl font-black text-red-500 tracking-tighter flex items-center justify-between">
                                            {insights.length}
                                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Insights Totais</div>
                                    </motion.button>
                                    <div className="p-6 rounded-2xl border border-white/5 bg-cyan-500/5 backdrop-blur-md">
                                        <div className="text-3xl font-black text-cyan-400 tracking-tighter">{insights.filter(i => i.status === 'Applied').length}</div>
                                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Candidaturas Ativas</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                    )}
                </AnimatePresence>

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

                {/* INSIGHTS LIST MODAL */}
                <AnimatePresence>
                    {isInsightsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsInsightsModalOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-4xl max-h-[80vh] bg-[#0A0A0A] border border-red-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col overflow-hidden"
                            >
                                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30">
                                            <Target className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-red-500 tracking-tighter uppercase">Cofre de Inteligência</h2>
                                            <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-1">{insights.length} REGISTROS ENCONTRADOS</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsInsightsModalOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="grid gap-3">
                                        {insights.map((insight) => (
                                            <div 
                                                key={insight.id}
                                                className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl border ${insight.document_type === 'Job' ? 'bg-red-500/10 border-red-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                                                        {insight.document_type === 'Job' ? (
                                                            <Briefcase className="w-4 h-4 text-red-400" />
                                                        ) : (
                                                            <FileText className="w-4 h-4 text-cyan-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{insight.document_name}</h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                                                {insight.document_type === 'Job' ? 'Alvo Adquirido' : 'Protocolo Currículo'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-zinc-700">•</span>
                                                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                                                                {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-tighter ${getScoreColor(insight.score)}`}>
                                                        {insight.score} MATCH
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDocument(insight.document_name);
                                                            }}
                                                            className="p-2 text-zinc-600 hover:text-white transition-colors"
                                                            title="Ver Documento"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteInsight(insight.id);
                                                            }}
                                                            className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                                                            title="Eliminar Registro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* DELETE CONFIRMATION MODAL */}
                <AnimatePresence>
                    {itemToDelete && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setItemToDelete(null)}
                                className="absolute inset-0 bg-red-950/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-md bg-[#0a0505] border border-red-500/30 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-[60px]" />
                                
                                <div className="flex flex-col items-center text-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                        <AlertTriangle size={32} className="animate-pulse" />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Protocolo de Exclusão</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                            Você está prestes a remover permanentemente este registro do <span className="text-red-400/80 font-bold">Cofre Neural</span>. Esta ação é irreversível.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                        <button 
                                            onClick={() => setItemToDelete(null)}
                                            className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >
                                            Abortar
                                        </button>
                                        <button 
                                            onClick={handleConfirmDelete}
                                            className="px-6 py-4 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </main>
        </section>
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
        <motion.article
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            aria-labelledby={`job-title-${insight.id}`}
            className="flex flex-col rounded-xl bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-500 group/card relative overflow-hidden active:scale-[0.99]"
        >
            {/* Subtle Inner Glow on Hover */}
            <div className="absolute inset-0 bg-red-500/0 group-hover/card:bg-red-500/[0.02] transition-colors duration-700 pointer-events-none" aria-hidden="true" />
            
            <div 
                onClick={() => onSelect(insight)}
                className="p-4 pb-2 flex items-start justify-between cursor-pointer relative z-10"
            >
                <div className="pr-6 space-y-1">
                    <h3 id={`job-title-${insight.id}`} className="text-lg font-bold text-white tracking-tight group-hover/card:text-red-400 transition-colors duration-300" title={insight.document_name}>
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
        </motion.article>
    );
}

function ProfileView({ latestResume }: { latestResume: HunterInsight }) {
    const [activeSubTab, setActiveSubTab] = useState<'VECTORS' | 'ACTION_PLAN' | 'RISKS'>('VECTORS');
    
    if (!latestResume) return null;

    const gapAnalysis = latestResume.gap_analysis || { missing_skills: [], match_percentage: 0, risks: [] };
    const actionPlan = latestResume.action_plan || { steps: [] };
    const actionPlanSteps = Array.isArray(actionPlan) ? actionPlan : (actionPlan?.steps || []);

    const tabs = [
        { id: 'VECTORS', label: '01. SUMÁRIO_E_VETORES', icon: Zap },
        { id: 'ACTION_PLAN', label: '02. SEQUÊNCIA_TÁTICA', icon: Target },
        { id: 'RISKS', label: '03. MATRIZ_DE_RISCO', icon: AlertOctagon },
    ] as const;

    return (
        <div className="h-full flex flex-col gap-2 p-1 overflow-hidden">
            {/* Header Ultra-Compacto Fixo */}
            <div className="flex items-center justify-between px-4 py-2 border border-cyan-500/20 bg-cyan-500/[0.03] rounded-xl backdrop-blur-md relative overflow-hidden shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                        <div className="text-2xl font-black text-cyan-400 italic leading-none">{latestResume.score}</div>
                        <div className="text-[7px] font-black font-mono text-cyan-500/60 uppercase tracking-widest">ÍNDICE ALPHA</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        <h2 className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[200px]">
                            {latestResume.document_name}
                        </h2>
                    </div>
                </div>

                {/* Sub-Navegação Tática */}
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${
                                activeSubTab === tab.id 
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className={`w-3 h-3 ${activeSubTab === tab.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conteúdo Dinâmico com Animação */}
            <div className="flex-1 overflow-hidden relative mt-1">
                <AnimatePresence mode="wait">
                    {activeSubTab === 'VECTORS' && (
                        <motion.div
                            key="vectors"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden"
                        >
                            {/* Resumo e Forças (60%) */}
                            <div className="md:col-span-12 flex flex-col gap-4 overflow-hidden">
                                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-2xl">
                                    <h3 className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                        <Cpu className="w-3.5 h-3.5" /> Sumário de Infiltração
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium tracking-wide italic">
                                        "{latestResume.summary}"
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                                    {/* Forças (Vetores) */}
                                    <div className="border border-white/5 bg-cyan-500/[0.01] rounded-2xl p-4 flex flex-col overflow-hidden">
                                        <h3 className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <Zap className="w-3.5 h-3.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]" /> Vetores de Ataque (Forças)
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                                            {(latestResume.key_points || []).slice(0, 6).map((point, i) => (
                                                <div key={i} className="text-[10px] px-3 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-3">
                                                    <span className="w-1 h-3 bg-cyan-500/40 rounded-full" />
                                                    {point}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gaps (Pontos Cegos) */}
                                    <div className="border border-white/5 bg-rose-500/[0.01] rounded-2xl p-4 flex flex-col overflow-hidden">
                                        <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Pontos Cego (Gaps_Tech)
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                                            {(gapAnalysis.missing_skills || []).slice(0, 6).map((skill, i) => (
                                                <div key={i} className="text-[10px] px-3 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg text-rose-400/80 font-bold uppercase tracking-wider flex items-center gap-3">
                                                    <span className="w-1 h-1 rounded-full bg-rose-500/40" />
                                                    {skill}
                                                </div>
                                            ))}
                                            {(!gapAnalysis.missing_skills || gapAnalysis.missing_skills.length === 0) && (
                                                <p className="text-[10px] text-slate-600 italic uppercase p-4 text-center">Nenhum ponto cego detectado.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSubTab === 'ACTION_PLAN' && (
                        <motion.div
                            key="action_plan"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full border border-white/5 bg-black/20 rounded-2xl p-6 flex flex-col overflow-hidden relative"
                        >
                            <div className="absolute top-6 right-6 text-[8px] font-mono text-cyan-500/30 tracking-widest">TACTICAL_SEQUENCE.SYS</div>
                            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                <Target className="w-4 h-4 shadow-[0_0_10px_rgba(34,211,238,0.4)]" /> Sequência de Intervenção (Action Plan)
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
                                {actionPlanSteps.slice(0, 6).map((step: string, i: number) => (
                                    <div key={i} className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all hover:border-cyan-500/30 group">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500/5 flex items-center justify-center text-xs font-black font-mono text-cyan-500 border border-cyan-500/10 group-hover:bg-cyan-500/20 transition-all shadow-inner">
                                            0{i + 1}
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                                {actionPlanSteps.length === 0 && (
                                    <div className="col-span-full flex items-center justify-center p-12 opacity-30">
                                        <span className="text-xs font-mono uppercase tracking-widest">Frequência Limpa: Nenhuma Intervenção Necessária</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeSubTab === 'RISKS' && (
                        <motion.div
                            key="risks"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col gap-4 overflow-hidden"
                        >
                            <div className="flex-1 border border-rose-500/10 bg-rose-500/[0.02] rounded-3xl p-8 flex flex-col overflow-hidden relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_40%)]" />
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.5em] flex items-center gap-4">
                                        <AlertOctagon className="w-6 h-6 animate-pulse" /> Matriz de Riscos Críticos
                                    </h3>
                                    <div className="flex flex-col items-end">
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Nível de Exposição</div>
                                        <div className="text-3xl font-black text-rose-500 italic drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">High_Risk</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                    {(Array.isArray(gapAnalysis.risks) && gapAnalysis.risks.length > 0) ? (
                                        gapAnalysis.risks.slice(0, 6).map((risk: string, i: number) => (
                                            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all group">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shadow-[0_0_8px_rgba(244,63,94,0.6)] group-hover:scale-125 transition-transform" />
                                                <p className="text-xs text-rose-100 font-bold leading-relaxed tracking-wide uppercase">
                                                    {risk}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full h-full flex flex-col items-center justify-center opacity-20 italic">
                                            <CheckCircle2 className="w-12 h-12 mb-4" />
                                            <span className="text-sm uppercase tracking-[0.3em]">Nenhum Risco Tático Identificado</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-rose-500/10 flex justify-between items-center opacity-60">
                                    <div className="text-[8px] font-mono tracking-[0.2em] text-rose-500/50 uppercase">Secured_by_RonnyZim_Nexus</div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confiança da Análise</p>
                                        <p className="text-sm font-black text-white italic">{(latestResume.score * 0.9).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
