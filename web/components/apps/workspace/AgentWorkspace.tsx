"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAgentChat } from '@/lib/hooks/useAgentChat';
import { consumePendingAnalysis } from '@/lib/services/analysis';
import GapCard from '@/components/chat/GapCard';
import QuestGeneratedCard from '@/components/chat/QuestGeneratedCard';
import AnalysisCard from '@/components/chat/AnalysisCard';
import TypewriterText from '@/components/chat/TypewriterText';
import AgentCarousel, { Agent } from '@/components/chat/AgentCarousel';
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
const INTERNAL_AGENTS: Agent[] = [
    { 
        id: 'orchestrator', 
        name: 'Orquestrador Central', 
        role: 'Consciência executiva', 
        icon: BrainCircuit, 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/30',
        howItWorks: 'Coordena o tráfego de dados e decide qual especialista deve assumir cada tarefa, garantindo a coesão do sistema.',
        howToWake: 'Ativo por padrão ou via /orchestrator. Use para consultas gerais ou supervisão de sistema.'
    },
    { 
        id: 'hunterzim', 
        name: 'HunterZim', 
        role: 'Oportunista de carreira', 
        icon: Terminal, 
        color: 'text-red-400', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/30',
        howItWorks: 'Varre o mercado em busca de falhas e oportunidades, utilizando algoritmos de scraping e análise preditiva.',
        howToWake: 'Desperte com /hunterzim ou enviando um link de vaga/empresa. Ele assume a análise de mercado.'
    },
    { 
        id: 'career-strategist', 
        name: 'Estrategista de Carreira', 
        role: 'Visionário de longo prazo', 
        icon: Briefcase, 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/30',
        howItWorks: 'Projeta caminhos de crescimento baseados em tendências de mercado e gaps de competências.',
        howToWake: "Chame via /carreira ou fale sobre 'objetivos' e 'promoção'. Ele planeja seus próximos 3 movimentos."
    },
    { 
        id: 'knowledge-curator', 
        name: 'Curador de Conhecimento', 
        role: 'Filtro intelectual', 
        icon: Library, 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/10', 
        border: 'border-emerald-500/30',
        howItWorks: 'Filtra o ruído informacional para entregar apenas o que é tecnicamente relevante e acionável.',
        howToWake: 'Invoke com /curador ou envie um PDF pesado. Ele extrai a essência técnica sem distrações.'
    },
    { 
        id: 'emotional-analyst', 
        name: 'Analista Emocional', 
        role: 'Tradutor de emoções', 
        icon: HeartHandshake, 
        color: 'text-rose-400', 
        bg: 'bg-rose-500/10', 
        border: 'border-rose-500/30',
        howItWorks: 'Decodifica nuances tonais e linguísticas para otimizar a comunicação interpessoal e inteligência emocional.',
        howToWake: "Ative com /emocional ou relate uma 'conversa difícil'. Ele traduz intenções ocultas."
    },
    { 
        id: 'astro-guide', 
        name: 'Guia Astro-Analítico', 
        role: 'Racionalista místico', 
        icon: Sparkles, 
        color: 'text-teal-400', 
        bg: 'bg-teal-500/10', 
        border: 'border-teal-500/30',
        howItWorks: 'Cruza dados astronômicos com biorritmos técnicos para identificar janelas de performance máxima.',
        howToWake: "Chame com /astro ou pergunte 'quando devo codar?'. Ele alinha seu código com o cosmos."
    },
    { 
        id: 'productivity-architect', 
        name: 'Arquiteto de Produtividade', 
        role: 'Construtor prático', 
        icon: LayoutTemplate, 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/10', 
        border: 'border-orange-500/30',
        howItWorks: 'Estrutura workflows e fluxos de trabalho baseados em metodologias ágeis e sistemas de alta performance.',
        howToWake: "Ative com /prod ou quando sentir 'caos na rotina'. Ele organiza suas Quests e prazos."
    },
    { 
        id: 'pattern-analyst', 
        name: 'Analista de Padrões', 
        role: 'Ironia observacional', 
        icon: Activity, 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-500/10', 
        border: 'border-cyan-500/30',
        howItWorks: 'Identifica anomalias e comportamentos repetitivos no fluxo de trabalho para evitar estagnação.',
        howToWake: 'Invoke com /padroes. Ele analisa seus logs de atividade para encontrar gargalos invisíveis.'
    },
    { 
        id: 'digital-identity-builder', 
        name: 'Construtor de Identidade', 
        role: 'Especialista em branding', 
        icon: Fingerprint, 
        color: 'text-pink-400', 
        bg: 'bg-pink-500/10', 
        border: 'border-pink-500/30',
        howItWorks: 'Forja uma presença digital autoritária e tecnicamente impecável no ecossistema dev.',
        howToWake: "Use /identidade ou peça para 'revisar meu perfil'. Ele trabalha seu branding pessoal."
    },
    { 
        id: 'long-term-visionary', 
        name: 'Visionário de Longo Prazo', 
        role: 'Pensador profundo', 
        icon: Telescope, 
        color: 'text-amber-400', 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/30',
        howItWorks: 'Simula cenários futuros de 5 a 10 anos para prevenir a obsolescência técnica.',
        howToWake: 'Chame com /visao para decisões de stack. Ele evita que você invista tempo em tecnologias mortas.'
    },
    { 
        id: 'coherence-guardian', 
        name: 'Guardião de Coerência', 
        role: 'Auditor clínico', 
        icon: Scale, 
        color: 'text-slate-400', 
        bg: 'bg-slate-500/10', 
        border: 'border-slate-500/30',
        howItWorks: 'Audita cada decisão do sistema para garantir que não haja divergência dos objetivos centrais.',
        howToWake: 'Ancorado em background, mas pode ser forçado com /auditoria para validar planos complexos.'
    },
    { 
        id: 'daily-synthesizer', 
        name: 'Sintetizador Diário', 
        role: 'Narrador objetivo', 
        icon: BookOpen, 
        color: 'text-teal-400', 
        bg: 'bg-teal-500/10', 
        border: 'border-teal-500/30',
        howItWorks: 'Consolida todos os micro-eventos do dia em um relatório executivo de alta densidade.',
        howToWake: 'Aciona automaticamente no fim do dia ou via /resumo. Ele fecha o ciclo de lucidez diária.'
    },
    { 
        id: 'creative-innovator', 
        name: 'Inovador Criativo', 
        role: 'Inovação caótica', 
        icon: Lightbulb, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/10', 
        border: 'border-yellow-500/30',
        howItWorks: 'Introduz soluções não convencionais e pensamento lateral em problemas rigidamente estruturados.',
        howToWake: "Chame com /caos ou quando estiver 'preso' num bug impossível. Ele quebra padrões lógicos."
    },
    { 
        id: 'risk-analyst', 
        name: 'Analista de Risco', 
        role: 'Simulador de catástrofes', 
        icon: ShieldAlert, 
        color: 'text-red-600', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/30',
        howItWorks: 'Avalia vetores de falha e impactos negativos em cada movimento de carreira ou código.',
        howToWake: 'Ative com /risco antes de grandes mudanças. Ele simula o pior cenário possível.'
    },
    { 
        id: 'energy-regulator', 
        name: 'Regulador de Energia', 
        role: 'Fronteira protetora', 
        icon: Battery, 
        color: 'text-green-400', 
        bg: 'bg-green-500/10', 
        border: 'border-green-500/30',
        howItWorks: 'Monitora o burnout técnico e sugere pausas estratégicas baseadas na carga cognitiva detectada.',
        howToWake: 'Chame com /bio ou quando a produtividade cair. Ele protege sua integridade neural.'
    },
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

            {/* Main Workspace Area */}
            <main
                className={`w-full h-full bg-[#050505] relative overflow-hidden flex flex-col transition-colors duration-1000 ease-in-out`}
            >
                {/* Dynamic Inner Glow */}
                <div className={`absolute inset-0 pointer-events-none opacity-20 transition-all duration-1000 ease-in-out ${activeAgent.bg.replace('bg-', 'bg-gradient-to-t from-transparent to-')}`}></div>

                {/* Header - Fixed Height */}
                <header className={`shrink-0 w-full h-[60px] md:h-[72px] border-b transition-colors duration-1000 ease-in-out ${activeAgent.border} px-4 md:px-8 flex flex-col justify-center bg-[#050505]/95 backdrop-blur-xl z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}>
                    <div className="flex items-center gap-3 md:gap-4 w-full md:max-w-[900px] md:mx-auto">
                        <div className={`shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl transition-all duration-1000 ease-in-out ${activeAgent.bg} ${activeAgent.border} border shadow-[0_0_20px_rgba(0,0,0,0.5)] w-[40px] h-[40px] md:w-[48px] md:h-[48px]`}>
                            <activeAgent.icon className={`w-[28px] h-[28px] md:w-[32px] md:h-[32px] transition-colors duration-1000 ease-in-out ${activeAgent.color}`} />
                        </div>
                        
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className={`text-[10px] md:text-[11px] font-tech tracking-[0.2em] md:tracking-[0.25em] uppercase opacity-70 transition-colors duration-1000 ease-in-out ${activeAgent.color} flex items-center gap-1`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-80"></span>
                                    {activeAgent.role}
                                </span>
                            </div>
                            
                            <h1 className={`text-[20px] md:text-[24px] font-black tracking-tighter leading-none transition-colors duration-1000 ease-in-out ${activeAgent.color} truncate mt-1`}>
                                {activeAgent.name}
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Chat History Panel */}
                <div ref={scrollContainerRef} className="flex-1 w-full overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar z-0 relative">
                    <div className="w-full md:max-w-[900px] mx-auto space-y-8 pb-[80px] md:pb-4">
                        {messages.length === 0 ? (
                            <AgentCarousel agents={INTERNAL_AGENTS} />
                        ) : (
                            messages.map((msg) => {
                                const renderContent = () => {
                                    if (msg.role === 'user') return msg.content;
                                    
                                    if (msg.type === 'analysis' && msg.analysisData) return <AnalysisCard data={msg.analysisData} />;
                                    if (msg.type === 'knowledge_gap' && msg.gapData) return <GapCard gapData={msg.gapData} onSubmit={resolveKnowledgeGap} />;
                                    if (msg.type === 'quest_generated' && msg.questData) return <QuestGeneratedCard questData={msg.questData} userId={userId} />;

                                    const trimmed = msg.content.trim();
                                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                        try {
                                            const parsed = JSON.parse(trimmed);
                                            if (parsed.question_to_user && parsed.category) return <GapCard gapData={parsed} onSubmit={resolveKnowledgeGap} />;
                                            if (parsed.title && parsed.description && parsed.xp_reward) return <QuestGeneratedCard questData={parsed} userId={userId} />;
                                            return <pre className="bg-black/40 p-3 text-[14px] font-mono text-emerald-400 overflow-x-auto border border-white/5 shadow-inner">{JSON.stringify(parsed, null, 2)}</pre>;
                                        } catch (e) { /* fallback */ }
                                    }

                                    return (
                                        <div className="text-[14px] md:text-[15px] prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-emerald-500/20 max-w-none">
                                            <TypewriterText content={msg.content} speed={msg.id === messages[messages.length - 1]?.id && msg.role === 'model' ? 15 : 0} />
                                        </div>
                                    );
                                };

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id}
                                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'user' ? (
                                            // USER TEXT: Terminal Style, Right Aligned
                                            <div className="flex flex-col items-end max-w-[85%]">
                                                <span className={`text-[10px] md:text-[11px] font-mono tracking-widest uppercase opacity-50 mb-1.5 ${activeAgent.color}`}>UPLINK_TX</span>
                                                <div className="bg-[#0A0A0A] border border-white/10 px-4 py-3 rounded-[2px] border-r-2 border-r-emerald-500 shadow-md">
                                                    <p className="text-[14px] md:text-[15px] font-mono text-emerald-400">
                                                        <span className="opacity-50 mr-2">{'>'}</span>
                                                        {renderContent()}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            // AI RESPONSE: Narrative Fragment
                                            <div className="flex flex-col items-start w-full relative pl-4 md:pl-5">
                                                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${activeAgent.bg.replace('/10', '/50')}`}></div>
                                                <span className={`text-[10px] md:text-[11px] font-mono tracking-widest uppercase opacity-50 mb-2 ${activeAgent.color}`}>RX_{activeAgent.id.toUpperCase()}</span>
                                                <div className="w-full text-text-hud font-fira relative z-10">
                                                    {renderContent()}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}

                        {isLoading && !activeLearningContext && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full pl-4 md:pl-5 relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${activeAgent.bg.replace('/10', '/50')} animate-pulse`}></div>
                                <span className={`text-[10px] font-mono tracking-widest uppercase opacity-50 mb-1 ${activeAgent.color}`}>RX_PROCESSING...</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Input Console - Fixed Bottom */}
                <div className="shrink-0 w-full bg-[#050505] border-t border-white/10 px-4 md:px-8 py-3 md:py-4 z-20 relative">
                    <form onSubmit={handleSend} className="relative w-full md:max-w-[900px] mx-auto flex">
                        
                        {/* Floating Command Menu */}
                        {showCommandMenu && filteredCommands.length > 0 && (
                            <div className="absolute bottom-full mb-2 left-0 w-full sm:w-80 bg-[#0A0A0A]/95 border border-primary/30 rounded-[4px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-50">
                                <div className="px-3 py-2 border-b border-primary/20 bg-primary/5">
                                    <p className="text-[10px] text-primary/70 font-mono uppercase tracking-widest">Ações do Sistema</p>
                                </div>
                                <div className="py-1">
                                    {filteredCommands.map((cmd, idx) => (
                                        <button
                                            key={cmd.id}
                                            type="button"
                                            onClick={() => executeCommand(cmd)}
                                            onMouseEnter={() => setCommandIndex(idx)}
                                            className={`w-full text-left px-4 py-2 flex items-center justify-between transition-colors ${idx === commandIndex ? 'bg-primary/15 border-l-2 border-primary text-primary' : 'text-primary/70 hover:bg-primary/5'}`}
                                        >
                                            <span className="font-mono text-[13px]">{cmd.label}</span>
                                            <span className="text-[11px] opacity-60 font-sans">{cmd.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label htmlFor="agent-input" className="sr-only">Input do Agente</label>
                        <input
                            id="agent-input"
                            type="text"
                            value={inputVal}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`> Iniciar input remoto para [${activeAgent.name.toUpperCase()}]...`}
                            disabled={isLoading || !!activeLearningContext}
                            aria-label="Mensagem para o agente"
                            className={`
                                w-full bg-black border border-white/10 rounded-[2px] h-[52px] md:h-[60px] px-4 pr-12
                                text-[14px] md:text-[15px] font-mono text-emerald-400 placeholder-emerald-900/50
                                focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        />
                        <button
                            type="submit"
                            disabled={!inputVal.trim() || isLoading || !!activeLearningContext}
                            aria-label="Enviar mensagem"
                            className={`
                                absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-[2px]
                                text-emerald-500 hover:bg-emerald-500/10 transition-colors
                                disabled:opacity-30 disabled:hover:bg-transparent
                            `}
                        >
                            <Terminal className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
