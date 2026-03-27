"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Cpu, Save, Loader2, AlertCircle, Mic } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

interface ModelInfo {
    id: string;
    displayName: string;
    description?: string;
    version?: string;
}

export default function SettingsApp({ userId }: { userId: string }) {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
    const [selectedAudioModel, setSelectedAudioModel] = useState<string>('gemini-2.0-flash-exp');
    const [loadingModels, setLoadingModels] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);


    useEffect(() => {
        fetchModels();
        fetchUserPreference();
    }, []);

    const fetchModels = async () => {
        try {
            setLoadingModels(true);
            const res = await fetch('/api/models');
            if (!res.ok) throw new Error('Falha ao buscar modelos');
            const data = await res.json();
            setModels(data.models || []);
        } catch (err: any) {
            console.error(err);
            setError('Não foi possível carregar a lista de modelos do Google AI Studio.');
        } finally {
            setLoadingModels(false);
        }
    };

    const fetchUserPreference = async () => {
        try {
            const supabase = createClient();
            const { data: textModelData } = await supabase
                .from('user_facts')
                .select('value')
                .eq('user_id', userId)
                .eq('property_key', 'preferred_ai_model')
                .limit(1);

            if (textModelData && textModelData.length > 0) {
                setSelectedModel(textModelData[0].value);
            }

            const { data: audioModelData } = await supabase
                .from('user_facts')
                .select('value')
                .eq('user_id', userId)
                .eq('property_key', 'preferred_audio_model')
                .limit(1);

            if (audioModelData && audioModelData.length > 0) {
                setSelectedAudioModel(audioModelData[0].value);
            }
        } catch (err) {
            console.error('Falha ao ler preferência', err);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMsg(null);

            const supabase = createClient();
            
            // Salvar Modelo de Texto
            const { error: textError } = await supabase
                .from('user_facts')
                .upsert({
                    user_id: userId,
                    category: 'System',
                    property_key: 'preferred_ai_model',
                    value: selectedModel
                }, { onConflict: 'user_id,property_key' });

            if (textError) throw textError;

            // Salvar Modelo de Áudio
            const { error: audioError } = await supabase
                .from('user_facts')
                .upsert({
                    user_id: userId,
                    category: 'System',
                    property_key: 'preferred_audio_model',
                    value: selectedAudioModel
                }, { onConflict: 'user_id,property_key' });

            if (audioError) throw audioError;

            setSuccessMsg('Configurações de inteligência salvas com sucesso!');
            setTimeout(() => setSuccessMsg(null), 4000);

        } catch (err: any) {
            console.error(err);
            setError('Erro ao salvar configuração: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full w-full bg-[#050505] text-zinc-300 flex flex-col items-center justify-start py-20 px-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full flex flex-col gap-8"
            >
                <header className="flex items-center gap-4 border-b border-green-500/20 pb-6">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                        <Settings2 className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-widest uppercase font-mono">System Config</h1>
                        <p className="text-zinc-500 text-[10px] font-mono mt-1 uppercase tracking-[0.2em]">Global Neural Network Parameters</p>
                    </div>
                </header>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-mono">{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-mono">{successMsg}</span>
                    </div>
                )}

                <section className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Mic className="text-red-400 w-6 h-6" />
                        <h2 className="text-xl font-semibold text-white">Audio Analysis Engine (Listening Room)</h2>
                    </div>

                    <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
                        Selecione o motor para processamento multimodal de áudio. Apenas modelos com suporte nativo a áudio estão listados aqui.
                    </p>

                    <div className="mb-4">
                        <div className="relative">
                            <select 
                                value={selectedAudioModel}
                                onChange={(e) => setSelectedAudioModel(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white p-5 rounded-2xl focus:outline-none focus:border-red-500/50 appearance-none font-mono text-xs uppercase tracking-widest"
                                style={{ WebkitAppearance: 'none', appearance: 'none' }}
                            >
                                {models
                                    .map(model => (
                                        <option key={model.id} value={model.id} className="bg-zinc-950 text-white">
                                            {model.displayName.toUpperCase()}
                                        </option>
                                    ))
                                }
                                {models.length === 0 && (
                                    <option value="gemini-2.0-flash-exp" className="bg-zinc-950 text-white text-xs">AQUIRING MODELS... (WAIT)</option>
                                )}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-red-500/50 group-hover:text-red-500 transition-colors">
                                <Mic size={16} className="animate-pulse" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Cpu className="text-blue-400 w-6 h-6" />
                        <h2 className="text-xl font-semibold text-white">Inteligência Artificial Base</h2>
                    </div>

                    <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
                        Selecione o modelo do Gemini que será utilizado por todos os agentes em segundo plano. 
                        Aviso: Modelos experimentais (Pro) podem oferecer raciocínio avançado, mas custam mais tempo de carregamento.
                    </p>

                    <div className="mb-8">
                        {loadingModels ? (
                            <div className="flex items-center gap-3 text-zinc-500 p-4 border border-dashed border-zinc-800 rounded-xl">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-mono text-xs uppercase tracking-wider">Conectando ao Google AI Studio...</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <select 
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 text-white p-5 rounded-2xl focus:outline-none focus:border-blue-500/50 appearance-none font-mono text-xs uppercase tracking-widest"
                                    style={{ WebkitAppearance: 'none', appearance: 'none' }}
                                >
                                    {models.map(model => (
                                        <option key={model.id} value={model.id} className="bg-zinc-950 text-white">
                                            {model.displayName.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500/50 group-hover:text-blue-500 transition-colors">
                                    <Cpu size={16} className="animate-pulse" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving || loadingModels}
                            className="bg-zinc-100 hover:bg-white text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Aplicar Configurações
                        </button>
                    </div>
                </section>
            </motion.div>
        </div>
    );
}
