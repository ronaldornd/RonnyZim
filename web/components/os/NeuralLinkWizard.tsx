"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Key, 
    ArrowRight, 
    Check, 
    Loader2, 
    ShieldAlert, 
    ExternalLink,
    Activity,
    Cpu,
    Sparkles
} from 'lucide-react';
import { useCyberSFX } from '@/hooks/useCyberSFX';
import { updateUserFactsAction } from '@/app/actions/profile';

interface NeuralLinkWizardProps {
    userId: string;
    onSuccess: () => void;
}

const tutorials = {
    google: {
        title: "Google Gemini (Recomendado)",
        url: "https://aistudio.google.com/app/apikey",
        steps: [
            "Acesse o Google AI Studio",
            "Clique em 'Create API Key'",
            "Copie a chave e cole abaixo"
        ],
        color: "text-blue-400",
        icon: <Sparkles className="w-5 h-5 text-blue-400" />
    },
    openai: {
        title: "OpenAI GPT-4o / o1",
        url: "https://platform.openai.com/api-keys",
        steps: [
            "Acesse o Dashboard da OpenAI",
            "Crie uma 'Secret Key'",
            "Certifique-se de ter créditos na conta"
        ],
        color: "text-emerald-400",
        icon: <Cpu className="w-5 h-5 text-emerald-400" />
    },
    anthropic: {
        title: "Anthropic Claude 3.5",
        url: "https://console.anthropic.com/settings/keys",
        steps: [
            "Acesse o Console da Anthropic",
            "Gere uma nova chave em 'API Keys'",
            "Claude é ideal para escrita criativa"
        ],
        color: "text-orange-400",
        icon: <Activity className="w-5 h-5 text-orange-400" />
    }
};

