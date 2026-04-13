"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    TrendingUp, 
    Flame, 
    Activity, 
    Code, 
    Database, 
    Palette, 
    Sparkles, 
    Star 
} from 'lucide-react';
import { useBiorhythm } from '@/hooks/useBiorhythm';

interface DailyQuest {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    target_stack: string;
    status: string;
    completed: boolean;
}

interface QuestGridProps {
    userId: string;
    quests: DailyQuest[];
    onCompleteQuest: (questId: string, xpReward: number, stackName: string) => void;
    onSelectQuest: (quest: DailyQuest) => void;
}

const getStackIcon = (stackName: string) => {
    const name = stackName.toLowerCase();
    if (name.includes('react') || name.includes('next') || name.includes('ts') || name.includes('js')) {
        return <Code className="w-4 h-4 text-blue-400" />;
    }
    if (name.includes('node') || name.includes('python') || name.includes('sql') || name.includes('db')) {
        return <Database className="w-4 h-4 text-green-400" />;
    }
    if (name.includes('tailwind') || name.includes('figma') || name.includes('ui') || name.includes('design')) {
        return <Palette className="w-4 h-4 text-teal-400" />;
    }
    return <Activity className="w-4 h-4 text-amber-400" />;
};

export default function QuestGrid({ userId, quests, onCompleteQuest, onSelectQuest }: QuestGridProps) {
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
    const { recommendedStack } = useBiorhythm(userId);

    const isQuestOptimal = (targetStack: string) => {
        const target = targetStack.toLowerCase();
        return recommendedStack.some(s => target.includes(s.toLowerCase()));
    };

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {quests.map((quest) => {
                    const isRedemption = quest.title.toUpperCase().includes('[REDENÇÃO]') || quest.title.toUpperCase().includes('[REDENCAO]');
                    const isOptimal = !quest.completed && isQuestOptimal(quest.target_stack);

                    return (
                        <motion.div
                            key={quest.id}
                            layout="position"
                            onClick={() => setExpandedQuestId(expandedQuestId === quest.id ? null : quest.id)}
                            initial={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                            animate={
                                isOptimal 
                                ? { boxShadow: ['0px 0px 5px rgba(34,197,94,0.1)', '0px 0px 15px rgba(34,197,94,0.3)', '0px 0px 5px rgba(34,197,94,0.1)'] }
                                : !quest.completed && isRedemption 
                                    ? { boxShadow: ['0px 0px 5px rgba(239,68,68,0.2)', '0px 0px 15px rgba(239,68,68,0.6)', '0px 0px 5px rgba(239,68,68,0.2)'] } 
                                    : { boxShadow: '0px 0px 0px rgba(0,0,0,0)' }
                            }
                            transition={
                                (isOptimal || (!quest.completed && isRedemption)) 
                                ? { 
                                    boxShadow: { duration: 2, repeat: Infinity },
                                    layout: { duration: 0.3 }
                                } 
                                : { duration: 0.3 }
                            }
                            className={`flex flex-col p-4 rounded-xl border cursor-pointer ${
                                quest.completed
                                    ? 'border-green-500/20 bg-green-500/5 opacity-50'
                                    : isOptimal
                                        ? 'border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/30'
                                        : isRedemption
                                            ? 'border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                            : 'border-white/5 bg-[#0a0a0a] hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm flex items-center gap-2 ${quest.completed ? 'line-through text-slate-500' : (isRedemption ? 'text-red-400 font-medium' : 'text-slate-200')}`}>
                                            {isRedemption ? <Flame className="w-4 h-4 text-red-500" /> : getStackIcon(quest.target_stack)}
                                            {quest.title}
                                        </span>
                                        {isOptimal && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">
                                                <Sparkles className="w-3 h-3" />
                                                Optimal Time
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-mono text-amber-500 mt-1 flex items-center gap-1 opacity-80">
                                        <TrendingUp className="w-3 h-3" />
                                        {quest.xp_reward} XP
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-right">
                                    {quest.description && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelectQuest(quest); }}
                                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                                        >
                                            Detalhes
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCompleteQuest(quest.id, quest.xp_reward, quest.target_stack);
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

                            {/* DESCRIÇÃO EXPANDIDA */}
                            <AnimatePresence>
                                {expandedQuestId === quest.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 pt-4 border-t border-white/10 text-slate-400 text-sm whitespace-pre-wrap leading-relaxed overflow-hidden"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 flex-shrink-0">
                                                <Star className={`w-3 h-3 ${isOptimal ? 'text-emerald-400' : 'text-slate-600'}`} />
                                            </div>
                                            <p>{quest.description || "Nenhum detalhe adicional fornecido pela IA."}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
