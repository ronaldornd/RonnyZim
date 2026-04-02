"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import LockScreen from './LockScreen';
import UpdatePasswordScreen from './UpdatePasswordScreen';
import { useBootSequence } from '@/lib/hooks/useBootSequence';
import BootSequence from '../onboarding/BootSequence';
import { AnimatePresence, motion } from 'framer-motion';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRecovering, setIsRecovering] = useState(false);
    const { isBootComplete, completeBoot } = useBootSequence();
    const supabase = createClient();

    useEffect(() => {
        // Verifica transição do Supabase (hash ou query string)
        if (typeof window !== 'undefined') {
            const hasRecoveryHash = window.location.hash.includes('type=recovery');
            const hasRecoveryQuery = new URLSearchParams(window.location.search).get('type') === 'recovery';
            if (hasRecoveryHash || hasRecoveryQuery) {
                setIsRecovering(true);
            }
        }

        // Busca a sessão inicial caso o user de F5
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Ouve as mudanças de Auth (login / logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovering(true);
            }
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    if (isBootComplete === null) return (
        <div className="h-screen w-full bg-black flex items-center justify-center">
            <div className="w-1 h-1 bg-white/20 animate-pulse" />
        </div>
    );

    return (
        <AnimatePresence mode="wait">
            {!isBootComplete ? (
                <motion.div
                    key="boot"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                >
                    <BootSequence onComplete={completeBoot} />
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full w-full"
                >
                    {loading ? (
                         <div className="h-screen w-full flex items-center justify-center bg-[#020202]">
                            <div className="w-4 h-4 rounded-full bg-white/20 animate-ping" />
                        </div>
                    ) : isRecovering ? (
                        <UpdatePasswordScreen
                            onComplete={() => {
                                setIsRecovering(false);
                                if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
                                    window.history.replaceState(null, '', window.location.pathname);
                                }
                            }}
                        />
                    ) : !session ? (
                        <LockScreen onLogin={() => {}} />
                    ) : (
                        children
                    )}
                </motion.div>
            ) }
        </AnimatePresence>
    );
}
