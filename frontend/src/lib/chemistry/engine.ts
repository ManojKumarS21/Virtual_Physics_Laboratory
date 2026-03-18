// Chemistry Engine — reaction lookup, state management for the virtual lab

export const EXPERIMENTS = [
  { id: "chloride_test", title: "Chloride Ion Test", desc: "Detect Chloride ions using Silver Nitrate (AgNO3)." },
  { id: "sulphate_test", title: "Sulphate Ion Test", desc: "Detect Sulphate ions using Barium Chloride (BaCl2)." },
  { id: "copper_test", title: "Copper(II) Ion Test", desc: "Detect Copper(II) ions using Ammonium Hydroxide (NH4OH)." },
  { id: "iron_test", title: "Iron(III) Ion Test", desc: "Detect Iron(III) ions using Pot. Thiocyanate (KSCN)." },
  { id: "chromate_test", title: "Chromate Ion Test", desc: "Detect Chromate ions using Barium Chloride (BaCl2)." },
  { id: "ammonium_test", title: "Ammonium Ion Test", desc: "Detect Ammonium ions using Sodium Hydroxide and Heat." }
];

export interface Observation {
  text: string;
  color?: string;
  precipitate?: string;
  gas?: string;
  animation?: "bubbles" | "sediment" | "curdy" | "fumes" | "brown_ring" | "smoke" | "glow" | "cloudy" | "layer";
  equation?: string;
  intensity?: number; // 0–1
}

export interface ReactionRule {
  reagent: string;
  observation: string;
  gas?: string;
  precipitate?: string;
  color?: string;
  animation?: string;
  equation?: string;
  confirmatory?: {
    reagent: string;
    observation: string;
    equation?: string;
  };
}

// ─── Chemical definitions ─────────────────────────────────────────────────────
export interface ChemicalConfig {
  name: string;
  color: string;
  labelColor: string;
  bottleColor: string;
  type: "acid" | "base" | "salt" | "indicator" | "water";
  ions: string[];
}

export const CHEMICALS: Record<string, ChemicalConfig> = {
  HCl: { name: "Hydrochloric Acid", color: "#e0f2f1", labelColor: "#333333", bottleColor: "#d8eef8", type: "acid", ions: ["H+", "Cl-"] },
  H2SO4: { name: "Sulphuric Acid", color: "#ffffff", labelColor: "#333333", bottleColor: "#d8eef8", type: "acid", ions: ["H+", "SO42-"] },
  AgNO3: { name: "Silver Nitrate", color: "#ffffff", labelColor: "#333333", bottleColor: "#5c3a21", type: "salt", ions: ["Ag+", "NO3-"] },
  BaCl2: { name: "Barium Chloride", color: "#ffffff", labelColor: "#333333", bottleColor: "#d8eef8", type: "salt", ions: ["Ba2+", "Cl-"] },
  NH4OH: { name: "Ammonium Hydroxide", color: "#ffffff", labelColor: "#333333", bottleColor: "#d8eef8", type: "base", ions: ["NH4+", "OH-"] },
  FeSO4: { name: "Iron(II) Sulphate", color: "#8bc34a", labelColor: "#333333", bottleColor: "#d8eef8", type: "salt", ions: ["Fe2+", "SO42-"] },
  NaOH: { name: "Sodium Hydroxide", color: "#ffffff", labelColor: "#333333", bottleColor: "#d8eef8", type: "base", ions: ["Na+", "OH-"] },
  KSCN: { name: "Pot. Thiocyanate", color: "#ffffff", labelColor: "#333333", bottleColor: "#5c3a21", type: "salt", ions: ["K+", "SCN-"] },
  H2O: { name: "Distilled Water", color: "#ffffff", labelColor: "#333333", bottleColor: "#ffffff", type: "water", ions: [] },
  Limewater: { name: "Limewater", color: "#ffffff", labelColor: "#333333", bottleColor: "#ffffff", type: "base", ions: ["Ca2+", "OH-"] },
  CuSO4: { name: "Copper(II) Sulphate", color: "#2196f3", labelColor: "#ffffff", bottleColor: "#d8eef8", type: "salt", ions: ["Cu2+", "SO42-"] },
  FeCl3: { name: "Iron(III) Chloride", color: "#795548", labelColor: "#ffffff", bottleColor: "#d8eef8", type: "salt", ions: ["Fe3+", "Cl-"] },
  K2CrO4: { name: "Potassium Chromate", color: "#ffeb3b", labelColor: "#333333", bottleColor: "#d8eef8", type: "salt", ions: ["K+", "CrO42-"] },
  NH4Cl: { name: "Ammonium Chloride", color: "#ffffff", labelColor: "#333333", bottleColor: "#d8eef8", type: "salt", ions: ["NH4+", "Cl-"] },
} as const;

