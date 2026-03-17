"use client";

import { LabScene } from "@/components/chemistry/LabScene";
import { LabHUD } from "@/components/chemistry/LabHUD";
import { LabProvider } from "@/lib/chemistry/LabContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChemistryLabPage() {
  return (
    <LabProvider>
      <main className="relative w-full h-screen overflow-hidden bg-[#0b0f1a]">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl
            bg-white/5 backdrop-blur-md border border-white/10
            text-white/60 hover:text-white hover:bg-white/10
            transition-all duration-200 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <LabHUD />
        <LabScene />
      </main>
    </LabProvider>
  );
}
