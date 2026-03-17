'use client';

import { useState, useEffect } from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import Scene from '../lab/Scene';
import Shelf from '../lab/Shelf';
import { QRCodeCanvas } from 'qrcode.react';
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

    const [showQR, setShowQR] = useState(false);
    const [arUrl, setArUrl] = useState('');
    const [localIP, setLocalIP] = useState('192.168.0.201');
    const showInterface = currentScreen === 'TOUR' || currentScreen === 'PRACTICE' || currentScreen === 'WORKOUT';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : '';
            if (localIP) {
                setArUrl(`${protocol}//${localIP}${port}/ar`);
            } else {
                setArUrl(`${window.location.origin}/ar`);
            }
        }
    }, [localIP]);

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
                        <button
                            onClick={() => setShowQR(true)}
                            className="pointer-events-auto px-3 py-1.5 bg-[#0a2538]/80 backdrop-blur-md text-[#2bb3a1] text-[10px] tracking-wider font-bold rounded-full border border-[#2bb3a1]/30 shadow-[0_0_10px_rgba(43,179,161,0.1)] hover:bg-[#2bb3a1]/10 transition-all hover:scale-105 active:scale-95"
                        >
                            XR READY
                        </button>
                    </div>
                </div>
            )}

            {/* AR QR Modal */}
            {showQR && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
                    <div className="relative max-w-sm w-full bg-[#0a2538]/90 border border-[#2bb3a1]/40 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(43,179,161,0.2)] animate-in fade-in zoom-in duration-300">
                        <button 
                            onClick={() => setShowQR(false)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="text-xl">×</span>
                        </button>

                        <div className="mb-6 mx-auto w-16 h-16 bg-[#2bb3a1]/10 rounded-2xl flex items-center justify-center border border-[#2bb3a1]/20 group">
                            <svg className="w-8 h-8 text-[#2bb3a1] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Experience AR</h2>
                        <p className="text-white/60 text-sm mb-6">Scan to open the laboratory in your physical space with WebXR</p>

                        <div className="mb-6 px-4">
                            <label className="block text-[#2bb3a1] text-[10px] font-bold tracking-widest uppercase mb-2 text-left opacity-60">
                                Local Machine IP (eg: 192.168.x.x)
                            </label>
                            <input 
                                type="text"
                                value={localIP}
                                onChange={(e) => setLocalIP(e.target.value)}
                                placeholder="Enter Local IP"
                                className="w-full bg-white/5 border border-[#2bb3a1]/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#2bb3a1] transition-colors"
                            />
                        </div>
                        
                        <div className="relative aspect-square w-full max-w-[240px] mx-auto mb-8 bg-white rounded-3xl p-6 border border-white/10 overflow-hidden group flex items-center justify-center">
                           {arUrl && (
                               <QRCodeCanvas 
                                   value={arUrl}
                                   size={200}
                                   level="H"
                                   includeMargin={false}
                                   className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                               />
                           )}
                           {/* Scanning line animation */}
                           <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#2bb3a1]/50 shadow-[0_0_15px_#2bb3a1] animate-[scan_3s_ease-in-out_infinite] pointer-events-none" />
                        </div>

                        <button
                            onClick={() => setShowQR(false)}
                            className="w-full py-4 bg-[#2bb3a1] hover:bg-[#2bb3a1]/90 text-black font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#2bb3a1]/20"
                        >
                            CLOSE PREVIEW
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { top: 5%; }
                    50% { top: 95%; }
                }
            `}</style>

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
