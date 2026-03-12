'use client';

import { useLabStore } from '../../hooks/useLabStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

export function GalvanometerMonitor() {
    const visualDeflection = useLabStore((state) => state.visualDeflection);
    const showInterface = useLabStore(s => s['currentScreen'] === 'TOUR' || s['currentScreen'] === 'PRACTICE' || s['currentScreen'] === 'WORKOUT');
    
    // Map -1.0 to 1.0 visualDeflection to -40 to 40 degrees
    // We negate it to match SVG rotation (Positive = Right/Clockwise)
    // Actually, in 3D: -(pos/50)*40. If pos=-50, angle=+40 (Left).
    // In SVG: rotate(-40) is Left.
    // So visualDeflection -1.0 should map to -40.
    const rotationDegrees = useMemo(() => {
        return (visualDeflection || 0) * 40;
    }, [visualDeflection]);

    // Points for the scale arc
    const scaleConfig = useMemo(() => {
        const ticks = [];
        for (let i = -50; i <= 50; i += 5) {
            const angle = (i / 50) * 40; // -40 to 40 degrees
            const rad = (angle - 90) * (Math.PI / 180);
            const isMajor = i % 10 === 0;
            
            ticks.push({
                x1: 100 + 85 * Math.cos(rad),
                y1: 110 + 85 * Math.sin(rad),
                x2: 100 + (isMajor ? 75 : 80) * Math.cos(rad),
                y2: 110 + (isMajor ? 75 : 80) * Math.sin(rad),
                labelX: 100 + 65 * Math.cos(rad),
                labelY: 110 + 65 * Math.sin(rad),
                value: Math.abs(i),
                isMajor,
                angle
            });
        }
        return ticks;
    }, []);

    return (
        <AnimatePresence>
            {showInterface && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-[110px] right-6 z-50 pointer-events-none select-none"
                    style={{ width: 180 }}
                >
                    <div className="bg-[#0a2538]/60 backdrop-blur-xl border border-[#2bb3a1]/30 rounded-2xl p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[9px] text-[#2bb3a1]/60 font-black uppercase tracking-widest">Galvo-Copy</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${Math.abs(visualDeflection) < 0.005 ? 'bg-[#e5e744] shadow-[0_0_8px_#e5e744]' : 'bg-[#e11d48]/20'}`} />
                        </div>

                        {/* Dial Area */}
                        <div className="relative aspect-[1.7/1] w-full bg-[#f8f9fa] rounded-xl border border-black/10 overflow-hidden shadow-inner">
                            <svg viewBox="0 0 200 120" className="w-full h-full">
                                {/* Arc line */}
                                <path 
                                    d="M 35 60 A 75 75 0 0 1 165 60" 
                                    fill="none" 
                                    stroke="#333" 
                                    strokeWidth="0.5"
                                    strokeDasharray="1,1"
                                    transform="translate(0, 50)"
                                />

                                {/* Ticks and Labels */}
                                {scaleConfig.map((tick, idx) => (
                                    <g key={idx}>
                                        <line 
                                            x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} 
                                            stroke="#111" 
                                            strokeWidth={tick.isMajor ? 1.2 : 0.6}
                                        />
                                        {tick.isMajor && (
                                            <text 
                                                x={tick.labelX} y={tick.labelY}
                                                fontSize="10"
                                                fill="#111"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                                fontWeight="1000"
                                                className="font-mono"
                                            >
                                                {tick.value}
                                            </text>
                                        )}
                                    </g>
                                ))}

                                {/* GALVO text */}
                                <text 
                                    x="100" y="70" 
                                    fontSize="14" 
                                    fill="#222" 
                                    textAnchor="middle" 
                                    fontWeight="900"
                                    className="tracking-tighter opacity-90"
                                >
                                    GALVO
                                </text>

                                {/* Symbols */}
                                <text x="80" y="85" fontSize="8" fill="#444" textAnchor="middle">☊</text>
                                <text x="120" y="85" fontSize="8" fill="#444" textAnchor="middle">⊥</text>

                                {/* Pivot */}
                                <circle cx="100" cy="110" r="12" fill="#000" />
                                <circle cx="100" cy="110" r="4" fill="#111" />

                                {/* Needle */}
                                <motion.g
                                    animate={{ rotate: rotationDegrees }}
                                    initial={false}
                                    transition={{ type: 'tween', duration: 0 }} // Direct sync with 3D damping
                                    style={{ transformOrigin: '100px 110px' }}
                                >
                                    <line 
                                        x1="100" y1="110" x2="100" y2="25" 
                                        stroke="#e11d48" 
                                        strokeWidth="1.2" 
                                        strokeLinecap="round"
                                    />
                                    <circle cx="100" cy="25" r="1.5" fill="#e11d48" />
                                </motion.g>
                            </svg>

                            {/* Glare effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none" />
                        </div>

                        {/* Footer info */}
                        <div className="mt-2 flex justify-between px-1 opacity-40">
                            <span className="text-[7px] text-[#2bb3a1] font-bold uppercase tracking-tighter">MC / MR-100</span>
                            <span className="text-[7px] text-[#2bb3a1] font-bold uppercase tracking-tighter">Class 2.0</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default GalvanometerMonitor;
