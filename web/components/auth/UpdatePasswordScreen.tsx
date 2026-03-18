"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function UpdatePasswordScreen({ onComplete }: { onComplete: () => void }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const supabase = createClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || 'Erro inesperado ao atualizar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#020302] text-white">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-[#051005] to-green-900/20" />
                <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3 text-green-500/80 mb-4"
                >
                    <div className="p-3 bg-green-500/10 rounded-full border border-green-500/20">
                        <ShieldCheck className="w-8 h-8 text-green-400" />
                    </div>
                    <span className="text-sm font-mono uppercase tracking-[0.2em] font-bold text-slate-300">Nova Senha</span>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.form
                            key="update-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full space-y-4 rounded-2xl bg-[#030803]/80 p-6 backdrop-blur-xl border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)]"
                            onSubmit={handleUpdate}
                        >
                            <p className="text-xs text-center text-slate-400 mb-4">
                                Você solicitou a redefinição. Digite seu novo código de acesso.
                            </p>

                            <div className="space-y-3">
                                <input
                                    type="password"
                                    placeholder="Nova Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl bg-green-950/30 border border-green-500/30 px-4 py-3 text-sm text-green-100 placeholder-green-600/50 focus:outline-none focus:ring-2 focus:ring-green-500/60 focus:border-transparent transition-all"
                                    required
                                    minLength={6}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmar Nova Senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl bg-green-950/30 border border-green-500/30 px-4 py-3 text-sm text-green-100 placeholder-green-600/50 focus:outline-none focus:ring-2 focus:ring-green-500/60 focus:border-transparent transition-all"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {error && <p className="text-xs text-green-400 text-center bg-green-500/10 p-2 rounded">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-400 text-black font-bold tracking-wide py-3 text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 disabled:shadow-none mt-2 hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Atualizar a Senha"}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full text-center space-y-4 rounded-2xl bg-green-500/10 p-8 backdrop-blur-xl border border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]"
                        >
                            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto" />
                            <h3 className="text-lg font-bold text-green-400 uppercase tracking-widest">Senha Atualizada</h3>
                            <p className="text-sm text-slate-300">
                                Seu código de acesso foi reescrito no córtex. Entrando no sistema...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
