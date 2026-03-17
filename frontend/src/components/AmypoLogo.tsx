import React from 'react';
import Image from 'next/image';

interface AmypoLogoProps {
    subtitle?: string;
}

const AmypoLogo: React.FC<AmypoLogoProps> = ({ subtitle = "Virtual Physics Lab" }) => {
    return (
        <div className="flex items-center gap-3 pointer-events-auto select-none">
            {/* Amypo Logo Image */}
            <div className="relative w-10 h-10 flex items-center justify-center">
                <Image 
                    src="/amypo_technologies_logo.png"
                    alt="Amypo"
                    width={40}
                    height={40}
                    className="object-contain"
                />
            </div>

            {/* Amypo Text */}
            <div className="flex flex-col -mt-0.5">
                <h1 className="text-xl font-black italic tracking-tighter text-[#2F8D46] leading-none uppercase"
                    style={{ transform: 'skewX(-4deg)', textShadow: '0 0.5px 1px rgba(0,0,0,0.1)' }}>
                    Amypo
                </h1>
                <p className="text-[#2F8D46]/80 text-[8px] font-bold tracking-[0.2em] mt-1 uppercase pl-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

export default AmypoLogo;
