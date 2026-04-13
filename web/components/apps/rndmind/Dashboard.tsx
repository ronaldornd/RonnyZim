"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  CircleDot, 
  Activity, 
  Compass, 
  Wind,
  ShieldCheck
} from 'lucide-react';

/**
 * Dashboard RND Mind v1.0 - Gênese Visual
 * Dogmas: No-Scroll, Monólito Central, Aura Effects, Fios de Luz.
 */
export default function Dashboard() {
  return (
    <div className="relative h-screen w-screen bg-[#050208] text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* 🔮 CAMADA 0: AURA EFFECTS (Mística) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Aura Central (Espírito) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[160px] animate-pulse opacity-60" 
             style={{ transitionDuration: '8s' }} />
        
        {/* Aura Norte (Consciência) */}
        <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        
        {/* Aura Sul (Vitalidade) */}
        <div className="absolute bottom-[-20%] right-1/3 w-[700px] h-[700px] bg-emerald-900/15 rounded-full blur-[140px]" />
      </div>

      {/* 🏛️ CAMADA 1: TEMPLO VISUAL (Grid Layout) */}
      <main className="relative z-10 w-full h-full p-6 grid grid-cols-12 gap-6 items-center">
        
        {/* [SATÉLITES ESQUERDA] */}
        <aside className="col-span-3 h-full flex flex-col gap-6 py-10 opacity-80 hover:opacity-100 transition-opacity duration-700">
          <SatelliteCard 
            title="Sincronia Lunar" 
            subtitle="Fase Atual: Crescente"
            icon={<Sparkles className="w-4 h-4 text-amber-200/60" />}
          />
          <SatelliteCard 
            title="Radar de Foco" 
            subtitle="Pico Neural: 14:30h"
            icon={<Compass className="w-4 h-4 text-slate-300/60" />}
          />
          <div className="mt-auto">
            <SystemStatus />
          </div>
        </aside>

        {/* [MONÓLITO CENTRAL: CORAÇÃO MÍSTICO] */}
        <section className="col-span-6 h-[85vh] relative group">
          {/* Fio de Luz Dourado (Border Glow) */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-500/10 via-amber-500/30 to-amber-500/10 rounded-3xl blur-[2px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
          
          <div className="relative w-full h-full bg-black/40 backdrop-blur-3xl border border-amber-500/20 rounded-3xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-2xl shadow-black/80">
            
            {/* Background Holográfico do Monólito */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Placeholder para Relógio/Biorritmo */}
            <div className="relative z-10 text-center space-y-8 h-full flex flex-col items-center justify-center">
              <div className="relative w-80 h-80 flex items-center justify-center">
                {/* Anéis de Pulsação (Geometria Sagrada) */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-slate-300/5 rounded-full scale-100" />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-8 border border-white/5 border-dashed rounded-full" />
                <div className="absolute inset-16 border border-amber-500/10 rounded-full" />
                
                {/* Núcleo Central */}
                <div className="text-center">
                  <h2 className="text-6xl font-extralight text-amber-200 tracking-[0.2em] opacity-80 uppercase">Fluxo</h2>
                  <p className="mt-2 text-[10px] font-mono text-amber-500/60 tracking-widest uppercase">Arquétipo Dominante: O Alquimista</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-medium text-slate-100 tracking-tight">Sincronia Estelar</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Suas funções cognitivas estão em harmonia com Mercúrio. Momento ideal para refatoração e lógica profunda.
                </p>
              </div>
            </div>

            {/* Fios de Luz de Rodapé do Monólito */}
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center opacity-40">
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-amber-500/30" />
              <CircleDot className="w-2 h-2 text-amber-500" />
              <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-amber-500/30" />
            </div>
          </div>
        </section>

        {/* [SATÉLITES DIREITA] */}
        <aside className="col-span-3 h-full flex flex-col gap-6 py-10 opacity-80 hover:opacity-100 transition-opacity duration-700">
          <SatelliteCard 
            title="Vento Vital" 
            subtitle="Modo: Meditativo"
            icon={<Wind className="w-4 h-4 text-slate-300/60" />}
          />
          <SatelliteCard 
            title="Biorritmo" 
            subtitle="Status: Recuperação"
            icon={<Activity className="w-4 h-4 text-slate-300/60" />}
          />
          <div className="mt-auto">
             <EnergyMeter />
          </div>
        </aside>

      </main>

      {/* 🗡️ DECORAÇÃO: FIOS DE LUZ EXTERNOS */}
      <div className="absolute top-0 left-[25%] right-[25%] h-[1px] bg-gradient-to-r from-transparent via-slate-400/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-[25%] right-[25%] h-[1px] bg-gradient-to-r from-transparent via-slate-400/10 to-transparent pointer-events-none" />
    </div>
  );
}

/**
 * Componente Satélite (Widget Orbital)
 */
function SatelliteCard({ title, subtitle, icon }: { title: string, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="group relative">
      {/* Fio de Luz Prateado */}
      <div className="absolute -inset-[1px] bg-slate-300/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-all duration-500">
        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">{title}</h4>
          <p className="text-[11px] text-slate-500 font-mono italic">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Medidor de Energia (Visual Utilitário)
 */
function EnergyMeter() {
  return (
    <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2">Carga Vital</span>
        <span className="text-[10px] font-mono text-amber-400">82%</span>
      </div>
      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "82%" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-amber-500/20 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
      </div>
    </div>
  );
}

/**
 * Status do Sistema (Sanidade Técnica)
 */
function SystemStatus() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-black/20 rounded-2xl border border-white/5">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      </div>
      <span className="text-[9px] font-mono text-slate-500 tracking-[0.15em] uppercase">Sincronia Estável</span>
      <ShieldCheck className="w-2 h-2 text-slate-700 ml-auto" />
    </div>
  );
}
