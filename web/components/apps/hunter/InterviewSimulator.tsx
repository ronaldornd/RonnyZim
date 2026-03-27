"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, Loader2, X, AlertCircle, Zap, Activity, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import ListeningRoom from './ListeningRoom';

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
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questGenerated, setQuestGenerated] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const synthRef = typeof window !== 'undefined' ? window.speechSynthesis : null;

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
            // Prioridade: Vozes "Premium", "Neural", "Natural" ou de alta qualidade (Google/Microsoft Online)
            const preferredVoice = 
                voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Neural') || v.name.includes('Premium')))
                || voices.find(v => v.lang.includes('pt-BR') && v.name.includes('Natural'))
                || voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Google') || v.name.includes('Microsoft Online')))
                || voices.find(v => v.lang.includes('pt-BR'))
                || voices[0];
            
            if (preferredVoice) utterance.voice = preferredVoice;
            
            // Ajustes para humanizar: pitch levemente mais baixo por ser o "HunterZim" e rate calmo
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

    const startRecording = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("🔒 Bloqueio de Navegador: O acesso ao microfone é proibido via IP de Rede (192.168...). Por favor, acesse a aplicação diretamente por 'http://localhost:3000' para que o navegador libere o hardware.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' 
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                
                if (audioBlob.size < 1000) { 
                    setError("Áudio muito curto ou vazio. Tente falar novamente.");
                    setState('waiting_for_user');
                } else {
                    processAudio(audioBlob);
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); 
            setIsRecording(true);
            setState('recording_user');
        } catch (err: any) {
            setError("Erro ao acessar microfone: " + (err.message || "Permissão negada."));
            setState('waiting_for_user');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setState('evaluating');
        }
    };

    const processAudio = async (blob: Blob) => {
        setState('evaluating');
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            const token = session?.access_token;
            
            // 1. Upload para Supabase Storage
            const fileName = `${user?.id || 'anon'}/${Date.now()}.webm`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('interview_audio')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('interview_audio')
                .getPublicUrl(fileName);

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const historySlice = history.slice(-4);

                // 2. Processamento Normal (Conteúdo e Próxima Pergunta)
                const response = await fetch('/api/interview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audioBase64: base64Audio,
                        jobDescription,
                        gapAnalysis,
                        history: historySlice,
                        userName
                    }),
                });
                const data = await response.json();
                
                if (response.status === 429 || data.code === 'QUOTA_EXHAUSTED') {
                    setError("🚫 ENERGIA ESGOTADA: O HunterZim atingiu o limite de requisições gratuitas do Google. Tente trocar para outro modelo no rodapé ou aguarde 1 minuto para recarregar.");
                    setState('waiting_for_user');
                    return;
                }

                if (!response.ok) throw new Error(data.error || "Erro desconhecido na API.");

                // 3. Disparar Análise Comportamental (Listening Room) - Async (não trava o chat)
                fetch('/api/interview/analyze-audio', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        audioBase64: base64Audio, // Enviamos base64 para o Gemini processar rápido
                        audio_url: publicUrl,    // URL para o player tocar depois
                        job_id: jobId // Usar o ID do job passado por prop para vínculo correto
                    }),
                }).catch(err => console.error("Análise comportamental falhou:", err));

                if (data.quest_generated) {
                    setQuestGenerated(true);
                    setTimeout(() => setQuestGenerated(false), 8000);
                }

                setEvaluation({ score: data.evaluation_score, feedback: data.feedback });
                
                setHistory(prev => [
                    ...prev, 
                    { role: 'user', text: data.transcribed_user_text },
                    ...(data.next_question ? [{ role: 'hunter', text: data.next_question } as const] : [])
                ]);

                if (data.next_question) {
                    setState('hunter_speaking');
                    speak(data.next_question);
                } else if (data.evaluation_score >= 80) {
                    const finishText = `Excelente performance, ${userName}. Você provou seu valor para esta posição. Encerrando simulação.`;
                    speak(finishText);
                    setHistory(prev => [...prev, { role: 'hunter', text: finishText }]);
                    setState('finished');
                }
            };
        } catch (err: any) {
            setError("Falha no HunterZim: " + err.message);
            setState('waiting_for_user');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-6xl h-[85vh] overflow-hidden border border-red-500/30 bg-[#0a0a0a] shadow-[0_0_50px_rgba(239,68,68,0.2)] rounded-3xl flex flex-col"
            >
                {/* Header Global */}
                <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/5 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                        <h2 className="font-mono text-sm font-bold tracking-widest text-red-500 uppercase">
                            SISTEMA DE ENTREVISTA TÁTICA :: HUNTER-ZIM 2.0
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Coluna Esquerda: Simulador Principal */}
                    <div className="flex-1 flex flex-col p-8 items-center text-center overflow-y-auto scrollbar-hide">


                    {/* Console / Dialog / Feedback */}
                    <div className="min-h-[160px] w-full max-w-lg flex flex-col items-center justify-start">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={state + (questGenerated ? '-quest' : '')}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 w-full"
                            >
                                {/* Redemption Quest Alert */}
                                <AnimatePresence>
                                    {questGenerated && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.1)] mb-2"
                                        >
                                            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Falha Crítica Detectada</p>
                                                <p className="text-[9px] text-amber-200/70 font-mono mt-1">Missão de Redenção adicionada ao Nexus.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* AI Subtitles / Dialog */}
                                {(state === 'hunter_speaking' || state === 'waiting_for_user' || state === 'recording_user' || state === 'finished') && [...history].reverse().find(msg => msg.role === 'hunter')?.text && (
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${state === 'hunter_speaking' ? 'bg-red-500 animate-pulse' : 'bg-red-500/50'}`} />
                                            <span className="text-[10px] font-mono text-red-500/70 uppercase tracking-widest">
                                                Hunter-Zim.exe
                                            </span>
                                        </div>
                                        <p className="font-mono text-zinc-300 text-sm leading-relaxed">
                                            "{[...history].reverse().find(msg => msg.role === 'hunter')?.text}"
                                        </p>
                                    </div>
                                )}

                                {/* Action Controls Instead of Text Status */}

                                {/* Evaluation Feedback */}
                                {evaluation && state !== 'evaluating' && (
                                    <div className="border-t border-red-500/20 pt-4 mt-2">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Última Avaliação:</span>
                                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${evaluation.score >= 70 ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                                                {evaluation.score}/100
                                            </span>
                                        </div>
                                        <div className="bg-[#050505] border border-red-500/10 rounded-lg p-3">
                                            <p className="text-xs text-zinc-400 leading-relaxed text-left font-mono">
                                                <span className="text-red-500/50 mr-2">/&gt;</span>
                                                {evaluation.feedback}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Action Area */}
                    <div className="pt-8 w-full max-w-lg flex items-center justify-center">
                        <div className="flex items-center gap-6 rounded-full border border-red-500/20 bg-red-500/5 p-2 pr-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                            {state === 'recording_user' ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={stopRecording}
                                    className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                >
                                    <Square size={20} className="fill-current" />
                                    <div className="absolute -inset-2 rounded-full border border-red-500/50 animate-ping opacity-20" />
                                </motion.button>
                            ) : state === 'hunter_speaking' ? (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                    <div className="flex gap-1 h-6 items-end">
                                        {[1, 2, 3, 4].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [6, 18, 6] }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                                className="w-1 bg-red-500 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : state === 'evaluating' ? (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                    <Loader2 className="animate-spin text-yellow-500" size={24} />
                                </div>
                            ) : (
                                <button
                                    disabled={state === 'finished'}
                                    onClick={startRecording}
                                    className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/50 hover:bg-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all disabled:opacity-30 disabled:hover:bg-red-500/10 cursor-pointer"
                                    title="Pressione para falar"
                                >
                                    <Mic size={24} />
                                </button>
                            )}

                            {/* Status Text next to Icon */}
                            <div className="flex flex-col text-left justify-center h-14">
                                <span className={`font-mono text-xs font-bold uppercase tracking-widest ${
                                    state === 'recording_user' ? 'text-red-500' :
                                    state === 'hunter_speaking' ? 'text-red-400' :
                                    state === 'evaluating' ? 'text-yellow-500' :
                                    'text-zinc-400'
                                }`}>
                                    {state === 'idle' ? 'PRONTO PARA INICIAR' :
                                     state === 'hunter_speaking' ? 'HUNTER ESTÁ FALANDO...' :
                                     state === 'waiting_for_user' ? 'SUA VEZ DE RESPONDER' :
                                     state === 'recording_user' ? 'GRAVANDO ÁUDIO...' :
                                     state === 'evaluating' ? 'AVALIANDO RESPOSTA...' :
                                     state === 'finished' ? 'SIMULAÇÃO CONCLUÍDA' : ''}
                                </span>
                                {(state === 'idle' || state === 'waiting_for_user') && (
                                    <span className="font-mono text-[10px] text-zinc-500/80 uppercase">
                                        Clique no microfone para falar
                                    </span>
                                )}
                                {state === 'recording_user' && (
                                    <span className="font-mono text-[10px] text-red-500/70 uppercase">
                                        Clique no ícone para parar
                                    </span>
                                )}
                                {state === 'hunter_speaking' && (
                                    <span className="font-mono text-[10px] text-red-500/50 uppercase">
                                        Aguarde a IA terminar
                                    </span>
                                )}
                                {state === 'evaluating' && (
                                    <span className="font-mono text-[10px] text-yellow-500/50 uppercase">
                                        Aguarde o processamento
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/5 px-4 py-2 rounded-lg border border-red-400/10 text-xs font-mono">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                    </div>

                    {/* Coluna Direita: Listening Room */}
                    <div className="w-[400px] border-l border-red-500/10 bg-black/20 flex flex-col">
                        <ListeningRoom jobId={jobId} isLive={true} />
                    </div>
                </div>

                {/* Status Bar Global */}
                <div className="border-t border-red-500/10 bg-[#050505] px-6 py-3 text-[10px] font-mono text-zinc-600 flex justify-between items-center uppercase tracking-widest shrink-0">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <Activity size={10} className="text-zinc-500" />
                            <span>LATENCY: STABLE</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-500/50">
                            <Zap size={10} className="text-red-500" />
                            <span>SISTEMA DE MODELO DINÂMICO ATIVO</span>
                        </div>
                    </div>
                    <div className="text-zinc-500">
                        LINK CRIPTOGRÁFICO :: {jobId.slice(0, 8)}...
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
