'use client';

import { motion } from 'framer-motion';
import { Play, FlaskConical, BookOpen } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-2xl w-full bg-[#404446]/90 backdrop-blur-md rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative pointer-events-auto border border-white/5"
            >
                <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-[#2F8D46] tracking-[0.2em] uppercase mb-3">
                        Experiment 01
                    </span>
                    
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-2">
                        Meter Bridge Experiment
                    </h1>
                    
                    <div className="w-10 h-[3px] bg-[#2F8D46] rounded-full mt-3 mb-6" />
                    
                    <p className="text-[#a0aab2] text-sm leading-relaxed max-w-xl mx-auto mb-10">
                        Learn how to determine the unknown resistance of a wire using the principle of a Wheatstone bridge. This experiment uses a 1-meter long wire to find the balancing point and calculate resistance with precision.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Start Tour Button */}
                        <button
                            onClick={handleStartTour}
                            className="group flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all"
                        >
                            <Play className="w-5 h-5 text-[#2F8D46] transition-transform group-hover:scale-110" />
                            <div className="text-left leading-tight">
                                <span className="block text-white font-bold text-sm tracking-wider">START</span>
                                <span className="block text-white font-bold text-sm tracking-wider">TOUR</span>
                            </div>
                        </button>

                        {/* Workout Button */}
                        <button
                            onClick={handleWorkout}
                            className="group flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all"
                        >
                            <FlaskConical className="w-5 h-5 text-yellow-500 transition-transform group-hover:scale-110" />
                            <span className="block text-white font-bold text-sm tracking-wider">WORKOUT</span>
                        </button>

                        {/* Practice Button */}
                        <button
                            onClick={handlePractice}
                            className="group flex items-center gap-3 px-8 py-4 bg-[#2F8D46] hover:bg-[#329e4d] rounded-2xl transition-all shadow-lg"
                        >
                            <BookOpen className="w-5 h-5 text-black" />
                            <span className="block text-black font-black text-sm tracking-wider">PRACTICE</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
