"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, Activity, Radar, Info, Loader2, AlertTriangle, Target, Fingerprint } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface Analysis {
    overall_confidence: number;
    summary: string;
    technical_gaps: string[];
    behavioral_traits: string[];
    red_flags: string[];
    markers: {
        timestamp: number;
        type: 'hesitation' | 'assertive' | 'key_point';
        label: string;
    }[];
}

interface ListeningRoomProps {
    jobId: string;
    isLive?: boolean;
    lastEvaluationTime?: number;
}

export default function ListeningRoom({ jobId, isLive = false, lastEvaluationTime }: ListeningRoomProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionIdx, setCurrentSessionIdx] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: sessionsData } = await supabase
                .from('interview_sessions')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (sessionsData && sessionsData.length > 0) {
                setSessions(sessionsData);
            } else {
                setSessions([]);
            }
            setLoading(false);
        };

        if (jobId) {
            fetchData();
            const supabase = createClient();
            const channel = supabase
                .channel(`sessions-${jobId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interview_sessions', filter: `job_id=eq.${jobId}` }, fetchData)
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [jobId, lastEvaluationTime]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const jumpTo = (time: number | number[]) => {
        const targetTime = Array.isArray(time) ? time[0] : time;
        if (audioRef.current) {
            audioRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);
            if (!isPlaying) {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading && sessions.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-black/20">
                <Loader2 className="animate-spin text-cyan-500 mb-4" size={32} />
                <span className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.4em]">Sincronia Neural...</span>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="w-full h-full p-10 flex flex-col items-center justify-center text-center space-y-4">
                <Radar className="text-zinc-800 animate-pulse" size={48} />
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Aguardando Captura</h3>
                    <p className="text-[10px] text-zinc-700 uppercase max-w-[200px]">Inicie a entrevista para começar a análise de sinal límbico.</p>
                </div>
            </div>
        );
    }

    const activeSession = sessions[currentSessionIdx];
    const activeAnalysis = activeSession ? (activeSession.behavioral_analysis as Analysis) : null;
    const audioUrl = activeSession ? activeSession.audio_url : "";

    return (
        <div className={`flex flex-col h-full bg-[#050505]/40 backdrop-blur-3xl overflow-hidden font-mono`}>
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between border-b border-white/[0.03] shrink-0">
                <div className="flex items-center gap-4">
                    <Radar className="w-5 h-5 text-cyan-500" />
                    <div>
                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SALA DE ESCUTA</h2>
                        <span className="text-[9px] text-cyan-500/60 uppercase font-bold">INTERCEPTADOR DE BIOSINAIS</span>
                    </div>
                </div>
                {activeAnalysis && (
                    <div className="text-right">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest block mb-1">CONFIANÇA</span>
                        <span className={`text-xl font-black font-mono ${activeAnalysis.overall_confidence >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {activeAnalysis.overall_confidence}%
                        </span>
                    </div>
                )}
            </div>

            {/* Seletor de Sessões de Simulação - Navegação de Histórico 1:N */}
            {sessions.length > 1 && (
                <div className="px-8 py-3 bg-white/[0.01] border-b border-white/[0.03] flex items-center gap-2 overflow-x-auto shrink-0 custom-scrollbar">
                    <span className="text-[8px] font-mono font-black text-zinc-600 uppercase tracking-widest mr-2 shrink-0">Histórico de Treinos:</span>
                    {sessions.map((session, idx) => {
                        const isSelected = idx === currentSessionIdx;
                        const dateStr = new Date(session.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        return (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setCurrentSessionIdx(idx);
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        setIsPlaying(false);
                                        setCurrentTime(0);
                                    }
                                }}
                                className={`px-3 py-1 rounded-md text-[9px] font-mono transition-all border shrink-0 ${
                                    isSelected
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                        : 'bg-transparent text-zinc-500 border-white/5 hover:text-zinc-300'
                                }`}
                            >
                                #{sessions.length - idx} ({dateStr})
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10 pb-32">
                
                {/* Audio Player Card */}
                <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/[0.05] space-y-6">
                    <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} />
                    
                    <div className="h-12 flex items-center justify-evenly gap-1 opacity-40 px-4">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: isPlaying ? [4, 32, 4] : 4 }}
                                transition={{ repeat: Infinity, duration: 0.8 + Math.random(), delay: i * 0.05 }}
                                className="w-1 bg-cyan-500 rounded-full"
                            />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={jumpTo} className="[&_[role=slider]]:bg-cyan-400 [&_[role=track]]:h-1" />
                        <div className="flex justify-between items-center">
                            <Button onClick={togglePlay} variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            </Button>
                            <span className="text-[11px] font-mono text-cyan-500/70 tabular-nums">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                </div>

                {activeAnalysis && (
                    <>
                        {/* Behavioral Analysis */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Fingerprint size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Traços</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(activeAnalysis.behavioral_traits || []).map((trait, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/5 rounded border border-white/5 text-[9px] text-zinc-400 uppercase">
                                            {trait}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 text-right">
                                <div className="flex items-center gap-2 text-zinc-500 justify-end">
                                    <Target size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Gaps</span>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {(activeAnalysis.technical_gaps || []).map((gap, i) => (
                                        <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-400/80 rounded border border-rose-500/10 text-[9px] uppercase">
                                            {gap}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Red Flags */}
                        {(activeAnalysis.red_flags || []).length > 0 && (
                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <AlertTriangle size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sinais de Alerta</span>
                                </div>
                                <ul className="space-y-2">
                                    {activeAnalysis.red_flags.map((flag, i) => (
                                        <li key={i} className="text-[11px] text-rose-300/70 font-mono leading-relaxed flex items-start gap-2">
                                            <span className="text-rose-500/50 mt-1">»</span> {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Neural Events */}
                        {(activeAnalysis.markers || []).length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Activity size={12} className="text-zinc-600" />
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Linha do Tempo</span>
                                </div>
                                <div className="space-y-2">
                                    {activeAnalysis.markers.map((marker, idx) => (
                                        <button key={idx} onClick={() => jumpTo(marker.timestamp)} className="w-full flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] rounded-xl transition-all text-left group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${marker.type === 'hesitation' ? 'bg-amber-500' : marker.type === 'assertive' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                                                <span className="text-[12px] text-zinc-400 group-hover:text-white transition-colors">{marker.label}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-600 font-bold">{formatTime(marker.timestamp)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Post-Mortem */}
                        {activeAnalysis.summary && (
                            <div className="space-y-3">
                                <span className="text-[9px] font-bold text-cyan-500/40 uppercase tracking-widest block">Resumo Pós-Morte</span>
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <p className="text-[13px] text-zinc-400 leading-relaxed italic font-light">
                                        "{activeAnalysis.summary}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
