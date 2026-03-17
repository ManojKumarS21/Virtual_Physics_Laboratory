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
                    exit={{ opacity: 0, transition: { duration: 0.8 } }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2d3032]"
                >
                    <div className="relative flex flex-col items-center">
                        <div className="text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-[10px] font-bold text-[#2F8D46] tracking-[0.4em] uppercase mb-4">
                                    Virtual Physics Laboratory
                                </span>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-widest flex items-center gap-2">
                                    AMYPO
                                </h1>
                            </motion.div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="mt-12 w-48 h-[3px] bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: 2.0, ease: "easeInOut" }}
                                className="w-full h-full bg-[#2F8D46]" 
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

