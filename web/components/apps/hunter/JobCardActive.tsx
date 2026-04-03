"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  ExternalLink, 
  Target, 
  Loader2, 
  Cpu, 
  CheckCircle2,
  AlertTriangle 
} from "lucide-react";
import { ScannedJob } from "@/hooks/useJobScanner";

interface JobCardActiveProps {
  job: ScannedJob;
  onSave: (job: ScannedJob) => Promise<boolean>;
}

export function JobCardActive({ job, onSave }: JobCardActiveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    const success = await onSave(job);
    if (success) {
      setIsSaved(true);
    }
    setIsSaving(false);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="group relative flex flex-col h-full rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl hover:bg-white/[0.05] transition-all duration-700 overflow-hidden"
    >
      {/* Scanning Overlay (Pulsante) */}
      <AnimatePresence>
        {job.isScoring && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-red-500/[0.05] overflow-hidden"
          >
            <motion.div 
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
            <div className="flex items-center gap-2 mt-2">
              <Cpu className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-[10px] font-black font-mono text-red-500 uppercase tracking-widest italic">Análise Neural Ativa...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 flex flex-col h-full gap-6">
        {/* Header: Score & Title */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tighter group-hover:text-red-400 transition-colors uppercase italic leading-tight">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
              <span className="text-red-500/60 font-black tracking-normal">SCAN_RES:</span>
              <span>{new Date(job.published_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className={`shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-[1.5rem] border border-white/5 bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.02)] relative overflow-hidden`}>
             <div className="absolute inset-0 bg-red-500/[0.02] group-hover:bg-red-500/[0.08] transition-colors" />
             {job.isScoring ? (
               <Loader2 className="w-6 h-6 text-red-500/40 animate-spin" />
             ) : (
               <div className="flex flex-col items-center text-red-500">
                  <span className="text-3xl font-black italic">{job.score || "--"}</span>
                  <span className="text-[8px] font-mono font-black uppercase tracking-[0.2em] opacity-60">Match</span>
               </div>
             )}
          </div>
        </div>

        {/* Content: Summary & Tags */}
        <div className="flex-1 space-y-4 relative z-10">
          <p className="text-xs text-zinc-400 leading-relaxed font-medium uppercase tracking-wider line-clamp-3">
             {job.summary}
          </p>

          {!job.isScoring && job.reasoning && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="p-4 rounded-2xl bg-red-500/[0.03] border border-red-500/10"
             >
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Veredito Neural</span>
                </div>
                <p className="text-[10px] text-zinc-300 font-mono leading-relaxed italic">
                   {job.reasoning}
                </p>
             </motion.div>
          )}

          <div className="flex flex-wrap gap-2">
             {job.strong_matches?.slice(0, 3).map((tag, i) => (
               <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono font-black uppercase tracking-widest">
                  + {tag}
               </span>
             ))}
             {job.missing_skills?.slice(0, 2).map((tag, i) => (
               <span key={i} className="px-2.5 py-1 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-[8px] font-mono font-black uppercase tracking-widest">
                  - {tag}
               </span>
             ))}
          </div>
        </div>

        {/* Footer: Actions */}
        <div className="pt-6 border-t border-white/5 flex items-center gap-4 relative z-10">
          <a 
            href={job.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/link active:scale-[0.98]"
          >
             <ExternalLink className="w-4 h-4 text-zinc-500 group-hover/link:text-white" />
             <span className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-zinc-400 group-hover/link:text-white">Abrir Link</span>
          </a>

          <button 
            onClick={handleSave}
            disabled={isSaving || isSaved || job.isScoring}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all active:scale-[0.98] ${
              isSaved 
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" 
              : "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            }`}
          >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
             <span className="text-[10px] font-black font-mono uppercase tracking-[0.2em]">
                {isSaved ? "Alvo Adquirido" : "Adquirir Alvo"}
             </span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
