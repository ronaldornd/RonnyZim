"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, Loader2, X, AlertCircle, Zap, Activity, Info, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import ListeningRoom from './ListeningRoom';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { WaveVisualizer } from './WaveVisualizer';
import { analyzeInterviewAction } from '@/app/actions/hunter';

interface InterviewSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string; // ID do Insight/Job para vínculo no banco
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

    const { 
        isRecording, 
        analyser, 
        startRecording: startAudioCapture, 
        stopRecording: stopAudioCapture, 
        recordingTime, 
        audioBlob,
        reset: resetAudio
    } = useAudioRecorder();

    const synthRef = typeof window !== 'undefined' ? window.speechSynthesis : null;

    // Monitora o áudio capturado para processar
    useEffect(() => {
        if (audioBlob && state === 'recording_user') {
            processAudio(audioBlob);
        }
    }, [audioBlob]);

    // Cleanup de áudio ao fechar
    useEffect(() => {
        if (!isOpen) {
            resetAudio();
            if (synthRef) synthRef.cancel();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && state === 'idle') {
            const loadVoices = () => {
                if (synthRef) {
                    const voices = synthRef.getVoices();
                    if (voices.length > 0) {
                        startInterview();
                    }
                }
            };

            if (synthRef) {
                synthRef.onvoiceschanged = loadVoices;
                if (synthRef.getVoices().length > 0) {
                    startInterview();
                }
            }
        }
        return () => {
            if (synthRef) {
                synthRef.cancel();
                synthRef.onvoiceschanged = null;
            }
        };
    }, [isOpen]);

    const startInterview = async () => {
        if (state !== 'idle') return;
        setState('hunter_speaking');
        const initialText = `Olá, ${userName}. Analisei sua Matrix. Vamos ver se você realmente domina os requisitos para esta vaga. Para começar, por que você se considera apto, considerando seus gaps em ${gapAnalysis?.missing_skills?.slice(0, 2).join(' e ') || 'algumas tecnologias'}?`;
        speak(initialText);
        setHistory([{ role: 'hunter', text: initialText }]);
    };

    const speak = (text: string) => {
        if (!synthRef) return;
        synthRef.cancel();
        
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.95; 
            utterance.pitch = 0.8; 
            
            const voices = synthRef.getVoices();
            const preferredVoice = 
                voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Neural') || v.name.includes('Premium')))
                || voices.find(v => v.lang.includes('pt-BR') && v.name.includes('Natural'))
                || voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Google') || v.name.includes('Microsoft Online')))
                || voices.find(v => v.lang.includes('pt-BR'))
                || voices[0];
            
            if (preferredVoice) utterance.voice = preferredVoice;
            
            utterance.pitch = 0.85; 
            utterance.rate = 0.9; 

            utterance.onend = () => {
                if (state !== 'finished') {
                    setState('waiting_for_user');
                }
            };
            synthRef.speak(utterance);
        }, 150);
    };

    const handleStartRecording = async () => {
        setError(null);
        try {
            await startAudioCapture();
            setState('recording_user');
        } catch (err: any) {
            setError(err.message);
            setState('waiting_for_user');
        }
    };

    const handleStopRecording = () => {
        stopAudioCapture();
        setState('evaluating');
    };
    const processAudio = async (blob: Blob) => {
        setState('evaluating');
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'interview.webm');
            formData.append('jobDescription', jobDescription);
            formData.append('history', JSON.stringify(history.slice(-4)));
            formData.append('userName', userName);

            const result = await analyzeInterviewAction(formData);
            
            if (!result.success) throw new Error(result.error || "Erro na análise neural.");

            if (result.quest_generated) {
                setQuestGenerated(true);
                setTimeout(() => setQuestGenerated(false), 8000);
            }

            setEvaluation({ score: result.evaluation_score, feedback: result.feedback });
            
            setHistory(prev => [
                ...prev, 
                { role: 'user', text: result.transcribed_text },
                ...(result.next_question ? [{ role: 'hunter', text: result.next_question } as const] : [])
            ]);

            if (result.next_question) {
                setState('hunter_speaking');
                speak(result.next_question);
            } else if (result.evaluation_score >= 80) {
                const finishText = `Excelente performance, ${userName}. Você provou seu valor para esta posição. Encerrando simulação.`;
                speak(finishText);
                setHistory(prev => [...prev, { role: 'hunter', text: finishText }]);
                setState('finished');
            }
        } catch (err: any) {
            setError("Falha no HunterZim: " + err.message);
            setState('waiting_for_user');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-full h-full bg-background flex flex-col relative">
            <div
                className="w-full h-full overflow-hidden bg-card/40 backdrop-blur-xl rounded-[2.5rem] flex flex-col transition-all duration-500"
            >
                {/* Header Global - Refined */}
                <div className="flex items-center justify-between px-10 py-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                            <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-primary opacity-40" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary uppercase opacity-80">
                                SISTEMA DE ENTREVISTA TÁTICA
                            </h2>
                            <span className="text-[14px] font-bold text-foreground tracking-tight">
                                HUNTER-ZIM :: ARENA
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-zinc-500 hover:text-white transition-all duration-300 p-3 hover:bg-white/5 rounded-2xl"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden lg:flex-row flex-col min-h-0 min-w-0">
                    {/* Coluna Esquerda: Simulador Principal */}
                    <div className="flex-1 flex flex-col p-10 md:p-12 items-center text-center overflow-y-auto custom-scrollbar min-w-0">

                        {/* Console / Dialog / Feedback */}
                        <div className="min-h-[220px] w-full max-w-2xl flex flex-col items-center justify-start">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={state + (questGenerated ? '-quest' : '')}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    className="space-y-8 w-full"
                                >
                                    {/* AI Subtitles / Dialog - Premium Glass */}
                                    {(state === 'hunter_speaking' || state === 'waiting_for_user' || state === 'recording_user' || state === 'finished') && [...history].reverse().find(msg => msg.role === 'hunter')?.text && (
                                        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-8 text-left shadow-2xl relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            
                                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                                <div className={`w-2 h-2 rounded-full ${state === 'hunter_speaking' ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-primary/30'}`} />
                                                <span className="text-[10px] font-mono text-primary/70 uppercase tracking-[0.2em] font-bold">
                                                    HUNTER-ZIM AGENT
                                                </span>
                                            </div>
                                            <p className="font-sans text-foreground/90 text-lg leading-relaxed font-light relative z-10">
                                                "{[...history].reverse().find(msg => msg.role === 'hunter')?.text}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Redemption Quest Alert */}
                                    <AnimatePresence>
                                        {questGenerated && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="p-6 bg-amber-500/10 backdrop-blur-md rounded-2xl flex items-center gap-4 border border-amber-500/10"
                                            >
                                                <div className="p-3 bg-amber-500/20 rounded-xl">
                                                    <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest leading-none mb-1">Falha Crítica Detectada</p>
                                                    <p className="text-[13px] text-amber-200/70 font-mono">Missão de Redenção adicionada ao Nexus.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Evaluation Feedback */}
                                    {evaluation && state !== 'evaluating' && (
                                        <div className="pt-4 flex flex-col items-center gap-6">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.3em] font-bold">Performance Matrix</span>
                                                <div className="h-px w-12 bg-zinc-800" />
                                                <span className={`text-lg font-bold font-mono px-4 py-1 rounded-full ${evaluation.score >= 80 ? 'text-green-400 bg-green-400/10' : 'text-primary bg-primary/10'}`}>
                                                    {evaluation.score}/100
                                                </span>
                                            </div>
                                            <div className="bg-white/[0.02] rounded-2xl p-6 w-full text-center">
                                                <p className="text-zinc-400 leading-relaxed font-mono text-sm italic">
                                                    "{evaluation.feedback}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Action Area */}
                        <div className="mt-auto pt-12 w-full max-w-lg flex items-center justify-center">
                            <div className="flex items-center gap-8 rounded-full bg-white/[0.03] backdrop-blur-xl p-3 pr-10 shadow-2xl group transition-all duration-500 hover:bg-white/[0.05]">
                                {state === 'recording_user' ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleStopRecording}
                                        className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_40px_rgba(var(--primary),0.6)] z-20"
                                    >
                                        <div className="absolute inset-0 rounded-full overflow-hidden">
                                            <WaveVisualizer analyser={analyser} isRecording={isRecording} />
                                        </div>
                                        <Square size={24} className="fill-current relative z-10" />
                                        <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-ping pointer-events-none" />
                                    </motion.button>
                                ) : state === 'hunter_speaking' ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-[inner_0_0_20px_rgba(var(--primary),0.1)]">
                                        <div className="flex gap-1.5 h-8 items-center">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ 
                                                        height: [8, 24, 8],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ 
                                                        repeat: Infinity, 
                                                        duration: 0.6, 
                                                        delay: i * 0.1,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="w-1 bg-primary rounded-full"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : state === 'evaluating' ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                        <Loader2 className="animate-spin text-amber-500" size={32} />
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={state === 'finished'}
                                        onClick={handleStartRecording}
                                        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-all hover:bg-primary/20 hover:shadow-[0_0_40px_rgba(var(--primary),0.3)] disabled:opacity-30 cursor-pointer group"
                                    >
                                        <Mic size={32} className="transition-transform duration-500 group-hover:scale-110" />
                                    </motion.button>
                                )}

                                {/* Status Text next to Icon */}
                                <div className="flex flex-col text-left justify-center py-2">
                                    <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.25em] mb-1 ${
                                        state === 'recording_user' ? 'text-primary' :
                                        state === 'hunter_speaking' ? 'text-primary/70' :
                                        state === 'evaluating' ? 'text-amber-500' :
                                        'text-zinc-500'
                                    }`}>
                                        {state === 'idle' ? 'PRONTO PARA INICIAR' :
                                         state === 'hunter_speaking' ? 'HUNTER COGNITION ATIVA' :
                                         state === 'waiting_for_user' ? 'SUA RESPOSTA :: AGUARDANDO' :
                                         state === 'recording_user' ? 'CAPTURA DE ÁUDIO ATIVA' :
                                         state === 'evaluating' ? 'ANÁLISE NEURAL EM CURSO' :
                                         state === 'finished' ? 'AVALIAÇÃO CONCLUÍDA' : ''}
                                    </span>
                                    
                                    <span className="font-sans text-[13px] text-foreground/60 tracking-tight font-medium flex items-center gap-2">
                                        {state === 'recording_user' && (
                                            <span className="flex items-center gap-1.5 text-primary animate-pulse">
                                                <Clock size={12} />
                                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} / 03:00
                                            </span>
                                        )}
                                        {state === 'idle' || state === 'waiting_for_user' ? 'Toque no sensor para falar' :
                                         state === 'recording_user' ? '' :
                                         state === 'hunter_speaking' ? 'Aguarde o processamento vocal' :
                                         state === 'evaluating' ? 'Hamiltoniana de decisão em cálculo' :
                                         state === 'finished' ? 'Sessão encerrada com sucesso' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 flex items-center gap-3 text-primary bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 text-[11px] font-mono tracking-wide"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}
                    </div>

                    {/* Coluna Direita: Listening Room - Integrated */}
                    <div className="lg:w-[450px] w-full bg-black/20 backdrop-blur-md flex flex-col shrink-0">
                        <ListeningRoom jobId={jobId} isLive={true} />
                    </div>
                </div>

                {/* Status Bar Global - Subtle */}
                <div className="px-10 py-6 text-[9px] font-mono text-zinc-600 flex justify-between items-center uppercase tracking-[0.3em] font-bold shrink-0">
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                            <Activity size={12} className="text-zinc-700" />
                            <span>NODE :: STABLE</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary/40">
                            <Zap size={12} className="text-primary/60" />
                            <span>COGNITIVE ENGINE v2.0.4</span>
                        </div>
                    </div>
                    <div className="text-zinc-700">
                        ID_LINK :: {jobId.slice(0, 12)}
                    </div>
                </div>
            </div>
        </div>
    );

}
