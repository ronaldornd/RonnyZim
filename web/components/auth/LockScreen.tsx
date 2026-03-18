"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import { Lock, Fingerprint, Loader2 } from 'lucide-react';

export default function LockScreen({ onLogin }: { onLogin: () => void }) {
    const [time, setTime] = useState<Date>(new Date());
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    setError(error.message);
                } else {
                    if (!data.session) {
                        setError("Cadastro efetuado! Por favor, verifique seu email para confirmar a conta.");
                    } else {
                        onLogin();
                    }
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    setError(error.message);
                } else {
                    onLogin();
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro inesperado ao conectar.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`,
            });
            if (error) {
                setError(error.message);
            } else {
                setError("Link enviado! Verifique sua caixa de entrada.");
            }
        } catch (err: any) {
            setError(err.message || 'Erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) {
                setError("Falha no login anônimo: " + error.message);
            } else {
                onLogin();
            }
        } catch (err: any) {
            setError("Erro: " + (err.message || 'Ocorreu um erro inesperado.'));
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#020302] text-white">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-[#051005] to-green-900/20" />
                <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-[120px]" />
                <div className="absolute left-1/4 top-1/4 h-[20rem] w-[20rem] rounded-full bg-emerald-500/10 blur-[100px]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-sm">

                {/* Clock & Date */}
                <div className="flex flex-col items-center gap-1">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-green-500/60 mb-4"
                    >
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold">Sistema Bloqueado</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-7xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-green-50 to-green-300/80"
                    >
                        {formatTime(time)}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg font-medium tracking-wide text-green-200/60 mt-2 capitalize"
                    >
                        {formatDate(time)}
                    </motion.p>
                </div>

                {/* Auth Module */}
                <AnimatePresence mode="wait">
                    {!showLogin ? (
                        <motion.button
                            key="profile-btn"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            onClick={() => setShowLogin(true)}
                            className="group relative flex flex-col items-center gap-4 rounded-3xl p-6 transition-all hover:bg-green-500/5"
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0a1a0a] to-[#020502] border border-green-500/20 shadow-2xl group-hover:border-green-400/40 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all">
                                <Fingerprint className="h-8 w-8 text-green-500/50 group-hover:text-green-400 transition-colors" />
                            </div>
                            <span className="text-sm font-medium tracking-widest uppercase text-green-400/70">Toque Para Desbloquear</span>
                        </motion.button>
                    ) : (
                        <motion.form
                            key="login-form"
                            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            className="w-full space-y-4 rounded-2xl bg-[#030803]/60 p-6 backdrop-blur-xl border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]"
                            onSubmit={isForgotPassword ? handleResetPassword : handleLogin}
                        >
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Identidade (E-mail)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl bg-green-950/20 border border-green-500/20 px-4 py-3 text-sm text-green-100 placeholder-green-600/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                                    required
                                />
                                {!isForgotPassword && (
                                    <input
                                        type="password"
                                        placeholder="Código de Acesso"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl bg-green-950/20 border border-green-500/20 px-4 py-3 text-sm text-green-100 placeholder-green-600/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                                        required
                                    />
                                )}
                            </div>

                            {error && <p className="text-xs text-green-400 text-center bg-green-500/10 p-2 rounded">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-green-400 to-green-500 text-black font-bold tracking-wide py-3 text-sm flex items-center justify-center gap-2 hover:from-green-300 hover:to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : (isForgotPassword ? "Enviar Link de Recuperação" : (isSignUp ? "Criar Identidade" : "Autenticar"))}
                            </button>

                            {isForgotPassword ? (
                                <div className="text-center mt-2">
                                    <button type="button" onClick={() => setIsForgotPassword(false)} className="text-xs text-green-500/80 hover:text-green-400 transition-colors">
                                        Voltar para o Autenticador
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center text-xs px-1">
                                    <p className="text-green-500/60">
                                        {isSignUp ? "Já possui registro? " : "Novo no sistema? "}
                                        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-green-400 font-semibold hover:text-green-300 transition-colors">
                                            {isSignUp ? "Acessar" : "Cadastrar-se"}
                                        </button>
                                    </p>
                                    {!isSignUp && (
                                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-green-500/80 hover:text-green-400 hover:underline transition-colors mt-0">
                                            Recuperar Acesso
                                        </button>
                                    )}
                                </div>
                            )}

                            {!isForgotPassword && (
                                <>
                                    <div className="relative py-2 mt-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-green-500/20" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-[#030803] px-3 font-semibold text-green-500/40">Ou</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGuest}
                                        disabled={loading}
                                        className="w-full rounded-xl bg-transparent border border-green-500/30 text-green-400 font-medium py-3 text-sm hover:bg-green-500/10 transition-colors disabled:opacity-50"
                                    >
                                        Entrar como Visitante
                                    </button>
                                </>
                            )}
                        </motion.form>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
