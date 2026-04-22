"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, X, AlertCircle, Zap, Activity, Clock } from 'lucide-react';
import ListeningRoom from './ListeningRoom';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { WaveVisualizer } from './WaveVisualizer';
import { analyzeInterviewAction } from '@/app/actions/hunter';
import { createClient } from '@/lib/supabase/browser';

interface InterviewSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobDescription: string;
    gapAnalysis: any;
    userName?: string;
}

type InterviewState = 'idle' | 'hunter_speaking' | 'waiting_for_user' | 'recording_user' | 'evaluating' | 'finished';

export default function InterviewSimulator({ isOpen, onClose, jobId, jobDescription, gapAnalysis, userName = 'Operador' }: InterviewSimulatorProps) {
    const [state, setState] = useState<InterviewState>('idle');
    const [history, setHistory] = useState<{ role: 'hunter' | 'user', text: string }[]>([]);
    const [evaluation, setEvaluation] = useState<{ score: number, feedback: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [questGenerated, setQuestGenerated] = useState(false);
    const [lastEvalTime, setLastEvalTime] = useState<number | undefined>(undefined);
    const [isRestoring, setIsRestoring] = useState(false);

    const { 
        isRecording, 
        analyser, 
        startRecording: startAudioCapture, 
        stopRecording: stopAudioCapture, 
        recordingTime, 
        audioBlob,
        reset: resetAudio
    } = useAudioRecorder();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const interviewStartedRef = useRef(false);

    // RESTAURAR ESTADO AO ABRIR
    useEffect(() => {
        if (isOpen && state === 'idle') {
            restoreSession();
        }
    }, [isOpen]);

    const restoreSession = async () => {
        setIsRestoring(true);
        try {
            const supabase = createClient();
            const { data: insight } = await supabase
                .from('hunter_insights')
                .select('action_plan')
                .eq('id', jobId)
                .single();

            if (insight?.action_plan?.history && insight.action_plan.history.length > 0) {
                console.log("[InterviewSimulator] Sessão restaurada para:", jobId);
                setHistory(insight.action_plan.history);
                setState('waiting_for_user');
                interviewStartedRef.current = true;
            } else {
                startInterview();
            }
        } catch (err) {
            console.error("Erro ao restaurar sessão:", err);
            startInterview();
        } finally {
            setIsRestoring(false);
        }
    };

    useEffect(() => {
        if (audioBlob && state === 'recording_user') {
            processAudio(audioBlob);
        }
    }, [audioBlob, state]);

    const startInterview = async () => {
        if (interviewStartedRef.current) return;
        interviewStartedRef.current = true;
        setState('hunter_speaking');
        const initialText = `Olá, ${userName}. Analisei sua Matrix. Vamos ver se você realmente domina os requisitos para esta vaga. Para começar, por que você se considera apto, considerando seus gaps em ${gapAnalysis?.missing_skills?.slice(0, 2).join(' e ') || 'algumas tecnologias'}?`;
        speak(initialText);
        setHistory([{ role: 'hunter', text: initialText }]);
    };

    const speak = async (text: string) => {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
            if (!response.ok) throw new Error('Failed to fetch audio');
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            audio.onended = () => {
                if (state !== 'finished') setState('waiting_for_user');
                URL.revokeObjectURL(audioUrl);
            };
        } catch (err) {
            console.error('TTS error:', err);
            setState('waiting_for_user');
        }
    };

    const handleStartRecording = async () => {
        setError(null);
        resetAudio();
        try {
            await startAudioCapture();
            setState('recording_user');
        } catch (err: any) {
            setError(err.message);
            setState('waiting_for_user');
        }
    };

    const handleStopRecording = () => stopAudioCapture();

    const processAudio = async (blob: Blob) => {
        if (state === 'evaluating') return;
        setState('evaluating');
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'interview.webm');
            formData.append('jobDescription', jobDescription);
            // IMPORTANTE: Enviamos o histórico ATUALIZADO para a IA
            formData.append('history', JSON.stringify(history.slice(-6)));
            formData.append('userName', userName);
            formData.append('jobId', jobId);

            const result = await analyzeInterviewAction(formData);
            if (!result.success) throw new Error(result.error);

            if (result.quest_generated) {
                setQuestGenerated(true);
                setTimeout(() => setQuestGenerated(false), 15000);
            }

            setEvaluation({ score: result.evaluation_score, feedback: result.feedback });
            setLastEvalTime(Date.now());

            const newUserMsg = { role: 'user' as const, text: result.transcribed_text };
            const newHunterMsg = result.next_question ? { role: 'hunter' as const, text: result.next_question } : null;

            setHistory(prev => [
                ...prev, 
                newUserMsg,
                ...(newHunterMsg ? [newHunterMsg] : [])
            ]);

            if (result.next_question) {
                setState('hunter_speaking');
                speak(result.next_question);
            } else {
                setState('finished');
            }
        } catch (err: any) {
            setError(err.message);
            setState('waiting_for_user');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-full h-full bg-background flex flex-col relative overflow-hidden">
            <div className="w-full h-full bg-[#050505] flex flex-col transition-all duration-500 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-4 shrink-0 border-b border-white/[0.03] bg-black/40">
                    <div className="flex items-center gap-3">
                        <Activity size={16} className="text-primary animate-pulse" />
                        <div className="flex flex-col">
                            <h2 className="font-mono text-[9px] font-bold tracking-[0.1em] text-primary/60 uppercase">ARENA :: TACTICAL INTERVIEW</h2>
                            <span className="text-[12px] font-bold text-foreground tracking-tight uppercase">HUNTER-ZIM v3.1</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isRestoring && <span className="text-[9px] font-mono text-zinc-500 animate-pulse uppercase">Restaurando Memória...</span>}
                        <button onClick={onClose} className="text-zinc-600 hover:text-white transition-all p-2 hover:bg-white/5 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden lg:flex-row flex-col min-h-0">
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-40">
                            <AnimatePresence mode="popLayout">
                                {history.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: msg.role === 'hunter' ? -10 : 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${msg.role === 'hunter' ? 'justify-start' : 'justify-end'} w-full`}
                                    >
                                        <div className={`max-w-[85%] p-5 rounded-2xl border ${
                                            msg.role === 'hunter' 
                                            ? 'bg-white/[0.02] border-white/[0.05] rounded-tl-none shadow-xl' 
                                            : 'bg-primary/5 border-primary/10 rounded-tr-none shadow-lg'
                                        }`}>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-2 tracking-widest">
                                                {msg.role === 'hunter' ? 'HUNTER-ZIM' : 'CANDIDATO'}
                                            </span>
                                            <p className="text-[14px] leading-relaxed text-zinc-300 font-light italic">
                                                "{msg.text}"
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {evaluation && state !== 'evaluating' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center py-4">
                                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center gap-6 max-w-md shadow-2xl backdrop-blur-xl">
                                            <div className="flex flex-col items-center shrink-0">
                                                <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest mb-1">SCORE</span>
                                                <span className="text-3xl font-black text-primary font-mono">{evaluation.score}</span>
                                            </div>
                                            <div className="w-px h-10 bg-primary/20" />
                                            <p className="text-[12px] text-zinc-400 font-mono italic">"{evaluation.feedback}"</p>
                                        </div>
                                    </motion.div>
                                )}

                                {questGenerated && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="fixed bottom-32 left-8 p-4 bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-500/20 flex items-center gap-3 z-50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                    >
                                        <Zap className="text-amber-500 w-5 h-5 animate-pulse" />
                                        <span className="text-[11px] font-mono text-amber-200">Missão de Redenção plantada no Nexus.</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Action Area */}
                        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent flex justify-center">
                            <div className="flex items-center gap-6 rounded-full bg-white/[0.03] backdrop-blur-3xl p-3 pr-10 border border-white/10 shadow-2xl hover:bg-white/[0.05] transition-all">
                                {state === 'recording_user' ? (
                                    <button onClick={handleStopRecording} className="h-16 w-16 rounded-full bg-primary flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.4)]">
                                        <WaveVisualizer analyser={analyser} isRecording={isRecording} />
                                        <Square size={20} className="fill-current relative z-10 text-white" />
                                    </button>
                                ) : state === 'evaluating' ? (
                                    <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-amber-500" size={24} />
                                    </div>
                                ) : (
                                    <button 
                                        disabled={state === 'finished' || state === 'hunter_speaking' || isRestoring}
                                        onClick={handleStartRecording}
                                        className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-all disabled:opacity-10 shadow-inner"
                                    >
                                        <Mic size={24} />
                                    </button>
                                )}

                                <div className="flex flex-col text-left">
                                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${
                                        state === 'recording_user' ? 'text-primary animate-pulse' : 'text-zinc-500'
                                    }`}>
                                        {isRestoring ? 'RESTORING MEMORY' : state === 'idle' ? 'LINK ESTABLISHED' : state.replace('_', ' ')}
                                    </span>
                                    <span className="text-[12px] text-zinc-400 font-medium">
                                        {isRestoring ? 'Sincronizando sinapses...' :
                                         state === 'recording_user' ? `Fale agora... ${recordingTime}s` : 
                                         state === 'evaluating' ? 'Hamiltoniana de decisão...' :
                                         state === 'finished' ? 'Sessão Finalizada' : 'Toque no sensor para falar'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[420px] w-full bg-black/60 border-l border-white/[0.05] flex flex-col shrink-0">
                        <ListeningRoom jobId={jobId} isLive={true} lastEvaluationTime={lastEvalTime} />
                    </div>
                </div>

                <div className="px-8 py-3 text-[8px] font-mono text-zinc-700 flex justify-between items-center border-t border-white/[0.03]">
                    <div className="flex gap-6 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]"/><span>NODE :: PERSISTENT</span></div>
                        <span className="text-primary/30">COGNITIVE ENGINE v3.1.0</span>
                    </div>
                    <span>SESSION_ID :: {jobId.slice(0, 12)}</span>
                </div>
            </div>
        </div>
    );
}
