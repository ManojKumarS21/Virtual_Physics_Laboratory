'use client';

import { useLabStore } from '../hooks/useLabStore';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ObservationSystem() {
    const observations = useLabStore(s => s.observations);
    const clearObservations = useLabStore(s => s.clearObservations);
    const [isOpen, setIsOpen] = useState(false);

    const meanX = observations.length > 0
        ? (observations.reduce((s, o) => s + o.X, 0) / observations.length).toFixed(2)
        : '—';

    return (
        <div className="mr-3 mt-2">
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden" style={{ width: 240 }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                    <div className="text-left">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Observation Table</p>
                        <p className="text-sm font-bold text-white leading-tight">
                            {observations.length === 0 ? 'No trials yet' : `${observations.length} trial${observations.length > 1 ? 's' : ''} · Mean: ${meanX} Ω`}
                        </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/10">
                            <div className="max-h-52 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[9px] text-white/25 uppercase border-b border-white/10">
                                            <th className="px-3 py-2">#</th>
                                            <th className="px-3 py-2">R (Ω)</th>
                                            <th className="px-3 py-2">l (cm)</th>
                                            <th className="px-3 py-2 text-purple-400">X (Ω)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {observations.map(obs => (
                                            <tr key={obs.trial} className="border-b border-white/5 text-xs text-white/60">
                                                <td className="px-3 py-1.5">{obs.trial}</td>
                                                <td className="px-3 py-1.5">{obs.R}</td>
                                                <td className="px-3 py-1.5">{obs.l}</td>
                                                <td className="px-3 py-1.5 font-mono text-purple-400 font-bold">{obs.X}</td>
                                            </tr>
                                        ))}
                                        {observations.length === 0 && (
                                            <tr><td colSpan={4} className="px-3 py-4 text-center text-xs text-white/20">Press Save Trial in HUD below</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase">Mean X</p>
                                    <p className="text-lg font-mono font-bold text-green-400">{meanX} Ω</p>
                                </div>
                                {observations.length > 0 && (
                                    <button onClick={clearObservations} className="text-red-400/50 hover:text-red-400 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
