import { ChemicalId } from "./engine";

export interface Transform {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

export interface ApparatusLayoutItem extends Transform {
    id: string;
    type: string;
    draggable: boolean;
    holder?: string | null;
}

export const DEFAULT_APPARATUS_LAYOUT: Record<string, ApparatusLayoutItem> = {
    // Bottles
    // Bottles Row 1 (Bottom Rack Shelf, y = 1.08, z = -0.8)
    "bot_HCl": { id: "bot_HCl", type: "bottle", position: [-1.2, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_H2SO4": { id: "bot_H2SO4", type: "bottle", position: [-0.8, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_AgNO3": { id: "bot_AgNO3", type: "bottle", position: [-0.4, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_BaCl2": { id: "bot_BaCl2", type: "bottle", position: [0.0, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_NH4OH": { id: "bot_NH4OH", type: "bottle", position: [0.4, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_FeSO4": { id: "bot_FeSO4", type: "bottle", position: [0.8, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_NaOH": { id: "bot_NaOH", type: "bottle", position: [1.2, 1.08, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },

    // Bottles Row 2 (Top Rack Shelf, y = 1.68, z = -0.8)
    "bot_KSCN": { id: "bot_KSCN", type: "bottle", position: [-1.2, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_H2O": { id: "bot_H2O", type: "bottle", position: [-0.8, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_Limewater": { id: "bot_Limewater", type: "bottle", position: [-0.4, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_CuSO4": { id: "bot_CuSO4", type: "bottle", position: [0.0, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_FeCl3": { id: "bot_FeCl3", type: "bottle", position: [0.4, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_K2CrO4": { id: "bot_K2CrO4", type: "bottle", position: [0.8, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "bot_NH4Cl": { id: "bot_NH4Cl", type: "bottle", position: [1.2, 1.68, -0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },

    // Glassware
    "measuringCylinder": { id: "measuringCylinder", type: "cylinder", position: [-1.4, 0.78, -0.5], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "flask": { id: "flask", type: "flask", position: [-0.96, 0.78, -0.5], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "beaker": { id: "beaker", type: "beaker", position: [-1.2, 0.78, -0.4], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "glassRod": { id: "glassRod", type: "rod", position: [-0.6, 0.78, -0.65], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "spatula": { id: "spatula", type: "spatula", position: [-0.8, 0.78, -0.1], rotation: [0, 0, Math.PI / 2], scale: [1, 1, 1], draggable: true, holder: null },

    // Burner + Dropper
    "burner": { id: "burner", type: "burner", position: [0.4, 0.78, -0.35], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "dropper": { id: "dropper", type: "dropper", position: [0.75, 0.78, 0.3], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },

    // Test Tubes
    "tt1": { id: "tt1", type: "tube", position: [1.08, 0.83, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: "rack" },
    "tt2": { id: "tt2", type: "tube", position: [1.33, 0.83, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: "rack" },
    "tt3": { id: "tt3", type: "tube", position: [1.58, 0.83, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: "rack" },
    "tt4": { id: "tt4", type: "tube", position: [1.82, 0.83, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: "rack" },
    "tt5": { id: "tt5", type: "tube", position: [2.07, 0.83, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: "rack" },
    "tt6": { id: "tt6", type: "tube", position: [2.32, 0.83, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: "rack" },

    "funnel": { id: "funnel", type: "funnel", position: [1.8, 0.78, 0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "holder": { id: "holder", type: "holder", position: [1.2, 0.78, 0.4], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },

    // Salts
    // Salts Row 1 (Front)
    "salt_CO3": { id: "salt_CO3", type: "salt", position: [-2.3, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_SO4": { id: "salt_SO4", type: "salt", position: [-2.0, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Cl": { id: "salt_Cl", type: "salt", position: [-1.7, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_NO3": { id: "salt_NO3", type: "salt", position: [-1.4, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Cu": { id: "salt_Cu", type: "salt", position: [-1.1, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Fe3": { id: "salt_Fe3", type: "salt", position: [-0.8, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_CrO4": { id: "salt_CrO4", type: "salt", position: [-0.5, 0.78, 0.75], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },

    // Salts Row 2 (Back)
    "salt_NH4": { id: "salt_NH4", type: "salt", position: [-2.3, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Fe2": { id: "salt_Fe2", type: "salt", position: [-2.0, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Ca": { id: "salt_Ca", type: "salt", position: [-1.7, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Pb": { id: "salt_Pb", type: "salt", position: [-1.4, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Al": { id: "salt_Al", type: "salt", position: [-1.1, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_Na": { id: "salt_Na", type: "salt", position: [-0.8, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "salt_K": { id: "salt_K", type: "salt", position: [-0.5, 0.78, 0.55], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },

    "filterPaper": { id: "filterPaper", type: "paper", position: [1.5, 0.78, 0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "candle": { id: "candle", type: "candle", position: [2.1, 0.78, 0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "retortStand": { id: "retortStand", type: "stand", position: [1.0, 0.78, -0.2], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "washBottle": { id: "washBottle", type: "washBottle", position: [2.4, 0.78, 0.8], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: true, holder: null },
    "testTubeRack": { id: "testTubeRack", type: "rack", position: [1.7, 0.78, 0.0], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: false, holder: null },
    "sink": { id: "sink", type: "sink", position: [-1.9, 0.58, -0.40], rotation: [0, 0, 0], scale: [1, 1, 1], draggable: false, holder: null },
};
