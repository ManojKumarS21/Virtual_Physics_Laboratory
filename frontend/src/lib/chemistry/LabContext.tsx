"use client";

import React, { createContext, useContext, useReducer, useCallback, useRef } from "react";
import { ChemicalId, getMixReaction, CHEMICALS, SALT_CONFIG, GET_CHEMICAL_CONFIG } from "@/lib/chemistry/engine";
import { DEFAULT_APPARATUS_LAYOUT, ApparatusLayoutItem } from "./apparatusLayout";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface TestTubeState {
    id: string;
    chemicals: ChemicalId[];
    ions: string[];
    fillLevel: number;
    color: string;
    isHeating: boolean;
    isBubbling: boolean;
    hasPrecipitate: boolean;
    precipitateColor?: string;
    precipitateStatus?: 'none' | 'forming' | 'stable' | 'dissolving' | 'dissolved';
    precipitateProgress?: number;
    heldSalt?: string | null;
    heldSaltAmount?: number;
    observation?: string;
    equation?: string;
    position: [number, number, number];
    isPickedUp: boolean;
}

export interface ObservationLog {
    id: string;
    time: Date;
    text: string;
    equation?: string;
    color?: string;
    tubeId: string;
}

export interface ApparatusState {
    id: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    draggable: boolean;
    holder: string | null;
}

interface LabState {
    burnerOn: boolean;
    testTubes: TestTubeState[];
    apparatus: Record<string, ApparatusState>;
    openBottle: ChemicalId | null;
    observations: ObservationLog[];
    selectedTube: string | null;
    draggingId: string | null;
    dropperContent: ChemicalId | null;
    dropperLevel: number; // 0 to 1
    isStirring: Record<string, boolean>; // tubeId -> bool
    currentStep: number;
    sinkOn: boolean;
    heldSalt: string | null; // active salt on spatula
    heldSaltAmount: number; // 0 to 1 (full scoop)
    holderAttachedId: string | null; // ID of test tube currently in the holder
    candleOn: boolean;
    filterPaperInFunnel: boolean;
    activeExperiment: string | null;
    activeSnapTarget: { type: string; id?: string; index?: number } | null;
    tourState: {
        isActive: boolean;
        stepIndex: number;
        isPaused: boolean;
        highlightedIds: string[];
        cameraFocusId: string | null;
        isTourDragging: boolean;
    };
    language: 'en' | 'hi' | 'te' | 'mr';
    voiceEnabled: boolean;
    lastSqueezeTime: number; // For sync bulb animation
}

type LabAction =
    | { type: "TOGGLE_BURNER" }
    | { type: "POUR_CHEMICAL"; tubeId: string; chemical: ChemicalId }
    | { type: "DROP_CHEMICAL"; tubeId: string; chemical: ChemicalId }
    | { type: "OPEN_BOTTLE"; chemical: ChemicalId | null }
    | { type: "SELECT_TUBE"; id: string | null }
    | { type: "SET_TUBE_POSITION"; id: string; position: [number, number, number] }
    | { type: "SET_TUBE_HEATING"; id: string; isHeating: boolean }
    | { type: "RESET_TUBE"; id: string }
    | { type: "ADD_SALT"; tubeId: string; saltId: string; amount?: number }
    | { type: "PICK_DROPPER"; chemical: ChemicalId }
    | { type: "RELEASE_DROPPER"; tubeId: string }
    | { type: "STIR_TUBE"; tubeId: string; active: boolean }
    | { type: "NEXT_STEP" }
    | { type: "SET_APPARATUS_POSITION"; id: string; position: [number, number, number] }
    | { type: "SET_DRAGGING"; id: string }
    | { type: "END_DRAGGING"; id: string }
    | { type: "TOGGLE_SINK" }
    | { type: "PICK_SALT"; saltId: string | null }
    | { type: "ATTACH_HOLDER"; tubeId: string | null }
    | { type: "TOGGLE_CANDLE" }
    | { type: "SET_FILTER_PAPER"; inFunnel: boolean }
    | { type: "DROP_ONE_FROM_DROPPER"; tubeId: string }
    | { type: "EMPTY_DROPPER" }
    | { type: "SET_HOLDER"; id: string; holder: string | null }
    | { type: "SET_APPARATUS_ROTATION"; id: string; rotation: [number, number, number] }
    | { type: "TOGGLE_PICKUP"; id: string; pickup: boolean }
    | { type: "SELECT_EXPERIMENT"; id: string | null }
    | { type: "SET_SNAP_TARGET"; target: { type: string; id?: string; index?: number } | null }
    | { type: "SET_TOUR_STATE"; payload: Partial<LabState["tourState"]> }
    | { type: "SET_LANGUAGE"; language: LabState["language"] }
    | { type: "TOGGLE_VOICE" }
    | { type: "SET_SQUEEZE_TIME"; time: number }
    | { type: "RESET_LAB" };

