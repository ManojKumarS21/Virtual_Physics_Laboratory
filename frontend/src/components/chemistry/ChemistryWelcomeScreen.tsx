'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ChemistryWelcomeScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500); 
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[4000] flex items-center justify-center bg-[#2d3032]"
                >
                    <div className="relative flex flex-col items-center">
                        <div className="text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-[12px] font-bold text-[#2F8D46] tracking-[0.4em] uppercase mb-4">
                                    Welcome To
                                </span>
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-widest flex items-center gap-2 uppercase text-center leading-tight">
                                    Amypo's<br/>Chemistry Lab
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
