'use client';

import { useState, useEffect } from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import Scene from '../lab/Scene';
import Shelf from '../lab/Shelf';
import ObservationSystem from '../experiments/ObservationSystem';
import TheoryPanel from '../experiments/TheoryPanel';
import LabHUD from '../lab/LabHUD';
import { useLabStore } from '../hooks/useLabStore';
import AmypoLogo from '../components/AmypoLogo';
import GuidedTour from '../components/GuidedTour';
import WelcomeScreen from '../components/WelcomeScreen';
import FrontScreen from '../components/FrontScreen';
import WorkoutMode from '../components/WorkoutMode';
import GalvanometerMonitor from '../components/instruments/GalvanometerMonitor';

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const isStaticMode = useLabStore(s => s.isStaticMode);
    const currentScreen = useLabStore(s => s.currentScreen);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showInterface = currentScreen === 'TOUR' || currentScreen === 'PRACTICE' || currentScreen === 'WORKOUT';

    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#0a2538]">
            {/* 3D Scene - Full screen */}
            <div className="absolute inset-0">
                {mounted && <Scene />}
            </div>

            <WelcomeScreen />
            <FrontScreen />

            {/* Lab Header */}
            {showInterface && (
                <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-center justify-between pointer-events-none z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                useLabStore.getState().resetLab();
                                useLabStore.getState().setScreen('WELCOME');
                            }}
                            className="pointer-events-auto p-2 rounded-full border border-[#2bb3a1]/40 bg-[#2bb3a1]/10 text-white hover:bg-[#2bb3a1]/20 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(43,179,161,0.1)]"
                            title="Back to Welcome Screen"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#2bb3a1]" />
                        </button>
                        <AmypoLogo subtitle="METER BRIDGE EXPERIMENT" />
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
            )}

            {/* Left Panel - Lab Shelf */}
            {showInterface && currentScreen !== 'WORKOUT' && (
                <div className="absolute left-0 top-16 bottom-36 z-20 overflow-visible pointer-events-none flex flex-col">
                    <Shelf />
                </div>
            )}

            {/* Right Panel - Observations */}
            {showInterface && currentScreen !== 'WORKOUT' && (
                <div className="absolute right-4 top-16 bottom-36 z-20 overflow-visible pointer-events-none flex flex-col items-end">
                    <ObservationSystem />
                </div>
            )}

            {/* Bottom HUD - Connection guide & live data */}
            {showInterface && <LabHUD />}

            {/* Theory Button */}
            {showInterface && <TheoryPanel />}

            {/* Guided Tour Overlay */}
            <GuidedTour />

            {/* Workout Mode Overlay */}
            <WorkoutMode />

            {/* Global Galvanometer Monitor */}
            <GalvanometerMonitor />
        </main>
    );
}
