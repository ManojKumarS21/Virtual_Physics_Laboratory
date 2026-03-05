import { useLabStore, Observation } from '../hooks/useLabStore';
import { Save, Trash2, ZapOff, Zap, Lock, LockOpen } from 'lucide-react';

export default function LabHUD() {
    const placedInstruments = useLabStore(s => s.placedInstruments);
    const connections = useLabStore(s => s.connections);
    const instrumentValues = useLabStore(s => s.instrumentValues);
    const deflection = useLabStore(s => s.deflection);
    const observations = useLabStore(s => s.observations);
    const addObservation = useLabStore(s => s.addObservation);
    const clearObservations = useLabStore(s => s.clearObservations);

    const isLocked = useLabStore(s => s.isLocked);
    const toggleLock = useLabStore(s => s.toggleLock);

    const battery = placedInstruments.find(i => i.type === 'battery');
    const resBox = placedInstruments.find(i => i.type === 'resistance_box');
    const meterBridge = placedInstruments.find(i => i.type === 'meter_bridge');
    const jockey = placedInstruments.find(i => i.type === 'jockey');
    const galvanometer = placedInstruments.find(i => i.type === 'galvanometer');
    const plugKey = placedInstruments.find(i => i.type === 'plug_key');

    const R = resBox ? (instrumentValues[resBox.id] || 5) : 0;
    const voltage = battery ? (instrumentValues[battery.id] || 2) : 0;
    const plugClosed = plugKey ? instrumentValues[plugKey.id] === 1 : false;

    // Jockey position along bridge (0-100 cm)
    let l = 0;
    if (jockey && meterBridge) {
        const relX = jockey.position[0] - meterBridge.position[0];
        l = parseFloat(Math.max(0, Math.min(100, ((relX + 5.25) / 10.5) * 100)).toFixed(1));
    }

    const X = (plugClosed && l > 0 && l < 100) ? parseFloat((R * (100 - l) / l).toFixed(2)) : 0;
    const nullPoint = Math.abs(deflection) < 0.05 && plugClosed && l > 0;

    const saveObservation = () => {
        if (!plugClosed || l <= 0) return;
        addObservation({ trial: observations.length + 1, R, l, X });
    };

    const isHoldingWire = useLabStore(s => s.isHoldingWire);

    // Guide steps
    const steps = [
        { done: !!battery, label: 'Place Battery' },
        { done: !!meterBridge, label: 'Place Meter Bridge' },
        { done: !!resBox, label: 'Place Resistance Box' },
        { done: !!galvanometer, label: 'Place Galvanometer' },
        { done: !!plugKey, label: 'Place Plug Key' },
        { done: !!jockey, label: 'Place Jockey' },
        { done: connections.length >= 3, label: 'Connect the circuit' },
        { done: plugClosed, label: 'Close Plug Key (click it)' },
        { done: nullPoint, label: 'Find null point (G = 0)' },
    ];
    const nextStep = steps.find(s => !s.done);

    let currentStepLabel = '';
    if (nextStep) {
        currentStepLabel = nextStep.label;
    } else {
        currentStepLabel = '✅ Complete!';
    }

    // Override if holding wire or needs to take one
    const needsWire = !nextStep && connections.length < 3; // Simplified
    const instruction = isHoldingWire
        ? 'Click two terminals to connect'
        : (nextStep?.label === 'Connect the circuit' ? 'Take wire from shelf' : currentStepLabel);

    const meanX = observations.length > 0
        ? (observations.reduce((s, o) => s + o.X, 0) / observations.length).toFixed(2)
        : '—';

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30 select-none">

            {/* Main HUD Bar */}
            <div className="bg-black/85 backdrop-blur-xl border-t border-white/10">
                <div className="flex items-stretch gap-0 overflow-x-auto">

                    {/* Next Step */}
                    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-blue-600/10 border-r border-white/10 min-w-[200px]">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <div>
                            <p className="text-[9px] text-blue-300/50 uppercase tracking-widest">Next</p>
                            <p className="text-xs text-blue-300 font-bold leading-tight">
                                {instruction}
                            </p>
                        </div>
                    </div>

                    {/* Galvanometer */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-white/10 text-center min-w-[130px]">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Galvanometer</p>
                        <p className={`text-lg font-mono font-bold leading-tight ${nullPoint ? 'text-green-400' : 'text-red-400'}`}>
                            {plugClosed ? `${deflection > 0 ? '+' : ''}${(deflection * 100).toFixed(0)} μA` : '— —'}
                        </p>
                        <p className="text-[9px] text-white/25 leading-tight">
                            {nullPoint ? '● NULL POINT' : plugClosed ? (deflection > 0 ? '→ right' : '← left') : 'Key open'}
                        </p>
                    </div>

                    {/* Balance Length */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-white/10 text-center min-w-[110px]">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Length l</p>
                        <p className="text-lg font-mono font-bold text-white leading-tight">{l} <span className="text-xs text-white/30">cm</span></p>
                    </div>

                    {/* R */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-white/10 text-center min-w-[100px]">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">R (known)</p>
                        <p className="text-lg font-mono font-bold text-yellow-400 leading-tight">{R} <span className="text-xs text-white/30">Ω</span></p>
                        <p className="text-[9px] text-white/20">Click box</p>
                    </div>

                    {/* X (calculated) */}
                    <div className={`flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-white/10 text-center min-w-[130px] ${nullPoint ? 'bg-purple-500/10' : ''}`}>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">X = R(100-l)/l</p>
                        <p className="text-lg font-mono font-bold text-purple-400 leading-tight">{plugClosed && l > 0 ? X : '—'} <span className="text-xs text-white/30">Ω</span></p>
                    </div>

                    {/* Voltage */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-white/10 text-center min-w-[100px]">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Battery</p>
                        <p className="text-lg font-mono font-bold text-cyan-400 leading-tight">{voltage} <span className="text-xs text-white/30">V</span></p>
                        <p className="text-[9px] text-white/20">Click battery</p>
                    </div>

                    {/* Key Status */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-white/10 text-center min-w-[90px]">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Key</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                            {plugClosed ? <Zap className="w-3.5 h-3.5 text-green-400" /> : <ZapOff className="w-3.5 h-3.5 text-red-400" />}
                            <p className={`text-xs font-bold ${plugClosed ? 'text-green-400' : 'text-red-400'}`}>
                                {plugClosed ? 'CLOSED' : 'OPEN'}
                            </p>
                        </div>
                        <p className="text-[9px] text-white/20">Click key</p>
                    </div>

                    {/* Lock Workbench */}
                    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-r border-white/10 text-center">
                        <div className="flex flex-col justify-center">
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">Workbench</p>
                            <button
                                onClick={toggleLock}
                                title="Lock camera rotation"
                                className={`flex items-center justify-center gap-1 mt-0.5 px-3 py-1 rounded-full border transition-all ${isLocked ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'}`}
                            >
                                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                                <span className="text-xs font-bold">{isLocked ? 'LOCKED' : 'FREE'}</span>
                            </button>
                        </div>
                        <div className="flex flex-col justify-center border-l border-white/5 pl-3">
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">Instruments</p>
                            <button
                                onClick={() => useLabStore.getState().toggleStaticMode()}
                                title="Freeze all instruments"
                                className={`flex items-center justify-center gap-1 mt-0.5 px-3 py-1 rounded-full border transition-all ${useLabStore(s => s.isStaticMode) ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'}`}
                            >
                                <span className="text-xs font-bold">{useLabStore(s => s.isStaticMode) ? 'STATIC' : 'MOVABLE'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Save + Mean X */}
                    <div className="flex-shrink-0 flex items-center gap-4 px-5 border-r border-white/10">
                        <button
                            onClick={saveObservation}
                            disabled={!plugClosed || l <= 0}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-25 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
                        >
                            <Save className="w-3 h-3" /> Save Trial
                        </button>
                        {observations.length > 0 && (
                            <div className="text-center">
                                <p className="text-[9px] text-white/30">Mean X ({observations.length})</p>
                                <p className="text-base font-mono font-bold text-green-400">{meanX} Ω</p>
                            </div>
                        )}
                    </div>

                    {/* Connections info */}
                    <div className="flex-1 flex items-center px-4 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] text-white/20 uppercase tracking-widest shrink-0">Circuit:</span>
                            {connections.length === 0 ? (
                                <span className="text-[9px] text-white/15">Click a terminal dot, then click another to wire · Green = connected, Yellow = selected</span>
                            ) : (
                                connections.slice(0, 4).map(c => (
                                    <span key={c.id} className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                        {c.from.split('_').slice(0, -1).join('_').substring(0, 6)} ↔ {c.to.split('_').slice(0, -1).join('_').substring(0, 6)}
                                    </span>
                                ))
                            )}
                            {connections.length > 4 && (
                                <span className="text-[9px] text-white/30">+{connections.length - 4} more</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
