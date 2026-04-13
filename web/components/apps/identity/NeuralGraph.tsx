"use client";

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Node,
    Edge,
    BackgroundVariant,
    NodeProps,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createClient } from '@/lib/supabase/browser';
import { ColorMap } from '../genesis/StackSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, Award, CheckCircle2, Sparkles, AlertTriangle, Focus } from 'lucide-react';
import {
    type AstralState,
    type AstralResonance,
    getAstralResonanceForStack,
    getAstralLabel,
} from '@/lib/astral';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStack {
    id: string;
    global_stacks: { name: string; category: string; icon_slug: string };
    current_xp: number;
    current_level: number;
}

interface DailyQuest {
    id: string;
    title: string;
    xp_reward: number;
    target_stack: string;
    status: string;
    completed: boolean;
}

interface NeuralGraphProps {
    stacks: UserStack[];
    quests: DailyQuest[];
    userName: string;
    totalLevel: number;
    userId: string;
}

interface SelectedSkill {
    stack: UserStack;
    relatedQuests: DailyQuest[];
    resonance: AstralResonance;
    resonanceLabel: { 
        label: string; 
        sublabel: string; 
        multiplier?: number;
    } | null;
}

// ─── CSS Keyframes (injected once) ───────────────────────────────────────────

const ASTRAL_STYLES = `
@keyframes moonPulse {
    0%   { box-shadow: 0 0 8px #f59e0b44, 0 0 20px #f59e0b22; }
    50%  { box-shadow: 0 0 24px #f59e0baa, 0 0 48px #f59e0b44; }
    100% { box-shadow: 0 0 8px #f59e0b44, 0 0 20px #f59e0b22; }
}
@keyframes mercuryGlitch {
    0%   { border-color: currentColor; }
    10%  { border-color: #ef444488; }
    12%  { border-color: transparent; }
    14%  { border-color: #ef444488; }
    20%  { border-color: currentColor; }
    80%  { border-color: currentColor; }
    82%  { border-color: transparent; }
    84%  { border-color: #ef444488; }
    86%  { border-color: currentColor; }
    100% { border-color: currentColor; }
}
`;

// ─── Custom Node: Central Core ────────────────────────────────────────────────

function CoreNode({ data }: NodeProps) {
    return (
        <div
            style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, #1a2f1a, #050505)',
                border: '2px solid #22c55e',
                boxShadow: '0 0 40px #22c55e66, 0 0 80px #22c55e22, inset 0 0 20px #22c55e11',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
            }}
        >
            <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>Core OS</span>
            <span style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', padding: '0 6px' }}>
                {(data as any).label}
            </span>
            <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'monospace', fontWeight: 800 }}>
                LVL {(data as any).totalLevel}
            </span>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
}

// ─── Custom Node: Skill ───────────────────────────────────────────────────────

