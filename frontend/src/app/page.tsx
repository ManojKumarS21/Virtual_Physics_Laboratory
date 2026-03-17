'use client';

import { Beaker, Link } from "lucide-react";


export default function Home() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#0a2538]">
            <Link
                href="/chemistry-lab"
                className="flex items-center justify-center gap-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-white rounded-2xl py-4 transition-all group"
            >
                <Beaker className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold tracking-wide">CHEM LAB</span>
            </Link>

            <Link
                href="/physics-lab"
                className="flex items-center justify-center gap-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-white rounded-2xl py-4 transition-all group"
            >
                <Beaker className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold tracking-wide">PHYSICS LAB</span>
            </Link>
        </main>
    );
}
