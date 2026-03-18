'use client';

import { Suspense, useState, useEffect } from 'react';
import ARScene from '../../components/ARScene';
import { useLabStore } from '../../hooks/useLabStore';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ARPage() {
    const { 
        isARPlaced,
        setArPlacementTrigger,
        isXRPresenting,
        resetLab,
        isSurfaceDetected,
        isARStable,
        canForcePlace,
        setCanForcePlace
    } = useLabStore();
    const [isSupported, setIsSupported] = useState<boolean | null>(null);

    // Timeout for manual placement
    useEffect(() => {
        if (isXRPresenting && !isARPlaced && !isARStable) {
            const timer = setTimeout(() => {
                setCanForcePlace(true);
            }, 5000); // 5 seconds
            return () => clearTimeout(timer);
        } else {
            setCanForcePlace(false);
        }
    }, [isXRPresenting, isARPlaced, isARStable, setCanForcePlace]);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && (navigator as any).xr) {
            (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
                setIsSupported(supported);
            });
        } else {
            setIsSupported(false);
        }
    }, []);

    if (isSupported === false) {
        return (
            <div className="min-h-screen bg-[#0a2538] flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">AR Not Supported</h2>
                    <div className="space-y-4 mb-8">
                        <p className="text-white/60">
                            Your device or browser does not support WebXR AR.
                        </p>
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-left">
                            <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2">Requirement Checklist:</h3>
                            <ul className="text-white/50 text-[11px] space-y-2 list-disc pl-4 leading-relaxed">
                                <li><strong className="text-white/70">Secure Connection:</strong> WebXR requires **HTTPS**. If using a local IP, ensure it's a secure context.</li>
                                <li><strong className="text-white/70">Compatible Browser:</strong> Use Google Chrome on Android or the **WebXR Viewer** app on iOS.</li>
                                <li><strong className="text-white/70">AR Services:</strong> Ensure "Google Play Services for AR" is installed (Android).</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2F8D46] text-black font-bold rounded-xl transition-all hover:scale-105">
                        <ArrowLeft className="w-4 h-4" />
                        BACK TO LAB
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
            {/* Standard UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 z-50 flex items-center justify-between pointer-events-none">
                <Link href="/" className="pointer-events-auto p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-2xl active:scale-90 transition-all hover:bg-black/80">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl border border-[#2F8D46]/40 rounded-full flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-right duration-500">
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2F8D46] animate-ping absolute" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2F8D46]" />
                    </div>
                    <span className="text-[#2F8D46] text-[10px] font-black tracking-[0.2em] uppercase">
                        {isXRPresenting ? 'AR ACTIVE' : 'SCANNING ENVIRONMENT'}
                    </span>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-full bg-[#0a2538] gap-4">
                    <div className="w-12 h-12 border-4 border-[#2F8D46] border-t-transparent rounded-full animate-spin" />
                    <div className="text-[#2F8D46] font-bold tracking-widest animate-pulse uppercase text-xs">CALIBRATING LENSES...</div>
                </div>
            }>
                <ARScene />
            </Suspense>

            {/* AR Session UI Overlay (Standard DOM) */}
            {isXRPresenting && (
                <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-between py-16 px-8">
                    <div className="mt-12 px-8 py-5 bg-black/80 backdrop-blur-2xl rounded-[2rem] border border-white/20 text-center shadow-2xl animate-in fade-in slide-in-from-top duration-1000">
                        <h3 className="text-white text-sm font-black tracking-[0.2em] uppercase mb-2">
                            {isARPlaced ? 'EXPERIMENT READY' : (isARStable ? 'SURFACE DETECTED' : 'SCANNING FOR SURFACE')}
                        </h3>
                        <p className="text-white/50 text-[10px] max-w-[220px] font-medium leading-relaxed mx-auto">
                            {isARPlaced 
                                ? 'Experiment is locked in place. You can now walk around it freely.' 
                                : (isARStable 
                                    ? 'Surface is stable. Tap the button below to place the equipment.' 
                                    : 'Move phone slowly to detect a table or floor surface.')
                            }
                        </p>
                    </div>

                    {!isARPlaced && (
                        <div className="flex flex-col gap-6 items-center animate-in fade-in slide-in-from-bottom duration-1000">
                           {isSurfaceDetected ? (
                                <button 
                                    onClick={() => setArPlacementTrigger(true)}
                                    className="pointer-events-auto px-12 py-6 rounded-[2.5rem] bg-[#2F8D46] text-black shadow-[0_25px_60px_rgba(47,141,70,0.6)] active:scale-90 transition-all border-4 border-white/30 flex flex-col items-center gap-1"
                                >
                                    <span className="font-black text-xl">PLACE EXPERIMENT</span>
                                    <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">
                                        SURFACE DETECTED - TAP TO SPAWN
                                    </span>
                                </button>
                           ) : (
                               canForcePlace && (
                                    <button 
                                        onClick={() => setArPlacementTrigger(true)}
                                        className="pointer-events-auto px-10 py-5 rounded-[2rem] bg-amber-500 text-black shadow-2xl active:scale-90 transition-all border-2 border-white/20 flex flex-col items-center gap-1"
                                    >
                                        <span className="font-bold">PLACE MANUALLY</span>
                                        <span className="text-[9px] opacity-70 font-bold uppercase tracking-wider">
                                            SPAWN AT RED BOX POSITION
                                        </span>
                                    </button>
                               )
                           )}
                            
                            <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
                                <div className={`w-2 h-2 rounded-full ${isSurfaceDetected ? 'bg-[#2F8D46] animate-pulse' : 'bg-white/20 animate-ping'}`} />
                                <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                                    {isSurfaceDetected ? 'READY TO PLACE' : 'SCANNING ENVIRONMENT...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {isARPlaced && (
                        <button 
                            onClick={() => {
                                resetLab();
                                useLabStore.getState().setIsARPlaced(false);
                            }}
                            className="pointer-events-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase rounded-2xl backdrop-blur-xl border border-white/20 transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                            RESET POSITION
                        </button>
                    )}
                </div>
            )}
        </main>
    );
}