export default function NeuralLinkWizard({ userId, onSuccess }: NeuralLinkWizardProps) {
    const [wizardStep, setWizardStep] = useState<'select' | 'key' | 'validating' | 'success'>('select');
    const [selectedProvider, setSelectedProvider] = useState<'google' | 'openai' | 'anthropic'>('google');
    const [wizardKey, setWizardKey] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const { triggerSFX, playSuccess, playError, playGlitch } = useCyberSFX();

    const validateAndSaveKey = async () => {
        setValidationError(null);
        setWizardStep('validating');
        
        try {
            // 1. Validar a chave buscando modelos
            const res = await fetch(`/api/models?provider=${selectedProvider}&apiKey=${wizardKey}`);
            const data = await res.json();
            
            if (!res.ok || !data.models || data.models.length === 0) {
                throw new Error(data.error || 'Falha na validação neural. Verifique sua chave.');
            }

            // 2. Chave válida! Salvar no Supabase
            setIsSaving(true);
            const keyField = selectedProvider === 'google' ? 'gemini_api_key' : 
                            selectedProvider === 'openai' ? 'openai_api_key' : 'anthropic_api_key';
            
            await updateUserFactsAction(userId, [
                { category: 'Security', property_key: keyField, value: wizardKey },
                { category: 'System', property_key: 'preferred_ai_provider', value: selectedProvider },
                // Selecionar o primeiro modelo válido como padrão
                { category: 'System', property_key: 'preferred_ai_model', value: data.models[0].id },
                { category: 'System', property_key: 'preferred_audio_model', value: data.models[0].id }
            ]);

            setWizardStep('success');
            playSuccess();
        } catch (err: any) {
            setValidationError(err.message);
            setWizardStep('key');
            playError();
            playGlitch();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#050505]/98 backdrop-blur-3xl"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                className="max-w-md w-full bg-[#0a0a0a] border border-cyan-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.2)] relative"
            >
                <div className="h-1.5 bg-[linear-gradient(90deg,transparent,rgba(6,182,212,0.8),transparent)] w-full" />
                
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {wizardStep === 'select' && (
                            <motion.div 
                                key="select"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-7 relative">
                                    <div className="absolute inset-0 bg-cyan-500/10 blur-xl animate-pulse" />
                                    <Zap className="w-8 h-8 text-cyan-400 relative z-10" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase mb-4">Núcleo Desconectado</h2>
                                <p className="text-slate-400 font-mono text-[10px] leading-relaxed mb-8 uppercase tracking-widest">
                                    O RonnyZim OS requer uma <span className="text-cyan-400 font-bold">Assinatura Neural</span> ativa para inicializar os Agentes de Inteligência.
                                </p>
                                
                                <div className="grid grid-cols-1 gap-2.5">
                                    {(['google', 'openai', 'anthropic'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setSelectedProvider(p);
                                                setWizardStep('key');
                                                triggerSFX();
                                            }}
                                            className="w-full py-[1.125rem] px-7 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {tutorials[p].icon}
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">
                                                    {p === 'google' ? 'Google Gemini' : p === 'openai' ? 'OpenAI GPT' : 'Anthropic Claude'}
                                                </span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 transition-all group-hover:translate-x-1" />
                                        </button>
                                    ))}
                                </div>
                                
                                <p className="mt-8 text-[9px] text-slate-700 font-mono uppercase tracking-[0.3em] font-bold italic">
                                    Acesso restrito até validação de uplink.
                                </p>
                            </motion.div>
                        )}

                        {wizardStep === 'key' && (
                            <motion.div 
                                key="key"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-left"
                            >
                                <button onClick={() => setWizardStep('select')} className="text-[11px] font-bold text-slate-600 hover:text-cyan-400 mb-8 flex items-center gap-2 uppercase tracking-[0.2em] transition-colors">
                                    ← Alterar Provedor
                                </button>
                                
                                <div className="flex items-center gap-4 mb-7">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        {tutorials[selectedProvider].icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">{tutorials[selectedProvider].title}</h3>
                                        <p className="text-[10px] text-cyan-500/60 uppercase tracking-widest font-mono">Neural Key Required</p>
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 italic">Protocolo de Reconhecimento:</p>
                                    <ul className="space-y-3">
                                        {tutorials[selectedProvider].steps.map((step, i) => (
                                            <li key={i} className="flex gap-4 text-[12px] text-slate-300 font-mono leading-relaxed">
                                                <span className="text-cyan-500/40 font-black">{i + 1}.</span> {step}
                                            </li>
                                        ))}
                                    </ul>
                                    <a 
                                        href={tutorials[selectedProvider].url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 mt-6 text-[11px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest border-b border-cyan-400/20 pb-1 transition-all"
                                    >
                                        Obter Chave API <ExternalLink size={11} />
                                    </a>
                                </div>

                                <div className="space-y-5">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                            <Key className="w-4 h-4 text-slate-700 group-focus-within:text-cyan-500 transition-colors" />
                                        </div>
                                        <input 
                                            type="password"
                                            value={wizardKey}
                                            onKeyDown={(e) => e.key === 'Enter' && validateAndSaveKey()}
                                            onChange={(e) => setWizardKey(e.target.value)}
                                            placeholder="INSIRA SUA API KEY AQUI..."
                                            className={`w-full bg-black/60 border ${validationError ? 'border-red-500/50' : 'border-white/10 group-hover:border-cyan-500/30'} rounded-2xl pl-12 pr-6 py-5 text-xs font-mono text-cyan-400 placeholder:text-slate-800 focus:outline-none focus:border-cyan-500 transition-all shadow-inner`}
                                        />
                                        {validationError && (
                                            <p className="text-[10px] text-red-400/80 mt-3 font-mono flex items-center gap-2 animate-pulse uppercase tracking-tight">
                                                <ShieldAlert className="w-3.5 h-3.5" /> {validationError}
                                            </p>
                                        )}
                                    </div>

                                    <button 
                                        onClick={validateAndSaveKey}
                                        disabled={!wizardKey || wizardKey.length < 5 || isSaving}
                                        className="w-full py-5 bg-cyan-500 text-black font-black text-[11px] tracking-[0.4em] uppercase rounded-2xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                    >
                                        {isSaving ? 'VALIDANDO REQUISITOS...' : 'AUTENTICAR VÍNCULO'} <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 'validating' && (
                            <motion.div 
                                key="validating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <div className="relative w-24 h-24 mx-auto mb-10">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-[3px] border-cyan-500/20 border-t-cyan-500 rounded-full"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-white tracking-[0.3em] uppercase mb-4">Sincronizando...</h3>
                                <p className="text-[11px] text-slate-500 font-mono italic animate-pulse uppercase tracking-widest">
                                    Mapeando terminações nervosas com {selectedProvider}...
                                </p>
                            </motion.div>
                        )}

                        {wizardStep === 'success' && (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-10 relative">
                                    <div className="absolute inset-0 bg-emerald-500/10 blur-2xl" />
                                    <Check className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)] relative z-10" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-[0.3em] uppercase mb-6">Vínculo Estável</h2>
                                <p className="text-slate-400 font-mono text-[12px] leading-relaxed mb-10 uppercase tracking-[0.2em]">
                                    A consciência foi ancorada com sucesso. Todos os módulos do OS foram desbloqueados.
                                </p>
                                
                                <button 
                                    onClick={onSuccess}
                                    className="w-full py-5 bg-emerald-500 text-black font-black text-[11px] tracking-[0.4em] uppercase rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_40px_rgba(52,211,153,0.2)]"
                                >
                                    INICIALIZAR KERNEL
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="px-8 py-4 bg-white/[0.03] border-t border-white/5 flex justify-between items-center">
                    <span className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.3em] font-bold">Protocolo: NEURAL-LINK-2026</span>
                    <span className="text-[9px] font-mono text-cyan-500/60 animate-pulse uppercase font-black tracking-widest">
                        {wizardStep === 'validating' ? 'ENCRYPTING...' : 'SISTEMA SEGURO'}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
}
