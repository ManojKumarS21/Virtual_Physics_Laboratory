'use client';

import { useState, useEffect } from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import Scene from '../../lab/Scene';
import Shelf from '../../lab/Shelf';
import { QRCodeCanvas } from 'qrcode.react';
import ObservationSystem from '../../experiments/ObservationSystem';
import TheoryPanel from '../../experiments/TheoryPanel';
import LabHUD from '../../lab/LabHUD';
import { useLabStore } from '../../hooks/useLabStore';
import AmypoLogo from '../../components/AmypoLogo';
import GuidedTour from '../../components/GuidedTour';
import WelcomeScreen from '../../components/WelcomeScreen';
import FrontScreen from '../../components/FrontScreen';
import WorkoutMode from '../../components/WorkoutMode';
import GalvanometerMonitor from '../../components/instruments/GalvanometerMonitor';

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const isStaticMode = useLabStore(s => s.isStaticMode);
    const currentScreen = useLabStore(s => s.currentScreen);
    const showQR = useLabStore(s => s.showQR);
    const setShowQR = useLabStore(s => s.setShowQR);

    useEffect(() => {
        setMounted(true);
        // Reset lab state on mount to ensure welcome animation plays
        const store = useLabStore.getState();
        store.resetLab();
        store.setScreen('WELCOME');
    }, []);

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
                            className="pointer-events-auto p-2 rounded-full border border-[#2F8D46]/40 bg-[#2F8D46]/10 text-white hover:bg-[#2F8D46]/20 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(47,141,70,0.1)]"
                            title="Back to Welcome Screen"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#2F8D46]" />
                        </button>
                        <AmypoLogo subtitle="METER BRIDGE EXPERIMENT" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => useLabStore.getState().toggleStaticMode()}
                            className={`pointer-events-auto px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(47,141,70,0.15)] ${isStaticMode
                                ? 'bg-[#2F8D46]/20 text-[#2F8D46] border-[#2F8D46]/40 hover:bg-[#2F8D46]/30'
                                : 'bg-[#ffffff]/20 text-[#ffffff] border-[#ffffff]/40 hover:bg-[#ffffff]/30 animate-pulse'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${isStaticMode ? 'bg-[#2F8D46]' : 'bg-[#ffffff]'}`} />
                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                {isStaticMode ? 'STATIC MODE' : 'EDIT MODE'}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* AR QR Modal */}
            {showQR && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-8">
                    <div className="relative max-w-sm w-full max-h-[90vh] overflow-y-auto bg-[#0a2538]/95 border border-[#2F8D46]/40 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(47,141,70,0.3)] animate-in fade-in zoom-in duration-300 custom-scrollbar">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10"
                        >
                            <span className="text-xl">×</span>
                        </button>

                        <div className="mb-4 mx-auto w-12 h-12 bg-[#2F8D46]/10 rounded-xl flex items-center justify-center border border-[#2F8D46]/20 group">
                            <svg className="w-6 h-6 text-[#2F8D46] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Experience AR</h2>
                        <p className="text-white/50 text-[10px] mb-6 font-medium leading-tight">Scan to bridge the laboratory into your physical environment</p>

                        <div className="mb-6 px-2">
                            <label className="block text-[#2F8D46] text-[9px] font-black tracking-widest uppercase mb-1.5 text-left opacity-60">
                                PC Network IP Address
                            </label>
                            <input
                                type="text"
                                value={localIP}
                                onChange={(e) => setLocalIP(e.target.value)}
                                placeholder="Enter Local IP"
                                className="w-full bg-white/5 border border-[#2F8D46]/30 rounded-lg px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#2F8D46] transition-all font-mono text-center"
                            />
                        </div>

                        <div className="relative aspect-square w-full max-w-[200px] mx-auto mb-6 bg-white rounded-[2rem] p-6 border-6 border-white group flex items-center justify-center shadow-xl transition-transform hover:scale-105 duration-500">
                            {arUrl && (
                                <QRCodeCanvas
                                    value={arUrl}
                                    size={160}
                                    level="H"
                                    includeMargin={false}
                                    className="w-full h-full"
                                />
                            )}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#2F8D46] shadow-[0_0_20px_#2F8D46] animate-[scan_3s_ease-in-out_infinite] pointer-events-none opacity-40" />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <details className="w-full text-left group">
                                <summary className="w-full py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[8px] font-black tracking-widest hover:bg-white/10 hover:text-white transition-all uppercase px-4 cursor-pointer list-none flex justify-between items-center group-open:bg-yellow-500/10 group-open:border-yellow-500/20 group-open:text-yellow-500">
                                    <span>MOBILE SETUP GUIDE</span>
                                    <svg className="w-2.5 h-2.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="mt-1.5 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg space-y-2">
                                     <p className="text-white/60 text-[8px] leading-relaxed italic">
                                        WebXR requires a secure context or manual whitelist in Chrome:
                                     </p>
                                     <div className="p-1.5 bg-black/40 rounded-lg text-[7px] font-mono text-yellow-500/80 break-all border border-white/5 select-all">
                                        chrome://flags/#unsafely-treat-insecure-origin-as-secure
                                     </div>
                                     <p className="text-[7px] text-white/40 leading-relaxed font-medium">
                                        1. Add <b>{arUrl.replace('/ar', '')}</b> to whitelist.<br/>
                                        2. Set to <b>ENABLED</b> and <b>RELAUNCH</b>.
                                     </p>
                                </div>
                            </details>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(arUrl);
                                    const btn = document.getElementById('copy-btn');
                                    if (btn) btn.innerText = 'COPIED!';
                                    setTimeout(() => { if (btn) btn.innerText = 'COPY ACCESS LINK'; }, 2000);
                                }}
                                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[9px] font-black tracking-widest hover:bg-white/10 hover:text-white transition-all uppercase"
                                id="copy-btn"
                            >
                                COPY ACCESS LINK
                            </button>
                            
                            <button
                                onClick={() => setShowQR(false)}
                                className="w-full py-4 bg-[#2F8D46] hover:bg-[#2F8D46]/90 text-black font-black text-xs tracking-widest rounded-xl transition-all active:scale-[0.98] shadow-xl shadow-[#2F8D46]/20 uppercase"
                            >
                                Back To Laboratory
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { top: 10%; }
                    50% { top: 90%; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(47, 141, 70, 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(47, 141, 70, 0.6);
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
