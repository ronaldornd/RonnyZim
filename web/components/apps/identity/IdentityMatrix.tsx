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
    const [activeTab, setActiveTab] = useState<'IDENTIDADE' | 'MAESTRIA' | 'AURA' | 'JORNADA'>('IDENTIDADE');
    const [maestriaPage, setMaestriaPage] = useState(0);
    const [jornadaPage, setJornadaPage] = useState(0);
    const stacksPerPage = 6;
    const questsPerPage = 3;

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

    const renderTabs = () => {
        const tabs = [
            { id: 'IDENTIDADE', icon: <UserCircle2 className="w-4 h-4" />, label: 'IDENTIDADE' },
            { id: 'MAESTRIA', icon: <Cpu className="w-4 h-4" />, label: 'MAESTRIA' },
            { id: 'AURA', icon: <Crosshair className="w-4 h-4" />, label: 'AURA' },
            { id: 'JORNADA', icon: <Activity className="w-4 h-4" />, label: 'JORNADA' },
        ];

        return (
            <div className="flex items-center justify-center gap-4 mb-1 border-b border-white/5 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-2 py-1 transition-all duration-300 relative group ${
                            activeTab === tab.id 
                                ? 'text-cyan-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab.icon}
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeProfileTab"
                                className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                            />
                        )}
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center font-mono text-green-500/50 gap-4">
                <Shield className="w-12 h-12 animate-pulse opacity-50" />
                <span className="tracking-widest uppercase text-[10px]">Iniciando Protocolo de Identidade...</span>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#050505] p-3 pt-1 text-slate-200 overflow-hidden relative flex flex-col">
            {/* Fundo Ambientes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
                {renderTabs()}

                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'IDENTIDADE' && (
                                <div className="flex flex-col gap-4 py-2">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/5 bg-white/[0.01] p-6 rounded-[2rem] backdrop-blur-md relative overflow-hidden shrink-0">
                                        <div className="absolute top-0 right-0 opacity-5 p-8 pointer-events-none">
                                            <UserCircle2 className="w-48 h-48 text-cyan-500" />
                                        </div>

                                        <div className="relative shrink-0">
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500/40 to-blue-500/40 p-1 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center border-2 border-[#050505]">
                                                    <UserCircle2 className="w-14 h-14 text-slate-400" />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[9px] font-black px-2 py-1 rounded-md border border-black shadow-lg uppercase tracking-tighter">
                                                NVL {stacks.reduce((a, s) => a + s.current_level, 0) || '—'}
                                            </div>
                                        </div>

                                        <div className="z-10 flex-1 w-full">
                                            {editMode ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <input
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            placeholder="IDENTIDADE"
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-cyan-500/30 transition-all uppercase tracking-wider"
                                                        />
                                                        <input
                                                            value={editTitle}
                                                            onChange={e => setEditTitle(e.target.value)}
                                                            placeholder="TÍTULO OPERACIONAL"
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-cyan-400 text-[10px] font-mono focus:outline-none focus:border-cyan-500/30 transition-all uppercase tracking-widest"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-4 pt-2 border-t border-white/5">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">✦ Dados Natais / Astrometria</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Data</label>
                                                                <input
                                                                    type="date"
                                                                    value={editBirth}
                                                                    onChange={e => setEditBirth(e.target.value)}
                                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/30 transition-all"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Hora</label>
                                                                <input
                                                                    type="time"
                                                                    value={editTime}
                                                                    onChange={e => setEditTime(e.target.value)}
                                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/30 transition-all"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 md:col-span-1">
                                                                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Cidade</label>
                                                                <input
                                                                    value={editCity}
                                                                    onChange={e => setEditCity(e.target.value)}
                                                                    placeholder="Ex: São Paulo, SP"
                                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/30 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-4">
                                                        <button onClick={saveProfile} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                                            <Check className="w-3 h-3" /> Confirmar
                                                        </button>
                                                        <button onClick={() => setEditMode(false)} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                                                            <XIcon className="w-3 h-3" /> Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center md:text-left h-full flex flex-col justify-center">
                                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                                        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
                                                            {displayName}
                                                        </h1>
                                                        <button onClick={enterEditMode} className="p-2 rounded-xl text-slate-700 hover:text-cyan-400 hover:bg-white/5 transition-all" title="Editar Perfil">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-cyan-500/60 tracking-[0.4em] uppercase mt-2">{profileTitle}</p>
                                                    
                                                    <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-6">
                                                        {(birthDate || birthTime || birthCity) && (
                                                            <div className="space-y-2">
                                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">Astrometria Natal</p>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {birthDate && <span className="text-[11px] font-mono text-slate-400 transition-colors hover:text-cyan-400">📅 {new Date(birthDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                                                                    {birthTime && <span className="text-[11px] font-mono text-slate-400 transition-colors hover:text-cyan-400">🕐 {birthTime}</span>}
                                                                    {birthCity && <span className="text-[11px] font-mono text-slate-400 transition-colors hover:text-cyan-400">📍 {birthCity}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="w-px h-10 bg-white/5 hidden md:block" />
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-center">
                                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">XP ACUMULADO</p>
                                                                <p className="text-lg font-black text-slate-200 tracking-tighter">{stacks.reduce((a, s) => a + s.current_xp, 0)}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">TECNOLOGIAS</p>
                                                                <p className="text-lg font-black text-slate-200 tracking-tighter">{stacks.length}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm flex flex-col gap-4 shrink-0">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                                <p className="text-[9px] font-bold text-cyan-400/60 uppercase tracking-widest mb-1">INTEGRIDADE DA IDENTIDADE</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="w-[98%] h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-cyan-400">98%</span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                                <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">SINCRONIA TEMPORAL</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="w-[85%] h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-blue-400">85%</span>
                                                </div>
                                            </div>
                                         </div>

                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                     <UserCircle2 className="w-3 h-3 text-cyan-500" /> RESUMO BIOGRÁFICO
                                                 </p>
                                                 <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                     Especialista em Engenharia de Software com foco em ecossistemas React, Node.js e automação de processos via IA. Arquiteto do RonnyZim OS, focado em alta performance e interfaces de densidade profissional.
                                                 </p>
                                             </div>
                                             <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                     <Award className="w-3 h-3 text-amber-500" /> HISTÓRICO OPERACIONAL
                                                 </p>
                                                 <div className="space-y-3">
                                                     <div>
                                                         <div className="flex justify-between items-center mb-1">
                                                             <span className="text-[10px] font-bold text-slate-300">TECH LEAD @ CYBERCORP</span>
                                                             <span className="text-[9px] font-mono text-slate-500">2024 — PRESENTE</span>
                                                         </div>
                                                         <p className="text-[10px] text-slate-500">Arquitetura de microsserviços e liderança técnica de times ágeis.</p>
                                                     </div>
                                                     <div className="pt-2 border-t border-white/5">
                                                         <div className="flex justify-between items-center mb-1">
                                                             <span className="text-[10px] font-bold text-slate-300">SR. FRONTEND @ NEONET</span>
                                                             <span className="text-[9px] font-mono text-slate-500">2021 — 2023</span>
                                                         </div>
                                                         <p className="text-[10px] text-slate-500">Desenvolvimento de interfaces complexas com Next.js e WebGL.</p>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'MAESTRIA' && (
                                <div className="h-full flex flex-col gap-6 py-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <Cpu className="w-5 h-5 text-cyan-400" />
                                            <h2 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">Matriz de Habilidades</h2>
                                        </div>
                                        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                                                    viewMode === 'list' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-slate-600 hover:text-slate-400'
                                                }`}
                                            >
                                                <LayoutList className="w-3 h-3" /> LISTA
                                            </button>
                                            <button
                                                onClick={() => setViewMode('neural')}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                                                    viewMode === 'neural' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-600 hover:text-slate-400'
                                                }`}
                                            >
                                                <Network className="w-3 h-3" /> NEURAL
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        {viewMode === 'list' ? (
                                            stacks.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] text-slate-600">
                                                    Nenhum DNA técnico registrado.
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                                        {stacks.slice(maestriaPage * stacksPerPage, (maestriaPage + 1) * stacksPerPage).map((stack) => {
                                                            const brandColor = ColorMap[stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'];
                                                            const nextLevelXp = stack.current_level * 100;
                                                            const progressPercent = Math.min(100, (stack.current_xp / nextLevelXp) * 100);

                                                            return (
                                                                <div key={stack.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all group">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
                                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor, boxShadow: `0 0 10px ${brandColor}` }} />
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black text-[11px] tracking-widest uppercase block">{stack.global_stacks.name}</span>
                                                                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">{stack.global_stacks.category}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="text-[10px] font-black text-cyan-400 font-mono">NVL {stack.current_level}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${progressPercent}%` }}
                                                                            className="absolute top-0 left-0 h-full rounded-full"
                                                                            style={{ backgroundColor: brandColor }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-between mt-3">
                                                                        <span className="text-[8px] text-slate-600 font-mono uppercase">XP: {stack.current_xp}</span>
                                                                        <span className="text-[8px] text-slate-600 font-mono uppercase">NEXT: {nextLevelXp}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {stacks.length > stacksPerPage && (
                                                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                                            <button 
                                                                onClick={() => setMaestriaPage(p => Math.max(0, p - 1))}
                                                                disabled={maestriaPage === 0}
                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${maestriaPage === 0 ? 'text-zinc-800' : 'text-cyan-500 hover:bg-cyan-500/10'}`}
                                                            >
                                                                Anterior
                                                            </button>
                                                            <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                                                                Página {maestriaPage + 1} de {Math.ceil(stacks.length / stacksPerPage)}
                                                            </span>
                                                            <button 
                                                                onClick={() => setMaestriaPage(p => Math.min(Math.ceil(stacks.length / stacksPerPage) - 1, p + 1))}
                                                                disabled={maestriaPage >= Math.ceil(stacks.length / stacksPerPage) - 1}
                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${maestriaPage >= Math.ceil(stacks.length / stacksPerPage) - 1 ? 'text-zinc-800' : 'text-cyan-500 hover:bg-cyan-500/10'}`}
                                                            >
                                                                Próxima
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-full min-h-[400px]">
                                                <NeuralGraph
                                                    stacks={stacks as any}
                                                    quests={quests as any}
                                                    userName={displayName}
                                                    totalLevel={stacks.reduce((a, s) => a + s.current_level, 0)}
                                                    userId={userId}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'AURA' && (
                                <div className="h-full flex flex-col gap-8 py-4 items-center justify-center">
                                    <div className="w-full max-w-2xl bg-white/[0.01] border border-white/5 rounded-[3rem] p-12 backdrop-blur-xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                                        
                                        <div className="text-center mb-8 relative z-10">
                                            <h2 className="text-xs font-black tracking-[0.4em] text-cyan-500 uppercase mb-2 flex items-center justify-center gap-3">
                                                <Crosshair className="w-4 h-4" /> AURA DO PERFIL OPERACIONAL
                                            </h2>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Análise de Geometria Técnica Baseada em Stacks Mestre</p>
                                        </div>

                                        <div className="w-full h-[350px] relative z-10">
                                            {stacks.length > 2 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                                        <PolarGrid stroke="#ffffff08" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'Inter', fontWeight: 900 }} />
                                                        <Radar name="Habilidades" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                                                            itemStyle={{ color: '#06b6d4' }}
                                                        />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] text-center px-12 uppercase tracking-widest italic">
                                                    <Crosshair className="w-12 h-12 mb-4 opacity-10" />
                                                    Protocolo Genesis Incompleto. Mínimo de 3 tecnologias necessárias para projetar a Aura.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'JORNADA' && (
                                <div className="h-full flex flex-col gap-6 py-4 px-2">
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                                             <BiorhythmWidget userId={userId} />
                                        </div>

                                        <div className="pt-2 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <Award className="w-5 h-5 text-amber-500" />
                                                    <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">Log de Missões Diárias</h3>
                                                </div>
                                                
                                                {quests.length > questsPerPage && (
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                                                            Página {jornadaPage + 1} de {Math.ceil(quests.length / questsPerPage)}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <button 
                                                                onClick={() => setJornadaPage(p => Math.max(0, p - 1))}
                                                                disabled={jornadaPage === 0}
                                                                className={`p-2 rounded-lg transition-all ${jornadaPage === 0 ? 'text-zinc-800' : 'text-amber-500 hover:bg-amber-500/10'}`}
                                                            >
                                                                <LayoutList className="w-3 h-3 rotate-180" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setJornadaPage(p => Math.min(Math.ceil(quests.length / questsPerPage) - 1, p + 1))}
                                                                disabled={jornadaPage >= Math.ceil(quests.length / questsPerPage) - 1}
                                                                className={`p-2 rounded-lg transition-all ${jornadaPage >= Math.ceil(quests.length / questsPerPage) - 1 ? 'text-zinc-800' : 'text-amber-500 hover:bg-amber-500/10'}`}
                                                            >
                                                                <LayoutList className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <QuestGrid 
                                                userId={userId}
                                                quests={quests.slice(jornadaPage * questsPerPage, (jornadaPage + 1) * questsPerPage)}
                                                onCompleteQuest={handleCompleteQuest}
                                                onSelectQuest={setSelectedQuest}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
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
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-cyan-400 font-black text-2xl drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] absolute whitespace-nowrap italic"
                        >
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
