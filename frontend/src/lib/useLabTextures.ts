"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * useLabTextures — procedurally generated PBR DataTextures.
 *
 * No external image files required.  All textures are created once via useMemo
 * and stay alive for the component lifecycle.
 *
 * Texture coordinate conventions (all use RepeatWrapping):
 *   wallRoughness   : tiled 14×7  across a 32×9 m wall  → 2.3 m per tile
 *   wallNormal      : tiled 12×6  → subtle plaster bump
 *   floorRoughness  : tiled 16×16 → ceramic surface grain per tile
 *   ceilingRoughness: tiled 8×8   → very fine ceiling paint texture
 */

// ── Internal helpers ──────────────────────────────────────────────────────────
function makeGrayscaleNoise(
    size: number,
    base: number,        // 0–1  mid-point
    variance: number,    // 0–1  half-range
    repeat: [number, number]
): THREE.DataTexture {
    const n = size * size;
    const data = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
        const raw = Math.round(Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 2 * variance)) * 255);
        data[i * 4 + 0] = raw;
        data[i * 4 + 1] = raw;
        data[i * 4 + 2] = raw;
        data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data as any, size, size);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
}

/** Normal-map DataTexture: mostly flat (128,128,255) with small XY perturbations */
function makeNormalNoise(
    size: number,
    strength: number,    // pixel-space deviation 0–128
    repeat: [number, number]
): THREE.DataTexture {
    const n = size * size;
    const data = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
        data[i * 4 + 0] = Math.max(0, Math.min(255, Math.round(128 + (Math.random() - 0.5) * strength)));
        data[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(128 + (Math.random() - 0.5) * strength)));
        data[i * 4 + 2] = 255;
        data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data as any, size, size);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
}

// ── Blur pass — 3×3 box filter for smoother noise ────────────────────────────
function boxBlur(src: Uint8Array, size: number): Uint8Array {
    const out = new Uint8Array(src.length);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let sum = 0, count = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = (x + dx + size) % size;
                    const ny = (y + dy + size) % size;
                    sum += src[(ny * size + nx) * 4];
                    count++;
                }
            }
            const v = Math.round(sum / count);
            const idx = (y * size + x) * 4;
            out[idx] = out[idx + 1] = out[idx + 2] = v;
            out[idx + 3] = 255;
        }
    }
    return out;
}

function makeSmoothedNoiseTexture(
    size: number,
    base: number,
    variance: number,
    repeat: [number, number],
    passes: number = 2
): THREE.DataTexture {
    let data = new Uint8Array(size * size * 4) as any;
    for (let i = 0; i < size * size; i++) {
        const raw = Math.round(Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 2 * variance)) * 255);
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = raw;
        data[i * 4 + 3] = 255;
    }
    for (let p = 0; p < passes; p++) data = boxBlur(data, size);
    const tex = new THREE.DataTexture(data as any, size, size);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
}

// ── Public interface ──────────────────────────────────────────────────────────
export interface LabTextures {
    /** Roughness variation for plaster walls (greyscale) */
    wallRoughness: THREE.DataTexture;
    /** Subtle normal-map bumps for plaster walls */
    wallNormal: THREE.DataTexture;
    /** Roughness variation for ceramic floor tiles */
    floorRoughness: THREE.DataTexture;
    /** Fine-grain roughness for painted ceiling */
    ceilingRoughness: THREE.DataTexture;
    /** Slight grain for the workbench epoxy surface */
    benchRoughness: THREE.DataTexture;
}

export function useLabTextures(): LabTextures {
    return useMemo<LabTextures>(() => ({
        // Reduced resolution from 512 to 256 for significantly faster startup
        wallRoughness: makeSmoothedNoiseTexture(256, 0.86, 0.18, [14, 7], 2),
        wallNormal: makeNormalNoise(256, 24, [12, 6]),
        floorRoughness: makeSmoothedNoiseTexture(256, 0.70, 0.22, [14, 14], 1),
        ceilingRoughness: makeSmoothedNoiseTexture(256, 0.94, 0.06, [8, 8], 1),
        benchRoughness: makeSmoothedNoiseTexture(256, 0.40, 0.12, [6, 4], 1),
    }), []);
}
