"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Target,
    BrainCircuit,
    Loader2,
    Cpu,
    ExternalLink,
    CheckCircle2,
    XCircle
} from 'lucide-react';

import InterviewSimulator from './InterviewSimulator';
import TargetDossier from './TargetDossier';
import MarketOracle from './MarketOracle';
import { SearchTerminal } from './SearchTerminal';
import { JobCardActive } from './JobCardActive';
import { JobCard } from './JobCard';
import { ProfileView } from './ProfileView';
import { InsightsListModal } from './InsightsListModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useJobScanner } from '@/hooks/useJobScanner';

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
    forge_cv?: string;
    forge_objective?: string;
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

    // Selection & Expansion States
    const [selectedJob, setSelectedJob] = useState<HunterInsight | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Interview States
    const [isInterviewOpen, setIsInterviewOpen] = useState(false);
    const [selectedInterviewJob, setSelectedInterviewJob] = useState<HunterInsight | null>(null);

    // Modals
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Scanner
    const [viewMode, setViewMode] = useState<'DATABASE' | 'SCANNER'>('DATABASE');
    const { 
        isScanning, 
        scannedJobs, 
        statusMessage, 
        startScan, 
        saveToDossier 
    } = useJobScanner();

    const supabase = createClient();


    const fetchInsights = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('hunter_insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const list = data as HunterInsight[];
            setInsights(list);
            
            // Sincronizar vaga selecionada se estiver aberta
            if (selectedJob) {
                const updated = list.find(i => i.id === selectedJob.id);
                if (updated) setSelectedJob(updated);
            }
        } else {
            console.error('Failed to fetch insights:', error);
        }
        setLoading(false);
    };

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
            setUserName(rawName.split(' ')[0]);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchInsights();
            fetchUserName();

            // Realtime Sync for extension jobs or backend updates
            const channel = supabase
                .channel('hunter-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'hunter_insights',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('Neural Link: Insight Update Detected', payload);
                        fetchInsights();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId]);

    const updateStatus = async (id: string, newStatus: HunterInsight['status']) => {
        setUpdatingId(id);
        const { error } = await supabase
            .from('hunter_insights')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setInsights(prev => prev.map(insight => insight.id === id ? { ...insight, status: newStatus } : insight));
            if (selectedJob?.id === id) {
                setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
            }
        }
        setUpdatingId(null);
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
            if (currentIndex >= targetJobs.length - 1) {
                setCurrentIndex(Math.max(0, targetJobs.length - 2));
            }
        }
        setUpdatingId(null);
        setItemToDelete(null);
    };


    const openDocument = async (fileName: string) => {
        const { data, error } = await supabase.storage.from('hunter_vault').createSignedUrl(fileName, 300);
        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
        } else {
            console.error('Erro ao gerar link:', error);
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

    const themeColor = activeTab === 'Targets' ? 'red' : 'cyan';
    const ThemeGlow = activeTab === 'Targets' ? 'from-transparent to-red-500' : 'from-transparent to-cyan-500';

    return (
        <section 
            id="hunter-board"
            className={`w-full h-full bg-[#050505] flex flex-col text-slate-200 overflow-hidden relative border ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'}`}
        >
            <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t ${ThemeGlow}`} aria-hidden="true"></div>


            <header className={`h-20 border-b ${activeTab === 'Targets' ? 'border-red-500/20' : 'border-cyan-500/20'} px-8 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-10 shrink-0`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border ${activeTab === 'Targets' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}>
                        {activeTab === 'Targets' ? <Target className="h-6 w-6 text-red-400" /> : <BrainCircuit className="h-6 w-6 text-cyan-400" />}
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h2 className={`text-2xl font-bold tracking-tight leading-none ${activeTab === 'Targets' ? 'text-red-400' : 'text-cyan-400'}`}>
                            Mural do Caçador
                        </h2>
                        <nav className="flex items-center gap-4 mt-2">
                            <button onClick={() => setActiveTab('Targets')} className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md ${activeTab === 'Targets' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500'}`}>
                                Alvos
                            </button>
                            <button onClick={() => setActiveTab('Profile')} className={`text-xs uppercase tracking-widest font-bold py-1 px-2 rounded-md ${activeTab === 'Profile' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500'}`}>
                                Currículos
                            </button>
                            {activeTab === 'Targets' && (
                                <div className="flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                                    <button onClick={() => setViewMode('DATABASE')} className={`text-[9px] uppercase tracking-widest font-bold py-1 px-2 ${viewMode === 'DATABASE' ? 'text-red-400' : 'text-zinc-600'}`}>
                                        Adquiridos [{targetJobs.length}]
                                    </button>
                                    <button onClick={() => setViewMode('SCANNER')} className={`text-[9px] uppercase tracking-widest font-bold py-1 px-2 ${viewMode === 'SCANNER' ? 'text-red-400' : 'text-zinc-600'}`}>
                                        Varredura [{scannedJobs.length}]
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative z-10 flex h-[calc(100vh-5rem)]">
                <motion.div 
                    layout
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full overflow-hidden p-4 border-r border-white/5 bg-black/20 block"
                    style={{ width: activeTab === 'Profile' ? '100%' : '33.333%', flexShrink: 0 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col">
                            {activeTab === 'Targets' ? (
                                <div className="h-full flex flex-col gap-4">
                                    {viewMode === 'DATABASE' ? (
                                        targetJobs.length === 0 ? (
                                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] p-6 text-center gap-4 overflow-hidden">
                                                {/* Background Decorative Elements */}
                                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                                                
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl w-full border border-red-500/20 bg-red-500/[0.03] px-6 py-4 rounded-2xl backdrop-blur-md relative overflow-hidden group"
                                                >
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                                                    <div className="text-center md:text-left relative z-10">
                                                        <Target className="w-5 h-5 text-red-500/50 mb-2" />
                                                        <h2 className="text-lg font-black text-red-500 tracking-tighter uppercase leading-none">
                                                            Nenhum Alvo<br/>Monitorado
                                                        </h2>
                                                        <p className="text-red-500/40 mt-1 font-mono text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                            Status: Standby Operacional
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setIsGuideModalOpen(true)}
                                                        className="px-8 py-5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 transition-all flex items-center gap-4 group/btn shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-sm font-black uppercase tracking-widest">Protocolo de Injeção</span>
                                                            <span className="text-[10px] text-red-400/50 font-mono">Configurar Zim-Clipper Extension</span>
                                                        </div>
                                                        <ExternalLink className="w-5 h-5 opacity-50 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                                    </button>
                                                </motion.div>

                                                <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full relative z-10">
                                                    {/* Portais Section */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-500/20" />
                                                            <h3 className="text-[10px] font-black text-red-500/40 uppercase tracking-[0.5em]">Portais de Varredura</h3>
                                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-500/20" />
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                            {[ 
                                                                { name: 'Programa Thor', url: 'https://programathor.com.br' },
                                                                { name: 'GeekHunter', url: 'https://geekhunter.com.br' },
                                                                { name: 'Revelo', url: 'https://revelo.com.br' },
                                                                { name: 'Gupy', url: 'https://gupy.io' },
                                                                { name: 'LinkedIn', url: 'https://linkedin.com' },
                                                                { name: 'Wellfound', url: 'https://wellfound.com' },
                                                                { name: 'Otta', url: 'https://otta.com' },
                                                                { name: 'Turing', url: 'https://turing.com' },
                                                                { name: 'BairesDev', url: 'https://bairesdev.com' },
                                                                { name: 'RemoteOK', url: 'https://remoteok.com' }
                                                            ].map((site, i) => (
                                                                <motion.a 
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: i * 0.05 }}
                                                                    key={site.name} 
                                                                    href={site.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="flex flex-col items-center justify-center gap-2 px-4 py-3 bg-red-500/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-xl text-xs font-bold text-red-400/60 transition-all hover:text-red-400 group/link"
                                                                >
                                                                    <ExternalLink className="w-[14px] h-[14px] opacity-30 group-hover/link:opacity-100 transition-opacity" />
                                                                    {site.name}
                                                                </motion.a>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Freelance Section */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-amber-500/20" />
                                                            <h3 className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.5em]">Mercado Livre / Jobs</h3>
                                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-amber-500/20" />
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                            {[ 
                                                                { name: 'Workana', url: 'https://workana.com' },
                                                                { name: '99Freelas', url: 'https://99freelas.com.br' },
                                                                { name: 'Trampos.co', url: 'https://trampos.co' },
                                                                { name: 'Nube', url: 'https://nube.com.br' },
                                                                { name: 'Cia de Talentos', url: 'https://ciadetalentos.com.br' },
                                                                { name: 'InfoJobs', url: 'https://infojobs.com.br' },
                                                                { name: 'Vagas.com.br', url: 'https://vagas.com.br' },
                                                                { name: 'APInfo', url: 'https://apinfo.com' },
                                                                { name: 'Hipsters.jobs', url: 'https://hipsters.jobs' },
                                                                { name: 'GetNinjas', url: 'https://getninjas.com.br' }
                                                            ].map((site, i) => (
                                                                <motion.a 
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.5 + i * 0.05 }}
                                                                    key={site.name} 
                                                                    href={site.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="flex flex-col items-center justify-center gap-2 px-4 py-3 bg-amber-500/[0.02] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-xs font-bold text-amber-400/60 transition-all hover:text-amber-400 group/link"
                                                                >
                                                                    <ExternalLink className="w-[14px] h-[14px] opacity-30 group-hover/link:opacity-100 transition-opacity" />
                                                                    {site.name}
                                                                </motion.a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col overflow-hidden relative">
                                                <div className="flex-1 relative overflow-hidden">
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={targetJobs[currentIndex]?.id}
                                                            initial={{ opacity: 0, x: 100 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -100 }}
                                                            drag="x"
                                                            dragConstraints={{ left: 0, right: 0 }}
                                                            onDragEnd={(_, info) => {
                                                                if (info.offset.x > 50 && currentIndex > 0) setCurrentIndex(prev => prev - 1);
                                                                else if (info.offset.x < -50 && currentIndex < targetJobs.length - 1) setCurrentIndex(prev => prev + 1);
                                                            }}
                                                            className="h-full cursor-grab active:cursor-grabbing flex flex-col"
                                                        >
                                                            <JobCard 
                                                                insight={targetJobs[currentIndex]} 
                                                                onSelect={(j: any) => { setSelectedJob(j); setIsExpanded(true); }}
                                                                onDelete={(id: string) => setItemToDelete(id)}
                                                                onUpdateStatus={updateStatus}
                                                                openDocument={openDocument}
                                                                getScoreColor={getScoreColor}
                                                                getStatusIcon={getStatusIcon}
                                                                updatingId={updatingId}
                                                                onStartInterview={(j: any) => { setSelectedInterviewJob(j); setIsInterviewOpen(true); }}
                                                            />
                                                        </motion.div>
                                                    </AnimatePresence>

                                                    {/* Navigation Controls - NEW */}
                                                    {targetJobs.length > 1 && (
                                                        <>
                                                            <div className="absolute inset-y-0 left-0 flex items-center pr-4">
                                                                <button 
                                                                    disabled={currentIndex === 0}
                                                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                                                    className="p-3 rounded-full bg-black/40 border border-white/10 text-white/50 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all disabled:opacity-10"
                                                                >
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                                </button>
                                                            </div>
                                                            <div className="absolute inset-y-0 right-0 flex items-center pl-4">
                                                                <button 
                                                                    disabled={currentIndex === targetJobs.length - 1}
                                                                    onClick={() => setCurrentIndex(prev => Math.min(targetJobs.length - 1, prev + 1))}
                                                                    className="p-3 rounded-full bg-black/40 border border-white/10 text-white/50 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all disabled:opacity-10"
                                                                >
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Pagination Counter - NEW */}
                                                <div className="h-12 flex items-center justify-center gap-4 bg-black/20 border-t border-white/5">
                                                    <div className="flex gap-1.5">
                                                        {targetJobs.map((_, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`h-1 transition-all rounded-full ${i === currentIndex ? 'w-8 bg-red-500' : 'w-2 bg-white/10'}`} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                                        {currentIndex + 1} / {targetJobs.length} ALVOS
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                            <div className="grid gap-4 pb-12">
                                                {scannedJobs.map((job) => (
                                                    <JobCardActive key={job.id} job={job} onSave={async (j: any) => { const success = await saveToDossier(j); if (success) fetchInsights(); return success; }} />
                                                ))}
                                                {isScanning && <Loader2 className="w-8 h-8 text-red-500/20 animate-spin mx-auto mt-8" />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full overflow-hidden">
                                    {latestResume ? <ProfileView latestResume={latestResume} /> : (
                                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/20 rounded-[2.5rem] bg-cyan-500/5">
                                            <BrainCircuit className="w-16 h-16 text-cyan-500/40 mb-4" />
                                            <h2 className="text-xl font-bold text-cyan-400">NENHUM CURRÍCULO</h2>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                    {isGuideModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#050505] border border-red-500/20 p-8 rounded-2xl max-w-2xl w-full shadow-2xl relative">
                        <h2 className="text-2xl font-bold text-red-400 mb-6 uppercase tracking-widest">Protocolo de Instalação</h2>
                        <div className="space-y-6 text-slate-300 font-mono text-sm">
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center font-bold text-red-400">1</span>
                                <p>No seu navegador, abra a página de extensões (ex: <code className="text-red-400">chrome://extensions</code>).</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center font-bold text-red-400">2</span>
                                <p>Ative o "Modo do desenvolvedor" no canto superior direito.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center font-bold text-red-400">3</span>
                                <p>Clique em "Carregar sem embalagem" e selecione a pasta <code className="text-red-400">chrome-extension/</code> deste projeto.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center font-bold text-red-400">4</span>
                                <p>Fixe a extensão na barra do navegador e certifique-se de que a sua API Key esteja configurada nas opções da extensão.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsGuideModalOpen(false)} className="mt-8 w-full py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-bold uppercase tracking-widest hover:bg-red-500/20">
                            Confirmar
                        </button>
                    </div>
                </div>
            )}
            {activeTab !== 'Profile' && (
                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '66.666%' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="h-full overflow-hidden p-4 bg-black/10 backdrop-blur-[2px] hidden md:block border-l border-white/5">
                                    <div className="h-full flex flex-col gap-2 overflow-hidden">
                                        <div className="p-2 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
                                            <h3 className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase flex items-center gap-2 mb-2">
                                                <Cpu className="w-4 h-4 text-red-500" /> Nexus de Inteligência
                                            </h3>
                                            <MarketOracle userId={userId} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 shrink-0 mt-4">
                                            <button onClick={() => setIsInsightsModalOpen(true)} className="p-6 rounded-2xl border border-white/5 bg-red-500/5 hover:bg-red-500/10 text-left transition-all group">
                                                <div className="text-3xl font-black text-red-500 flex items-center justify-between">{insights.length} <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100" /></div>
                                                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Insights Totais</div>
                                            </button>
                                            <div className="p-6 rounded-2xl border border-white/5 bg-cyan-500/5">
                                                <div className="text-3xl font-black text-cyan-400">{insights.filter(i => i.status === 'Applied').length}</div>
                                                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Candidaturas</div>
                                            </div>
                                        </div>
                                    </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlays */}
                <AnimatePresence>
                    {isExpanded && selectedJob && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#050505]">
                            <TargetDossier job={selectedJob} userId={userId} onClose={() => { setIsExpanded(false); setSelectedJob(null); }} onUpdateStatus={updateStatus} openDocument={openDocument} onStartInterview={(j: any) => { setSelectedInterviewJob(j); setIsInterviewOpen(true); setIsExpanded(false); }} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Interview Simulator Overlay */}
                <AnimatePresence>
                    {isInterviewOpen && selectedInterviewJob && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#050505]">
                            <InterviewSimulator isOpen={isInterviewOpen} onClose={() => setIsInterviewOpen(false)} jobId={selectedInterviewJob.id} jobDescription={selectedInterviewJob.summary} gapAnalysis={selectedInterviewJob.gap_analysis || {}} userName={userName} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <InsightsListModal isOpen={isInsightsModalOpen} onClose={() => setIsInsightsModalOpen(false)} insights={insights} getScoreColor={getScoreColor} openDocument={openDocument} onDelete={(id: string) => setItemToDelete(id)} />
                <DeleteConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
            </main>
        </section>
    );
}
