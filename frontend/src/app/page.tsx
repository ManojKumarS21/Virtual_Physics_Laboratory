'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Beaker, Atom } from 'lucide-react';

export default function Home() {

    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#121212] flex flex-col items-center justify-center p-2 md:p-4 select-none font-serif" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Subtle Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Amypo Branding - Top Left */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 md:top-6 md:left-6 z-50 pointer-events-auto"
            >
                <div className="relative group">
                    <img 
                        src="/amypo_brand_logo.png" 
                        alt="Amypo" 
                        className="h-8 md:h-12 w-auto object-contain transition-all duration-500"
                        style={{ 
                            filter: 'invert(1) hue-rotate(180deg) brightness(1.1) contrast(1.1)',
                            mixBlendMode: 'lighten'
                        }}
                    />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2 }}
                className="relative z-10 w-full max-w-4xl flex flex-col items-center"
            >
                {/* Center Title */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 md:mb-12 text-center"
                >
                    <h1 className="text-3xl md:text-5xl font-normal text-white tracking-[0.2em] uppercase drop-shadow-2xl" style={{ fontFamily: 'Times New Roman, serif' }}>
                        Amypo's Laboratories
                    </h1>
                    <div className="h-[1px] w-32 md:w-48 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent mx-auto mt-4 md:mt-6" />
                </motion.div>

                {/* Main Interaction Realm */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full justify-center items-stretch px-4 font-serif">
                    
                    {/* Chemistry Module */}
                    <div className="flex flex-col gap-3 md:gap-4 w-full max-w-sm">
                        <Link href="/chemistry-lab" className="group block relative h-[180px] md:h-[240px] overflow-hidden rounded-xl bg-black/40 border border-white/10 transition-all duration-700 hover:border-teal-500/40 backdrop-blur-md">
                            <div className="absolute inset-0 z-0">
                                <img
                                    src="/chemistry_bg.png"
                                    alt="Chemistry"
                                    className="w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-all duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            </div>

                            <div className="relative z-10 p-4 md:p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-3 md:mb-4 border border-white/5 group-hover:scale-105 transition-all duration-500">
                                    <Beaker className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
                                </div>
                                <h2 className="text-lg md:text-xl font-normal text-white mb-1 md:mb-2 tracking-[0.05em] uppercase">
                                    Chemistry Lab
                                </h2>
                                <p className="text-zinc-500 text-[10px] md:text-xs italic opacity-70">
                                    Molecular Dynamics
                                </p>
                            </div>
                        </Link>
                        <Link href="/chemistry-lab">
                            <button className="w-full py-3 px-6 border border-white/10 text-white/40 hover:text-black hover:bg-teal-500 hover:border-teal-500 font-normal tracking-[0.2em] uppercase rounded-lg transition-all duration-500 text-[9px] md:text-xs bg-white/5">
                                Enter Lab
                            </button>
                        </Link>
                    </div>

                    {/* Physics Module */}
                    <div className="flex flex-col gap-3 md:gap-4 w-full max-w-sm">
                        <Link href="/physics-lab" className="group block relative h-[180px] md:h-[240px] overflow-hidden rounded-xl bg-black/40 border border-white/10 transition-all duration-700 hover:border-teal-500/40 backdrop-blur-md">
                            <div className="absolute inset-0 z-0">
                                <img
                                    src="/physics_bg.png"
                                    alt="Physics"
                                    className="w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-all duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            </div>

                            <div className="relative z-10 p-4 md:p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-3 md:mb-4 border border-white/5 group-hover:scale-105 transition-all duration-500">
                                    <Atom className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
                                </div>
                                <h2 className="text-lg md:text-xl font-normal text-white mb-1 md:mb-2 tracking-[0.05em] uppercase">
                                    Physics Lab
                                </h2>
                                <p className="text-zinc-500 text-[10px] md:text-xs italic opacity-70">
                                    Physical Simulations
                                </p>
                            </div>
                        </Link>
                        <Link href="/physics-lab">
                            <button className="w-full py-3 px-6 border border-white/10 text-white/40 hover:text-black hover:bg-teal-500 hover:border-teal-500 font-normal tracking-[0.2em] uppercase rounded-lg transition-all duration-500 text-[9px] md:text-xs bg-white/5">
                                Enter Lab
                            </button>
                        </Link>
                    </div>

                </div>
            </motion.div>

            {/* Subtle Footer */}
            <div className="absolute bottom-4 md:bottom-6 text-center w-full z-0 opacity-20 pointer-events-none px-4">
                <p className="text-zinc-600 text-[7px] md:text-[9px] tracking-[0.4em] uppercase">
                    Amypo Systems Integrated v4.0.2
                </p>
            </div>
        </main>
    );
}
