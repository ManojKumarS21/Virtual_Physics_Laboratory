'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Beaker, Atom, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#2d3032] flex items-center justify-center p-6 select-none font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-5xl flex flex-col items-center"
            >
                {/* Amypo Branding */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="mb-12 relative"
                >
                    <Image 
                        src="/amypo_technologies_logo.png" 
                        alt="Amypo Technologies" 
                        width={300} 
                        height={80} 
                        className="h-auto w-full max-w-[280px] md:max-w-[320px] object-contain drop-shadow-xl"
                        priority
                    />
                </motion.div>

                {/* Main Interaction Realm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                    
                    {/* Chemistry Module */}
                    <Link href="/chemistry-lab" className="group h-full block">
                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            className="h-full flex flex-col items-center justify-center p-10 overflow-hidden rounded-[2rem] bg-[#404446]/90 border border-white/5 group-hover:border-[#2F8D46]/40 transition-all duration-300 shadow-2xl"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-[#2F8D46]/10 flex items-center justify-center mb-6 group-hover:bg-[#2F8D46]/20 transition-colors">
                                <Beaker className="w-10 h-10 text-[#2F8D46]" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase">Chemistry Lab</h2>
                            <p className="text-sm text-white/50 text-center mb-8 max-w-[240px]">
                                Interactive Molecular & Reaction Dynamics Environment
                            </p>
                            
                            <div className="flex items-center gap-2 text-[#2F8D46] font-semibold text-sm tracking-wide group-hover:translate-x-2 transition-transform">
                                ENTER LAB <ChevronRight className="w-4 h-4" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Physics Module */}
                    <Link href="/physics-lab" className="group h-full block">
                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            className="h-full flex flex-col items-center justify-center p-10 overflow-hidden rounded-[2rem] bg-[#404446]/90 border border-white/5 group-hover:border-[#2F8D46]/40 transition-all duration-300 shadow-2xl"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-[#2F8D46]/10 flex items-center justify-center mb-6 group-hover:bg-[#2F8D46]/20 transition-colors">
                                <Atom className="w-10 h-10 text-[#2F8D46]" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase">Physics Lab</h2>
                            <p className="text-sm text-white/50 text-center mb-8 max-w-[240px]">
                                Advanced Electromagnetic & Mechanical Simulations
                            </p>
                            
                            <div className="flex items-center gap-2 text-[#2F8D46] font-semibold text-sm tracking-wide group-hover:translate-x-2 transition-transform">
                                ENTER LAB <ChevronRight className="w-4 h-4" />
                            </div>
                        </motion.div>
                    </Link>

                </div>
            </motion.div>
        </main>
    );
}
