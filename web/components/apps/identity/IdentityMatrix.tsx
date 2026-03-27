"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import QuestDetailModal from './QuestDetailModal';
import NeuralGraph from './NeuralGraph';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
    Activity,
    Award,
    CheckCircle2,
    Cpu,
    Crosshair,
    Shield,
    UserCircle2,
    Code,
    Database,
    Palette,
    Pencil,
    Check,
    X as XIcon,
    Network,
    LayoutList
} from 'lucide-react';
import { ColorMap } from '../genesis/StackSelector';
import BiorhythmWidget from '../daily/BiorhythmWidget';
import QuestGrid from './QuestGrid';

interface UserStack {
    id: string;
    global_stacks: {
        name: string;
        category: string;
        icon_slug: string;
    };
    current_xp: number;
    current_level: number;
}

interface IdentityMatrixProps {
    userId: string;
    isActive?: boolean;
}

interface DailyQuest {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    target_stack: string;
    status: string;
    completed: boolean; // para controle de otimismo no front
}



export default function IdentityMatrix({ userId, isActive = true }: IdentityMatrixProps) {
    const [stacks, setStacks] = useState<UserStack[]>([]);
    const [loading, setLoading] = useState(true);
    const [quests, setQuests] = useState<DailyQuest[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'neural'>('list');
    const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);
    const [xpToasts, setXpToasts] = useState<{ id: number; message: string }[]>([]);

    // Profile Editável
    const [editMode, setEditMode] = useState(false);
    const [displayName, setDisplayName] = useState('Operador');
    const [profileTitle, setProfileTitle] = useState('Arquiteto Full Stack');
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthCity, setBirthCity] = useState('');
    const [editName, setEditName] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editBirth, setEditBirth] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editCity, setEditCity] = useState('');

    const fetchIdentityStats = async () => {
        if (!userId) return;

        const supabase = createClient();

        // Buscar Stacks Atuais (Mastery RPG)
        const { data, error } = await supabase
            .from('user_stack_mastery')
            .select(`
                    id,
                    current_xp,
                    current_level,
                    global_stacks (
                        name,
                        category,
                        icon_slug
                    )
                `)
            .eq('user_id', userId)
            .eq('is_active', true);

        if (data && !error) {
            // @ts-ignore - Supabase join typing is tricky
            setStacks(data as UserStack[]);
        }

        // Buscar Profile Facts (name, title, birth_date, birth_time, birth_city, birth_data)
        const { data: facts } = await supabase
            .from('user_facts')
            .select('property_key, value')
            .eq('user_id', userId)
            .in('property_key', ['display_name', 'full_name', 'profile_title', 'birth_date', 'birth_time', 'birth_city', 'birth_data']);

        if (facts) {
            const fMap: Record<string, string> = {};
            facts.forEach((f: any) => { fMap[f.property_key] = f.value; });
            
            // display_name tem prioridade, fallback para full_name do Genesis
            setDisplayName(fMap.display_name || fMap.full_name || 'Operador');
            if (fMap.profile_title) setProfileTitle(fMap.profile_title);
            
            // Dados Natais com Fallback para birth_data (Legado)
            let bd = fMap.birth_date;
            let bt = fMap.birth_time;
            let bc = fMap.birth_city;

            if (!bd && fMap.birth_data) {
                // Tenta extrair do formato: "Nascido em DD/MM/YYYY as HH:mm na cidade de CIDADE"
                const dateMatch = fMap.birth_data.match(/(\d{2}\/\d{2}\/\d{4})/);
                const timeMatch = fMap.birth_data.match(/as (\d{2}:\d{2})/);
                const cityMatch = fMap.birth_data.match(/na cidade de (.+)/);
                
                if (dateMatch) {
                    const [d, m, y] = dateMatch[1].split('/');
                    bd = `${y}-${m}-${d}`; // Converte para YYYY-MM-DD
                }
                if (timeMatch) bt = timeMatch[1];
                if (cityMatch) bc = cityMatch[1];
            }

            if (bd) setBirthDate(bd);
            if (bt) setBirthTime(bt);
            if (bc) setBirthCity(bc);
        }

        // Buscar Quests usando a API nova para evitar expor chaves extras
        try {
            const qRes = await fetch(`/api/quests?userId=${userId}`);
            const qData = await qRes.json();
            if (qData.quests) {
                setQuests(qData.quests.map((q: any) => ({ ...q, completed: false })));
            }
        } catch (err) {
            console.error('Falha ao buscar quests', err);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (isActive) {
            fetchIdentityStats();
        }
    }, [userId, isActive]);

    const enterEditMode = () => {
        setEditName(displayName);
        setEditTitle(profileTitle);
        setEditBirth(birthDate);
        setEditTime(birthTime);
        setEditCity(birthCity);
        setEditMode(true);
    };

    const saveProfile = async () => {
        const supabase = createClient();
        const updates = [
            { user_id: userId, category: 'core_identity', property_key: 'display_name', value: editName },
            { user_id: userId, category: 'core_identity', property_key: 'profile_title', value: editTitle },
            { user_id: userId, category: 'astrology', property_key: 'birth_date', value: editBirth },
            { user_id: userId, category: 'astrology', property_key: 'birth_time', value: editTime },
            { user_id: userId, category: 'astrology', property_key: 'birth_city', value: editCity },
            // Atualizar o human-readable birth_data para compatibilidade reversa
            { 
                user_id: userId, 
                category: 'astrology', 
                property_key: 'birth_data', 
                value: `Nascido em ${editBirth.split('-').reverse().join('/')} as ${editTime} na cidade de ${editCity}` 
            },
        ];

        const { error: upsertError } = await supabase
            .from('user_facts')
            .upsert(updates, { onConflict: 'user_id,property_key' });

        if (upsertError) {
            console.error('❌ Falha ao salvar perfil:', upsertError);
            return;
        }

        setDisplayName(editName);
        setProfileTitle(editTitle);
        setBirthDate(editBirth);
        setBirthTime(editTime);
        setBirthCity(editCity);
        localStorage.removeItem('rndmind_astro_cache');
        setEditMode(false);
    };

    const handleCompleteQuest = async (questId: string, xpReward: number, stackName: string) => {
        // Update otimista da UI
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));

        // Mostrar Toast de XP
        const toastId = Date.now();
        setXpToasts(prev => [...prev, { id: toastId, message: `+${xpReward} XP em ${stackName}` }]);

        // Remover toast após 2s
        setTimeout(() => {
            setXpToasts(prev => prev.filter(t => t.id !== toastId));
        }, 2000);

        // Disparar update no Backend real
        try {
            await fetch('/api/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questId, userId })
            });
            // Re-fetch radar/skills silenciosamente para animar o ganho de progresso visualmente
            await fetchIdentityStats();
        } catch (e) {
            console.error('Falha na api de gamificação', e);
        }
    };

    // Preparar dados do gráfico de radar
    const radarData = stacks.map(s => ({
        subject: s.global_stacks.name,
        A: (s.current_level * 10) + (s.current_xp / 10), 
        fullMark: 100,
    }));

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center font-mono text-green-500/50 gap-4">
                <Shield className="w-12 h-12 animate-pulse opacity-50" />
                <span className="tracking-widest uppercase text-[10px]">Iniciando Protocolo de Identidade...</span>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#050505] p-6 text-slate-200 overflow-y-auto custom-scrollbar relative">

            {/* Fundo Ambientes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-6">

                {/* 1. CABEÇALHO (Identidade / Classe) — Editável */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/5 bg-white/[0.02] p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 p-6 pointer-events-none">
                        <UserCircle2 className="w-32 h-32 text-green-500" />
                    </div>

                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 p-1">
                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center border-2 border-[#050505]">
                                <UserCircle2 className="w-12 h-12 text-slate-300" />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-md border border-black shadow-lg">
                            NVL {stacks.reduce((a, s) => a + s.current_level, 0) || '—'}
                        </div>
                    </div>

                    <div className="z-10 flex-1 w-full">
                        {editMode ? (
                            <div className="space-y-3">
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-green-500/50"
                                />
                                <input
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    placeholder="Título / Especialidade"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-green-400 text-xs font-mono focus:outline-none focus:border-green-500/50"
                                />
                                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest pt-1 pb-0.5">✦ Mapa Astral — Dados Natais</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Data de Nascimento</label>
                                        <input
                                            type="date"
                                            value={editBirth}
                                            onChange={e => setEditBirth(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-green-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Hora de Nascimento</label>
                                        <input
                                            type="time"
                                            value={editTime}
                                            onChange={e => setEditTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-green-500/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Cidade de Nascimento</label>
                                    <input
                                        value={editCity}
                                        onChange={e => setEditCity(e.target.value)}
                                        placeholder="Ex: São Paulo, SP, Brasil"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-green-500/50"
                                    />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button onClick={saveProfile} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all">
                                        <Check className="w-3.5 h-3.5" /> Salvar
                                    </button>
                                    <button onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-xs hover:bg-white/5 transition-all">
                                        <XIcon className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                        {displayName}
                                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                    </h1>
                                    <button onClick={enterEditMode} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all" title="Editar Perfil">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm font-mono text-green-400 tracking-widest uppercase mt-1">{profileTitle}</p>
                                {(birthDate || birthTime || birthCity) && (
                                    <p className="text-xs font-mono text-slate-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                                        {birthDate && <span>📅 {new Date(birthDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>}
                                        {birthTime && <span>🕐 {birthTime}</span>}
                                        {birthCity && <span>📍 {birthCity}</span>}
                                    </p>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-green-500" />
                                        <span className="text-xs font-mono">Stacks: {stacks.length}</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-mono">XP Total: {stacks.reduce((a, s) => a + s.current_xp, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>


                {/* 2. GRID PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* GRID DE HABILIDADES (Maestria Atual) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-green-400" />
                                Matriz de Habilidades
                            </h2>
                            {/* Toggle List / Neural */}
                            <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-xl">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
                                        viewMode === 'list'
                                            ? 'bg-white/10 text-green-400 shadow-inner'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <LayoutList className="w-3.5 h-3.5" />
                                    Lista
                                </button>
                                <button
                                    onClick={() => setViewMode('neural')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
                                        viewMode === 'neural'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <Network className="w-3.5 h-3.5" />
                                    Neural
                                </button>
                            </div>
                        </div>

                        {/* LIST VIEW */}
                        {viewMode === 'list' && (
                            stacks.length === 0 ? (
                                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-slate-500">
                                    Nenhum DNA técnico registrado na calibração.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {stacks.map((stack) => {
                                        const brandColor = ColorMap[stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'];
                                        const nextLevelXp = stack.current_level * 100;
                                        const progressPercent = Math.min(100, (stack.current_xp / nextLevelXp) * 100);

                                        return (
                                            <div
                                                key={stack.id}
                                                className="p-4 rounded-xl border border-white/5 bg-[#0a0a0a] hover:border-white/10 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: brandColor, boxShadow: `0 0 10px ${brandColor}` }}
                                                        />
                                                        <span className="font-bold text-sm tracking-wide">{stack.global_stacks.name}</span>
                                                    </div>
                                                    <span className="text-xs font-mono text-slate-400">Nv. {stack.current_level}</span>
                                                </div>

                                                <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progressPercent}%` }}
                                                        transition={{ duration: 1, delay: 0.2 }}
                                                        className="absolute top-0 left-0 h-full rounded-full"
                                                        style={{ backgroundColor: brandColor }}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-[10px] text-slate-500 font-mono">XP: {stack.current_xp}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">PRÓX: {nextLevelXp}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}

                        {/* NEURAL VIEW */}
                        {viewMode === 'neural' && (
                            <NeuralGraph
                                stacks={stacks as any}
                                quests={quests as any}
                                userName={displayName}
                                totalLevel={stacks.reduce((a, s) => a + s.current_level, 0)}
                                userId={userId}
                            />
                        )}
                    </div>

                    {/* GRÁFICO DE RADAR (Aura / Formato do Perfil) */}
                    <div className="col-span-1 space-y-4">
                        <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-teal-400" />
                            Aura do Perfil
                        </h2>
                        <div className="w-full h-[300px] bg-black/40 border border-white/5 rounded-2xl p-4">
                            {stacks.length > 2 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#333" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
                                        <Radar name="Habilidades" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#22c55e', fontSize: '12px' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center px-4">
                                    <Crosshair className="w-8 h-8 mb-2 opacity-20" />
                                    Mínimo de 3 tecnologias necessárias no Genesis para gerar a Aura do Perfil.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. LOG DE MISSÕES DIÁRIAS (Biorritmo Integrado) */}
                <div className="mt-8 space-y-6">
                    <BiorhythmWidget userId={userId} />

                    <div className="pt-2">
                        <QuestGrid 
                            userId={userId}
                            quests={quests}
                            onCompleteQuest={handleCompleteQuest}
                            onSelectQuest={setSelectedQuest}
                        />
                    </div>
                </div>

            </div>

            {/* MODAL DE DETALHES DA QUEST */}
            <QuestDetailModal
                userId={userId}
                quest={selectedQuest}
                onClose={() => setSelectedQuest(null)}
                onComplete={handleCompleteQuest}
            />

            {/* FLOATING XP TOASTS */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100]">
                <AnimatePresence>
                    {xpToasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            animate={{ opacity: 1, scale: 1.5, y: -100 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="text-amber-400 font-black text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] absolute whitespace-nowrap"
                        >
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
}
