"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import { useBootSequence } from '@/hooks/useBootSequence';
import { saveSettingsAction, wipeMemoryAction } from '@/app/actions/settings';
import { 
    Settings2, 
    Cpu, 
    Save, 
    Loader2, 
    AlertCircle, 
    RefreshCw, 
    Palette, 
    CircuitBoard, 
    Eye, 
    EyeOff, 
    Unplug,
    ChevronRight,
    Sparkles,
    Key,
    Activity,
    ExternalLink,
    Zap,
    Mic
} from 'lucide-react';

interface ModelInfo {
    id: string;
    displayName: string;
    description?: string;
    family?: string;
}

export default function SettingsApp({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState<'intelligence' | 'system' | 'aesthetic'>('intelligence');
    const [models, setModels] = useState<ModelInfo[]>([]);
    
    // AI Configs
    const [selectedProvider, setSelectedProvider] = useState<string>('google');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [selectedAudioModel, setSelectedAudioModel] = useState<string>('');
    
    // Keys
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [elevenlabsKey, setElevenlabsKey] = useState('');
    const [showKey, setShowKey] = useState<boolean>(false);

    const [loadingModels, setLoadingModels] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const { resetBoot } = useBootSequence();
    const [confirmWipe, setConfirmWipe] = useState(false);
    const [wiping, setWiping] = useState(false);

    // Mapping providers to keys and links
    const providerConfig = {
        google: { key: geminiKey, set: setGeminiKey, link: 'https://aistudio.google.com/app/apikey', label: 'Chave API Gemini' },
        openai: { key: openaiKey, set: setOpenaiKey, link: 'https://platform.openai.com/api-keys', label: 'Chave API OpenAI' },
        anthropic: { key: anthropicKey, set: setAnthropicKey, link: 'https://console.anthropic.com/settings/keys', label: 'Chave API Anthropic' },
        elevenlabs: { key: elevenlabsKey, set: setElevenlabsKey, link: 'https://elevenlabs.io/app/settings/api-keys', label: 'Chave API ElevenLabs' }
    };

    useEffect(() => {
        fetchUserPreference();
    }, []);

    // Fetch models whenever provider or its key changes (with debounce)
    useEffect(() => {
        const currentKey = (providerConfig as any)[selectedProvider].key;
        if (currentKey && currentKey.length > 5 && !currentKey.startsWith('****')) {
            const timer = setTimeout(() => {
                fetchModels(selectedProvider, currentKey);
            }, 800);
            return () => clearTimeout(timer);
        } else if (!currentKey) {
            setModels([]);
        }
    }, [selectedProvider, geminiKey, openaiKey, anthropicKey, elevenlabsKey]);

    const fetchModels = async (provider: string, apiKey: string) => {
        try {
            setLoadingModels(true);
            setError(null);
            const res = await fetch(`/api/models`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, apiKey })
            });
            if (!res.ok) throw new Error('Falha ao validar chaves ou buscar modelos');
            const data = await res.json();
            setModels(data.models || []);
        } catch (err: any) {
            console.error(err);
            setError(`Erro na conexão ${provider.toUpperCase()}: Verifique sua chave.`);
        } finally {
            setLoadingModels(false);
        }
    };

    const fetchUserPreference = async () => {
        try {
            const supabase = createClient();
            const { data: facts } = await supabase
                .from('user_facts')
                .select('property_key, value')
                .eq('user_id', userId)
                .in('property_key', [
                    'preferred_ai_provider',
                    'preferred_ai_model',
                    'preferred_audio_model',
                    'gemini_api_key',
                    'openai_api_key',
                    'anthropic_api_key',
                    'elevenlabs_api_key'
                ]);

            if (facts) {
                facts.forEach(f => {
                    if (f.property_key === 'preferred_ai_provider') setSelectedProvider(f.value);
                    if (f.property_key === 'preferred_ai_model') setSelectedModel(f.value);
                    if (f.property_key === 'preferred_audio_model') setSelectedAudioModel(f.value);
                    
                    const displayValue = f.value?.startsWith('enc:') ? '****************' : f.value;
                    
                    if (f.property_key === 'gemini_api_key') setGeminiKey(displayValue);
                    if (f.property_key === 'openai_api_key') setOpenaiKey(displayValue);
                    if (f.property_key === 'anthropic_api_key') setAnthropicKey(displayValue);
                    if (f.property_key === 'elevenlabs_api_key') setElevenlabsKey(displayValue);
                });
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

            const updates = [
                { category: 'System', property_key: 'preferred_ai_provider', value: selectedProvider },
                { category: 'System', property_key: 'preferred_ai_model', value: selectedModel },
                { category: 'System', property_key: 'preferred_audio_model', value: selectedAudioModel },
                { category: 'Security', property_key: 'gemini_api_key', value: geminiKey },
                { category: 'Security', property_key: 'openai_api_key', value: openaiKey },
                { category: 'Security', property_key: 'anthropic_api_key', value: anthropicKey },
                { category: 'Security', property_key: 'elevenlabs_api_key', value: elevenlabsKey },
            ];

            const result = await saveSettingsAction(updates);
            if (!result.success) throw new Error(result.error);

            setSuccessMsg('Parâmetros cerebrais sincronizados com sucesso.');
            setTimeout(() => setSuccessMsg(null), 4000);

        } catch (err: any) {
            console.error(err);
            setError('Sincronização neural falhou: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleWipe = async () => {
        if (!confirmWipe) {
            setConfirmWipe(true);
            setTimeout(() => setConfirmWipe(false), 5000);
            return;
        }

        try {
            setWiping(true);
            setError(null);
            const res = await wipeMemoryAction();
            if (res.success) {
                window.location.reload();
            } else {
                throw new Error(res.error);
            }
        } catch (err: any) {
            console.error(err);
            setError('Purga Neural Falhou: ' + err.message);
            setConfirmWipe(false);
        } finally {
            setWiping(false);
        }
    };

    const tabs = [
        { id: 'intelligence', label: 'Inteligência', icon: Cpu, color: 'text-blue-400' },
        { id: 'aesthetic', label: 'Estética', icon: Palette, color: 'text-purple-400' },
        { id: 'system', label: 'Sistema', icon: CircuitBoard, color: 'text-zinc-400' },
    ];

    const groupedModels = models.reduce((acc, model) => {
        const family = model.family || 'Outros';
        if (!acc[family]) acc[family] = [];
        acc[family].push(model);
        return acc;
    }, {} as Record<string, ModelInfo[]>);

    return (
        <div className="h-full w-full bg-[#050505] text-zinc-300 flex overflow-hidden">
            <aside className="w-64 border-r border-white/5 bg-[#080808] flex flex-col p-6 gap-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Settings2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white uppercase font-mono">Kernel Config</span>
                </div>

                <nav className="flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                activeTab === tab.id 
                                ? 'bg-white/5 text-white shadow-lg shadow-white/5' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : 'text-zinc-600'}`} />
                            <span className="text-xs font-mono uppercase tracking-wider">{tab.label}</span>
                            {activeTab === tab.id && (
                                <ChevronRight className="w-4 h-4 ml-auto text-white/20" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                    {activeTab === 'intelligence' && (
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <p className="text-[9px] font-mono text-blue-400 uppercase tracking-widest leading-relaxed">
                                <Zap className="w-3 h-3 inline mr-2" />
                                Modelos auto-descobertos: {models.length} ativos
                            </p>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-zinc-100 hover:bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="text-xs uppercase tracking-widest">Sincronizar</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-8 scrollbar-none">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 mb-8">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-xs font-mono uppercase tracking-widest">{error}</span>
                            </motion.div>
                        )}

                        {successMsg && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3 mb-8">
                                <Activity className="w-4 h-4 animate-pulse" />
                                <span className="text-xs font-mono uppercase tracking-widest">{successMsg}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'intelligence' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <header>
                                <h1 className="text-3xl font-black text-white tracking-tight">Link Neural de IA</h1>
                                <p className="text-zinc-500 text-xs font-mono mt-2 uppercase tracking-[0.3em]">Descoberta de Modelos e Provedores</p>
                            </header>

                            <section className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Provedor Ativo</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['google', 'openai', 'anthropic', 'elevenlabs'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setSelectedProvider(p)}
                                                className={`py-4 rounded-xl border transition-all font-mono text-[9px] uppercase tracking-widest flex flex-col items-center gap-1.5 ${
                                                    selectedProvider === p 
                                                    ? 'bg-white/10 border-white/20 text-white shadow-xl shadow-white/5' 
                                                    : 'bg-black/40 border-white/5 text-zinc-600 hover:border-white/10'
                                                }`}
                                            >
                                                {p === 'google' && <Sparkles className="w-3.5 h-3.5 " />}
                                                {p === 'openai' && <Cpu className="w-3.5 h-3.5" />}
                                                {p === 'anthropic' && <Activity className="w-3.5 h-3.5" />}
                                                {p === 'elevenlabs' && <Mic className="w-3.5 h-3.5" />}
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <motion.div layout className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Key className="w-3.5 h-3.5 text-blue-400" />
                                            <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">
                                                {(providerConfig as any)[selectedProvider].label}
                                            </label>
                                        </div>
                                        <a href={(providerConfig as any)[selectedProvider].link} target="_blank" rel="noopener noreferrer" className="text-[8px] text-zinc-500 hover:text-white transition-colors uppercase font-mono tracking-tighter flex items-center gap-1">
                                            Obter Chave <ExternalLink size={9} />
                                        </a>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type={showKey ? "text" : "password"}
                                            value={(providerConfig as any)[selectedProvider].key}
                                            onChange={(e) => (providerConfig as any)[selectedProvider].set(e.target.value)}
                                            placeholder={`Insira sua chave para carregar modelos...`}
                                            className="w-full bg-black/60 border border-white/10 text-white p-4 rounded-xl focus:outline-none focus:border-blue-500/30 transition-all font-mono text-xs placeholder:text-zinc-800"
                                        />
                                        <button onClick={() => setShowKey(!showKey)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors">
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Motor do Cérebro (Lógica)</label>
                                            {loadingModels && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                                        </div>
                                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={models.length === 0} className="w-full bg-black/60 border border-white/10 text-white p-4 rounded-xl focus:outline-none focus:border-blue-500/50 appearance-none font-mono text-[11px] disabled:opacity-30">
                                            <option value="">{loadingModels ? 'Buscando rastro neural...' : 'Aguardando chave...'}</option>
                                            {Object.entries(groupedModels).map(([family, familyModels]) => (
                                                <optgroup key={family} label={family} className="bg-[#080808] text-blue-400 py-2">
                                                    {familyModels.map(model => (
                                                        <option key={model.id} value={model.id}>{model.displayName}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Motor de Áudio (Voz)</label>
                                            {loadingModels && <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />}
                                        </div>
                                        <select value={selectedAudioModel} onChange={(e) => setSelectedAudioModel(e.target.value)} disabled={models.length === 0} className="w-full bg-black/60 border border-white/10 text-white p-4 rounded-xl focus:outline-none focus:border-emerald-500/50 appearance-none font-mono text-[11px] disabled:opacity-30">
                                            <option value="">{loadingModels ? 'Sintonizando frequências...' : 'Aguardando chave...'}</option>
                                            {Object.entries(groupedModels).map(([family, familyModels]) => (
                                                <optgroup key={family} label={family} className="bg-[#080808] text-emerald-400 py-2">
                                                    {familyModels.map(model => (
                                                        <option key={model.id} value={model.id}>{model.displayName}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'aesthetic' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <header>
                                <h1 className="text-3xl font-black text-white tracking-tight">Estética Visual</h1>
                                <p className="text-zinc-500 text-xs font-mono mt-2 uppercase tracking-[0.3em]">Customização de UI e Temas</p>
                            </header>
                            <section className="bg-white/5 border border-white/5 rounded-2xl p-8 py-20 text-center flex flex-col items-center gap-4">
                                <Sparkles className="w-12 h-12 text-purple-500/20 animate-pulse" />
                                <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.4em]">Módulo em Desenvolvimento</p>
                                <p className="text-[9px] text-zinc-700 font-mono max-w-sm uppercase leading-loose">
                                    Controle de intensidade de vidro, esquemas de cores (Obsidian, Emerald, Crimson) em breve.
                                </p>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'system' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <header>
                                <h1 className="text-3xl font-black text-white tracking-tight">Sistema & Kernel</h1>
                                <p className="text-zinc-500 text-xs font-mono mt-2 uppercase tracking-[0.3em]">Ciclo de Vida e Diagnósticos</p>
                            </header>
                            <section className="bg-white/5 border border-white/5 rounded-2xl p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={resetBoot} className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 p-6 rounded-2xl transition-all group flex flex-col gap-3">
                                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Reiniciar Boot</p>
                                            <p className="text-[8px] opacity-60 uppercase mt-1">Limpa cache de tutorial</p>
                                        </div>
                                    </button>
                                    <button onClick={handleWipe} disabled={wiping} className={`border p-6 rounded-2xl transition-all group flex flex-col gap-3 ${confirmWipe ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:text-red-500/60'}`}>
                                        {wiping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unplug className="w-5 h-5" />}
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">{confirmWipe ? 'CONFIRMAR PURGA?' : 'Limpar Memória'}</p>
                                            <p className="text-[8px] opacity-60 uppercase mt-1">{confirmWipe ? 'Ação irreversível.' : 'Apaga todos os fatos aprendidos'}</p>
                                        </div>
                                    </button>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
