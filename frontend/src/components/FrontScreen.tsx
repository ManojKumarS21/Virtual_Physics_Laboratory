'use client';

import { motion } from 'framer-motion';
import { Play, FlaskConical, BookOpen, Beaker } from 'lucide-react';
import Link from 'next/link';
import { useLabStore } from '../hooks/useLabStore';
import { initWorkoutInstruments } from '../components/WorkoutMode';

export default function FrontScreen() {
    const currentScreen = useLabStore(s => s.currentScreen);
    const setScreen = useLabStore(s => s.setScreen);
    const setTourState = useLabStore(s => s.setTourState);

    if (currentScreen !== 'FRONT') return null;

    const handleStartTour = () => {
        setScreen('TOUR');
        setTourState({ isActive: true, stepIndex: 0 });
    };

    const handleWorkout = () => {
        initWorkoutInstruments();
        setScreen('WORKOUT');
        useLabStore.getState().setWorkoutState({ isActive: true, stepIndex: 1 });
    };

    const handlePractice = () => {
        setScreen('PRACTICE');
        useLabStore.getState().resetLab();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full mx-4 p-8 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto"
            >
                <div className="text-center mb-8">
                    <h2 className="text-[#2bb3a1] font-bold tracking-[0.2em] uppercase text-sm mb-2">Experiment 01</h2>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Meter Bridge Experiment</h1>
                    <div className="h-1 w-12 bg-[#2bb3a1] mx-auto mt-4 rounded-full" />
                </div>

                <div className="space-y-4 mb-10">
                    <p className="text-white/70 text-center leading-relaxed">
                        Learn how to determine the unknown resistance of a wire using the principle of a Wheatstone bridge. This experiment uses a 1-meter long wire to find the balancing point and calculate resistance with precision.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={handleStartTour}
                        className="flex items-center justify-center gap-3 bg-white/5 hover:bg-[#2bb3a1]/20 border border-white/10 hover:border-[#2bb3a1]/40 text-white rounded-2xl py-4 transition-all group"
                    >
                        <Play className="w-5 h-5 text-[#2bb3a1] group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wide">START TOUR</span>
                    </button>

                    <button
                        onClick={handleWorkout}
                        className="flex items-center justify-center gap-3 bg-white/5 hover:bg-[#e5e744]/20 border border-white/10 hover:border-[#e5e744]/40 text-white rounded-2xl py-4 transition-all group"
                    >
                        <FlaskConical className="w-5 h-5 text-[#e5e744] group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wide">WORKOUT</span>
                    </button>

                    <button
                        onClick={handlePractice}
                        className="flex items-center justify-center gap-3 bg-[#2bb3a1] hover:bg-[#259b8a] text-black rounded-2xl py-4 transition-all group"
                    >
                        <BookOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold tracking-wide">PRACTICE</span>
                    </button>

                    <Link
                        href="/chemistry-lab"
                        className="flex items-center justify-center gap-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-white rounded-2xl py-4 transition-all group"
                    >
                        <Beaker className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wide">CHEM LAB</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
