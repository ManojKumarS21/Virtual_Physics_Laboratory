'use client';

interface MeterBridgeParams {
    R: number; // Known resistance in ohms
    X: number; // Unknown resistance in ohms
    voltage: number; // Battery voltage
    jockeyPos: number; // Position of jockey along 100cm wire (0-100)
    wireResistancePerCm: number;
}

/**
 * Calculates the current through the galvanometer in a Meter Bridge circuit.
 * Using Wheatstone Bridge principle:
 * At balance: R/X = l / (100 - l)
 * Imbalance results in potential difference.
 */
export function calculateGalvanometerDeflection(params: MeterBridgeParams): number {
    const { R, X, voltage, jockeyPos } = params;

    if (jockeyPos <= 0.1) return 1;
    if (jockeyPos >= 99.9) return -1;

    // Resistance of wire segments
    const l = Math.max(0.1, Math.min(99.9, jockeyPos));
    const l_rem = 100 - l;

    // Ratio comparison
    // Ideal balance when R/l = X/l_rem => R * l_rem = X * l
    const leftSide = R / l;
    const rightSide = X / l_rem;

    // Deflection is proportional to the difference in potential ratios
    let deflection = (leftSide - rightSide) * 5; // Scale for visual effect

    // Clamp deflection between -1 and 1
    return Math.max(-1, Math.min(1, deflection));
}