const INITIAL_TUBES: TestTubeState[] = Object.values(DEFAULT_APPARATUS_LAYOUT)
    .filter(item => item.type === "tube")
    .map(item => ({
        id: item.id,
        chemicals: [],
        ions: [],
        fillLevel: 0,
        color: "#ffffff",
        isHeating: false,
        isBubbling: false,
        hasPrecipitate: false,
        precipitateStatus: 'none',
        precipitateProgress: 0,
        heldSaltAmount: 0,
        position: item.position as [number, number, number],
        isPickedUp: false
    }));

const INITIAL_APPARATUS: Record<string, ApparatusState> = {};
Object.entries(DEFAULT_APPARATUS_LAYOUT).forEach(([id, item]) => {
    INITIAL_APPARATUS[id] = {
        id: item.id,
        type: item.type,
        position: item.position,
        rotation: item.rotation,
        scale: item.scale,
        draggable: item.draggable,
        holder: item.holder || null
    };
});

const INITIAL_STATE: LabState = {
    burnerOn: false,
    testTubes: INITIAL_TUBES,
    apparatus: INITIAL_APPARATUS,
    openBottle: null,
    observations: [],
    selectedTube: null,
    draggingId: null,
    dropperContent: null,
    dropperLevel: 0,
    isStirring: {},
    currentStep: 0,
    sinkOn: false,
    heldSalt: null,
    heldSaltAmount: 0,
    holderAttachedId: null,
    candleOn: false,
    filterPaperInFunnel: false,
    activeExperiment: null,
    activeSnapTarget: null,
    tourState: {
        isActive: false,
        stepIndex: 0,
        isPaused: false,
        highlightedIds: [],
        cameraFocusId: null,
        isTourDragging: false
    },
    language: 'en',
    voiceEnabled: true,
    lastSqueezeTime: 0
};

