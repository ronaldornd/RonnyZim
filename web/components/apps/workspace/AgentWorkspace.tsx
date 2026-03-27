"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAgentChat } from '@/lib/hooks/useAgentChat';
import { consumePendingAnalysis } from '@/lib/services/analysis';
import GapCard from '@/components/chat/GapCard';
import QuestGeneratedCard from '@/components/chat/QuestGeneratedCard';
import AnalysisCard from '@/components/chat/AnalysisCard';
import TypewriterText from '@/components/chat/TypewriterText';
import {
    Terminal,
    BrainCircuit,
    Briefcase,
    Library,
    HeartHandshake,
    Sparkles,
    LayoutTemplate,
    Activity,
    Fingerprint,
    Telescope,
    Scale,
    BookOpen,
    Lightbulb,
    ShieldAlert,
    Battery
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';

// Dados dos agentes baseados no Seed do DB
const INTERNAL_AGENTS = [
    { id: 'orchestrator', name: 'Orquestrador Central', role: 'Consciência executiva', icon: BrainCircuit, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'hunterzim', name: 'HunterZim', role: 'Oportunista de carreira', icon: Terminal, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { id: 'career-strategist', name: 'Estrategista de Carreira', role: 'Visionário de longo prazo', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
    { id: 'knowledge-curator', name: 'Curador de Conhecimento', role: 'Filtro intelectual', icon: Library, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'emotional-analyst', name: 'Analista Emocional', role: 'Tradutor de emoções', icon: HeartHandshake, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    { id: 'astro-guide', name: 'Guia Astro-Analítico', role: 'Racionalista místico', icon: Sparkles, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    { id: 'productivity-architect', name: 'Arquiteto de Produtividade', role: 'Construtor prático', icon: LayoutTemplate, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { id: 'pattern-analyst', name: 'Analista de Padrões', role: 'Ironia observacional', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    { id: 'digital-identity-builder', name: 'Construtor de Identidade', role: 'Especialista em branding', icon: Fingerprint, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
    { id: 'long-term-visionary', name: 'Visionário de Longo Prazo', role: 'Pensador profundo', icon: Telescope, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { id: 'coherence-guardian', name: 'Guardião de Coerência', role: 'Auditor clínico', icon: Scale, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
    { id: 'daily-synthesizer', name: 'Sintetizador Diário', role: 'Narrador objetivo', icon: BookOpen, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    { id: 'creative-innovator', name: 'Inovador Criativo', role: 'Inovação caótica', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { id: 'risk-analyst', name: 'Analista de Risco', role: 'Simulador de catástrofes', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { id: 'energy-regulator', name: 'Regulador de Energia', role: 'Fronteira protetora', icon: Battery, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
];

interface AgentWorkspaceProps {
    userId: string;
}

export default function AgentWorkspace({ userId }: AgentWorkspaceProps) {
    const [activeAgentId, setActiveAgentId] = useState<string>('orchestrator');
    const [inputVal, setInputVal] = useState('');
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    const [commandIndex, setCommandIndex] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Inicialização do Hook
    const {
        messages,
        isLoading,
        sendMessage,
        addSystemMessage,
        clearMessages,
        activeLearningContext,
        resolveKnowledgeGap,
        cancelKnowledgeGap
    } = useAgentChat({
        userId: userId,
        agentId: activeAgentId,
        onAgentSwitch: (newAgentId) => {
            const newAgent = INTERNAL_AGENTS.find(a => a.id === newAgentId);
            if (newAgent) {
                setActiveAgentId(newAgent.id);
                addSystemMessage(`🔄 **[Router Semântico]** Roteando contexto e entregando sessão para **${newAgent.name}**...`);
            }
        }
    });

    const activeAgent = INTERNAL_AGENTS.find(a => a.id === activeAgentId) || INTERNAL_AGENTS[0];

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // Intent Consumer Hook
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleIntent = () => {
            const intent = consumePendingAnalysis();
            if (intent) {
                // Há uma intenção pendente de outro aplicativo (ex: Data Vault clicou "Analisar Arquivo")
                setActiveAgentId(intent.agentId);
                setTimeout(() => {
                    addSystemMessage(`🔌 **CONEXÃO DE SISTEMA ESTABELECIDA**\n\nRecebi o arquivo **${intent.fileName}** do Cofre.\nIniciando extração de dados e protocolo de análise nativa...`);

                    // Dispara a análise no backend
                    fetch('/api/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(intent)
                    })
                        .then(async (res) => {
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Falha no Endpoint');
                            // Injeta o card na tela
                            addSystemMessage('', 'analysis', data);
                        })
                        .catch(err => {
                            console.error('Erro na Bridge do Analisador:', err);
                            addSystemMessage(`❌ **FALHA DE CONEXÃO**\n\nNão foi possível concluir a análise do documento.\n\nDetalhes: ${err.message}`);
                        });

                }, 800);
            }
        };

        // Roda ao montar (caso de reload)
        handleIntent();

        // Escuta ativamente eventos de outros componentes enquanto 'hidden' no CSS
        window.addEventListener('ronnyzim:analysis_intent_created', handleIntent);

        return () => {
            window.removeEventListener('ronnyzim:analysis_intent_created', handleIntent);
        };
    }, [addSystemMessage]);

    // Lógica de Comandos Slash
    const COMMANDS = [
        { id: 'clear', label: '/clear', description: 'Purificar registro da sessão' },
        { id: 'orchestrator', label: '/orchestrator', description: 'Forçar Roteamento: Orquestrador' },
        { id: 'hunterzim', label: '/hunterzim', description: 'Forçar Roteamento: HunterZim' },
        { id: 'emotional-analyst', label: '/emocional', description: 'Forçar Roteamento: Analista Emocional' }
    ];

    const filteredCommands = COMMANDS.filter(cmd => cmd.label.toLowerCase().startsWith(inputVal.toLowerCase()));

    const executeCommand = (cmd: typeof COMMANDS[0]) => {
        if (cmd.id === 'clear') {
            clearMessages();
            addSystemMessage('🧹 **Histórico Purificado.** Registros confidenciais expurgados com sucesso.');
        } else {
            setActiveAgentId(cmd.id);
            addSystemMessage(`🔄 **[Substituição Manual]** Subrotina de Forçamento ativada. Contexto ancorado em **${cmd.label.replace('/', '')}**.`);
        }
        setInputVal('');
        setShowCommandMenu(false);
        setCommandIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showCommandMenu && filteredCommands.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCommandIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCommandIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeCommand(filteredCommands[commandIndex]);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputVal(val);

        if (val.startsWith('/')) {
            setShowCommandMenu(true);
            setCommandIndex(0);
        } else {
            setShowCommandMenu(false);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (showCommandMenu && filteredCommands.length > 0) {
            executeCommand(filteredCommands[commandIndex]);
            return;
        }
        if (inputVal.trim() && !isLoading) {
            sendMessage(inputVal);
            setInputVal('');
            setShowCommandMenu(false);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-tactical text-text-hud overflow-hidden font-fira">

            {/* Main Workspace Area - Full Screen with Dynamic Borders */}
            <main
                className={`w-full h-full bg-tactical relative border-4 overflow-hidden transition-colors duration-1000 ease-in-out ${activeAgent.border} shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]`}
            >
                {/* Dynamic Inner Glow */}
                <div className={`absolute inset-0 pointer-events-none opacity-20 transition-all duration-1000 ease-in-out ${activeAgent.bg.replace('bg-', 'bg-gradient-to-t from-transparent to-')}`}></div>

                {/* Header - Active Agent Centered Focus */}
                <header className={`absolute top-0 w-full h-24 border-b transition-colors duration-1000 ease-in-out ${activeAgent.border} px-8 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-all duration-1000 ease-in-out ${activeAgent.bg} ${activeAgent.border} border shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                            <activeAgent.icon className={`h-8 w-8 transition-colors duration-1000 ease-in-out ${activeAgent.color}`} />
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <h1 className={`text-3xl font-bold tracking-tight leading-none transition-colors duration-1000 ease-in-out ${activeAgent.color}`}>{activeAgent.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`flex h-2.5 w-2.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] transition-colors duration-1000 ease-in-out ${activeAgent.bg.replace('/10', '')} ${activeAgent.color}`}></span>
                                <span className={`text-xs uppercase tracking-widest font-semibold opacity-70 transition-colors duration-1000 ease-in-out ${activeAgent.color}`}>{activeAgent.role} • Consultoria Ativa</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Chat History Panel */}
                <div ref={scrollContainerRef} className="absolute top-24 bottom-36 w-full overflow-y-auto p-8 space-y-6 custom-scrollbar z-0">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center flex-col text-center opacity-40 text-green-400">
                            <activeAgent.icon className="h-16 w-16 mb-4" />
                            <p className="text-lg font-medium">Sistema em espera. Inicialização concluída.</p>
                            <p className="text-sm">Inicie o comando para {activeAgent.name}.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isModel = msg.role === 'model';
                            
                            // Lógica de Renderização Inteligente de Conteúdo
                            const renderContent = () => {
                                if (msg.role === 'user') return msg.content;

                                // 1. Tipos Explícitos (Interceptados pelo useAgentChat)
                                if (msg.type === 'analysis' && msg.analysisData) return <AnalysisCard data={msg.analysisData} />;
                                if (msg.type === 'knowledge_gap' && msg.gapData) return <GapCard gapData={msg.gapData} onSubmit={resolveKnowledgeGap} />;
                                if (msg.type === 'quest_generated' && msg.questData) return <QuestGeneratedCard questData={msg.questData} userId={userId} />;

                                // 2. Detecção de JSON "vazado" (Quando a IA responde com JSON bruto em vez de chamar a ferramenta)
                                const trimmed = msg.content.trim();
                                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                    try {
                                        const parsed = JSON.parse(trimmed);
                                        // Detecção de Gap de Conhecimento "acidental"
                                        if (parsed.question_to_user && parsed.category) {
                                            return <GapCard gapData={parsed} onSubmit={resolveKnowledgeGap} />;
                                        }
                                        // Detecção de Quest "acidental"
                                        if (parsed.title && parsed.description && parsed.xp_reward) {
                                            return <QuestGeneratedCard questData={parsed} userId={userId} />;
                                        }
                                        // Se for outro JSON, formata como código
                                        return <pre className="bg-black/40 p-3 rounded-lg text-[13px] font-mono text-emerald-400 overflow-x-auto border border-emerald-500/20">{JSON.stringify(parsed, null, 2)}</pre>;
                                    } catch (e) { /* Segue para renderização normal */ }
                                }

                                // 3. Resposta de Texto Padrão (Typewriter + Markdown)
                                return (
                                    <TypewriterText
                                        content={msg.content}
                                        speed={msg.id === messages[messages.length - 1]?.id && msg.role === 'model' ? 15 : 0}
                                    />
                                );
                            };

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                                            max-w-[85%] p-5 rounded-2xl text-[15px] leading-relaxed relative shadow-xl transition-all duration-500
                                            ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-green-900/20 to-transparent text-primary rounded-br-sm border border-primary/30 shadow-[0_0_20px_rgba(0,255,65,0.05)]'
                                                : 'bg-[#0A0F0A]/90 text-text-hud border border-primary/10 rounded-bl-sm backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                                            }
                                        `}
                                    >
                                        {/* Sutil brilho interior para mensagens do modelo */}
                                        {isModel && (
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                                        )}
                                        
                                        <div className="relative z-10">
                                            {renderContent()}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}

                    {isLoading && !activeLearningContext && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className={`p-4 rounded-2xl bg-green-900/20 border border-green-500/30 rounded-bl-sm opacity-60 flex items-center gap-3`}>
                                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-bounce"></span>
                                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </motion.div>
                    )}

                </div>

                {/* Input Console */}
                <div className="absolute bottom-16 w-full px-8 shrink-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                    <form onSubmit={handleSend} className="relative w-full max-w-4xl mx-auto flex shadow-[0_0_30px_rgba(0,255,65,0.1)] rounded-xl pointer-events-auto">

                        {/* Floating Command Menu */}
                        {showCommandMenu && filteredCommands.length > 0 && (
                            <div className="absolute bottom-full mb-4 left-0 w-80 bg-tactical/95 border border-primary/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden z-50">
                                <div className="px-3 py-2 border-b border-primary/20 bg-primary/5">
                                    <p className="text-[10px] text-primary/70 font-tech uppercase tracking-widest">Ações Rápidas do Sistema</p>
                                </div>
                                <div className="py-2">
                                    {filteredCommands.map((cmd, idx) => (
                                        <button
                                            key={cmd.id}
                                            type="button"
                                            onClick={() => executeCommand(cmd)}
                                            onMouseEnter={() => setCommandIndex(idx)}
                                            className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${idx === commandIndex ? 'bg-primary/15 border-l-2 border-primary text-primary' : 'text-primary/70 hover:bg-primary/5'}`}
                                        >
                                            <span className="font-tech font-bold">{cmd.label}</span>
                                            <span className="text-xs opacity-60 font-fira">{cmd.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <input
                            type="text"
                            value={inputVal}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`Comunicar-se com ${activeAgent.name}... (Digite '/' para comandos)`}
                            disabled={isLoading || !!activeLearningContext}
                            aria-label="Mensagem para o agente"
                            className={`
                w-full bg-[#030603]/80 backdrop-blur-xl border border-primary/30 rounded-xl py-4 pl-6 pr-16
                text-text-hud placeholder-primary/40 font-fira tracking-wide
                focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/80 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed shadow-inner
              `}
                        />
                        <button
                            type="submit"
                            disabled={!inputVal.trim() || isLoading || !!activeLearningContext}
                            aria-label="Enviar mensagem"
                            className={`
                absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg
                text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all
                disabled:opacity-50 disabled:hover:bg-transparent disabled:shadow-none
              `}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>

            </main>

            {/* Global CSS for scrollbar hiding/styling but keeping functionality */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
      `}} />
        </div>
    );
}
