"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import StackSelector from './StackSelector';
import {
    Fingerprint,
    MapPin,
    TerminalSquare,
    UserCircle2,
    Clock,
    Globe2,
    Cpu,
    Briefcase,
    CheckCircle2,
    Database
} from 'lucide-react';

interface GenesisMonolithProps {
    onComplete: () => void;
    userId: string;
}

export default function GenesisMonolith({ onComplete, userId }: GenesisMonolithProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successToast, setSuccessToast] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        birthDateTime: '',
        birthCity: '',
        currentLocation: '',
        mainStacks: [] as string[],
        seniority: 'Pleno'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Derivar date/time separados do birthDateTime (datetime-local format: "YYYY-MM-DDTHH:mm")
        const [birthDatePart, birthTimePart] = (formData.birthDateTime || '').split('T');

        // Preparar payload massivo de facts para o Supabase
        const factsToInsert = [
            {
                user_id: userId,
                category: 'core_identity',
                property_key: 'full_name',
                value: formData.fullName,
            },
            // display_name mirrors full_name for IdentityMatrix
            {
                user_id: userId,
                category: 'core_identity',
                property_key: 'display_name',
                value: formData.fullName,
            },
            // Structured natal data for AstroDash
            {
                user_id: userId,
                category: 'astrology',
                property_key: 'birth_date',
                value: birthDatePart || '',
            },
            {
                user_id: userId,
                category: 'astrology',
                property_key: 'birth_time',
                value: birthTimePart || '',
            },
            {
                user_id: userId,
                category: 'astrology',
                property_key: 'birth_city',
                value: formData.birthCity,
            },
            // Human-readable blob for AI context (kept for backward compat)
            {
                user_id: userId,
                category: 'astrology',
                property_key: 'birth_data',
                value: `Nascido em ${formData.birthDateTime} na cidade de ${formData.birthCity}`,
            },
            {
                user_id: userId,
                category: 'logistics',
                property_key: 'current_location',
                value: formData.currentLocation,
            },
            {
                user_id: userId,
                category: 'career',
                property_key: 'seniority',
                value: formData.seniority,
            },
            // Marcador primordial que prova que a calibração ocorreu (fallback pra DesktopShell)
            {
                user_id: userId,
                category: 'system_calibration',
                property_key: 'system_calibration_answer',
                value: 'completed',
            }
        ];

        const supabase = createClient();

        // Injeção de Dados em Massa (usando upsert para evitar Violação Unique Key: user_id_property_key_key)
        const { error } = await supabase.from('user_facts').upsert(
            factsToInsert,
            { onConflict: 'user_id,property_key' }
        );

        if (error) {
            console.error("Erro na Calibração de Facts LOG DETALHADO:", error?.message, error?.details, error?.hint, error?.code);
            console.error(error);
            setIsSubmitting(false);
            return;
        }

        // 2) Insere as Stacks Individuais no RPG Mastery (Level 1, XP 0)
        if (formData.mainStacks.length > 0) {
            const stacksToInsert = formData.mainStacks.map(stackId => ({
                user_id: userId,
                stack_id: stackId,
                current_xp: 0,
                current_level: 1,
                is_active: true
            }));

            const { error: stacksError } = await supabase
                .from('user_stack_mastery')
                .upsert(stacksToInsert, { onConflict: 'user_id,stack_id' });

            if (stacksError) {
                console.error("Erro na Injeção de Stacks (RPG):", stacksError);
            }
        }

        // Exibir Toast Sucesso Transe MS
        setSuccessToast(true);

        // Simulando calibração pesada da consciencia dos 15 agentes
        setTimeout(() => {
            onComplete();
        }, 3500);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[150px] opacity-10 pointer-events-none bg-green-500" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-5 pointer-events-none bg-blue-500" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl w-full z-10 relative"
            >
                <div className="absolute -top-12 left-0 text-green-500/20 font-mono text-8xl font-black opacity-20 pointer-events-none select-none">DNA</div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                        <Database className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">Configuração da Matriz de Identidade</h1>
                        <p className="text-xs font-mono tracking-widest text-green-500/70 uppercase mt-1">Protocolo Genesis • Single-Shot Data Injection</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Sec. 1: Bio-Data */}
                        <div className="col-span-1 md:col-span-1 border border-white/5 bg-[#0a0f0a]/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><Fingerprint className="w-24 h-24" /></div>
                            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-4">
                                <UserCircle2 className="w-4 h-4 text-green-400" /> Dados Biológicos
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Nome Completo</label>
                                    <input required type="text" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} disabled={isSubmitting} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-sm" placeholder="Ronaldo..." />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3 text-green-400" /> Data Natal</label>
                                        <input required type="date" value={(formData.birthDateTime || '').split('T')[0]} onChange={(e) => handleInputChange('birthDateTime', `${e.target.value}T${(formData.birthDateTime || '').split('T')[1] || '00:00'}`)} disabled={isSubmitting} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3 text-teal-400" /> Hora Natal</label>
                                        <input type="time" value={(formData.birthDateTime || '').split('T')[1] || ''} onChange={(e) => handleInputChange('birthDateTime', `${(formData.birthDateTime || '').split('T')[0]}T${e.target.value}`)} disabled={isSubmitting} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-sm" placeholder="Ex: 14:30" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 flex items-center gap-1"><Globe2 className="w-3 h-3 text-teal-400" /> Cidade Natal</label>
                                    <input required type="text" value={formData.birthCity} onChange={(e) => handleInputChange('birthCity', e.target.value)} disabled={isSubmitting} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-sm" placeholder="Ex: São Paulo, SP, Brasil" />
                                </div>
                            </div>

                        </div>

                        {/* Sec. 2 & 3: Logistics + Tech Profile */}
                        <div className="col-span-1 md:col-span-2 space-y-4">

                            {/* Sec. 2: Logistics */}
                            <div className="border border-white/5 bg-[#0a0f0a]/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><MapPin className="w-24 h-24" /></div>
                                <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-4">
                                    <MapPin className="w-4 h-4 text-blue-400" /> Logística Pessoal (Alvo p/ HunterZim)
                                </h2>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Localização Atual</label>
                                    <input required type="text" value={formData.currentLocation} onChange={(e) => handleInputChange('currentLocation', e.target.value)} disabled={isSubmitting} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm" placeholder="Sua cidade atual e limitações de deslocamento..." />
                                </div>
                            </div>

                            {/* Sec. 3: Tech Profile */}
                            <div className="border border-white/5 bg-[#0a0f0a]/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><Cpu className="w-24 h-24" /></div>
                                <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-4">
                                    <TerminalSquare className="w-4 h-4 text-amber-400" /> Perfil Técnico
                                </h2>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Main Stacks (Mastery RPG)</label>
                                    <div className="w-full">
                                        <StackSelector
                                            selectedStacks={formData.mainStacks}
                                            onChange={(stacks) => handleInputChange('mainStacks', stacks as any)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 mt-3">
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3 text-amber-400" /> Senioridade Atual</label>
                                    <select
                                        value={formData.seniority}
                                        onChange={(e) => handleInputChange('seniority', e.target.value)}
                                        disabled={isSubmitting}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm appearance-none"
                                    >
                                        <option value="Junior">Junior</option>
                                        <option value="Pleno">Pleno</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Tech Lead">Tech Lead</option>
                                        <option value="Staff/Principal">Staff / Principal / Arquitetura</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || successToast}
                            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-black font-bold uppercase tracking-widest text-sm rounded-xl border border-green-500/50 hover:border-transparent transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500/10 disabled:hover:text-green-400 disabled:hover:border-green-500/50"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-currentColor rounded-full border-t-transparent animate-spin"></div>
                                    INJETANDO DADOS...
                                </span>
                            ) : (
                                <>
                                    SALVAR MATRIZ NO CÓRTEX
                                    <div className="absolute inset-0 h-full w-full bg-green-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Global Toast for Success Action */}
            <AnimatePresence>
                {successToast && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#0a0f0a]/90 backdrop-blur-xl border border-green-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.2)] flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-green-400 font-bold text-lg leading-tight">Matriz de DNA Salva</h3>
                            <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Calibrando a consciência de 15 agentes...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
