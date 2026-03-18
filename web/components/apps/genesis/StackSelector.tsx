"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import {
    TerminalSquare,
    Code2,
    Database,
    Layers,
    Figma,
    Cloud,
    Cpu,
    MonitorPlay,
    Component
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface GlobalStack {
    id: string;
    name: string;
    category: string;
    icon_slug: string;
}

interface StackSelectorProps {
    selectedStacks: string[]; // Passar IDs
    onChange: (stacks: string[]) => void;
    disabled?: boolean;
}

// Mapa seguro de ícones baseado em slugs
const IconMap: Record<string, React.ReactNode> = {
    react: <Component className="w-6 h-6" />,
    nextjs: <MonitorPlay className="w-6 h-6" />,
    tailwind: <Layers className="w-6 h-6" />,
    nodejs: <TerminalSquare className="w-6 h-6" />,
    python: <Code2 className="w-6 h-6" />,
    typescript: <Code2 className="w-6 h-6" />,
    database: <Database className="w-6 h-6" />,
    sql: <Database className="w-6 h-6" />,
    docker: <Layers className="w-6 h-6" />,
    aws: <Cloud className="w-6 h-6" />,
    figma: <Figma className="w-6 h-6" />,
    default: <Cpu className="w-6 h-6" />
};

// Mapa de cores oficiais das ferramentas para UI Pro Max
export const ColorMap: Record<string, string> = {
    react: '#61DAFB',
    nextjs: '#FFFFFF',
    'tailwind': '#14b8a6', // teal-500
    nodejs: '#339933',
    python: '#3776AB',
    typescript: '#3178C6',
    database: '#336791',
    sql: '#F29111',
    docker: '#2496ED',
    aws: '#FF9900',
    figma: '#F24E1E',
    default: '#22c55e' // Neon Green OS Theme
};

export default function StackSelector({ selectedStacks, onChange, disabled }: StackSelectorProps) {
    const [stacks, setStacks] = useState<GlobalStack[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStacks() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('global_stacks')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error("Erro ao buscar stacks:", error);
            } else if (data) {
                setStacks(data);
            }
            setLoading(false);
        }

        fetchStacks();
    }, []);

    const toggleStack = (id: string) => {
        if (disabled) return;

        if (selectedStacks.includes(id)) {
            onChange(selectedStacks.filter(s => s !== id));
        } else {
            onChange([...selectedStacks, id]);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center p-8 border border-white/5 bg-[#0a0f0a]/50 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-500/50">
                    <div className="w-4 h-4 border-2 border-currentColor rounded-full border-t-transparent animate-spin"></div>
                    <span className="text-sm font-mono tracking-widest uppercase">Decodificando Tecnologias...</span>
                </div>
            </div>
        );
    }

    // Fallback se n tiver
    if (stacks.length === 0) {
        return <div className="text-slate-500 text-sm italic">Nenhuma Stack listada na matriz de infraestrutura. Execute a migração SQL.</div>
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {stacks.map((stack) => {
                const isSelected = selectedStacks.includes(stack.id);
                const slug = stack.icon_slug.toLowerCase();
                const icon = IconMap[slug] || IconMap['default'];
                const brandColor = ColorMap[slug] || ColorMap['default'];

                return (
                    <motion.button
                        key={stack.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleStack(stack.id)}
                        whileHover={{ scale: disabled ? 1 : 1.05 }}
                        whileTap={{ scale: disabled ? 1 : 0.95 }}
                        className={`
                            relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-300 overflow-hidden
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            ${!isSelected && 'border-white/10 bg-black/40 text-slate-400 hover:text-white'}
                        `}
                        // Aplicação do UI/UX Pro Max: Uso dinâmico de Brand Colors via Inline Styles 
                        // para evitar injeção falha do compilador do Tailwind
                        style={isSelected ? {
                            borderColor: brandColor,
                            backgroundColor: `${brandColor}1A`, // 10% opacity hex
                            color: brandColor,
                            boxShadow: `0 0 12px ${brandColor}33` // 20% opacity hex
                        } : {}}
                    >
                        {/* Efeito Glow Interno quando Selecionado */}
                        {isSelected && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: `linear-gradient(to top, ${brandColor}20, transparent)` }}
                            />
                        )}

                        <div className="relative z-10 transition-transform duration-300">
                            {icon}
                        </div>

                        <span className="relative z-10 text-[10px] font-bold tracking-widest uppercase text-center mt-1">
                            {stack.name}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}
