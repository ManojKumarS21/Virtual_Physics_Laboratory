'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';
import { useState } from 'react';

export default function TheoryPanel() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-28 right-4 flex items-center gap-2 bg-[#404446]/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/5 shadow-xl text-white hover:bg-white/10 transition-all z-20"
            >
                <BookOpen className="w-4 h-4 text-[#2F8D46]" />
                <span className="text-sm font-bold">Theory</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#404446] border border-white/5 p-8 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Meter Bridge</h1>
                                    <p className="text-white/40 text-sm">Finding resistance of a wire</p>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h2 className="text-[#2F8D46] font-bold uppercase tracking-widest text-xs mb-2">Principle</h2>
                                    <p className="text-white/70 text-sm leading-relaxed">
                                        Works on the Wheatstone Bridge principle. When the bridge is balanced, no current flows through the galvanometer (null point).
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-[#2F8D46] font-bold uppercase tracking-widest text-xs mb-2">Formula</h2>
                                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 text-center">
                                        <p className="text-2xl text-white font-mono">X = R × (100 − l) / l</p>
                                    </div>
                                    <ul className="mt-3 space-y-1 text-xs text-white/40">
                                        <li>• <b>R</b> = Known resistance from resistance box (Ω)</li>
                                        <li>• <b>l</b> = Balance length in cm (where galvanometer reads 0)</li>
                                        <li>• <b>X</b> = Unknown resistance being measured (Ω)</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-[#2F8D46] font-bold uppercase tracking-widest text-xs mb-2">Circuit Diagram</h2>
                                    <div className="bg-black/20 p-4 rounded-xl text-center">
                                        <p className="text-white/40 text-xs">Battery → [A·Plug Key] → Meter Bridge</p>
                                        <p className="text-white/40 text-xs mt-1">Resistance Box between A-C junction · Unknown wire between C-D junction</p>
                                        <p className="text-white/40 text-xs mt-1">Galvanometer between midpoint and Jockey</p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-[#2F8D46] font-bold uppercase tracking-widest text-xs mb-2">Procedure</h2>
                                    <ol className="list-decimal list-inside space-y-2 text-white/70 text-sm">
                                        <li>Place all instruments on the table from the left panel.</li>
                                        <li>Connect terminals (click a terminal, then click another to wire).</li>
                                        <li>Set resistance R using the Resistance Box (click to cycle).</li>
                                        <li>Close the Plug Key (click on it) to complete the circuit.</li>
                                        <li>Slide the Jockey along the Meter Bridge wire.</li>
                                        <li>Find the <b className="text-white">null point</b> where galvanometer reads 0 (green).</li>
                                        <li>Note the balance length l. Click <b className="text-white">Save Trial</b>.</li>
                                        <li>Repeat with different R values for more accuracy.</li>
                                    </ol>
                                </section>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