// ─── Reducer ───────────────────────────────────────────────────────────────────
function labReducer(state: LabState, action: LabAction): LabState {
    switch (action.type) {
        case "TOGGLE_BURNER":
            return { ...state, burnerOn: !state.burnerOn };

        case "TOGGLE_SINK":
            return { ...state, sinkOn: !state.sinkOn };

        case "OPEN_BOTTLE":
            return { ...state, openBottle: action.chemical };

        case "SELECT_TUBE":
            return { ...state, selectedTube: action.id };

        case "TOGGLE_PICKUP":
            return {
                ...state,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.id ? { ...t, isPickedUp: action.pickup } : t
                ),
            };

        case "SET_APPARATUS_POSITION": {
            const prev = state.apparatus[action.id] || INITIAL_APPARATUS[action.id];

            // Allow partial updates if needed, but for now we replace position
            const nextApparatus = {
                ...state.apparatus,
                [action.id]: {
                    ...prev,
                    position: action.position,
                },
            };

            let nextTubes = action.id.startsWith("tt")
                ? state.testTubes.map(t => t.id === action.id ? { ...t, position: action.position } : t)
                : state.testTubes;

            // Synchronization: If holder moves, the attached tube must move in state too
            if (action.id === "holder" && state.holderAttachedId) {
                const tubeId = state.holderAttachedId;
                const tubePos: [number, number, number] = [
                    action.position[0],
                    action.position[1] - 0.22,
                    action.position[2]
                ];

                if (nextApparatus[tubeId]) {
                    nextApparatus[tubeId] = { ...nextApparatus[tubeId], position: tubePos };
                }
                nextTubes = nextTubes.map(t => t.id === tubeId ? { ...t, position: tubePos } : t);
            }

            // Synchronization: Retort Stand
            if (action.id === "retortStand") {
                const rsX = action.position[0];
                const rsY = action.position[1];
                const rsZ = action.position[2];
                const clampPos: [number, number, number] = [rsX, rsY + 0.225, rsZ + 0.14];
                Object.keys(nextApparatus).forEach(key => {
                    if (nextApparatus[key].holder === "retortStand") {
                        nextApparatus[key] = { ...nextApparatus[key], position: clampPos };
                        if (key.startsWith("tt")) {
                            nextTubes = nextTubes.map(t => t.id === key ? { ...t, position: clampPos } : t);
                        }
                    }
                });
            }

            return {
                ...state,
                apparatus: nextApparatus,
                testTubes: nextTubes
            };
        }

        case "SET_HOLDER": {
            return {
                ...state,
                apparatus: {
                    ...state.apparatus,
                    [action.id]: {
                        ...(state.apparatus[action.id] || INITIAL_APPARATUS[action.id]),
                        holder: action.holder
                    }
                }
            };
        }

        case "SET_APPARATUS_ROTATION": {
            const prev = state.apparatus[action.id] || INITIAL_APPARATUS[action.id];
            return {
                ...state,
                apparatus: {
                    ...state.apparatus,
                    [action.id]: {
                        ...prev,
                        rotation: action.rotation
                    }
                }
            };
        }

        case "SET_DRAGGING":
            return { ...state, draggingId: action.id };

        case "END_DRAGGING":
            return { ...state, draggingId: state.draggingId === action.id ? null : state.draggingId };

        case "SET_TUBE_POSITION":
            return {
                ...state,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.id ? { ...t, position: action.position } : t
                ),
                apparatus: {
                    ...state.apparatus,
                    [action.id]: state.apparatus[action.id] ? {
                        ...state.apparatus[action.id],
                        position: action.position
                    } : state.apparatus[action.id]
                }
            };

        case "SET_TUBE_HEATING":
            return {
                ...state,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.id
                        ? { ...t, isHeating: action.isHeating, isBubbling: action.isHeating && t.fillLevel > 0 }
                        : t
                ),
            };

        case "POUR_CHEMICAL": {
            const tube = state.testTubes.find((t) => t.id === action.tubeId);
            if (!tube || tube.fillLevel >= 0.85) return state;

            const chemConfig = CHEMICALS[action.chemical];
            const addedIons = chemConfig?.ions || [];
            let newIons = [...tube.ions];

            // ─── Neutralization Logic ───
            if (addedIons.includes("H+")) {
                if (newIons.includes("OH-")) {
                    newIons = newIons.filter(i => i !== "OH-");
                } else if (!newIons.includes("H+")) {
                    newIons.push("H+");
                }
            }
            if (addedIons.includes("OH-")) {
                if (newIons.includes("H+")) {
                    newIons = newIons.filter(i => i !== "H+");
                } else if (!newIons.includes("OH-")) {
                    newIons.push("OH-");
                }
            }
            addedIons.forEach(ion => {
                if (ion !== "H+" && ion !== "OH-" && !newIons.includes(ion)) {
                    newIons.push(ion);
                }
            });

            const newChemicals = [...tube.chemicals, action.chemical];
            const rxn = getMixReaction(action.chemical, newIons, tube.isHeating);
            const isBubbling = !!(rxn?.animation === "bubbles" || rxn?.gas);
            const newFill = Math.min(tube.fillLevel + 0.35, 0.85);

            const finalColor = rxn?.color ?? (tube.color === "#ffffff" ? chemConfig?.color : tube.color);
            const observation = rxn?.text || `Added ${chemConfig?.name}`;

            // Handle precipitate status for animation
            let pStatus = (tube.precipitateStatus || 'none') as any;

            if (rxn?.precipitate) {
                pStatus = 'forming';
            } else if (action.chemical === 'NH4OH' && tube.hasPrecipitate && tube.precipitateColor === '#ffffff') {
                pStatus = 'dissolving';
            }

            const logEntry: ObservationLog = {
                id: Math.random().toString(36).substr(2, 9),
                time: new Date(),
                text: observation,
                equation: rxn?.equation,
                color: rxn?.color || chemConfig?.color,
                tubeId: action.tubeId
            };

            return {
                ...state,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.tubeId
                        ? {
                            ...t,
                            chemicals: newChemicals,
                            ions: newIons,
                            fillLevel: newFill,
                            color: finalColor,
                            isBubbling,
                            hasPrecipitate: pStatus === 'dissolving' ? t.hasPrecipitate : (!!rxn?.precipitate || pStatus === 'forming'),
                            precipitateStatus: pStatus,
                            precipitateColor: rxn?.precipitate ? rxn.color : (pStatus === 'forming' ? '#ffffff' : t.precipitateColor),
                            observation,
                            equation: rxn?.equation
                        }
                        : t
                ),
                observations: [logEntry, ...state.observations],
            };
        }

        case "DROP_CHEMICAL": {
            const tube = state.testTubes.find((t) => t.id === action.tubeId);
            if (!tube || tube.fillLevel >= 0.9) return state;

            const chemConfig = CHEMICALS[action.chemical];
            const addedIons = chemConfig?.ions || [];
            let newIons = [...tube.ions];

            // ─── Neutralization Logic ───
            if (addedIons.includes("H+")) {
                if (newIons.includes("OH-")) {
                    newIons = newIons.filter(i => i !== "OH-");
                } else if (!newIons.includes("H+")) {
                    newIons.push("H+");
                }
            }
            if (addedIons.includes("OH-")) {
                if (newIons.includes("H+")) {
                    newIons = newIons.filter(i => i !== "H+");
                } else if (!newIons.includes("OH-")) {
                    newIons.push("OH-");
                }
            }
            addedIons.forEach(ion => {
                if (ion !== "H+" && ion !== "OH-" && !newIons.includes(ion)) {
                    newIons.push(ion);
                }
            });

            const newChemicals = [...tube.chemicals, action.chemical];
            const rxn = getMixReaction(action.chemical, newIons, tube.isHeating);
            const isBubbling = !!(rxn?.animation === "bubbles" || rxn?.gas);
            const newFill = Math.min(tube.fillLevel + 0.05, 0.9);

            const finalColor = rxn?.color ?? (tube.color === "#ffffff" ? chemConfig?.color : tube.color);
            const observation = rxn?.text || `Added drop of ${chemConfig?.name}`;

            return {
                ...state,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.tubeId
                        ? {
                            ...t,
                            chemicals: newChemicals,
                            ions: newIons,
                            color: finalColor,
                            fillLevel: newFill,
                            hasPrecipitate: !!rxn?.precipitate,
                            precipitateColor: rxn?.precipitate ? rxn.color : t.precipitateColor,
                            isBubbling: isBubbling,
                            observation: observation,
                            equation: rxn?.equation
                        }
                        : t
                ),
                observations: [
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        time: new Date(),
                        text: observation,
                        equation: rxn?.equation,
                        color: rxn?.color || chemConfig?.color,
                        tubeId: action.tubeId
                    },
                    ...state.observations
                ],
            };
        }

        case "RESET_TUBE":
            return {
                ...state,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.id
                        ? { ...t, chemicals: [], ions: [], fillLevel: 0, color: "#ffffff", hasPrecipitate: false, isBubbling: false, observation: undefined, equation: undefined }
                        : t
                ),
            };

        case "PICK_DROPPER": {
            const currentContent = state.dropperContent;
            // Only allow if empty or same chemical
            if (currentContent && currentContent !== action.chemical) return state;

            // Gradual fill: 0.2 per click (5 clicks to full)
            return {
                ...state,
                dropperContent: action.chemical,
                dropperLevel: Math.min((state.dropperLevel || 0) + 0.2, 1.0)
            };
        }

        case "RELEASE_DROPPER": {
            if (!state.dropperContent) return state;
            const tube = state.testTubes.find(t => t.id === action.tubeId);
            if (!tube || tube.fillLevel >= 0.9) return state;

            const chemConfig = CHEMICALS[state.dropperContent];
            const addedIons = chemConfig?.ions || [];
            let newIons = [...tube.ions];

            // ─── Neutralization Logic ───
            if (addedIons.includes("H+")) {
                if (newIons.includes("OH-")) {
                    newIons = newIons.filter(i => i !== "OH-");
                } else if (!newIons.includes("H+")) {
                    newIons.push("H+");
                }
            }
            if (addedIons.includes("OH-")) {
                if (newIons.includes("H+")) {
                    newIons = newIons.filter(i => i !== "H+");
                } else if (!newIons.includes("OH-")) {
                    newIons.push("OH-");
                }
            }
            addedIons.forEach(ion => {
                if (ion !== "H+" && ion !== "OH-" && !newIons.includes(ion)) {
                    newIons.push(ion);
                }
            });

            const newChemicals = [...tube.chemicals, state.dropperContent];
            const rxn = getMixReaction(state.dropperContent, newIons, tube.isHeating);
            const newFill = Math.min(tube.fillLevel + 0.15, 0.9);

            return {
                ...state,
                dropperContent: null,
                dropperLevel: 0,
                testTubes: state.testTubes.map(t => t.id === action.tubeId ? {
                    ...t,
                    fillLevel: newFill,
                    chemicals: newChemicals,
                    ions: newIons,
                    color: rxn?.color ?? (tube.color === "#ffffff" ? chemConfig?.color : tube.color),
                    hasPrecipitate: !!rxn?.precipitate,
                    precipitateColor: rxn?.precipitate ? rxn.color : t.precipitateColor,
                    observation: rxn?.text ?? `Added ${chemConfig?.name} via dropper`,
                    equation: rxn?.equation
                } : t),
                observations: [
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        time: new Date(),
                        text: rxn?.text ?? `Added ${chemConfig?.name} via dropper`,
                        equation: rxn?.equation,
                        color: rxn?.color || chemConfig?.color,
                        tubeId: action.tubeId
                    },
                    ...state.observations
                ],
            };
        }

        case "DROP_ONE_FROM_DROPPER": {
            if (!state.dropperContent || state.dropperLevel <= 0.001) return state;
            const tube = state.testTubes.find(t => t.id === action.tubeId);
            if (!tube || tube.fillLevel >= 0.95) return state;

            const chemContent = state.dropperContent;
            const chemConfig = CHEMICALS[chemContent];
            const addedIons = chemConfig?.ions || [];
            let newIons = [...tube.ions];

            // ─── Neutralization Logic ───
            if (addedIons.includes("H+")) {
                if (newIons.includes("OH-")) {
                    newIons = newIons.filter(i => i !== "OH-");
                } else if (!newIons.includes("H+")) {
                    newIons.push("H+");
                }
            }
            if (addedIons.includes("OH-")) {
                if (newIons.includes("H+")) {
                    newIons = newIons.filter(i => i !== "H+");
                } else if (!newIons.includes("OH-")) {
                    newIons.push("OH-");
                }
            }
            addedIons.forEach((ion: string) => {
                if (ion !== "H+" && ion !== "OH-" && !newIons.includes(ion)) {
                    newIons.push(ion);
                }
            });

            const newChemicals = [...tube.chemicals, chemContent];
            const rxn = getMixReaction(chemContent, newIons, tube.isHeating);
            const newFill = Math.min(tube.fillLevel + 0.08, 0.95); // Increased from 0.02 for better visibility
            // Drop amount: 0.05 per drop (20 drops max capacity)
            const newDropperLevel = Math.max(state.dropperLevel - 0.05, 0);

            // Special logic for Silver Chloride animation states
            let pStatus = (tube.precipitateStatus || 'none') as any;

            if (rxn?.precipitate) {
                pStatus = 'forming';
            } else if (chemContent === 'NH4OH' && tube.hasPrecipitate && tube.precipitateColor === '#ffffff') {
                pStatus = 'dissolving';
            }

            return {
                ...state,
                dropperLevel: newDropperLevel,
                dropperContent: newDropperLevel <= 0.001 ? null : chemContent,
                testTubes: state.testTubes.map(t => t.id === action.tubeId ? {
                    ...t,
                    fillLevel: newFill,
                    chemicals: newChemicals,
                    ions: newIons,
                    color: rxn?.color ?? (tube.color === "#ffffff" ? chemConfig?.color : tube.color),
                    hasPrecipitate: pStatus === 'dissolving' ? t.hasPrecipitate : (!!rxn?.precipitate || pStatus === 'forming'),
                    precipitateStatus: pStatus,
                    precipitateColor: rxn?.precipitate ? rxn.color : (pStatus === 'forming' ? '#ffffff' : t.precipitateColor),
                    observation: rxn?.text ?? `Added a drop of ${chemConfig?.name}`,
                    equation: rxn?.equation
                } : t),
                observations: [
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        time: new Date(),
                        text: rxn?.text ?? `Added a drop of ${chemConfig?.name}`,
                        equation: rxn?.equation,
                        color: rxn?.color || chemConfig?.color,
                        tubeId: action.tubeId
                    },
                    ...state.observations
                ],
            };
        }

        case "EMPTY_DROPPER":
            return {
                ...state,
                dropperContent: null,
                dropperLevel: 0
            };
            
        case "ADD_SALT": {
            const tube = state.testTubes.find(t => t.id === action.tubeId);
            if (!tube) return state;

            const saltConfig = GET_CHEMICAL_CONFIG(action.saltId);
            const saltIons = (CHEMICALS[action.saltId as any] as any)?.ions || [action.saltId];
            const amount = action.amount ?? 0.05;

            let newIons = [...tube.ions];

            // ─── Neutralization Logic ───
            if (saltIons.includes("H+")) {
                if (newIons.includes("OH-")) {
                    newIons = newIons.filter(i => i !== "OH-");
                } else if (!newIons.includes("H+")) {
                    newIons.push("H+");
                }
            }
            if (saltIons.includes("OH-")) {
                if (newIons.includes("H+")) {
                    newIons = newIons.filter(i => i !== "H+");
                } else if (!newIons.includes("OH-")) {
                    newIons.push("OH-");
                }
            }
            saltIons.forEach((ion: string) => {
                if (ion !== "H+" && ion !== "OH-" && !newIons.includes(ion)) {
                    newIons.push(ion);
                }
            });

            // Re-check reaction with the salt being the "poured" trigger
            const rxn = getMixReaction(action.saltId, newIons, tube.isHeating);

            // Handle precipitate status for animation
            let pStatus = (tube.precipitateStatus || 'none') as any;
            if (rxn?.precipitate) {
                pStatus = 'forming';
            }

            // Calculate new held amount
            const newHeldAmount = Math.max(0, state.heldSaltAmount - amount);
            const isNowEmpty = newHeldAmount <= 0.005;

            const observationText = rxn?.text ?? `Added some ${saltConfig?.name}`;
            const isNewObservation = tube.observation !== observationText;

            return {
                ...state,
                heldSalt: isNowEmpty ? null : state.heldSalt,
                heldSaltAmount: isNowEmpty ? 0 : newHeldAmount,
                testTubes: state.testTubes.map((t) =>
                    t.id === action.tubeId
                        ? {
                            ...t,
                            ions: newIons,
                            observation: observationText,
                            hasPrecipitate: !!rxn?.precipitate || pStatus === 'forming',
                            precipitateStatus: pStatus,
                            precipitateColor: rxn?.precipitate ? rxn.color : (pStatus === 'forming' ? '#ffffff' : t.precipitateColor),
                            equation: rxn?.equation,
                            color: rxn?.color ?? (t.fillLevel === 0 ? saltConfig?.color : (t.color === "#ffffff" ? saltConfig?.color : t.color)),
                            heldSalt: action.saltId,
                            heldSaltAmount: Math.min((t.heldSaltAmount || 0) + amount, 1.0),
                            fillLevel: Math.min(t.fillLevel + (amount * 0.1), 0.9)
                        }
                        : t
                ),
                observations: isNewObservation
                    ? [
                        {
                            id: Math.random().toString(36).substr(2, 9),
                            time: new Date(),
                            text: observationText,
                            equation: rxn?.equation,
                            color: rxn?.color || saltConfig?.color,
                            tubeId: action.tubeId
                        },
                        ...state.observations
                    ]
                    : state.observations,
            };
        }

        case "PICK_SALT":
            return { 
                ...state, 
                heldSalt: action.saltId,
                heldSaltAmount: action.saltId ? 0.4 : 0 
            };

        case "ATTACH_HOLDER": {
            const releasedId = !action.tubeId ? state.holderAttachedId : null;
            let updatedTubes = state.testTubes;
            let updatedApparatus = state.apparatus;

            if (releasedId) {
                const relTube = state.testTubes.find(t => t.id === releasedId);
                if (relTube) {
                    const [rx, ry, rz] = relTube.position;
                    // RACK CONSTANTS (Synced with useApparatusDrag)
                    const RACK_X_CENTER = 1.7;
                    const RACK_Z_CENTER = 0.0;
                    const RACK_SLOTS = [1.08, 1.33, 1.58, 1.82, 2.07, 2.32];
                    const distToRackSq = Math.pow(rx - RACK_X_CENTER, 2) + Math.pow(rz - RACK_Z_CENTER, 2);

                    let finalPos: [number, number, number] = [rx, 0.78, rz]; // Default bench level

                    // Check for shelf or other surfaces first
                    const SHELVES = [
                        { y: 1.68, xMin: -2.35, xMax: 2.35, zMin: -0.9, zMax: -0.7 },
                        { y: 1.08, xMin: -2.35, xMax: 2.35, zMin: -0.9, zMax: -0.7 }
                    ];

                    for (const s of SHELVES) {
                        if (rx >= s.xMin && rx <= s.xMax && rz >= s.zMin && rz <= s.zMax) {
                            finalPos[1] = s.y;
                            break;
                        }
                    }

                    if (distToRackSq < 0.36) {
                        let bestX = RACK_SLOTS[0];
                        let minDist = 999;
                        RACK_SLOTS.forEach(sx => {
                            const d = Math.abs(rx - sx);
                            if (d < minDist) { minDist = d; bestX = sx; }
                        });

                        const isOccupied = state.testTubes.some(t =>
                            t.id !== releasedId &&
                            Math.abs(t.position[0] - bestX) < 0.05 &&
                            Math.abs(t.position[2] - RACK_Z_CENTER) < 0.05
                        );

                        if (minDist < 0.15 && !isOccupied) {
                            finalPos = [bestX, 0.83, RACK_Z_CENTER]; // Rack slot height
                        }
                    }

                    updatedTubes = state.testTubes.map(t =>
                        t.id === releasedId ? { ...t, position: finalPos, isPickedUp: false } : t
                    );

                    if (updatedApparatus[releasedId]) {
                        updatedApparatus = {
                            ...updatedApparatus,
                            [releasedId]: {
                                ...updatedApparatus[releasedId],
                                position: finalPos,
                                rotation: [0, 0, 0] // Ensure upright stability
                            }
                        };
                    }
                }
            }

            return {
                ...state,
                holderAttachedId: action.tubeId,
                testTubes: updatedTubes,
                apparatus: updatedApparatus
            };
        }

        case "STIR_TUBE":
            return {
                ...state,
                isStirring: { ...state.isStirring, [action.tubeId]: action.active }
            };

        case "NEXT_STEP":
            return { ...state, currentStep: state.currentStep + 1 };

        case "TOGGLE_CANDLE":
            return { ...state, candleOn: !state.candleOn };

        case "SET_FILTER_PAPER":
            return { ...state, filterPaperInFunnel: action.inFunnel };


        case "SELECT_EXPERIMENT":
            return { ...state, activeExperiment: action.id, currentStep: 0 };

        case "SET_SNAP_TARGET":
            return { ...state, activeSnapTarget: action.target };
        case "RESET_LAB": {
            // Restore all apparatus positions, rotations, scales except buttons
            const nextApparatus = { ...state.apparatus };
            Object.entries(DEFAULT_APPARATUS_LAYOUT).forEach(([id, layout]) => {
                const item = nextApparatus[id];
                if (item && item.type !== "bottle") {
                    nextApparatus[id] = {
                        ...item,
                        position: layout.position,
                        rotation: layout.rotation,
                        scale: layout.scale,
                        holder: layout.holder || null
                    };
                }
            });

            // Reset test tubes as well
            const nextTubes = state.testTubes.map(t => {
                const layout = DEFAULT_APPARATUS_LAYOUT[t.id];
                return layout ? {
                    ...t,
                    position: layout.position,
                    chemicals: [],
                    ions: [],
                    fillLevel: 0,
                    color: "#ffffff",
                    isHeating: false,
                    isBubbling: false,
                    hasPrecipitate: false,
                    precipitateStatus: 'none' as any,
                    precipitateProgress: 0,
                    heldSaltAmount: 0,
                    observation: undefined,
                    equation: undefined
                } : t;
            });

            return {
                ...state,
                apparatus: nextApparatus,
                testTubes: nextTubes,
                burnerOn: false,
                sinkOn: false,
                candleOn: false,
                heldSalt: null,
                holderAttachedId: null,
                dropperContent: null,
                dropperLevel: 0,
                activeExperiment: null,
                currentStep: 0,
                activeSnapTarget: null,
                tourState: {
                    isActive: false,
                    stepIndex: 0,
                    isPaused: false,
                    highlightedIds: [],
                    cameraFocusId: null,
                    isTourDragging: false
                }
            };
        }

        case "SET_TOUR_STATE":
            return {
                ...state,
                tourState: {
                    ...state.tourState,
                    ...action.payload
                }
            };

        case "SET_LANGUAGE":
            return { ...state, language: action.language };

        case "TOGGLE_VOICE":
            return { ...state, voiceEnabled: !state.voiceEnabled };

        case "SET_SQUEEZE_TIME":
            return { ...state, lastSqueezeTime: action.time };

        default:
            return state;
    }
}

