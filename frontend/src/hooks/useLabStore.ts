'use client';

import { create } from 'zustand';

export interface Terminal {
    id: string;
    instrumentId: string;
    position: [number, number, number];
}

export interface Connection {
    id: string;
    from: string;
    to: string;
}

export interface Instrument {
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    terminals: Terminal[];
    isFixed?: boolean;
}

export interface Observation {
    trial: number;
    R: number;
    l: number;
    X: number;
}

interface LabState {
    placedInstruments: Instrument[];
    connections: Connection[];
    activeTerminal: string | null;
    deflection: number;
    instrumentValues: Record<string, number>;
    observations: Observation[];
    isLocked: boolean;
    isStaticMode: boolean;
    isHoldingWire: boolean;
    setHoldingWire: (val: boolean) => void;
    toggleStaticMode: () => void;
    addInstrument: (type: string, name: string, terminals: Terminal[], id: string, position: [number, number, number]) => void;
    removeInstrument: (id: string) => void;
    updateInstrument: (id: string, updates: Partial<Instrument>) => void;
    toggleInstrumentFixed: (id: string) => void;
    updateInstrumentValue: (id: string, value: number) => void;
    setActiveTerminal: (id: string | null) => void;
    addConnection: (from: string, to: string) => void;
    setDeflection: (val: number) => void;
    addObservation: (obs: Observation) => void;
    clearObservations: () => void;
    toggleLock: () => void;
}

export const useLabStore = create<LabState>((set) => ({
    placedInstruments: [],
    connections: [],
    activeTerminal: null,
    deflection: 0,
    instrumentValues: {},
    observations: [],
    isLocked: false,
    isStaticMode: false,
    isHoldingWire: false,
    setHoldingWire: (val) => set({ isHoldingWire: val }),
    toggleStaticMode: () => set((state) => ({ isStaticMode: !state.isStaticMode })),
    toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),
    addInstrument: (type, name, terminals, id, position) => set((state) => {
        return {
            placedInstruments: [
                ...state.placedInstruments,
                { id, type, name, position, rotation: [0, 0, 0], terminals, isFixed: false }
            ],
            instrumentValues: {
                ...state.instrumentValues,
                [id]: type === 'battery' ? 2 : (type === 'resistance_box' ? 5 : (type === 'plug_key' ? 0 : 0))
            }
        };
    }),
    removeInstrument: (id) => set((state) => {
        const instrument = state.placedInstruments.find(i => i.id === id);
        const terminalIds = instrument?.terminals.map(t => t.id) || [];
        const newValues = { ...state.instrumentValues };
        delete newValues[id];
        return {
            placedInstruments: state.placedInstruments.filter(inst => inst.id !== id),
            connections: state.connections.filter(conn =>
                !terminalIds.includes(conn.from) && !terminalIds.includes(conn.to)
            ),
            instrumentValues: newValues
        };
    }),
    updateInstrument: (id, updates) => set((state) => ({
        placedInstruments: state.placedInstruments.map(inst =>
            inst.id === id ? { ...inst, ...updates } : inst
        )
    })),
    toggleInstrumentFixed: (id) => set((state) => ({
        placedInstruments: state.placedInstruments.map(inst =>
            inst.id === id ? { ...inst, isFixed: !inst.isFixed } : inst
        )
    })),
    setActiveTerminal: (id) => set({ activeTerminal: id }),
    addConnection: (from, to) => set((state) => {
        const id = from < to ? `${from}-${to}` : `${to}-${from}`;
        if (state.connections.some(c => c.id === id)) return { activeTerminal: null };

        return {
            connections: [...state.connections, { id, from, to }],
            activeTerminal: null
        };
    }),
    setDeflection: (val) => set({ deflection: val }),
    updateInstrumentValue: (id, value) => set((state) => ({
        instrumentValues: { ...state.instrumentValues, [id]: value }
    })),
    addObservation: (obs) => set((state) => ({
        observations: [...state.observations, obs]
    })),
    clearObservations: () => set({ observations: [] }),
}));