export type ChemicalId = keyof typeof CHEMICALS;

export const SALT_CONFIG: Record<string, { name: string; color: string }> = {
  CO3: { name: "Carbonate Salt", color: "#ffffff" },
  SO4: { name: "Sulphate Salt", color: "#fafafa" },
  Cl: { name: "Chloride Salt", color: "#eeeeee" },
  NO3: { name: "Nitrate Salt", color: "#f5f5f5" },
  Cu: { name: "Copper(II) Salt", color: "#2196f3" }, // Vivid Blue
  Fe3: { name: "Iron(III) Salt", color: "#795548" }, // Yellow-Brown
  CrO4: { name: "Chromate Salt", color: "#ffeb3b" }, // Yellow
  NH4: { name: "Ammonium Salt", color: "#ffffff" }, // White
  Fe2: { name: "Iron(II) Salt", color: "#c8e6c9" }, // Pale Green
  Ca: { name: "Calcium Salt", color: "#ffffff" },   // White
  Pb: { name: "Lead Salt", color: "#f1f1f1" },      // Off-white
  Al: { name: "Aluminium Salt", color: "#ffffff" }, // White
  Na: { name: "Sodium Salt", color: "#ffffff" },    // White
  K: { name: "Potassium Salt", color: "#ffffff" },   // White
};

export function GET_CHEMICAL_CONFIG(id: string) {
  if (CHEMICALS[id as ChemicalId]) return CHEMICALS[id as ChemicalId];
  if (SALT_CONFIG[id]) return SALT_CONFIG[id];
  return { name: id, color: "#ffffff" };
}

// ─── Lab State ────────────────────────────────────────────────────────────────
export interface TestTubeState {
  id: string;
  chemicals: ChemicalId[];
  ions: string[];
  fillLevel: number; // 0–1
  color: string;
  isHeating: boolean;
  isBubbling: boolean;
  hasPrecipitate: boolean;
  precipitateColor?: string;
  precipitateStatus?: 'none' | 'forming' | 'stable' | 'dissolving' | 'dissolved';
  precipitateProgress?: number; // 0-1 for animation
  heldSaltAmount?: number; // for visual pile
  observation?: string;
  equation?: string;
  position: [number, number, number];
  isPickedUp: boolean;
}

export interface LabState {
  burnerOn: boolean;
  testTubes: TestTubeState[];
  selectedBottle: ChemicalId | null;
  observations: Array<{ time: Date; text: string; equation?: string; color?: string }>;
}

// ─── Reaction lookup ──────────────────────────────────────────────────────────
import reactionsData from "@/data/reactions.json";

export function getReaction(chemical: ChemicalId, reagent: ChemicalId): Observation | null {
  // Search anions
  for (const [, ionData] of Object.entries(reactionsData.anions)) {
    const test = (ionData as any).tests?.find(
      (t: any) => t.reagent?.toLowerCase() === reagent.toLowerCase()
    );
    if (test) {
      return {
        text: test.observation,
        color: test.color,
        precipitate: test.precipitate,
        gas: test.gas,
        animation: test.animation as Observation["animation"],
        equation: test.equation,
        intensity: 0.8,
      };
    }
  }
  // Search cations
  for (const [, ionData] of Object.entries(reactionsData.cations)) {
    const test = (ionData as any).tests?.find(
      (t: any) => t.reagent?.toLowerCase() === reagent.toLowerCase()
    );
    if (test) {
      return {
        text: test.observation,
        color: test.color,
        precipitate: test.precipitate,
        gas: test.gas,
        animation: test.animation as Observation["animation"],
        equation: test.equation,
        intensity: 0.8,
      };
    }
  }
  return null;
}

