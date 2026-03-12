import React from 'react';

interface AmypoLogoProps {
    subtitle?: string;
}

const AmypoLogo: React.FC<AmypoLogoProps> = ({ subtitle = "Virtual Physics Lab" }) => {
    return (
        <div className="flex items-center gap-2 pointer-events-auto select-none">
            {/* Amypo Icon Symbol */}
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    {/* Stylized A / Mountain shape based on user logo image */}
                    <path
                        d="M10 90 L55 10 L100 90 H78 L55 45 L32 90 Z"
                        fill="black"
                    />
                </svg>
            </div>

            {/* Amypo Text */}
            <div className="flex flex-col -mt-0.5">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black italic tracking-tighter text-[#2F8D46] leading-none uppercase"
                        style={{ transform: 'skewX(-4deg)', textShadow: '0 0.5px 1px rgba(0,0,0,0.1)' }}>
                        Amypo
                    </h1>
                    <div className="h-[1.5px] w-full bg-[#2F8D46] mt-0.5 rounded-full opacity-30" />
                </div>
                <p className="text-[#2F8D46]/80 text-[8px] font-bold tracking-[0.2em] mt-1 uppercase pl-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

export default AmypoLogo;
