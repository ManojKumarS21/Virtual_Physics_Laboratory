"use client";

import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useLabTextures } from "@/lib/useLabTextures";

/**
 * RoomEnvironment — realistic school chemistry laboratory.
 *
 * Back wall (Z = -9.5):
 *   LEFT section   x < -3.5   → 5-shelf chemical storage unit + dense glassware
 *   CENTER section -3.5 < x < +3.5  → 3 large windows + sunlight shafts
 *   RIGHT section  x > +3.5  → large chalkboard with formula markings
 *
 * Background student tables at z = -5 and z = -7.
 */

// ── Shared palette (desaturated for realism) ─────────────────────────────────
const WALL_CREAM = "#587073";   // Powder Blue (50% darker)
const WALL_COOLS = "#587073";   // Powder Blue (50% darker)
const FLOOR_A = "#b0b0b0";      // ceramic tile light grey
const FLOOR_B = "#9e9e9e";      // ceramic tile mid grey
const GROUT = "#7a7a7a";        // realistic grout
const CEILING = "#f2efeb";      // warm white plaster ceiling (not pure white)
const SKIRTING = "#b0b0b0";   // neutral baseboard
const SHELF_OAK = "#8b5a2b";   // rich real oak wood tone
const SHELF_EDGE = "#5c3a21";   // darker oxidized oak edge
const CAB_WHITE = "#d8d5ce";   // painted cabinet white
const SURFACE_COLOR = "#1a1a1a";   // dark matte epoxy
const CABINET_WHITE = "#e3c7a1";   // warm maple wood laminate
const SINK_COLOR = "#1f2224";      // dark chemical-resistant sink
const BOARD_GREEN = "#1e3325";   // chalkboard green
const CHALK_WHITE = "#d8d4c8";   // chalk marks colour
const CHALK_FAINT = "#b8b49c";   // faint worn chalk

// Shared normal scale used for all PBR walls
const WALL_NORMAL_SCALE = new THREE.Vector2(0.32, 0.32);