// Direct chemical-to-chemical reactions (what happens when you pour chemical A into chemical B)
const DIRECT_REACTIONS: Record<string, Record<string, Observation>> = {
  HCl: {
    AgNO3: {
      text: "White curdy precipitate of AgCl formed",
      color: "#f0f0f0",
      precipitate: "AgCl",
      animation: "curdy",
      equation: "HCl + AgNO₃ → AgCl↓ + HNO₃",
    },
    BaCl2: {
      text: "No visible reaction (both clear solutions)",
      color: "#d1fae5",
      animation: "bubbles",
      equation: "No precipitate — BaCl₂ + 2HCl → no change",
    },
    NaOH: {
      text: "Neutralisation — solution warms slightly",
      color: "#fffde7",
      animation: "glow",
      equation: "HCl + NaOH → NaCl + H₂O  (ΔH = −57.3 kJ/mol)",
    },
  },
  H2SO4: {
    BaCl2: {
      text: "White precipitate of BaSO₄ formed, insoluble in HCl",
      color: "#ffffff",
      precipitate: "BaSO4",
      animation: "sediment",
      equation: "H₂SO₄ + BaCl₂ → BaSO₄↓ + 2HCl",
    },
    NaOH: {
      text: "Exothermic neutralisation — solution heats up",
      color: "#fef9c3",
      animation: "glow",
      equation: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
    },
  },
  AgNO3: {
    HCl: {
      text: "White curdy precipitate of AgCl formed",
      color: "#f0f0f0",
      precipitate: "AgCl",
      animation: "curdy",
      equation: "AgNO₃ + HCl → AgCl↓ + HNO₃",
    },
    NH4OH: {
      text: "AgCl precipitate dissolves — colourless complex forms",
      color: "#e0f2fe",
      animation: "sediment",
      equation: "AgCl + 2NH₄OH → [Ag(NH₃)₂]⁺ + Cl⁻ + 2H₂O",
    },
  },
  BaCl2: {
    H2SO4: {
      text: "White precipitate of BaSO₄ formed",
      color: "#ffffff",
      precipitate: "BaSO4",
      animation: "sediment",
      equation: "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
    },
  },
  FeSO4: {
    H2SO4: {
      text: "Brown ring forms at junction — Nitrate confirmed",
      color: "#7c3d12",
      animation: "brown_ring",
      equation: "FeSO₄ + HNO₃ (conc H₂SO₄) → Brown ring [Fe(NO)]²⁺",
    },
    NH4OH: {
      text: "Dirty green precipitate of Fe(OH)₂ formed",
      color: "#6b7280",
      precipitate: "Fe(OH)2",
      animation: "sediment",
      equation: "FeSO₄ + 2NH₄OH → Fe(OH)₂↓ + (NH₄)₂SO₄",
    },
  },
  NH4OH: {
    FeSO4: {
      text: "Dirty green precipitate — Fe(OH)₂",
      color: "#4b5563",
      precipitate: "Fe(OH)2",
      animation: "sediment",
      equation: "2NH₄OH + FeSO₄ → Fe(OH)₂↓ + (NH₄)₂SO₄",
    },
    AgNO3: {
      text: "White precipitate dissolves in excess NH₄OH",
      color: "#e0f2fe",
      animation: "curdy",
      equation: "AgNO₃ + NH₄OH → AgOH↓ (→ dissolves in excess)",
    },
  },
  NaOH: {
    FeSO4: {
      text: "Dirty green precipitate of Fe(OH)₂",
      color: "#4b5563",
      precipitate: "Fe(OH)2",
      animation: "sediment",
      equation: "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄",
    },
  },
  CuSO4: {
    NaOH: {
      text: "Sky blue gelatinous precipitate of Cu(OH)2 formed",
      color: "#4fc3f7",
      precipitate: "Cu(OH)2",
      animation: "sediment",
      equation: "CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4",
    },
    NH4OH: {
      text: "Pale blue precipitate, dissolves in excess to deep blue solution",
      color: "#0288d1",
      precipitate: "Cu(OH)2",
      animation: "glow",
      equation: "CuSO4 + 2NH4OH → Cu(OH)2↓ + (NH4)2SO4",
    }
  },
  K2CrO4: {
    BaCl2: {
      text: "Yellow precipitate of Barium Chromate formed",
      color: "#ffeb3b",
      precipitate: "BaCrO4",
      animation: "sediment",
      equation: "K2CrO4 + BaCl2 → BaCrO4↓ + 2KCl",
    }
  }
};