function SkillNode({ data }: NodeProps) {
    const d = data as any;
    const size = Math.max(70, Math.min(130, 70 + d.level * 12));
    const glowIntensity = Math.max(15, Math.min(60, 15 + d.xp / 10));
    const glowSize = Math.max(8, Math.min(30, 8 + d.level * 4));
    const astralBuff: AstralResonance = d.astralBuff;

    const baseBoxShadow = `0 0 ${glowSize}px ${d.color}${Math.floor(glowIntensity).toString(16).padStart(2, '0')}, 0 0 ${glowSize * 2}px ${d.color}18`;
    const baseBorder = `1.5px solid ${d.color}${Math.floor(glowIntensity * 1.5).toString(16).padStart(2, '0')}`;

    // Astral visual overrides
    const animation =
        astralBuff === 'buff'    ? 'moonPulse 2.5s ease-in-out infinite'  :
        astralBuff === 'debuff'  ? 'mercuryGlitch 3s linear infinite'      :
        undefined;

    const borderOverride =
        astralBuff === 'buff'   ? `1.5px solid #f59e0b` :
        astralBuff === 'debuff' ? `1.5px solid ${d.color}` : // glitch handles color via keyframe
        baseBorder;

    return (
        <div
            onClick={d.onSelect}
            style={{
                width: size,
                height: size,
                borderRadius: '16px',
                background: `radial-gradient(circle at 35% 35%, ${d.color}18, #050505)`,
                border: borderOverride,
                boxShadow: astralBuff === 'buff' ? '' : baseBoxShadow,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                animation,
                position: 'relative',
            }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

            {/* Astral indicator badge */}
            {astralBuff && (
                <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    fontSize: 10,
                    lineHeight: 1,
                    background: astralBuff === 'buff' ? '#f59e0b' : '#ef4444',
                    borderRadius: '50%',
                    width: 14,
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: astralBuff === 'buff' ? '0 0 8px #f59e0b88' : '0 0 8px #ef444488',
                }}>
                    {astralBuff === 'buff' ? '✦' : '⚡'}
                </div>
            )}

            <div style={{
                position: 'relative',
                width: size * 0.5,
                height: size * 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
            }}>
                <div 
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: astralBuff === 'buff' ? '#f59e0b' : d.color,
                        boxShadow: `0 0 ${glowSize}px ${astralBuff === 'buff' ? '#f59e0b' : d.color}, 0 0 ${glowSize * 2}px ${astralBuff === 'buff' ? '#f59e0b88' : d.color + '88'}`,
                    }}
                />
                <div style={{
                    position: 'absolute',
                    inset: -10,
                    background: `radial-gradient(circle, ${astralBuff === 'buff' ? '#f59e0b1a' : d.color + '1a'}, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
            </div>
            <span style={{ fontSize: 9, color: astralBuff === 'buff' ? '#f59e0b' : d.color, fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', padding: '0 6px' }}>
                {d.label}
            </span>
            <span style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace' }}>
                NV. {d.level}
            </span>
        </div>
    );
}

const nodeTypes = { core: CoreNode, skill: SkillNode };

// ─── Main Graph ───────────────────────────────────────────────────────────────

function NeuralGraphInner({ stacks, quests, userName, totalLevel, userId }: NeuralGraphProps) {
    const [selectedSkill, setSelectedSkill] = useState<SelectedSkill | null>(null);
    const [astralState, setAstralState] = useState<AstralState>({ 
        moonSign: null, 
        mercuryRetrograde: false,
        technicalFocus: null
    });

    // Fetch astral state from user_facts
    useEffect(() => {
        if (!userId) return;
        const fetchAstral = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('user_facts')
                .select('property_key, value')
                .eq('user_id', userId)
                .in('property_key', ['moon_sign', 'mercury_retrograde', 'astro_technical_focus']);

            if (data) {
                const map: Record<string, string> = {};
                data.forEach((f: any) => { map[f.property_key] = f.value; });
                
                let technicalFocus = null;
                if (map.astro_technical_focus) {
                    try {
                        technicalFocus = JSON.parse(map.astro_technical_focus);
                    } catch (e) {
                        console.error('Failed to parse astro_technical_focus', e);
                    }
                }

                setAstralState({
                    moonSign: map.moon_sign ?? null,
                    mercuryRetrograde: map.mercury_retrograde === 'true',
                    technicalFocus
                });
            }
        };
        fetchAstral();
    }, [userId]);

    const buildGraph = useCallback(() => {
        const centerX = 400;
        const centerY = 300;
        const radius = Math.min(centerX, centerY) * 0.7; // Dinâmico para caber melhor

        const coreNode: Node = {
            id: 'core',
            type: 'core',
            position: { x: centerX - 60, y: centerY - 60 },
            data: { label: userName, totalLevel },
            draggable: true,
        };

        const skillNodes: Node[] = stacks.map((stack, i) => {
            const angle = (2 * Math.PI * i) / stacks.length - Math.PI / 2;
            const nodeSize = Math.max(70, Math.min(130, 70 + stack.current_level * 12));
            const brandColor = ColorMap[stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'];
            
            const { resonance, multiplier } = getAstralResonanceForStack(
                stack.global_stacks.icon_slug,
                astralState
            );

            return {
                id: stack.id,
                type: 'skill',
                position: {
                    x: centerX + radius * Math.cos(angle) - nodeSize / 2,
                    y: centerY + radius * Math.sin(angle) - nodeSize / 2,
                },
                data: {
                    label: stack.global_stacks.name,
                    level: stack.current_level,
                    xp: stack.current_xp,
                    color: brandColor,
                    iconSlug: stack.global_stacks.icon_slug.toLowerCase(),
                    astralBuff: resonance,
                    multiplier,
                    onSelect: () => {
                        const relatedQuests = quests.filter(q =>
                            q.target_stack.toLowerCase() === stack.global_stacks.name.toLowerCase() && q.completed
                        );
                        const astralInfo = getAstralLabel(
                            stack.global_stacks.icon_slug,
                            astralState
                        );
                        setSelectedSkill({
                            stack,
                            relatedQuests,
                            resonance,
                            resonanceLabel: astralInfo ? { 
                                label: astralInfo.label, 
                                sublabel: astralInfo.sublabel,
                                multiplier
                            } : null,
                        });
                    },
                },
                draggable: true,
            };
        });

        const edges: Edge[] = stacks.map((stack) => {
            const brandColor = ColorMap[stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'];
            return {
                id: `core-${stack.id}`,
                source: 'core',
                target: stack.id,
                animated: true,
                style: {
                    stroke: brandColor,
                    strokeWidth: 1.5,
                    opacity: 0.7,
                },
            };
        });

        return { nodes: [coreNode, ...skillNodes], edges };
    }, [stacks, quests, userName, totalLevel, astralState]);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraph(), [buildGraph]);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync nodes/edges when initialNodes change (after astral fetch)
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const getNextLevelXp = (level: number) => level * 100;

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5">
            {/* Inject CSS keyframes */}
            <style>{ASTRAL_STYLES}</style>

            {/* Astral Status Bar */}
            {(astralState.moonSign || astralState.mercuryRetrograde || astralState.technicalFocus) && (
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 max-w-[80%]">
                    {astralState.technicalFocus && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono leading-none">
                            <Focus className="w-3 h-3" />
                            Foco Técnico Ativo
                        </div>
                    )}
                    {astralState.moonSign && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono leading-none">
                            <Sparkles className="w-3 h-3" />
                            Lua em {astralState.moonSign}
                        </div>
                    )}
                    {astralState.mercuryRetrograde && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono leading-none">
                            <AlertTriangle className="w-3 h-3" />
                            Mercúrio ℞
                        </div>
                    )}
                </div>
            )}

            {/* React Flow */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#1a1a1a"
                />
                <Controls
                    className="!bg-black/60 !border-white/10 !rounded-xl overflow-hidden"
                    showInteractive={false}
                />
            </ReactFlow>

            {/* Side Panel */}
            <AnimatePresence>
                {selectedSkill && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-4 right-4 w-64 bg-[#070707]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 z-10 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                        backgroundColor: ColorMap[selectedSkill.stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'],
                                        boxShadow: `0 0 8px ${ColorMap[selectedSkill.stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default']}`,
                                    }}
                                />
                                <span className="text-sm font-bold text-white">{selectedSkill.stack.global_stacks.name}</span>
                            </div>
                            <button onClick={() => setSelectedSkill(null)} className="text-slate-600 hover:text-slate-300 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Astral Resonance Badge */}
                        {selectedSkill.resonanceLabel && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-3 p-2.5 rounded-xl border flex flex-col gap-0.5 ${
                                    selectedSkill.resonance === 'buff'
                                        ? 'bg-amber-500/10 border-amber-500/30'
                                        : 'bg-red-500/10 border-red-500/30'
                                }`}
                            >
                                <span className={`text-xs font-bold font-mono ${
                                    selectedSkill.resonance === 'buff' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    {selectedSkill.resonanceLabel.label}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {selectedSkill.resonanceLabel.sublabel}
                                </span>
                            </motion.div>
                        )}

                        {/* XP Stats */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-400" /> XP Atual
                                </span>
                                <span className="text-xs font-mono text-amber-400 font-bold">{selectedSkill.stack.current_xp}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-green-400" /> Próximo Nível
                                </span>
                                <span className="text-xs font-mono text-green-400 font-bold">
                                    {getNextLevelXp(selectedSkill.stack.current_level)} XP
                                    {selectedSkill.resonanceLabel && selectedSkill.resonanceLabel.multiplier !== undefined && selectedSkill.resonanceLabel.multiplier !== 1 && (
                                        <span className={`ml-1 ${(selectedSkill.resonanceLabel.multiplier ?? 0) > 1 ? 'text-amber-400' : 'text-red-400'}`}>
                                            ×{selectedSkill.resonanceLabel.multiplier}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                                    <Award className="w-3 h-3 text-blue-400" /> Nível Atual
                                </span>
                                <span className="text-xs font-mono text-blue-400 font-bold">{selectedSkill.stack.current_level}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2">
                                <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min(100, (selectedSkill.stack.current_xp / getNextLevelXp(selectedSkill.stack.current_level)) * 100)}%`,
                                            backgroundColor: selectedSkill.resonance === 'buff'
                                                ? '#f59e0b'
                                                : ColorMap[selectedSkill.stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'],
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-600 font-mono mt-1 block text-right">
                                    {Math.min(100, Math.round((selectedSkill.stack.current_xp / getNextLevelXp(selectedSkill.stack.current_level)) * 100))}%
                                </span>
                            </div>
                        </div>

                        {/* Quests concluídas relacionadas */}
                        {selectedSkill.relatedQuests.length > 0 && (
                            <div>
                                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">Missões Concluídas</p>
                                <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                                    {selectedSkill.relatedQuests.map(q => (
                                        <div key={q.id} className="flex items-start gap-2 text-xs text-slate-400">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                            <span className="leading-snug">{q.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedSkill.relatedQuests.length === 0 && (
                            <p className="text-[10px] text-slate-600 font-mono text-center py-1">Nenhuma missão concluída ainda.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Exported Component (com Provider) ────────────────────────────────────────

export default function NeuralGraph(props: NeuralGraphProps) {
    if (props.stacks.length === 0) {
        return (
            <div className="w-full h-[400px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-green-500/30" />
                </div>
                <p className="text-sm font-mono">Nenhuma stack no DNA técnico.</p>
                <p className="text-xs text-slate-600 mt-1">Complete o Genesis Monolith primeiro.</p>
            </div>
        );
    }

    return (
        <ReactFlowProvider>
            <NeuralGraphInner {...props} />
        </ReactFlowProvider>
    );
}
