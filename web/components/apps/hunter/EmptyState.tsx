import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface EmptyStateProps {
    onGuideOpen: () => void;
}

export default function EmptyState({ onGuideOpen }: EmptyStateProps) {
    const jobPortals = [
        { name: 'Programa Thor', url: 'https://programathor.com.br' },
        { name: 'GeekHunter', url: 'https://geekhunter.com.br' },
        { name: 'Revelo', url: 'https://revelo.com.br' },
        { name: 'Gupy', url: 'https://gupy.io' },
        { name: 'LinkedIn', url: 'https://linkedin.com' },
        { name: 'Wellfound', url: 'https://wellfound.com' },
        { name: 'Otta', url: 'https://otta.com' },
        { name: 'Turing', url: 'https://turing.com' },
        { name: 'BairesDev', url: 'https://bairesdev.com' },
        { name: 'RemoteOK', url: 'https://remoteok.com' }
    ];

    const freelanceMarkets = [
        { name: 'Workana', url: 'https://workana.com' },
        { name: '99Freelas', url: 'https://99freelas.com.br' },
        { name: 'Trampos.co', url: 'https://trampos.co' },
        { name: 'Nube', url: 'https://nube.com.br' },
        { name: 'Cia de Talentos', url: 'https://ciadetalentos.com.br' },
        { name: 'InfoJobs', url: 'https://infojobs.com.br' },
        { name: 'Vagas.com.br', url: 'https://vagas.com.br' },
        { name: 'APInfo', url: 'https://apinfo.com' },
        { name: 'Hipsters.jobs', url: 'https://hipsters.jobs' },
        { name: 'GetNinjas', url: 'https://getninjas.com.br' }
    ];

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] p-12 text-center gap-8 overflow-y-auto custom-scrollbar">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl w-full border border-red-500/20 bg-red-500/[0.03] p-10 rounded-[2rem] backdrop-blur-md relative overflow-hidden group"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                <div className="text-center md:text-left relative z-10">
                    <h2 className="text-4xl font-black text-red-500 tracking-tighter uppercase italic leading-none">
                        Nenhum Alvo<br/>Monitorado
                    </h2>
                    <p className="text-red-500/40 mt-4 font-mono text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Status: Standby Operacional
                    </p>
                </div>
                <button 
                    onClick={onGuideOpen}
                    className="px-8 py-5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 transition-all flex items-center gap-4 group/btn shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-black uppercase tracking-widest">Protocolo de Injeção</span>
                        <span className="text-[10px] text-red-400/50 font-mono">Configurar Zim-Clipper Extension</span>
                    </div>
                    <ExternalLink className="w-5 h-5 opacity-50 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
            </motion.div>

            <div className="flex flex-col gap-12 max-w-6xl mx-auto w-full relative z-10">
                {/* Portais Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-500/20" />
                        <h3 className="text-[10px] font-black text-red-500/40 uppercase tracking-[0.5em]">Portais de Varredura</h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-500/20" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {jobPortals.map((site, i) => (
                            <motion.a 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={site.name} 
                                href={site.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex flex-col items-center justify-center gap-2 p-4 bg-red-500/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-xl text-[10px] font-bold text-red-400/60 transition-all hover:text-red-400 group/link"
                            >
                                <ExternalLink className="w-4 h-4 opacity-30 group-hover/link:opacity-100 transition-opacity" />
                                {site.name}
                            </motion.a>
                        ))}
                    </div>
                </div>

                {/* Freelance Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-amber-500/20" />
                        <h3 className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.5em]">Mercado Livre / Jobs</h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-amber-500/20" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {freelanceMarkets.map((site, i) => (
                            <motion.a 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                key={site.name} 
                                href={site.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex flex-col items-center justify-center gap-2 p-4 bg-amber-500/[0.02] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-[10px] font-bold text-amber-400/60 transition-all hover:text-amber-400 group/link"
                            >
                                <ExternalLink className="w-4 h-4 opacity-30 group-hover/link:opacity-100 transition-opacity" />
                                {site.name}
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}