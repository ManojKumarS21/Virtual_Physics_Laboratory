'use client';

import { useState, useEffect } from 'react';
import Scene from '../lab/Scene';
import Shelf from '../lab/Shelf';
import ObservationSystem from '../experiments/ObservationSystem';
import TheoryPanel from '../experiments/TheoryPanel';
import LabHUD from '../lab/LabHUD';
import { useLabStore } from '../hooks/useLabStore';

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const isStaticMode = useLabStore(s => s.isStaticMode);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#0a2538]">
            {/* 3D Scene - Full screen */}
            <div className="absolute inset-0">
                {mounted && <Scene />}
            </div>

            {/* Lab Header */}
            <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between pointer-events-none z-10">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#e5e744] tracking-tighter leading-none">
                        SKITECH <span className="text-[#2bb3a1]">VirtualLab</span>
                    </h1>
                    <p className="text-[#2bb3a1]/60 text-xs font-semibold mt-0.5 tracking-wide">METER BRIDGE EXPERIMENT</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => useLabStore.getState().toggleStaticMode()}
                        className={`pointer-events-auto px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(43,179,161,0.15)] ${isStaticMode
                            ? 'bg-[#2bb3a1]/20 text-[#2bb3a1] border-[#2bb3a1]/40 hover:bg-[#2bb3a1]/30'
                            : 'bg-[#e5e744]/20 text-[#e5e744] border-[#e5e744]/40 hover:bg-[#e5e744]/30 animate-pulse'
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${isStaticMode ? 'bg-[#2bb3a1]' : 'bg-[#e5e744]'}`} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">
                            {isStaticMode ? 'STATIC MODE' : 'EDIT MODE'}
                        </span>
                    </button>
                    <span className="px-3 py-1.5 bg-[#0a2538]/80 backdrop-blur-md text-[#2bb3a1] text-[10px] tracking-wider font-bold rounded-full border border-[#2bb3a1]/30 shadow-[0_0_10px_rgba(43,179,161,0.1)]">
                        XR READY
                    </span>
                </div>
            </div>

            {/* Left Panel - Lab Shelf */}
            <div className="absolute left-0 top-16 bottom-36 z-20 overflow-visible pointer-events-none flex flex-col">
                <Shelf />
            </div>

            {/* Right Panel - Observations */}
            <div className="absolute right-4 top-16 bottom-36 z-20 overflow-visible pointer-events-none flex flex-col items-end">
                <ObservationSystem />
            </div>

            {/* Bottom HUD - Connection guide & live data */}
            <LabHUD />

            {/* Theory Button */}
            <TheoryPanel />
        </main>
    );
}