// ─── Main Logic: Ion-based Reaction Engine ─────────────────────────────────
// Utility to normalize ion names (handles 'Cl', 'Cl-', 'Ag', 'Ag+', etc.)
function normalizeIon(ion: string): string {
    // Strips electrochemical charges (e.g., +, -, 2+, 2-) but keeps polyatomic subscripts (e.g., CrO4, NH4)
    // and oxidation states if they are part of the base ion ID (e.g., Fe3, Fe2)
    return ion.replace(/(\d*[+\-])$|([+\-])$/g, '').trim();
}

// ─── Main Logic: Ion-based Reaction Engine ─────────────────────────────────
export function getMixReaction(
    poured: string,
    currentIons: string[],
    isHeating: boolean = false
): Observation | null {
    const chemicalPoured = CHEMICALS[poured as ChemicalId];
    const reactiveIons = chemicalPoured ? chemicalPoured.ions : [poured];
    const pouredIons = reactiveIons.map(normalizeIon);
    
    // Standardize all ions to their base element name for lookup
    const normalizedNewIons = [...new Set([...currentIons.map(normalizeIon), ...pouredIons])];

    // 1. Copper(II) Test: Cu + OH -> Cu(OH)2 (Blue ppt)
    if (normalizedNewIons.includes("Cu") && normalizedNewIons.includes("OH")) {
        return {
            text: "Blue precipitate of Copper(II) hydroxide confirms presence of Copper(II) ions.",
            color: "#4fc3f7",
            precipitate: "Cu(OH)2",
            animation: "sediment",
            equation: "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓",
            intensity: 0.9
        };
    }

    // 1b. Chloride Ion Test: Cl + Ag -> AgCl (White curdy ppt)
    if (normalizedNewIons.includes("Cl") && normalizedNewIons.includes("Ag")) {
        return {
            text: "White curdy precipitate of Silver Chloride formed confirms Chloride ions.",
            color: "#ffffff", // Pure white for high contrast against salt pile
            precipitate: "AgCl",
            animation: "curdy",
            equation: "Ag⁺ + Cl⁻ → AgCl↓",
            intensity: 1.0
        };
    }

    // 2. Iron(III) Test: Fe3 + OH -> Fe(OH)3 (Reddish-brown ppt)
    if (normalizedNewIons.includes("Fe3") && normalizedNewIons.includes("OH")) {
        return {
            text: "Reddish brown precipitate of Iron(III) hydroxide confirms Iron(III) ions.",
            color: "#795548",
            precipitate: "Fe(OH)3",
            animation: "sediment",
            equation: "Fe³⁺ + 3OH⁻ → Fe(OH)₃↓",
            intensity: 0.9
        };
    }

    // 2b. Iron(II) Test: Fe2 + OH -> Fe(OH)2 (Dirty Green ppt)
    if (normalizedNewIons.includes("Fe2") && normalizedNewIons.includes("OH")) {
        return {
            text: "Dirty green precipitate of Iron(II) hydroxide confirms Iron(II) ions.",
            color: "#4b5563",
            precipitate: "Fe(OH)2",
            animation: "sediment",
            equation: "Fe²⁺ + 2OH⁻ → Fe(OH)₂↓",
            intensity: 0.9
        };
    }

    // 3. Chromate-Dichromate Effect: 2CrO4 + 2H -> Cr2O7 + H2O (Orange solution)
    if (normalizedNewIons.includes("CrO4") && normalizedNewIons.includes("H")) {
        return {
            text: "Yellow chromate solution turns orange forming dichromate in acidic medium.",
            color: "#ff8c00",
            animation: "glow",
            equation: "2CrO4²⁻ + 2H⁺ → Cr₂O₇²⁻ + H2O",
            intensity: 1.0
        };
    }

    // 4. Ammonium Test: NH4 + OH + Heat -> NH3 (Gas evolution)
    if (normalizedNewIons.includes("NH4") && normalizedNewIons.includes("OH") && isHeating) {
        return {
            text: "Ammonia gas evolved confirms presence of Ammonium ions. Pungent smell detected.",
            gas: "NH3",
            animation: "smoke",
            equation: "NH4⁺ + OH⁻ → NH3↑ + H2O",
            intensity: 0.8
        };
    }

    // 5. Barium Chromate Test: Ba + CrO4 -> BaCrO4 (Yellow ppt)
    if (normalizedNewIons.includes("Ba") && normalizedNewIons.includes("CrO4") && !normalizedNewIons.includes("H")) {
        return {
            text: "Yellow precipitate of Barium Chromate confirms presence of Chromate ions.",
            color: "#ffeb3b",
            precipitate: "BaCrO4",
            animation: "sediment",
            equation: "Ba²⁺ + CrO4²⁻ → BaCrO4↓",
            intensity: 0.9
        };
    }

    // 5. Look up in legacy reactionsData (Bidirectional)
    // First, check if the POURED chemical is the REAGENT for any ion in the tube
    for (const ion of currentIons.map(normalizeIon)) {
        const ionData = (reactionsData.anions as any)[ion] || (reactionsData.cations as any)[ion];
        if (ionData) {
            const test = ionData.tests?.find((t: any) => t.reagent.toLowerCase() === poured.toLowerCase());
            if (test) {
                if (test.condition === "heat" && !isHeating) continue;
                return {
                    text: test.observation,
                    color: test.color,
                    precipitate: test.precipitate,
                    gas: test.gas,
                    animation: test.animation as any,
                    equation: test.equation
                };
            }
        }
    }

    // Second, check if any chemical ALREADY IN the tube is a REAGENT for an ion being poured
    for (const pouredIon of pouredIons) {
        const ionData = (reactionsData.anions as any)[pouredIon] || (reactionsData.cations as any)[pouredIon];
        if (ionData) {
            // Find if any existing chemical in the 'currentIons' (approximated by chemical list) reacts with pouredIon
            // We'll check each chemical in the database to see if it acts as a reagent for the poured ion
            for (const key in CHEMICALS) {
                if (currentIons.some(i => CHEMICALS[key as ChemicalId].ions.map(normalizeIon).includes(normalizeIon(i)))) {
                    const test = ionData.tests?.find((t: any) => t.reagent.toLowerCase() === key.toLowerCase());
                    if (test) {
                        if (test.condition === "heat" && !isHeating) continue;
                        return {
                            text: test.observation,
                            color: test.color,
                            precipitate: test.precipitate,
                            gas: test.gas,
                            animation: test.animation as any,
                            equation: test.equation
                        };
                    }
                }
            }
        }
    }

    return null;
}

// ─── Legacy class export (keep backward-compat) ────────────────────────────
export class ChemistryEngine {
  static getReaction(salt: string, reagent: string): Observation | null {
    return getReaction(salt as ChemicalId, reagent as ChemicalId);
  }
}
