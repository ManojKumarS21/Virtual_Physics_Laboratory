'use client';

import { useLabStore } from '../hooks/useLabStore';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ObservationSystem() {
    const observations = useLabStore(s => s.observations);
    const clearObservations = useLabStore(s => s.clearObservations);
    const [isOpen, setIsOpen] = useState(true);

    const meanX = observations.length > 0
        ? (observations.reduce((s, o) => s + o.X, 0) / observations.length).toFixed(2)
        : '—';

    return (
        <div className="mr-3 mt-2 pointer-events-auto">
            <div className="bg-[#0a2538]/80 backdrop-blur-2xl border border-[#2bb3a1]/20 rounded-2xl shadow-[0_0_30px_rgba(10,37,56,0.6)] overflow-hidden" style={{ width: 240 }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2bb3a1]/10 transition-colors"
                >
                    <div className="text-left">
                        <p className="text-[10px] text-[#2bb3a1]/50 uppercase tracking-widest pl-1">Observation Table</p>
                        <p className="text-sm font-bold text-white leading-tight">
                            {observations.length === 0 ? 'No trials yet' : `${observations.length} trial${observations.length > 1 ? 's' : ''} · Mean: ${meanX} Ω`}
                        </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#2bb3a1]/40" /> : <ChevronDown className="w-4 h-4 text-[#2bb3a1]/40" />}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-[#2bb3a1]/20">
                            {/* Table Area */}
                            <div className="max-h-52 overflow-y-auto custom-scrollbar border-t border-[#2bb3a1]/10">
                                {observations.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-[#0a2538] text-[10px] uppercase tracking-wider text-[#2bb3a1]/70 border-b border-[#2bb3a1]/20">
                                            <tr>
                                                <th className="px-3 py-2 font-bold">#</th>
                                                <th className="px-2 py-2 font-bold">R (Ω)</th>
                                                <th className="px-2 py-2 font-bold">l (cm)</th>
                                                <th className="px-3 py-2 font-bold text-[#e5e744]">X (Ω)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {observations.map(obs => (
                                                <tr
                                                    key={obs.trial}
                                                    className="border-b border-[#2bb3a1]/10 hover:bg-[#2bb3a1]/5 transition-colors text-xs font-mono"
                                                >
                                                    <td className="px-3 py-1.5 text-[#2bb3a1]/60">{obs.trial}</td>
                                                    <td className="px-2 py-1.5 text-white/90">{obs.R}</td>
                                                    <td className="px-2 py-1.5 text-white/90">{obs.l}</td>
                                                    <td className="px-3 py-1.5 text-[#e5e744] font-bold">{obs.X}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="px-3 py-3 text-center text-[10px] text-[#2bb3a1]/40 uppercase tracking-widest font-bold">Press Save Trial</div>
                                )}
                            </div>
                            <div className="p-4 bg-[#0a2538]/60 border-t border-[#2bb3a1]/20 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-[#2bb3a1]/50 uppercase tracking-widest font-bold">Mean X</p>
                                    <p className="text-xl font-mono font-bold text-[#e5e744]">
                                        {meanX !== '—' ? `${meanX} Ω` : '— Ω'}
                                    </p>
                                </div>
                                {observations.length > 0 && (
                                    <button onClick={clearObservations} className="text-[#2bb3a1]/40 hover:text-red-400 hover:bg-red-400/10 transition-colors p-1.5 rounded-lg">
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
