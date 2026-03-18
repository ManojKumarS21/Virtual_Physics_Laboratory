'use client';

import { create } from 'zustand';
import * as THREE from 'three';

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
    trueValue: number; // For percentage error calculation
    setTrueValue: (val: number) => void;
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
    currentScreen: 'WELCOME' | 'FRONT' | 'TOUR' | 'PRACTICE' | 'WORKOUT';
    setScreen: (screen: 'WELCOME' | 'FRONT' | 'TOUR' | 'PRACTICE' | 'WORKOUT') => void;

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
    isSurfaceDetected: boolean;
    setIsSurfaceDetected: (val: boolean) => void;
    isARStable: boolean;
    setIsARStable: (val: boolean) => void;
    lastHitResult: any | null;
    setLastHitResult: (val: any | null) => void;
    showQR: boolean;
    setShowQR: (val: boolean) => void;
    initConnectedExperiment: (origin?: [number, number, number], rotation?: number) => void;
    canForcePlace: boolean;
    setCanForcePlace: (val: boolean) => void;
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
    trueValue: 5.0, 
    setTrueValue: (val) => set({ trueValue: val }),
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
    isSurfaceDetected: false,
    setIsSurfaceDetected: (val: boolean) => set({ isSurfaceDetected: val }),
    isARStable: false,
    setIsARStable: (val: boolean) => set({ isARStable: val }),
    lastHitResult: null,
    setLastHitResult: (val: any) => set({ lastHitResult: val }),
    showQR: false,
    setShowQR: (val) => set({ showQR: val }),
    initConnectedExperiment: (origin = [0, 2.05, 0], rotation = 0) => set((state) => {
        const instruments = [
            { type: 'battery', id: 'battery', name: 'Laclanche Cell', offset: [-4.8, 0, -1.2] },
            { type: 'plug_key', id: 'plug_key', name: 'Plug Key', offset: [-2.8, 0, -1.2] },
            { type: 'jockey', id: 'jockey', name: 'Jockey', offset: [-0.6, 0.1, -1.2] },
            { type: 'resistance_box', id: 'resistance_box', name: 'Resistance Box', offset: [2.0, 0.05, -1.2] },
            { type: 'galvanometer', id: 'galvanometer', name: 'Galvanometer', offset: [4.6, 0.05, -1.2] },
            { type: 'meter_bridge', id: 'meter_bridge', name: 'Meter Bridge', offset: [0, 0, 0.8] },
        ];

        const getTerminals = (type: string, id: string) => {
            switch (type) {
                case 'battery': return [{ id: `${id}_pos`, instrumentId: id, position: [-0.3, 1.1, 0] as [number, number, number] }, { id: `${id}_neg`, instrumentId: id, position: [0.3, 1.0, 0] as [number, number, number] }];
                case 'plug_key': return [{ id: `${id}_t1`, instrumentId: id, position: [-0.45, 0.525, 0.2] as [number, number, number] }, { id: `${id}_t2`, instrumentId: id, position: [0.45, 0.525, 0.2] as [number, number, number] }];
                case 'jockey': return [{ id: `${id}_t`, instrumentId: id, position: [0, 0.75, 0] as [number, number, number] }];
                case 'resistance_box': return [{ id: `${id}_t1`, instrumentId: id, position: [-0.9, 0.4, 0.8] as [number, number, number] }, { id: `${id}_t2`, instrumentId: id, position: [0.9, 0.4, 0.8] as [number, number, number] }];
                case 'galvanometer': return [{ id: `${id}_t1`, instrumentId: id, position: [0.5, 0.15, 0] as [number, number, number] }, { id: `${id}_t2`, instrumentId: id, position: [-0.5, 0.15, 0] as [number, number, number] }];
                case 'meter_bridge': return [
                    { id: `${id}_A1`, instrumentId: id, position: [-5.1, 0.3, 0.6] as [number, number, number] }, { id: `${id}_A2`, instrumentId: id, position: [-5.1, 0.3, -0.6] as [number, number, number] },
                    { id: `${id}_L1`, instrumentId: id, position: [-3.1, 0.3, -0.6] as [number, number, number] }, { id: `${id}_L2`, instrumentId: id, position: [-1.9, 0.3, -0.6] as [number, number, number] },
                    { id: `${id}_D`, instrumentId: id, position: [0, 0.3, -0.6] as [number, number, number] },
                    { id: `${id}_R1`, instrumentId: id, position: [1.9, 0.3, -0.6] as [number, number, number] }, { id: `${id}_R2`, instrumentId: id, position: [3.1, 0.3, -0.6] as [number, number, number] },
                    { id: `${id}_C1`, instrumentId: id, position: [5.1, 0.3, 0.6] as [number, number, number] }, { id: `${id}_C2`, instrumentId: id, position: [5.1, 0.3, -0.6] as [number, number, number] }
                ];
                default: return [];
            }
        };

        const spawnAt = (offset: number[]) => {
            const v = new THREE.Vector3(offset[0], offset[1], offset[2]);
            if (rotation !== 0) v.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
            return [origin[0] + v.x, origin[1] + v.y, origin[2] + v.z] as [number, number, number];
        };

        const placedInstruments = instruments.map(inst => ({
            id: inst.id,
            type: inst.type,
            name: inst.name,
            position: spawnAt(inst.offset),
            rotation: [0, rotation, 0] as [number, number, number],
            terminals: getTerminals(inst.type, inst.id),
            isFixed: true
        }));

        const connections = [
            { id: 'c1', from: 'battery_pos', to: 'meter_bridge_A1' },
            { id: 'c2', from: 'battery_neg', to: 'plug_key_t1' },
            { id: 'c3', from: 'plug_key_t2', to: 'meter_bridge_C1' },
            { id: 'c4', from: 'resistance_box_t1', to: 'meter_bridge_L1' },
            { id: 'c5', from: 'resistance_box_t2', to: 'meter_bridge_L2' },
            { id: 'c6', from: 'galvanometer_t1', to: 'meter_bridge_D' },
            { id: 'c7', from: 'jockey_t', to: 'galvanometer_t2' },
        ];

        return {
            ...state,
            placedInstruments,
            connections,
            isStaticMode: true,
            instrumentValues: {
                battery: 2,
                resistance_box: 5,
                plug_key: 1, // Closed by default in ready mode
                galvanometer: 0,
            }
        };
    }),
    canForcePlace: false,
    setCanForcePlace: (val) => set({ canForcePlace: val }),
}));
