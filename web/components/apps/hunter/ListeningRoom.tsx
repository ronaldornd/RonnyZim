"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Activity, AlertCircle, Loader2, Info, Radar, Volume2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

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

    if (loading && !data) {
        return (
            <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center border border-dashed border-cyan-500/20 rounded-xl bg-cyan-500/5">
                <Loader2 className="animate-spin text-cyan-500 mb-2" size={20} />
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
        <div className={`flex flex-col h-full bg-card/10 backdrop-blur-xl ${isLive ? '' : 'rounded-[2rem] shadow-2xl'} overflow-hidden font-mono transition-all duration-500`}>
            {/* Header Sensor - Refined */}
            <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Radar className="w-6 h-6 text-cyan-500" />
                        <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] opacity-80">LISTENING ROOM</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                            <span className="text-[9px] font-mono text-cyan-500/70 uppercase font-bold tracking-widest">SENSOR LÍMBICO ATIVO</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">CONFIDENCE</span>
                    <span className={`text-sm font-black ${data.analysis.overall_confidence >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {data.analysis.overall_confidence}%
                    </span>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto ${isLive ? 'max-h-[calc(100vh-280px)]' : 'max-h-[600px]'} custom-scrollbar p-8 space-y-10 pb-24`}>
                {/* Waveform Visualization - Premium Glass */}
                <div className="relative h-32 bg-white/[0.02] rounded-[2rem] flex flex-col justify-end p-6 pt-10 overflow-hidden group/wave transition-all duration-500 hover:bg-white/[0.04] shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-evenly opacity-30 pointer-events-none px-6">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: isPlaying ? [10, 50, 10] : 6 }}
                                transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.02 }}
                                className="w-[1.5px] bg-cyan-500/60 rounded-full"
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

                    {/* Scrub Bar using Shadcn Slider */}
                    <div className="relative w-full z-20 mt-4">
                        <Slider 
                            value={[currentTime]} 
                            max={duration || 100} 
                            step={0.1} 
                            onValueChange={jumpTo}
                            className="[&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500 [&_[role=slider]]:shadow-[0_0_15px_rgba(6,182,212,0.8)] [&_[role=slider]]:scale-125 [&_[role=track]]:h-1"
                        />

                        {/* Behavior Markers Overlay */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full pointer-events-none flex h-4 opacity-50">
                            {data.analysis.markers.map((marker, idx) => (
                                <div
                                    key={idx}
                                    className="absolute -translate-x-1/2"
                                    style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                                >
                                    <div className={`w-1 h-6 blur-[1px] transition-all ${
                                        marker.type === 'hesitation' ? 'bg-amber-500' :
                                        marker.type === 'assertive' ? 'bg-emerald-500' :
                                        'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]'
                                    }`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Markers List - Clean Flat */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pl-1">
                        <Activity size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Neural Events Detection</span>
                    </div>
                    <div className="space-y-px">
                        {data.analysis.markers.map((marker, idx) => (
                            <button
                                key={idx}
                                onClick={() => jumpTo(marker.timestamp)}
                                className="w-full flex items-start justify-between p-4 bg-white/[0.02] hover:bg-white/[0.06] rounded-2xl transition-all duration-300 text-left gap-4 group/marker"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-all group-hover/marker:scale-125 ${
                                        marker.type === 'hesitation' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
                                        marker.type === 'assertive' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' :
                                        'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                    }`} />
                                    <span className="text-[12px] text-foreground/80 leading-relaxed font-sans">{marker.label}</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 shrink-0 mt-0.5 font-bold">{formatTime(marker.timestamp)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Box - Minimalist */}
                <div className="bg-white/[0.02] rounded-[1.5rem] p-6 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500/50 transition-colors duration-500" />
                    <span className="text-[9px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mb-3 block">Neural Post-Mortem</span>
                    <p className="text-[13px] text-zinc-400 leading-relaxed font-light italic font-serif">
                        "{data.analysis.summary}"
                    </p>
                </div>

                {/* Footer Player Controls */}
                <div className="pt-8 flex items-center justify-between gap-6 border-t border-white/[0.05]">
                    <div className="flex items-center gap-6">
                        <Button 
                            variant="outline" 
                            size="icon"
                            onClick={togglePlay}
                            className="h-14 w-14 rounded-2xl bg-cyan-500/10 border-none text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all shrink-0"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="translate-x-0.5" fill="currentColor" />}
                        </Button>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold mb-1">Acoustic Synapse</span>
                            <span className="text-sm font-black text-cyan-400/80 tabular-nums tracking-wider">
                                {formatTime(currentTime)} <span className="text-zinc-700 mx-1">/</span> {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 group transition-colors hover:bg-white/10">
                        <Volume2 className="w-4 h-4 text-cyan-500/50" />
                        <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500/50 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