// ─── Context ───────────────────────────────────────────────────────────────────
interface LabContextValue {
    state: LabState;
    toggleBurner: () => void;
    openBottle: (chemical: ChemicalId | null) => void;
    pourChemical: (tubeId: string, chemical: ChemicalId) => void;
    dropChemical: (tubeId: string, chemical: ChemicalId) => void;
    selectTube: (id: string | null) => void;
    setTubePosition: (id: string, position: [number, number, number]) => void;
    setTubeHeating: (id: string, isHeating: boolean) => void;
    togglePickup: (id: string, pickup: boolean) => void;
    resetTube: (id: string) => void;
    setApparatusPosition: (id: string, position: [number, number, number]) => void;
    setApparatusRotation: (id: string, rotation: [number, number, number]) => void;
    setDragging: (id: string) => void;
    endDragging: (id: string) => void;
    addSalt: (tubeId: string, saltId: string, amount?: number) => void;
    pickDropper: (chemical: ChemicalId) => void;
    releaseDropper: (tubeId: string) => void;
    stirTube: (tubeId: string, active: boolean) => void;
    nextStep: () => void;
    toggleSink: () => void;
    pickSalt: (saltId: string | null) => void;
    attachHolder: (tubeId: string | null) => void;
    toggleCandle: () => void;
    setFilterPaper: (inFunnel: boolean) => void;
    dropOneFromDropper: (tubeId: string) => void;
    emptyDropper: () => void;
    setHolder: (id: string, holder: string | null) => void;
    selectExperiment: (id: string | null) => void;
    resetLab: () => void;
    setSnapTarget: (target: { type: string; id?: string; index?: number } | null) => void;
    setTourState: (payload: Partial<LabState["tourState"]>) => void;
    setLanguage: (lang: LabState["language"]) => void;
    toggleVoice: () => void;
    setSqueezeTime: (time: number) => void;
}

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(labReducer, INITIAL_STATE);

    const toggleBurner = useCallback(() => dispatch({ type: "TOGGLE_BURNER" }), []);
    const openBottle = useCallback((chemical: ChemicalId | null) => dispatch({ type: "OPEN_BOTTLE", chemical }), []);
    const pourChemical = useCallback((tubeId: string, chemical: ChemicalId) => dispatch({ type: "POUR_CHEMICAL", tubeId, chemical }), []);
    const dropChemical = useCallback((tubeId: string, chemical: ChemicalId) => dispatch({ type: "DROP_CHEMICAL", tubeId, chemical }), []);
    const selectTube = useCallback((id: string | null) => dispatch({ type: "SELECT_TUBE", id }), []);
    const setTubePosition = useCallback((id: string, position: [number, number, number]) => dispatch({ type: "SET_TUBE_POSITION", id, position }), []);
    const setTubeHeating = useCallback((id: string, isHeating: boolean) => dispatch({ type: "SET_TUBE_HEATING", id, isHeating }), []);
    const togglePickup = useCallback((id: string, pickup: boolean) => dispatch({ type: "TOGGLE_PICKUP", id, pickup }), []);
    const resetTube = useCallback((id: string) => dispatch({ type: "RESET_TUBE", id }), []);
    const setApparatusPosition = useCallback((id: string, position: [number, number, number]) => {
        dispatch({ type: "SET_APPARATUS_POSITION", id, position });
    }, []);

    const setApparatusRotation = useCallback((id: string, rotation: [number, number, number]) => {
        dispatch({ type: "SET_APPARATUS_ROTATION", id, rotation });
    }, []);

    const setDragging = useCallback((id: string) => {
        dispatch({ type: "SET_DRAGGING", id });
    }, []);
    const endDragging = useCallback((id: string) => dispatch({ type: "END_DRAGGING", id }), []);
    const addSalt = useCallback((tubeId: string, saltId: string, amount?: number) => dispatch({ type: "ADD_SALT", tubeId, saltId, amount }), []);
    const pickSalt = useCallback((saltId: string | null) => dispatch({ type: "PICK_SALT", saltId }), []);
    const pickDropper = useCallback((chemical: ChemicalId) => dispatch({ type: "PICK_DROPPER", chemical }), []);
    const releaseDropper = useCallback((tubeId: string) => dispatch({ type: "RELEASE_DROPPER", tubeId }), []);
    const stirTube = useCallback((tubeId: string, active: boolean) => dispatch({ type: "STIR_TUBE", tubeId, active }), []);
    const nextStep = useCallback(() => dispatch({ type: "NEXT_STEP" }), []);
    const toggleSink = useCallback(() => dispatch({ type: "TOGGLE_SINK" }), []);
    const attachHolder = useCallback((tubeId: string | null) => dispatch({ type: "ATTACH_HOLDER", tubeId }), []);
    const toggleCandle = useCallback(() => dispatch({ type: "TOGGLE_CANDLE" }), []);
    const setFilterPaper = useCallback((inFunnel: boolean) => dispatch({ type: "SET_FILTER_PAPER", inFunnel }), []);
    const dropOneFromDropper = useCallback((tubeId: string) => dispatch({ type: "DROP_ONE_FROM_DROPPER", tubeId }), []);
    const emptyDropper = useCallback(() => dispatch({ type: "EMPTY_DROPPER" }), []);
    const setHolder = useCallback((id: string, holder: string | null) => dispatch({ type: "SET_HOLDER", id, holder }), []);
    const selectExperiment = useCallback((id: string | null) => dispatch({ type: "SELECT_EXPERIMENT", id }), []);
    const resetLab = useCallback(() => dispatch({ type: "RESET_LAB" }), []);
    const setSnapTarget = useCallback((target: { type: string; id?: string; index?: number } | null) => {
        dispatch({ type: "SET_SNAP_TARGET", target });
    }, []);
    const setTourState = useCallback((payload: Partial<LabState["tourState"]>) => dispatch({ type: "SET_TOUR_STATE", payload }), []);
    const setLanguage = useCallback((language: LabState["language"]) => dispatch({ type: "SET_LANGUAGE", language }), []);
    const toggleVoice = useCallback(() => dispatch({ type: "TOGGLE_VOICE" }), []);
    const setSqueezeTime = useCallback((time: number) => dispatch({ type: "SET_SQUEEZE_TIME", time }), []);
    // Safety sync: Ensure missing apparatus keys (from hot reloading or updates) are added to the state dynamically
    const syncDone = useRef(false);
    React.useEffect(() => {
        if (syncDone.current) return;
        let needed = false;
        Object.keys(INITIAL_APPARATUS).forEach(key => {
            if (!state.apparatus[key]) {
                dispatch({ type: "SET_APPARATUS_POSITION", id: key, position: INITIAL_APPARATUS[key].position });
                needed = true;
            }
        });
        if (!needed) syncDone.current = true;
    }, [state.apparatus]);

    return (
        <LabContext.Provider value={{
            state, toggleBurner, openBottle, pourChemical, selectTube,
            setTubePosition, setTubeHeating, togglePickup, resetTube,
            setApparatusPosition, setApparatusRotation, setDragging, endDragging,
            addSalt, pickSalt, pickDropper, releaseDropper,
            stirTube, nextStep, toggleSink, attachHolder, dropChemical,
            toggleCandle, setFilterPaper, dropOneFromDropper, 
            emptyDropper,
            setHolder,
            selectExperiment, resetLab, setSnapTarget,
            setTourState, setLanguage, toggleVoice,
            setSqueezeTime
        }}>
            {children}
        </LabContext.Provider>
    );
}

export function useLabState() {
    const ctx = useContext(LabContext);
    if (!ctx) throw new Error("useLabState must be used within LabProvider");
    return ctx;
}