export const RoomEnvironment = () => {
    const { gl } = useThree();
    const textures = useLabTextures();
    const { wallRoughness, wallNormal, floorRoughness, ceilingRoughness } = textures;

    const [vinylTex, setVinylTex] = React.useState<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = GROUT;
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = FLOOR_A;
        ctx.fillRect(2, 2, 60, 60);
        ctx.fillRect(66, 66, 60, 60);
        ctx.fillStyle = FLOOR_B;
        ctx.fillRect(66, 2, 60, 60);
        ctx.fillRect(2, 66, 60, 60);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(24, 24);
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;

        setVinylTex(tex);
        return () => tex.dispose();
    }, []);

    useEffect(() => {
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
        Object.values(textures).forEach((tex) => {
            if (tex && (tex as any).isTexture) {
                (tex as any).anisotropy = maxAnisotropy;
                (tex as any).needsUpdate = true;
            }
        });
        if (vinylTex) {
            vinylTex.anisotropy = maxAnisotropy;
            vinylTex.needsUpdate = true;
        }
    }, [gl, textures, vinylTex]);

    return (
        <group scale={[0.45, 0.83, 0.55]}>

            {/* ══════════════════════════════════════════════════════════
                FLOOR — realistic school laboratory vinyl tiles
            ══════════════════════════════════════════════════════════ */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[32, 32]} />
                <meshStandardMaterial
                    map={vinylTex}
                    roughness={1.0}
                    metalness={0.0}
                />
            </mesh>

            {/* ══════════════════════════════════════════════════════════
                CEILING
            ══════════════════════════════════════════════════════════ */}
            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.63, 0]}>
                <planeGeometry args={[32, 32]} />
                <meshPhysicalMaterial
                    color={CEILING}
                    roughnessMap={ceilingRoughness}
                    roughness={0.94}
                    clearcoat={0.015}
                    clearcoatRoughness={0.9}
                />
            </mesh>
            {/* Ceiling tile seams */}
            {Array.from({ length: 8 }, (_, i) => i - 4).map((xi) => (
                <mesh key={`cs-x${xi}`} position={[xi * 1.6, 4.6, 0]}>
                    <boxGeometry args={[0.018, 0.008, 32]} />
                    <meshStandardMaterial color="#d8d4cc" roughness={0.98} />
                </mesh>
            ))}
            {Array.from({ length: 8 }, (_, i) => i - 4).map((zi) => (
                <mesh key={`cs-z${zi}`} position={[0, 4.6, zi * 1.6]}>
                    <boxGeometry args={[32, 0.008, 0.018]} />
                    <meshStandardMaterial color="#d8d4cc" roughness={0.98} />
                </mesh>
            ))}

            {/* Back wall */}
            <mesh position={[0, 2.315, -9.5]} receiveShadow>
                <planeGeometry args={[32, 4.63]} />
                <meshStandardMaterial color={WALL_CREAM} roughness={1.0} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Left wall */}
            <mesh position={[-14, 2.315, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[32, 4.63]} />
                <meshStandardMaterial color={WALL_COOLS} roughness={1.0} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Right wall */}
            <mesh position={[14, 2.315, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[32, 4.63]} />
                <meshStandardMaterial color={WALL_COOLS} roughness={1.0} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Front wall */}
            <mesh position={[0, 2.315, 9.5]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[32, 4.63]} />
                <meshStandardMaterial color={WALL_COOLS} roughness={1.0} metalness={0.0} />
            </mesh>

            {/* ── Skirting boards ──────────────────────────────────────── */}
            {[
                { pos: [0, 0.075, -9.46] as [number, number, number], rot: [0, 0, 0] as [number, number, number], sz: [32, 0.15, 0.04] as [number, number, number] },
                { pos: [-13.96, 0.075, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], sz: [32, 0.15, 0.04] as [number, number, number] },
                { pos: [13.96, 0.075, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], sz: [32, 0.15, 0.04] as [number, number, number] },
            ].map(({ pos, rot, sz }, i) => (
                <mesh key={`sk-${i}`} position={pos} rotation={rot}>
                    <boxGeometry args={sz} />
                    <meshStandardMaterial color={SKIRTING} roughness={0.75} />
                </mesh>
            ))}

            {/* ── Ceiling cornice (where wall meets ceiling) ───────────── */}
            {[
                { pos: [0, 4.63, -9.48], rot: [0, 0, 0] },
                { pos: [-13.98, 4.63, 0], rot: [0, Math.PI / 2, 0] },
                { pos: [13.98, 4.63, 0], rot: [0, -Math.PI / 2, 0] },
            ].map(({ pos, rot }, i) => (
                <mesh key={`cor-${i}`} position={pos as any} rotation={rot as any}>
                    <boxGeometry args={[32, 0.08, 0.08]} />
                    <meshStandardMaterial color={CEILING} roughness={0.8} />
                </mesh>
            ))}

            {/* ══════════════════════════════════════════════════════════
                BACK WALL — LEFT SECTION: Chemical Storage Shelves
                x: -14 to -3.8    Five shelf levels, dense glassware
            ══════════════════════════════════════════════════════════ */}
            <group position={[-8.5, 0, -9.2]}>
                {/* Shelf boards × 5 */}
                {[0.9, 1.75, 2.6, 3.45, 4.3].map((y, i) => (
                    <mesh key={`sh-${i}`} position={[0, y, 0]} castShadow receiveShadow>
                        <boxGeometry args={[8.8, 0.072, 0.46]} />
                        <meshStandardMaterial color={SHELF_OAK} roughness={0.88} metalness={0.02} />
                    </mesh>
                ))}
                {/* Side uprights */}
                {[-4.4, 4.4].map((x, i) => (
                    <mesh key={`su-${i}`} position={[x, 2.7, 0]} castShadow>
                        <boxGeometry args={[0.06, 5.4, 0.46]} />
                        <meshStandardMaterial color={SHELF_EDGE} roughness={0.92} metalness={0.02} />
                    </mesh>
                ))}
                {/* Internal dividers */}
                {[-2.2, 0, 2.2].map((x, i) => (
                    <mesh key={`sd-${i}`} position={[x, 2.7, 0]}>
                        <boxGeometry args={[0.04, 5.4, 0.44]} />
                        <meshStandardMaterial color={SHELF_EDGE} roughness={0.92} metalness={0.02} />
                    </mesh>
                ))}
                {/* Back panel */}
                <mesh position={[0, 2.7, -0.23]}>
                    <boxGeometry args={[8.8, 5.4, 0.025]} />
                    <meshStandardMaterial color="#4a3018" roughness={0.95} />
                </mesh>

                {/* ── Dense glassware on each shelf ───────────────────── */}
                {[
                    // y=0.9 shelf
                    { x: -4.0, y: 0.9, c: "#1a6eb5", h: 0.32, r: 0.048, cap: "#111" },
                    { x: -3.5, y: 0.9, c: "#c0392b", h: 0.26, r: 0.040, cap: "#111" },
                    { x: -3.0, y: 0.9, c: "#27ae60", h: 0.30, r: 0.050, cap: "#0a0" },
                    { x: -2.55, y: 0.9, c: "#d97706", h: 0.28, r: 0.044, cap: "#111" },
                    { x: -2.1, y: 0.9, c: "#7c3aed", h: 0.34, r: 0.052, cap: "#111" },
                    { x: -1.6, y: 0.9, c: "#0891b2", h: 0.24, r: 0.040, cap: "#111" },
                    { x: -1.1, y: 0.9, c: "#be185d", h: 0.30, r: 0.048, cap: "#111" },
                    { x: -0.6, y: 0.9, c: "#374151", h: 0.28, r: 0.044, cap: "#111" },
                    { x: -0.1, y: 0.9, c: "#15803d", h: 0.32, r: 0.050, cap: "#0a0" },
                    { x: 0.4, y: 0.9, c: "#b91c1c", h: 0.24, r: 0.040, cap: "#111" },
                    { x: 0.9, y: 0.9, c: "#1d4ed8", h: 0.30, r: 0.048, cap: "#111" },
                    { x: 1.4, y: 0.9, c: "#92400e", h: 0.26, r: 0.042, cap: "#111" },
                    { x: 1.9, y: 0.9, c: "#1e40af", h: 0.32, r: 0.050, cap: "#111" },
                    { x: 2.4, y: 0.9, c: "#701a75", h: 0.28, r: 0.046, cap: "#111" },
                    { x: 2.9, y: 0.9, c: "#065f46", h: 0.34, r: 0.052, cap: "#0a0" },
                    { x: 3.4, y: 0.9, c: "#7f1d1d", h: 0.26, r: 0.042, cap: "#111" },
                    { x: 3.9, y: 0.9, c: "#1e3a5f", h: 0.30, r: 0.048, cap: "#111" },
                    // y=1.75 shelf
                    { x: -4.0, y: 1.75, c: "#2563eb", h: 0.28, r: 0.046, cap: "#111" },
                    { x: -3.5, y: 1.75, c: "#dc2626", h: 0.32, r: 0.050, cap: "#111" },
                    { x: -3.0, y: 1.75, c: "#16a34a", h: 0.24, r: 0.040, cap: "#0a0" },
                    { x: -2.5, y: 1.75, c: "#ca8a04", h: 0.30, r: 0.048, cap: "#111" },
                    { x: -2.0, y: 1.75, c: "#7e22ce", h: 0.28, r: 0.044, cap: "#111" },
                    { x: -1.5, y: 1.75, c: "#0e7490", h: 0.34, r: 0.052, cap: "#111" },
                    { x: -1.0, y: 1.75, c: "#9d174d", h: 0.26, r: 0.042, cap: "#111" },
                    { x: -0.5, y: 1.75, c: "#155e75", h: 0.30, r: 0.048, cap: "#111" },
                    { x: 0.0, y: 1.75, c: "#78350f", h: 0.28, r: 0.046, cap: "#111" },
                    { x: 0.5, y: 1.75, c: "#1e3a5f", h: 0.32, r: 0.050, cap: "#111" },
                    { x: 1.0, y: 1.75, c: "#6b21a8", h: 0.26, r: 0.042, cap: "#111" },
                    { x: 1.5, y: 1.75, c: "#134e4a", h: 0.30, r: 0.048, cap: "#111" },
                    // y=2.6 shelf
                    { x: -3.8, y: 2.6, c: "#1d4ed8", h: 0.30, r: 0.048, cap: "#111" },
                    { x: -3.2, y: 2.6, c: "#991b1b", h: 0.26, r: 0.042, cap: "#111" },
                    { x: -2.7, y: 2.6, c: "#14532d", h: 0.32, r: 0.050, cap: "#0a0" },
                    { x: -2.2, y: 2.6, c: "#78350f", h: 0.28, r: 0.046, cap: "#111" },
                    { x: -1.7, y: 2.6, c: "#4c1d95", h: 0.24, r: 0.040, cap: "#111" },
                    { x: -1.2, y: 2.6, c: "#0c4a6e", h: 0.30, r: 0.048, cap: "#111" },
                    { x: -0.7, y: 2.6, c: "#831843", h: 0.28, r: 0.044, cap: "#111" },
                    { x: -0.2, y: 2.6, c: "#1a3a4e", h: 0.32, r: 0.050, cap: "#111" },
                    { x: 0.3, y: 2.6, c: "#3b0764", h: 0.26, r: 0.042, cap: "#111" },
                    { x: 0.8, y: 2.6, c: "#052e16", h: 0.30, r: 0.048, cap: "#0a0" },
                    { x: 1.3, y: 2.6, c: "#450a0a", h: 0.28, r: 0.044, cap: "#111" },
                    { x: 1.8, y: 2.6, c: "#082f49", h: 0.32, r: 0.050, cap: "#111" },
                ].map((b, i) => (
                    <group key={`wbottle-${i}`} position={[b.x, b.y + 0.038, 0]}>
                        <mesh castShadow>
                            <latheGeometry
                                args={[
                                    [
                                        new THREE.Vector2(0, 0),
                                        new THREE.Vector2(b.r, 0),
                                        new THREE.Vector2(b.r * 1.05, 0.02),
                                        new THREE.Vector2(b.r * 1.05, b.h * 0.7),
                                        new THREE.Vector2(b.r * 0.8, b.h * 0.85),
                                        new THREE.Vector2(b.r * 0.4, b.h * 0.95),
                                        new THREE.Vector2(b.r * 0.4, b.h * 1.1),
                                        new THREE.Vector2(0, b.h * 1.1)
                                    ],
                                    16
                                ]}
                            />
                            <meshPhysicalMaterial
                                color={b.c}
                                transparent opacity={0.65}
                                roughness={0.08}
                                transmission={0.92} // heavy glass transmission
                                thickness={0.08}    // thick glass effect
                                ior={1.5}
                                clearcoat={0.3}     // subtle specular highlight
                            />
                        </mesh>
                        <mesh position={[0, b.h * 0.4, b.r + 0.005]}>
                            <planeGeometry args={[b.r * 1.6, b.h * 0.5]} />
                            <meshStandardMaterial color="#f2ede6" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, b.h * 1.1 + 0.015, 0]}>
                            <cylinderGeometry args={[b.r * 0.45, b.r * 0.45, 0.04, 16]} />
                            <meshStandardMaterial color={b.cap} roughness={0.6} metalness={0.1} />
                        </mesh>
                    </group>
                ))}

                {/* ── Beakers & flasks on lower shelves for variety ─────── */}
                {[
                    { x: 4.0, y: 0.9, rB: 0.11, hB: 0.22 },
                    { x: -4.2, y: 1.75, rB: 0.09, hB: 0.18 },
                    { x: 3.8, y: 1.75, rB: 0.12, hB: 0.24 },
                    { x: -4.0, y: 2.6, rB: 0.10, hB: 0.20 },
                ].map((bk, i) => (
                    <group key={`wbeaker-${i}`} position={[bk.x, bk.y + bk.hB / 2 + 0.038, 0]}>
                        <mesh>
                            <cylinderGeometry args={[bk.rB, bk.rB * 0.88, bk.hB, 18, 1, true]} />
                            <meshPhysicalMaterial
                                color="#c8e8f4" transparent opacity={0.22}
                                roughness={0} transmission={0.88} ior={1.47}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                        <mesh position={[0, -bk.hB / 2, 0]}>
                            <circleGeometry args={[bk.rB * 0.88, 16]} />
                            <meshPhysicalMaterial
                                color="#c8e8f4" transparent opacity={0.22}
                                roughness={0} transmission={0.88}
                            />
                        </mesh>
                        <mesh position={[0, 0, 0]}>
                            <cylinderGeometry args={[bk.rB * 0.92, bk.rB * 0.88, bk.hB * 0.36, 18]} />
                            <meshPhysicalMaterial
                                color="#90c8e0" transparent opacity={0.55}
                                roughness={0.04}
                            />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* ══════════════════════════════════════════════════════════
                BACK WALL — CENTER SECTION: Large Windows
                x: -3.8 to +3.8     Three tall windows
            ══════════════════════════════════════════════════════════ */}
            {[-2.6, 0, 2.6].map((x) => (
                <group key={`win-${x}`} position={[x, 2.6, -9.44]}>
                    {/* Outer frame */}
                    <mesh>
                        <boxGeometry args={[2.2, 2.6, 0.2]} />
                        <meshStandardMaterial color="#c4c0b6" roughness={0.4} metalness={0.3} />
                    </mesh>
                    {/* Glass — real float glass, full PBR */}
                    <mesh position={[0, 0, 0.09]}>
                        <planeGeometry args={[1.84, 2.44]} />
                        <meshPhysicalMaterial
                            transmission={1.0}
                            thickness={0.3}
                            roughness={0.0}
                            ior={1.5}
                            reflectivity={0.9}
                            envMapIntensity={1.0}
                        />
                    </mesh>
                    {/* Horizontal rail */}
                    <mesh position={[0, 0.15, 0.1]}>
                        <boxGeometry args={[1.82, 0.055, 0.055]} />
                        <meshStandardMaterial color="#b0aea6" roughness={0.36} metalness={0.45} />
                    </mesh>
                    {/* Vertical mullion */}
                    <mesh position={[0, 0, 0.1]}>
                        <boxGeometry args={[0.055, 2.4, 0.055]} />
                        <meshStandardMaterial color="#b0aea6" roughness={0.36} metalness={0.45} />
                    </mesh>
                    {/* Window sill */}
                    <mesh position={[0, -1.47, 0.3]}>
                        <boxGeometry args={[2.25, 0.07, 0.45]} />
                        <meshPhysicalMaterial color="#d4d0c8" roughness={0.62} clearcoat={0.1} clearcoatRoughness={0.7} />
                    </mesh>
                    {/* Outdoor sky glow (bright daylight plane) */}
                    <mesh position={[0, 0, -0.12]}>
                        <planeGeometry args={[1.84, 2.44]} />
                        <meshBasicMaterial color="#747a80" />
                    </mesh>
                    {/* Sunlight shaft (volumetric cone) */}
                    <mesh position={[0, -3.8, 3.5]} rotation={[0.28, 0, 0]}>
                        <coneGeometry args={[1.2, 7.5, 6, 1, true]} />
                        <meshBasicMaterial
                            color="#ffe8a8"
                            transparent opacity={0.014}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            ))}

            {/* ══════════════════════════════════════════════════════════
                BACK WALL — RIGHT SECTION: Chalkboard
                x: +4.0 to +13.5   Large teaching chalkboard
            ══════════════════════════════════════════════════════════ */}
            <group position={[9.0, 1.75, -9.38]}>
                {/* Board surround / frame */}
                <mesh>
                    <boxGeometry args={[9.2, 2.8, 0.1]} />
                    <meshStandardMaterial color="#2e2820" roughness={1.0} metalness={0.0} />
                </mesh>
                {/* Chalkboard surface */}
                <mesh position={[0, 0, 0.05]}>
                    <planeGeometry args={[8.8, 2.5]} />
                    <meshStandardMaterial color={BOARD_GREEN} roughness={1.0} metalness={0.0} />
                </mesh>

                {/* ── Chalk formula markings ─────────────────────────── */}
                {/* Title line: "Qualitative Analysis" */}
                {[0, 0.6, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2, 4.8, 5.4].map((dx, i) => (
                    <mesh key={`ttl-${i}`} position={[-4.2 + dx, 1.15, 0.06]}>
                        <boxGeometry args={[0.38, 0.055, 0.005]} />
                        <meshStandardMaterial color={CHALK_WHITE} roughness={0.95} />
                    </mesh>
                ))}
                {/* Underline */}
                <mesh position={[0, 1.0, 0.06]}>
                    <boxGeometry args={[6.2, 0.025, 0.005]} />
                    <meshStandardMaterial color={CHALK_WHITE} roughness={0.95} />
                </mesh>

                {/* "HCl + NaOH → NaCl + H₂O" */}
                {[-3.8, -3.3, -2.8, -2.3, -1.8, -1.3, -0.8, -0.3, 0.2, 0.7, 1.2, 1.7, 2.2, 2.7, 3.2].map((dx, i) => (
                    <mesh key={`eq1-${i}`} position={[dx, 0.55, 0.06]}>
                        <boxGeometry args={[0.28 + (i % 3) * 0.06, 0.04, 0.005]} />
                        <meshStandardMaterial color={CHALK_WHITE} roughness={0.97} />
                    </mesh>
                ))}
                {/* Arrow → */}
                <mesh position={[-0.1, 0.55, 0.06]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.045, 0.14, 4]} />
                    <meshStandardMaterial color={CHALK_WHITE} roughness={0.96} />
                </mesh>

                {/* "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑" */}
                {[-4.1, -3.5, -2.9, -2.3, -1.7, -1.1, -0.5, 0.1, 0.7, 1.3, 1.9, 2.5, 3.1, 3.7].map((dx, i) => (
                    <mesh key={`eq2-${i}`} position={[dx, 0.1, 0.06]}>
                        <boxGeometry args={[0.24 + (i % 4) * 0.05, 0.038, 0.005]} />
                        <meshStandardMaterial color={CHALK_WHITE} roughness={0.97} />
                    </mesh>
                ))}
                <mesh position={[0, 0.1, 0.06]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.038, 0.12, 4]} />
                    <meshStandardMaterial color={CHALK_WHITE} roughness={0.96} />
                </mesh>

                {/* Ion test table lines */}
                {[-4.2, -4.2, -4.2, -4.2].map((_, i) => (
                    <mesh key={`tbl-${i}`} position={[-1.5, -0.38 - i * 0.25, 0.06]}>
                        <boxGeometry args={[4.8, 0.022, 0.005]} />
                        <meshStandardMaterial color={CHALK_FAINT} roughness={0.97} />
                    </mesh>
                ))}
                {/* Column dividers */}
                {[-2.2, 0.0, 1.8].map((dx, i) => (
                    <mesh key={`col-${i}`} position={[dx, -0.7, 0.06]}>
                        <boxGeometry args={[0.022, 1.1, 0.005]} />
                        <meshStandardMaterial color={CHALK_FAINT} roughness={0.97} />
                    </mesh>
                ))}
                {/* Short formula snippets in table cells */}
                {[-3.5, -0.9, 0.8, 3.0].map((dx, ci) =>
                    [-0.28, -0.52, -0.76, -1.0].map((dy, ri) => (
                        <mesh key={`cell-${ci}-${ri}`} position={[dx, dy, 0.06]}>
                            <boxGeometry args={[0.55 + (ri + ci) % 3 * 0.06, 0.03, 0.005]} />
                            <meshStandardMaterial color={CHALK_FAINT} roughness={0.97} />
                        </mesh>
                    ))
                )}

                {/* "Fe²⁺ / Fe³⁺ tests" title on right */}
                {[0, 0.5, 1.0, 1.5, 2.0, 2.5].map((dx, i) => (
                    <mesh key={`fe-${i}`} position={[2.2 + dx, 0.55, 0.06]}>
                        <boxGeometry args={[0.3, 0.042, 0.005]} />
                        <meshStandardMaterial color={CHALK_WHITE} roughness={0.97} />
                    </mesh>
                ))}

                {/* Chalk ledge */}
                <mesh position={[0, -1.51, 0.15]}>
                    <boxGeometry args={[8.8, 0.08, 0.18]} />
                    <meshStandardMaterial color="#2e2820" roughness={0.7} />
                </mesh>
                {/* Chalk pieces on ledge */}
                {[-3.5, -1.2, 0.4, 2.0, 3.8].map((cx, i) => (
                    <mesh key={`piece-${i}`} position={[cx, -1.49, 0.2]} rotation={[0, i * 0.4, 0]}>
                        <cylinderGeometry args={[0.024, 0.024, 0.12 + i * 0.02, 8]} />
                        <meshStandardMaterial color={i < 4 ? "#e8e4d8" : "#d8cca0"} roughness={0.88} />
                    </mesh>
                ))}

                {/* Eraser on ledge */}
                <mesh position={[1.2, -1.48, 0.22]}>
                    <boxGeometry args={[0.22, 0.05, 0.1]} />
                    <meshStandardMaterial color="#8a7050" roughness={0.85} />
                </mesh>
            </group>

            {/* ── Wall strip between shelves and board ────────────────── */}
            {/* Transition pilaster between left shelves and windows */}
            <mesh position={[-3.65, 1.75, -9.44]}>
                <boxGeometry args={[0.2, 3.5, 0.08]} />
                <meshStandardMaterial color={WALL_CREAM} roughness={0.95} />
            </mesh>
            {/* Transition between windows and board */}
            <mesh position={[4.0, 1.75, -9.44]}>
                <boxGeometry args={[0.25, 3.5, 0.08]} />
                <meshStandardMaterial color={WALL_CREAM} roughness={0.95} />
            </mesh>

            {/* ══════════════════════════════════════════════════════════
                LEFT WALL — Storage cabinets
            ══════════════════════════════════════════════════════════ */}
            <group position={[-13.65, 0, 0]}>
                <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.58, 1.08, 6.5]} />
                    <meshStandardMaterial color={CAB_WHITE} roughness={0.72} />
                </mesh>
                {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((z, i) => (
                    <group key={i} position={[0.3, 0.54, z]}>
                        <mesh>
                            <boxGeometry args={[0.018, 0.98, 0.95]} />
                            <meshStandardMaterial color="#c4c0b8" roughness={0.52} />
                        </mesh>
                        <mesh position={[0.02, 0, 0.33]}>
                            <boxGeometry args={[0.016, 0.018, 0.09]} />
                            <meshStandardMaterial color="#8a8880" roughness={0.22} metalness={0.88} />
                        </mesh>
                    </group>
                ))}
                <mesh position={[0, 1.1, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.05, 6.5]} />
                    <meshStandardMaterial color="#1a1f24" roughness={0.22} metalness={0.1} />
                </mesh>
                <mesh position={[0, 2.4, 0]} castShadow>
                    <boxGeometry args={[0.46, 1.1, 6.5]} />
                    <meshStandardMaterial color={CAB_WHITE} roughness={0.72} />
                </mesh>
            </group>

            {/* ══════════════════════════════════════════════════════════
                STUDENT EXPERIMENT TABLES (Background)
                z = -5 and z = -7 levels
            ══════════════════════════════════════════════════════════ */}
            {/* Removed extra background workbenches to reduce clutter */}

            {/* ══════════════════════════════════════════════════════════
                VENTILATION GRILLES — front wall top
            ══════════════════════════════════════════════════════════ */}
            {[-5, 0, 5].map((x) => (
                <group key={`vent-${x}`} position={[x, 4.2, 9.44]}>
                    <mesh>
                        <boxGeometry args={[1.4, 0.45, 0.1]} />
                        <meshStandardMaterial color="#c0bcb4" roughness={0.55} metalness={0.2} />
                    </mesh>
                    {[-0.14, -0.07, 0, 0.07, 0.14].map((dy, i) => (
                        <mesh key={i} position={[0, dy, 0.06]}>
                            <boxGeometry args={[1.3, 0.04, 0.04]} />
                            <meshStandardMaterial color="#aaa8a0" roughness={0.5} metalness={0.3} />
                        </mesh>
                    ))}
                </group>
            ))}

        </group>
    );
};


