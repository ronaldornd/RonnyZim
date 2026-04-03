"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Zap, Search, Loader2 } from "lucide-react";

interface SearchTerminalProps {
  onScan: (query: string) => void;
  isScanning: boolean;
  statusMessage: string;
}

const MEMORY_MACROS = [
  { id: "NEXTJS_REMOTE", label: ">_ MACRO: NEXTJS_REMOTE", query: "Senior Next.js Developer Remote English" },
  { id: "FRONTEND_BR", label: ">_ MACRO: FRONTEND_BR", query: "Frontend Developer Brasil Remoto" },
  { id: "REACT_AGENTIC", label: ">_ MACRO: REACT_AGENTIC", query: "Senior React Developer AI Agents LLM" }
];

export function SearchTerminal({ onScan, isScanning, statusMessage }: SearchTerminalProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isScanning) {
      onScan(query);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-6 rounded-[2rem] border border-red-500/20 bg-red-500/[0.03] backdrop-blur-xl relative overflow-hidden group">
      {/* Glow Decorativo */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
      
      <div className="flex items-center gap-3 mb-2">
        <Terminal className="w-4 h-4 text-red-500/60" />
        <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest">Iniciação de Reconhecimento Tático</span>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="[ Digite sua diretriz de busca... ]"
          disabled={isScanning}
          className="w-full bg-white/[0.03] border border-red-500/10 rounded-2xl px-6 py-4 text-sm font-mono text-slate-100 placeholder:text-zinc-700 focus:outline-none focus:border-red-500/30 focus:bg-white/5 transition-all"
        />
        <button 
          type="submit"
          disabled={isScanning}
          className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all flex items-center gap-2 group/btn"
        >
          {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 group-hover/btn:scale-110" />}
          <span className="text-[10px] font-black font-mono uppercase tracking-widest hidden md:inline">Scan</span>
        </button>
      </form>

      {/* Macros (Prompt Presets) */}
      <div className="flex flex-wrap gap-2 mt-2">
        {MEMORY_MACROS.map((macro) => (
          <button
            key={macro.id}
            onClick={() => {
              setQuery(macro.query);
              onScan(macro.query);
            }}
            disabled={isScanning}
            className="text-[9px] font-mono font-bold text-zinc-500 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/5 border border-white/5 hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-all"
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="mt-2 min-h-[1.5rem] flex items-center gap-3">
        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-mono font-black text-red-500/80 uppercase tracking-[0.2em] italic">
              {statusMessage}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
