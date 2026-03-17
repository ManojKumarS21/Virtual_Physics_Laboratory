'use client';

import { useLabStore } from '../hooks/useLabStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, X } from 'lucide-react';
import { useState } from 'react';

const AVAILABLE_INSTRUMENTS = [
    {
        type: 'battery',
        name: 'Battery',
        desc: '2V DC Source',
        image: '/assets/instruments/battery.png',
        color: 'cyan',
        terminals: [
            { id: 'pos', position: [-0.3, 0.85, 0] as [number, number, number] },
            { id: 'neg', position: [0.3, 0.85, 0] as [number, number, number] },
        ]
    },
    {
        type: 'galvanometer',
        name: 'Galvanometer',
        desc: 'Null detector',
        image: '/assets/instruments/galvanometer.png',
        color: 'green',
        terminals: [
            { id: 't1', position: [-0.4, 0, 0.2] as [number, number, number] },
            { id: 't2', position: [0.4, 0, 0.2] as [number, number, number] },
        ]
    },
    {
        type: 'resistance_box',
        name: 'Resistance Box',
        desc: 'Known R (click to adjust)',
        image: '/assets/instruments/resistance_box.png',
        color: 'yellow',
        terminals: [
            { id: 't1', position: [-0.6, 0, 0.65] as [number, number, number] },
            { id: 't2', position: [0.6, 0, 0.65] as [number, number, number] },
        ]
    },
    {
        type: 'meter_bridge',
        name: 'Meter Bridge',
        desc: '100cm slide wire',
        image: '/assets/instruments/meter_bridge.png',
        color: 'orange',
        terminals: [
            { id: 'A1', position: [-5.1, 0.3, 0.6] as [number, number, number] },
            { id: 'A2', position: [-5.1, 0.3, -0.6] as [number, number, number] },
            { id: 'L1', position: [-3.1, 0.3, -0.6] as [number, number, number] },
            { id: 'L2', position: [-1.9, 0.3, -0.6] as [number, number, number] },
            { id: 'D', position: [0, 0.3, -0.6] as [number, number, number] },
            { id: 'R1', position: [1.9, 0.3, -0.6] as [number, number, number] },
            { id: 'R2', position: [3.1, 0.3, -0.6] as [number, number, number] },
            { id: 'C1', position: [5.1, 0.3, 0.6] as [number, number, number] },
            { id: 'C2', position: [5.1, 0.3, -0.6] as [number, number, number] },
        ]
    },
    {
        type: 'plug_key',
        name: 'Plug Key',
        desc: 'Circuit switch (click)',
        image: '/assets/instruments/plug_key.png',
        color: 'red',
        terminals: [
            { id: 't1', position: [-0.4, 0.1, 0.4] as [number, number, number] },
            { id: 't2', position: [0.4, 0.1, 0.4] as [number, number, number] },
        ]
    },
    {
        type: 'jockey',
        name: 'Jockey',
        desc: 'Slide along wire',
        image: '/assets/instruments/jockey.png',
        color: 'purple',
        terminals: [
            { id: 't', position: [0, 0.75, 0] as [number, number, number] }
        ]
    },
    {
        type: 'wire',
        name: 'Connecting Wire',
        desc: 'Take to connect terminals',
        image: '/assets/instruments/wire.png', // I'll assume this exists or I'll use a placeholder icon
        color: 'red',
        terminals: []
    },
];

const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40 hover:bg-purple-500/30',
};

export default function Shelf() {
    const [isOpen, setIsOpen] = useState(true);
    const { addInstrument, placedInstruments, removeInstrument, isHoldingWire, setHoldingWire, setHeldInstrument } = useLabStore((s: any) => s);

    const handleSpawn = (inst: typeof AVAILABLE_INSTRUMENTS[0]) => {
        if (inst.type === 'wire') {
            setHoldingWire(!isHoldingWire);
            return;
        }

        const instrumentId = Math.random().toString(36).substring(7);

        const terminals = inst.terminals.map(t => ({
            ...t,
            id: `${instrumentId}_${t.id}`,
            instrumentId
        }));

        setHeldInstrument({
            id: instrumentId,
            type: inst.type,
            name: inst.name,
            terminals
        });
    };

    return (
        <div className="ml-3 mt-2 pointer-events-auto">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="bg-[#404446]/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl w-58 overflow-hidden"
                        style={{ width: 220 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2F8D46]/20">
                            <div>
                                <p className="text-[10px] text-[#2F8D46]/50 uppercase tracking-widest pl-1">Lab Shelf</p>
                                <p className="text-sm font-bold text-white tracking-wide">Instruments</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-[#2F8D46]/60 hover:text-[#2F8D46] hover:bg-white/5 p-1.5 rounded-lg transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Available */}
                        <div className="p-3 space-y-1.5 overflow-y-auto max-h-[400px]">
                            {AVAILABLE_INSTRUMENTS.map((inst) => {
                                const isSelected = inst.type === 'wire' && isHoldingWire;
                                // Using Amypo Green for base items, White for selected
                                const colorCls = isSelected
                                    ? 'ring-2 ring-[#2F8D46] scale-[1.02] bg-[#2F8D46]/10 border-[#2F8D46]/30 shadow-sm'
                                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20';

                                return (
                                    <div
                                        key={inst.type}
                                        onPointerDown={() => handleSpawn(inst)}
                                        className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${colorCls}`}
                                    >
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/20 border border-white/5">
                                            <img src={inst.image} alt={inst.name} className="w-full h-full object-cover opacity-90" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold truncate tracking-tight ${isSelected ? 'text-white' : 'text-white'}`}>{inst.name}</p>
                                            <p className={`text-[9px] truncate leading-tight ${isSelected ? 'text-[#2F8D46]' : 'text-[#a0aab2]'}`}>
                                                {inst.type === 'wire' && isHoldingWire ? 'Holding Wire...' : inst.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Placed Instruments */}
                        {placedInstruments.length > 0 && (
                            <div className="border-t border-white/10 px-4 py-3 bg-black/10">
                                <p className="text-[10px] text-[#2F8D46]/50 uppercase tracking-widest pl-1 mb-2">On Table</p>
                                <div className="space-y-1">
                                    {placedInstruments.map((inst: any) => (
                                        <div key={inst.id} className="flex items-center justify-between group">
                                            <span className="text-[11px] font-medium text-white/50 group-hover:text-white transition-colors">{inst.name}</span>
                                            <button
                                                onClick={() => removeInstrument(inst.id)}
                                                className="text-white/20 hover:text-white hover:bg-white/5 p-1 rounded transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-4 py-3 border-t border-white/10 bg-black/20">
                            <p className="text-[9px] text-[#2F8D46]/60 text-center uppercase tracking-widest font-bold">Click to place · Drag to position</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#404446]/90 backdrop-blur-md p-3 rounded-2xl border border-white/5 text-[#a0aab2] hover:text-[#2F8D46] hover:bg-white/10 transition-all shadow-xl"
                >
                    <Box className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
