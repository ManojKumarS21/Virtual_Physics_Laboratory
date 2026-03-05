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

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]">
            {/* 3D Scene - Full screen */}
            <div className="absolute inset-0">
                {mounted && <Scene />}
            </div>

            {/* Lab Header */}
            <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between pointer-events-none z-10">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tighter leading-none">
                        VirtualPhysics<span className="text-blue-400">Lab</span>
                    </h1>
                    <p className="text-white/40 text-xs font-medium mt-0.5">Meter Bridge Experiment · Grade 12 Physics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => useLabStore.getState().toggleStaticMode()}
                        className={`pointer-events-auto px-4 py-1 rounded-full border transition-all flex items-center gap-2 group ${useLabStore(s => s.isStaticMode)
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 animate-pulse'
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${useLabStore(s => s.isStaticMode) ? 'bg-blue-400' : 'bg-green-400'}`} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">
                            {useLabStore(s => s.isStaticMode) ? 'STATIC MODE' : 'EDIT MODE'}
                        </span>
                    </button>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                        XR MODE
                    </span>
                </div>
            </div>

            {/* Left Panel - Lab Shelf */}
            <div className="absolute left-0 top-16 bottom-36 z-20 overflow-y-auto">
                <Shelf />
            </div>

            {/* Right Panel - Observations */}
            <div className="absolute right-4 top-16 bottom-36 z-20 overflow-y-auto">
                <ObservationSystem />
            </div>

            {/* Bottom HUD - Connection guide & live data */}
            <LabHUD />

            {/* Theory Button */}
            <TheoryPanel />
        </main>
    );
}
