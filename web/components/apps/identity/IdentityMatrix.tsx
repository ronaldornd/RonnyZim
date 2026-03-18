"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import QuestDetailModal from './QuestDetailModal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
    Activity,
    Award,
    CheckCircle2,
    Cpu,
    Crosshair,
    Shield,
    TrendingUp,
    UserCircle2,
    Zap,
    Code,
    Database,
    Palette,
    Pencil,
    Check,
    X as XIcon
} from 'lucide-react';
import { ColorMap } from '../genesis/StackSelector';

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

const getStackIcon = (stackName: string) => {
    switch (stackName.toLowerCase()) {
        case 'react':
        case 'next.js':
        case 'typescript':
        case 'javascript':
            return <Code className="w-4 h-4 text-blue-400" />;
        case 'node.js':
        case 'python':
        case 'supabase':
        case 'postgresql':
            return <Database className="w-4 h-4 text-green-400" />;
        case 'tailwind':
        case 'figma':
            return <Palette className="w-4 h-4 text-teal-400" />;
        default:
            return <Activity className="w-4 h-4 text-amber-400" />;
    }
};

export default function IdentityMatrix({ userId, isActive = true }: IdentityMatrixProps) {
    const [stacks, setStacks] = useState<UserStack[]>([]);
    const [loading, setLoading] = useState(true);
    const [quests, setQuests] = useState<DailyQuest[]>([]);
    const [xpToasts, setXpToasts] = useState<{ id: number, message: string }[]>([]);
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);

    // Editable Profile
    const [editMode, setEditMode] = useState(false);
    const [displayName, setDisplayName] = useState('Operador');
    const [profileTitle, setProfileTitle] = useState('Full Stack Architect');
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

        // Buscar Profile Facts (name, title, birth_date, birth_time, birth_city)
        const { data: facts } = await supabase
            .from('user_facts')
            .select('property_key, fact_value')
            .eq('user_id', userId)
            .in('property_key', ['display_name', 'full_name', 'profile_title', 'birth_date', 'birth_time', 'birth_city']);

        if (facts) {
            const fMap: Record<string, string> = {};
            facts.forEach((f: any) => { fMap[f.property_key] = f.fact_value; });
            // display_name takes priority, fall back to full_name from Genesis
            setDisplayName(fMap.display_name || fMap.full_name || 'Operador');
            if (fMap.profile_title) setProfileTitle(fMap.profile_title);
            if (fMap.birth_date) setBirthDate(fMap.birth_date);
            if (fMap.birth_time) setBirthTime(fMap.birth_time);
            if (fMap.birth_city) setBirthCity(fMap.birth_city);
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
            { property_key: 'display_name', fact_value: editName },
            { property_key: 'profile_title', fact_value: editTitle },
            { property_key: 'birth_date', fact_value: editBirth },
            { property_key: 'birth_time', fact_value: editTime },
            { property_key: 'birth_city', fact_value: editCity },
        ];
        for (const u of updates) {
            await supabase.from('user_facts').upsert(
                { user_id: userId, agent_id: 'system', ...u },
                { onConflict: 'user_id,property_key' }
            );
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
        // Optimistic UI update
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));

        // Show XP Toast
        const toastId = Date.now();
        setXpToasts(prev => [...prev, { id: toastId, message: `+${xpReward} XP em ${stackName}` }]);

        // Remove toast after 2s
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
            console.error('Falha na gamification API', e);
            // Revert optimistic if error? (Para escopo simples, apenas logamos)
        }
    };

    // Preparar dados do radar chart 
    // Usaremos as próprias stacks listadas 
    const radarData = stacks.map(s => ({
        subject: s.global_stacks.name,
        A: (s.current_level * 10) + (s.current_xp / 10), // formula fictícia de progressão visual
        fullMark: 100,
    }));

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center font-mono text-green-500/50">
                <Shield className="w-8 h-8 animate-pulse mb-2 opacity-50 block mx-auto" />
                Carregando Identidade...
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#050505] p-6 text-slate-200 overflow-y-auto custom-scrollbar relative">

            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-6">

                {/* 1. HEADER (Identity / Class) — Editable */}
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
                            LVL {stacks.reduce((a, s) => a + s.current_level, 0) || '—'}
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
                                    <button onClick={enterEditMode} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
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


                {/* 2. MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* SKILL GRID (Current Mastery) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-green-400" />
                            Matriz de Habilidades
                        </h2>

                        {stacks.length === 0 ? (
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
                                                <span className="text-[10px] text-slate-500 font-mono">NEXT: {nextLevelXp}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RADAR CHART (Aura / Profile Shape) */}
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
                                        <Radar name="Skills" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
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

                {/* 3. DAILY QUESTS LOG (Optimistic UI) */}
                <div className="mt-8">
                    <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Missões Diárias
                    </h2>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {quests.map((quest) => (
                                <motion.div
                                    key={quest.id}
                                    layout
                                    onClick={() => setExpandedQuestId(expandedQuestId === quest.id ? null : quest.id)}
                                    initial={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex flex-col p-4 rounded-xl border transition-all duration-300 cursor-pointer ${quest.completed
                                    ? 'border-green-500/20 bg-green-500/5 opacity-50'
                                    : 'border-white/5 bg-[#0a0a0a] hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className={`text-sm flex items-center gap-2 ${quest.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                            {getStackIcon(quest.target_stack)}
                                            {quest.title}
                                        </span>
                                        <span className="text-xs font-mono text-amber-500 mt-1 flex items-center gap-1 opacity-80">
                                            <TrendingUp className="w-3 h-3" />
                                            {quest.xp_reward} XP
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {quest.description && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedQuest(quest); }}
                                                className="px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                                            >
                                                Detalhes
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCompleteQuest(quest.id, quest.xp_reward, quest.target_stack);
                                            }}
                                            disabled={quest.completed}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${quest.completed
                                                ? 'bg-transparent text-green-500'
                                                : 'bg-white/5 text-white hover:bg-white/10 hover:text-green-400'
                                                }`}
                                        >
                                            {quest.completed ? 'Completado' : 'Concluir'}
                                        </button>
                                    </div>
                                  </div>

                                  {/* EXPANDED DESCRIPTION */}
                                  <AnimatePresence>
                                      {expandedQuestId === quest.id && (
                                          <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="mt-4 pt-4 border-t border-white/10 text-slate-400 text-sm whitespace-pre-wrap leading-relaxed overflow-hidden"
                                          >
                                              {quest.description || "Nenhum detalhe adicional fornecido pela IA."}
                                          </motion.div>
                                      )}
                                  </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            {/* QUEST DETAIL MODAL */}
            <QuestDetailModal
                quest={selectedQuest}
                onClose={() => setSelectedQuest(null)}
                onComplete={handleCompleteQuest}
            />

            {/* XP FLOAT TOASTS */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                {xpToasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1.5, y: -100 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-amber-400 font-black text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] absolute"
                    >
                        {toast.message}
                    </motion.div>
                ))}
            </div>

        </div>
    );
}
