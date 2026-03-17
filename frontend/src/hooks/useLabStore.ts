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
    visualDeflection: number; // For synchronized instrument animation
    instrumentValues: Record<string, number>;
    observations: Observation[];
    currentL: number; // Current balance length (0-100) or -1 if no contact
    isLocked: boolean;
    isStaticMode: boolean;
    isHoldingWire: boolean;
    heldInstrument: { id: string, type: string, name: string, terminals: any[] } | null;
    setHeldInstrument: (inst: { id: string, type: string, name: string, terminals: any[] } | null) => void;
    simulationError: string | null;
    setSimulationError: (error: string | null) => void;
    setHoldingWire: (val: boolean) => void;
    toggleStaticMode: () => void;
    addInstrument: (type: string, name: string, terminals: Terminal[], id: string, position: [number, number, number]) => void;
    removeInstrument: (id: string) => void;
    undoInstrument: () => void;
    updateInstrument: (id: string, updates: Partial<Instrument>) => void;
    toggleInstrumentFixed: (id: string) => void;
    updateInstrumentValue: (id: string, value: number) => void;
    setActiveTerminal: (id: string | null) => void;
    addConnection: (from: string, to: string) => void;
    undoConnection: () => void;
    setDeflection: (val: number) => void;
    setVisualDeflection: (val: number) => void;
    addObservation: (obs: Observation) => void;
    clearObservations: () => void;
    toggleLock: () => void;
    setCurrentL: (l: number) => void;
    
    // Global Settings
    language: 'en' | 'hi' | 'te' | 'mr';
    voiceEnabled: boolean;
    setLanguage: (lang: 'en' | 'hi' | 'te' | 'mr') => void;
    toggleVoice: () => void;

    // Screen State
    currentScreen: 'WELCOME' | 'SUBJECT_SELECTION' | 'FRONT' | 'TOUR' | 'PRACTICE' | 'WORKOUT';
    setScreen: (screen: 'WELCOME' | 'SUBJECT_SELECTION' | 'FRONT' | 'TOUR' | 'PRACTICE' | 'WORKOUT') => void;

    tourState: {
        isActive: boolean;
        stepIndex: number;
        isPaused: boolean;
    };
    tourHighlightedIds: string[];
    setTourState: (updates: Partial<LabState['tourState']>) => void;
    setTourHighlight: (ids: string[]) => void;
    setTourLanguage: (lang: 'en' | 'hi' | 'te' | 'mr') => void; // Deprecated, use setLanguage
    
    // Workout State
    workoutState: {
        isActive: boolean;
        stepIndex: number;
    };
    setWorkoutState: (updates: Partial<LabState['workoutState']>) => void;
    
    resetLab: () => void;
    
    // AR State
    arPlacementTrigger: boolean;
    setArPlacementTrigger: (val: boolean) => void;
    isARPlaced: boolean;
    setIsARPlaced: (val: boolean) => void;
    isXRPresenting: boolean;
    setIsXRPresenting: (val: boolean) => void;
}

export const useLabStore = create<LabState>((set) => ({
    placedInstruments: [],
    connections: [],
    activeTerminal: null,
    deflection: 0,
    visualDeflection: 0,
    instrumentValues: {},
    observations: [],
    currentL: -1,
    isLocked: false,
    isStaticMode: false,
    isHoldingWire: false,
    heldInstrument: null,
    setHeldInstrument: (inst) => set({ heldInstrument: inst }),
    simulationError: null,
    setSimulationError: (error) => set({ simulationError: error }),
    setHoldingWire: (val) => set({ isHoldingWire: val }),
    toggleStaticMode: () => set((state) => ({ isStaticMode: !state.isStaticMode })),
    toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),

    // Global Settings
    language: 'en',
    voiceEnabled: true,
    setLanguage: (lang) => set({ language: lang }),
    toggleVoice: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),

    // Screen Actions
    currentScreen: 'WELCOME',
    setScreen: (screen) => set({ currentScreen: screen }),
    addInstrument: (type, name, terminals, id, position) => set((state) => {
        // Prevent duplicate IDs
        if (state.placedInstruments.some(inst => inst.id === id)) {
            return state;
        }
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
            instrumentValues: newValues,
        };
    }),
    undoInstrument: () => set((state) => {
        // Find the last placed instrument that is NOT fixed
        const removableInstruments = state.placedInstruments.filter(inst => !inst.isFixed);
        if (removableInstruments.length === 0) return state;
        
        const lastInstrument = removableInstruments[removableInstruments.length - 1];
        const terminalIds = lastInstrument.terminals.map(t => t.id);
        const newValues = { ...state.instrumentValues };
        delete newValues[lastInstrument.id];
        
        return {
            placedInstruments: state.placedInstruments.filter(inst => inst.id !== lastInstrument.id),
            connections: state.connections.filter(conn => 
                !terminalIds.includes(conn.from) && !terminalIds.includes(conn.to)
            ),
            instrumentValues: newValues,
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
    undoConnection: () => set((state) => ({
        connections: state.connections.slice(0, -1)
    })),
    setDeflection: (val) => set({ deflection: val }),
    setVisualDeflection: (val) => set({ visualDeflection: val }),
    updateInstrumentValue: (id, value) => set((state) => ({
        instrumentValues: { ...state.instrumentValues, [id]: value }
    })),
    addObservation: (obs) => set((state) => ({
        observations: [...state.observations, obs]
    })),
    clearObservations: () => set({ observations: [] }),
    setCurrentL: (l: number) => set({ currentL: l }),

    tourState: {
        isActive: false,
        stepIndex: 0,
        isPaused: false,
    },
    tourHighlightedIds: [],
    setTourState: (updates) => set((state) => ({
        tourState: { ...state.tourState, ...updates }
    })),
    setTourHighlight: (ids) => set({ tourHighlightedIds: ids }),
    setTourLanguage: (lang) => set({ language: lang }),
    
    // Workout Initial State & Actions
    workoutState: {
        isActive: false,
        stepIndex: 1,
    },
    setWorkoutState: (updates) => set((state) => ({
        workoutState: { ...state.workoutState, ...updates }
    })),

    resetLab: () => set((state) => ({
        placedInstruments: [],
        connections: [],
        activeTerminal: null,
        deflection: 0,
        visualDeflection: 0,
        observations: [],
        currentL: -1,
        isLocked: false,
        isStaticMode: false,
        isHoldingWire: false,
        heldInstrument: null,
        simulationError: null,
        tourHighlightedIds: [],
        instrumentValues: {},
        tourState: { ...state.tourState, isActive: false, stepIndex: 0, isPaused: false },
        workoutState: { ...state.workoutState, isActive: false, stepIndex: 1 }
    })),

    // AR Actions
    arPlacementTrigger: false,
    setArPlacementTrigger: (val: boolean) => set({ arPlacementTrigger: val }),
    isARPlaced: false,
    setIsARPlaced: (val: boolean) => set({ isARPlaced: val }),
    isXRPresenting: false,
    setIsXRPresenting: (val: boolean) => set({ isXRPresenting: val }),
}));
