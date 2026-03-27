"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Activity, AlertCircle, Loader2, Info, Radar } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

interface Marker {
    timestamp: number;
    type: 'hesitation' | 'assertive' | 'key_point';
    label: string;
}

interface Analysis {
    overall_confidence: number;
    summary: string;
    markers: Marker[];
}

interface InterviewSession {
    id: string;
    audio_url: string;
    behavioral_analysis: Analysis;
    created_at: string;
}

interface ListeningRoomProps {
    jobId: string;
    isLive?: boolean; // Se true, o layout se adapta para barra lateral do simulador
}

export default function ListeningRoom({ jobId, isLive = false }: ListeningRoomProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ audioUrl: string; analysis: Analysis } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: session } = await supabase
                .from('interview_sessions')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (session) {
                setData({
                    audioUrl: session.audio_url,
                    analysis: session.behavioral_analysis as Analysis
                });
            }
            setLoading(false);
        };

        if (jobId) {
            fetchData();

            const supabase = createClient();
            const channel = supabase
                .channel(`sessions-${jobId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'interview_sessions', filter: `job_id=eq.${jobId}` },
                    (payload) => {
                        console.log("Realtime: Nova análise detectada!", payload);
                        const newSession = payload.new;
                        setData({
                            audioUrl: newSession.audio_url,
                            analysis: newSession.behavioral_analysis as Analysis
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [jobId]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const jumpTo = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
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

    if (loading && !data) {
        return (
            <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center border border-dashed border-red-500/20 rounded-xl bg-red-500/5">
                <Loader2 className="animate-spin text-red-500 mb-2" size={20} />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center px-4">Sincronizando Link Neural...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-full min-h-[200px] p-6 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-center">
                <Info className="text-zinc-600 mb-2" size={20} />
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Aguardando Avaliação...</span>
                <p className="text-[10px] text-zinc-700 mt-2 uppercase">A análise comportamental aparecerá aqui assim que o Gemini processar sua resposta.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-black/40 ${isLive ? 'border-l border-red-500/10' : 'rounded-xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]'} overflow-hidden font-mono`}>
            {/* Header Sensor */}
            <div className="p-4 border-b border-red-500/10 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Radar className="w-5 h-5 text-red-500 animate-pulse" />
                        <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">LISTENING ROOM</h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                            <span className="text-[8px] font-mono text-emerald-500/70 uppercase">SENSOR LÍMBICO ATIVO</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500">CONFIDENCE:</span>
                    <span className={`text-xs font-bold ${data.analysis.overall_confidence >= 70 ? 'text-green-500' : 'text-red-400'}`}>
                        {data.analysis.overall_confidence}%
                    </span>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto ${isLive ? 'max-h-[calc(100vh-250px)]' : 'max-h-[500px]'} scrollbar-hide p-4 space-y-6 pb-20`}>
                {/* Waveform Visualization Mock */}
                <div className="relative h-20 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center p-4 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-evenly opacity-10 pointer-events-none px-4">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: isPlaying ? [10, 40, 10] : 8 }}
                                transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.05 }}
                                className="w-1 bg-red-500 rounded-full"
                            />
                        ))}
                    </div>

                    <audio 
                        ref={audioRef}
                        src={data.audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                    />

                    {/* Scrub Bar */}
                    <div className="relative w-full h-8 flex items-center group">
                        <div className="absolute w-full h-[1px] bg-zinc-800" />
                        <div 
                            className="absolute h-[2px] bg-red-500/50 transition-all"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />

                        {data.analysis.markers.map((marker, idx) => (
                            <button
                                key={idx}
                                onClick={() => jumpTo(marker.timestamp)}
                                className="absolute -translate-x-1/2 group/marker z-10"
                                style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full border shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all group-hover/marker:scale-125 ${
                                    marker.type === 'hesitation' ? 'bg-yellow-500 border-yellow-400' :
                                    marker.type === 'assertive' ? 'bg-green-500 border-green-400' :
                                    'bg-cyan-500 border-cyan-400'
                                }`} />
                                
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity max-w-[200px] whitespace-normal bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[9px] text-zinc-300 pointer-events-none z-20 font-mono shadow-xl">
                                    {marker.label}
                                </div>
                            </button>
                        ))}

                        <div 
                            className="absolute h-full w-[1px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] z-0"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Markers List */}
                <div className="space-y-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Neural Events</span>
                    <div className="space-y-1.5">
                        {data.analysis.markers.map((marker, idx) => (
                            <button
                                key={idx}
                                onClick={() => jumpTo(marker.timestamp)}
                                className="w-full flex items-start justify-between p-2 bg-white/5 border border-white/5 rounded hover:bg-white/10 transition-colors text-left gap-3"
                            >
                                <div className="flex items-start gap-2 flex-1">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                        marker.type === 'hesitation' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' :
                                        marker.type === 'assertive' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                                        'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                    }`} />
                                    <span className="text-[10px] text-zinc-300 leading-relaxed py-0.5">{marker.label}</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 shrink-0 mt-0.5">{formatTime(marker.timestamp)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Box */}
                <div className="bg-[#080808] border border-red-500/10 rounded-lg p-4 relative">
                    <div className="absolute -top-2 left-4 px-2 bg-black text-[8px] text-red-500/50 uppercase font-bold tracking-widest">
                        Neural POST-MORTEM Summary
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed italic font-serif">
                        "{data.analysis.summary}"
                    </p>
                </div>

                {/* Footer Player Controls */}
                <div className="pt-2 flex items-center gap-4">
                    <button 
                        onClick={togglePlay}
                        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase">Telescreen-Audio</span>
                        <span className="text-xs font-bold text-zinc-300 tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
