import { useLabStore, Observation } from '../hooks/useLabStore';
import { Save, Trash2, ZapOff, Zap, Lock, LockOpen, RotateCcw } from 'lucide-react';

export default function LabHUD() {
    const placedInstruments = useLabStore(s => s.placedInstruments);
    const connections = useLabStore(s => s.connections);
    const undoConnection = useLabStore(s => s.undoConnection);
    const instrumentValues = useLabStore(s => s.instrumentValues);
    const deflection = useLabStore(s => s.deflection);
    const observations = useLabStore(s => s.observations);
    const currentL = useLabStore(s => s.currentL);
    const addObservation = useLabStore(s => s.addObservation);
    const clearObservations = useLabStore(s => s.clearObservations);

    const isLocked = useLabStore(s => s.isLocked);
    const toggleLock = useLabStore(s => s.toggleLock);
    const isStaticMode = useLabStore(s => s.isStaticMode);
    const simulationError = useLabStore(s => s.simulationError);

    const battery = placedInstruments.find(i => i.type === 'battery');
    const resBox = placedInstruments.find(i => i.type === 'resistance_box');
    const meterBridge = placedInstruments.find(i => i.type === 'meter_bridge');
    const jockey = placedInstruments.find(i => i.type === 'jockey');
    const galvanometer = placedInstruments.find(i => i.type === 'galvanometer');
    const plugKey = placedInstruments.find(i => i.type === 'plug_key');

    const R = resBox ? (instrumentValues[resBox.id] || 5) : 0;
    const voltage = battery ? (instrumentValues[battery.id] || 2) : 0;
    const plugClosed = plugKey ? instrumentValues[plugKey.id] === 1 : false;

    // source of truth from store
    const l = currentL;
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
        // Senior Detail: Dynamic Instruction
        if (nextStep.label === 'Find null point (G = 0)' && l === -1 && jockey && meterBridge) {
            currentStepLabel = 'Press Jockey on Wire';
        }
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
            <div className="bg-[#0a2538]/90 backdrop-blur-xl border-t border-[#2bb3a1]/20 h-24 flex items-center shadow-[0_-5px_25px_rgba(10,37,56,0.5)]">
                <div className="flex items-stretch gap-0 w-full h-full overflow-hidden">

                    {/* Next Step */}
                    <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 bg-[#2bb3a1]/10 border-r border-[#2bb3a1]/20 min-w-[200px]">
                        <div className="w-2 h-2 rounded-full bg-[#e5e744] animate-pulse shadow-[0_0_8px_rgba(229,231,68,0.8)]"></div>
                        <div>
                            <p className="text-[9px] text-[#2bb3a1] uppercase tracking-widest font-bold">Task</p>
                            <p className="text-[13px] text-white font-bold leading-tight line-clamp-2">
                                {instruction}
                            </p>
                        </div>
                    </div>

                    {/* Galvanometer */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-[#2bb3a1]/20 text-center min-w-[130px] bg-[#0a2538]/40">
                        <p className="text-[9px] text-[#2bb3a1]/70 uppercase tracking-widest font-bold mb-0.5">Galvanometer</p>
                        <p className={`text-2xl font-mono font-bold leading-tight ${nullPoint ? 'text-[#e5e744]' : 'text-white'}`}>
                            {!plugClosed ? '— —' : (simulationError ? '0 μA' : `${deflection > 0 ? '+' : ''}${(deflection * 100).toFixed(0)}`)}
                            <span className="text-[10px] ml-1 opacity-50">μA</span>
                        </p>
                        <p className={`text-[10px] font-bold leading-tight mt-0.5 ${nullPoint ? 'text-[#e5e744]/80' : 'text-[#2bb3a1]/50'}`}>
                            {nullPoint ? 'NULL' : !plugClosed ? 'Open' : (simulationError || (deflection > 0 ? '→' : '←'))}
                        </p>
                    </div>

                    {/* Balance Length */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-[#2bb3a1]/20 text-center min-w-[110px]">
                        <p className="text-[9px] text-[#2bb3a1]/70 uppercase tracking-widest font-bold mb-0.5">Length l</p>
                        <p className="text-2xl font-mono font-bold text-white leading-tight">
                            {l === -1 ? '— —' : `${l}`} <span className="text-[10px] opacity-40 text-[#2bb3a1]">cm</span>
                        </p>
                    </div>

                    {/* R */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-[#2bb3a1]/20 text-center min-w-[80px]">
                        <p className="text-[9px] text-[#2bb3a1]/70 uppercase tracking-widest font-bold mb-0.5">R</p>
                        <p className="text-2xl font-mono font-bold text-[#e5e744] leading-tight">{R} <span className="text-xs text-[#e5e744]/50">Ω</span></p>
                    </div>

                    {/* X (calculated) */}
                    <div className={`flex-shrink-0 flex flex-col justify-center px-6 py-2 border-r border-[#2bb3a1]/20 text-center min-w-[140px] ${nullPoint ? 'bg-[#2bb3a1]/10' : ''}`}>
                        <p className="text-[9px] text-[#2bb3a1]/70 uppercase tracking-widest font-bold mb-0.5">X = R(100-l)/l</p>
                        <p className="text-2xl font-mono font-bold text-[#e5e744] leading-tight">{plugClosed && l > 0 ? X : '—'} <span className="text-xs text-[#e5e744]/50">Ω</span></p>
                    </div>

                    {/* Battery */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 border-r border-[#2bb3a1]/20 text-center min-w-[80px]">
                        <p className="text-[9px] text-[#2bb3a1]/70 uppercase tracking-widest font-bold mb-0.5">V</p>
                        <p className="text-2xl font-mono font-bold text-white leading-tight">{voltage} <span className="text-xs text-[#2bb3a1]/50">V</span></p>
                    </div>

                    {/* Key Status */}
                    <div className="flex-shrink-0 flex flex-col justify-center px-4 py-2 border-r border-[#2bb3a1]/20 text-center min-w-[90px]">
                        <p className="text-[9px] text-[#2bb3a1]/70 uppercase tracking-widest font-bold mb-0.5">Key</p>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                            {plugClosed ? <Zap className="w-4 h-4 text-[#e5e744]" /> : <ZapOff className="w-4 h-4 text-white/40" />}
                            <p className={`text-sm font-bold ${plugClosed ? 'text-[#e5e744]' : 'text-white/40'}`}>
                                {plugClosed ? 'CLOSED' : 'OPEN'}
                            </p>
                        </div>
                    </div>

                    {/* Lock Workbench */}
                    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-r border-[#2bb3a1]/20 text-center">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={toggleLock}
                                title="Lock camera"
                                className={`p-2 rounded-lg border transition-all ${isLocked ? 'bg-[#2bb3a1]/20 text-[#2bb3a1] border-[#2bb3a1]/40' : 'bg-[#0a2538]/50 text-[#e5e744]/70 border-[#e5e744]/20 hover:border-[#e5e744]/50'}`}
                            >
                                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[8px] text-[#2bb3a1]/50 uppercase mt-1">View</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-[#2bb3a1]/20 pl-3">
                            <button
                                onClick={() => useLabStore.getState().toggleStaticMode()}
                                title="Freeze instruments"
                                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${isStaticMode ? 'bg-[#2bb3a1]/20 text-[#2bb3a1] border-[#2bb3a1]/40' : 'bg-[#0a2538]/50 text-[#e5e744]/70 border-[#e5e744]/20 hover:border-[#e5e744]/50'}`}
                            >
                                {isStaticMode ? 'STATIC' : 'FREE'}
                            </button>
                            <span className="text-[8px] text-[#2bb3a1]/50 uppercase mt-1">Movement</span>
                        </div>
                    </div>

                    {/* Save + Mean X */}
                    <div className="flex-shrink-0 flex items-center gap-2.5 px-4 border-r border-[#2bb3a1]/20">
                        <button
                            onClick={() => undoConnection()}
                            disabled={connections.length === 0}
                            className="flex items-center justify-center w-8 h-8 bg-[#0a2538]/50 hover:bg-[#2bb3a1]/20 disabled:opacity-20 text-white rounded-lg transition-all border border-[#2bb3a1]/30"
                            title="Undo"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={saveObservation}
                            disabled={!plugClosed || l <= 0}
                            className="flex items-center gap-2 bg-[#e5e744] hover:bg-white disabled:opacity-25 disabled:bg-[#e5e744]/50 text-[#0a2538] text-xs font-extrabold px-4 py-2 rounded-lg transition-all shadow-lg shadow-[#e5e744]/20"
                        >
                            <Save className="w-3.5 h-3.5" /> Save
                        </button>
                        {observations.length > 0 && (
                            <div className="text-center min-w-[50px] border-l border-[#2bb3a1]/20 pl-2">
                                <p className="text-[8px] text-[#2bb3a1]/60 uppercase">Mean X</p>
                                <p className="text-[13px] font-mono font-bold text-[#e5e744]">{meanX}Ω</p>
                            </div>
                        )}
                    </div>

                    {/* Connections info */}
                    <div className="flex-1 flex items-center px-4 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden py-1 opacity-60">
                            <span className="text-[8px] text-[#2bb3a1] uppercase tracking-tighter shrink-0">Wired:</span>
                            {connections.length > 0 && (
                                <span className="text-[9px] text-[#e5e744] font-bold">{connections.length} nodes</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
