'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLabStore } from '../hooks/useLabStore';

export default function WelcomeScreen() {
    const currentScreen = useLabStore(s => s.currentScreen);
    const setScreen = useLabStore(s => s.setScreen);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (currentScreen === 'WELCOME') {
            const timer = setTimeout(() => {
                setIsVisible(false);
                // Trigger transition to FRONT immediately as UI fades
                // This starts the camera zoom in Scene.tsx
                setScreen('FRONT');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [currentScreen, setScreen]);

    if (currentScreen !== 'WELCOME' && !isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a2538]/40 backdrop-blur-sm"
                >
                    <div className="text-center">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-5xl md:text-7xl font-bold text-white tracking-tight"
                        >
                            Welcome to <span className="text-[#2bb3a1]">Amypo's</span>
                        </motion.h1>
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="text-4xl md:text-6xl font-light text-white/80 mt-2"
                        >
                            Physics Laboratory
                        </motion.h2>
                        
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
                            className="h-[1px] w-48 bg-[#2bb3a1] mx-auto mt-8 origin-center"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
