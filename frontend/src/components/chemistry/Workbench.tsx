"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useLabTextures } from "@/lib/useLabTextures";
import { useLabState } from "@/lib/chemistry/LabContext";
import { LabSink } from "./LabSink";
/**
 * Workbench — Modern laboratory island bench.
 * Refined to match high-definition reference image standards.
 */

const SURFACE_COLOR = "#2a2e33";   // dark graphite or charcoal
const CABINET_WHITE = "#e6dcc8";   // light wood or laminate color
const CABINET_TRIM = "#b5a390";    // darker wood trim
const HANDLE_COLOR = "#d0d4d8";    // polished stainless steel
const RACK_METAL = "#2a2e33";      // dark graphite or charcoal
const SINK_COLOR = "#1a1c1e";      // very dark resin sink
const SINK_BOTTOM = "#0d0e0f";
const PIPE_COLOR = "#b8b8b8";
const RUBBER_TUBE = "#d36a4a";     // orange rubber


export const Workbench = () => {
    const { state, toggleSink } = useLabState();
    const { benchRoughness } = useLabTextures();

    const BW = 5.5;    // length updated to matches prompt
    const BD = 1.8;    // width updated to matches prompt
    const BH = 0.08;   // tabletop thickness
    const SY = 0.74;   // tabletop centre Y → top = 0.78

    const drawerRows = [
        { y: 0.58, h: 0.18 },
        { y: 0.38, h: 0.18 },
        { y: 0.12, h: 0.22 },
    ];

    return (
        <group>
            {/* ── 1. TABLETOP (Integrated epoxy surface with SINK CUTOUT) ─ */}
            <mesh position={[0, SY, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow>
                <extrudeGeometry
                    args={[
                        (() => {
                            const s = new THREE.Shape();
                            // Outer workbench boundary
                            s.moveTo(-BW / 2, -BD / 2);
                            s.lineTo(BW / 2, -BD / 2);
                            s.lineTo(BW / 2, BD / 2);
                            s.lineTo(-BW / 2, BD / 2);
                            s.closePath();

                            // Sink hole cutout
                            const h = new THREE.Path();
                            const hx = -1.9;
                            const hz = -0.40;
                            const hw = 0.32;
                            const hd = 0.29;
                            h.moveTo(hx - hw, hz - hd);
                            h.lineTo(hx + hw, hz - hd);
                            h.lineTo(hx + hw, hz + hd);
                            h.lineTo(hx - hw, hz + hd);
                            h.closePath();
                            s.holes.push(h);

                            return s;
                        })(),
                        { depth: BH, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.01 }
                    ]}
                />
                <meshStandardMaterial
                    color={SURFACE_COLOR}
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>







            {/* ── 2. LOWER CABINETS WITH SINK CUTOUT ── */}
            <mesh position={[0, 0.70, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <extrudeGeometry
                    args={[
                        (() => {
                            const s = new THREE.Shape();
                            const cw = 5.5 - 0.1;
                            const cd = 1.8 - 0.1;
                            s.moveTo(-cw / 2, -cd / 2);
                            s.lineTo(cw / 2, -cd / 2);
                            s.lineTo(cw / 2, cd / 2);
                            s.lineTo(-cw / 2, cd / 2);
                            s.closePath();

                            // Sink & Plumbing hole
                            const h = new THREE.Path();
                            const hx = -1.9;
                            const hz = -0.40;
                            const hw = 0.35;
                            const hd = 0.32;
                            h.moveTo(hx - hw, hz - hd);
                            h.lineTo(hx + hw, hz - hd);
                            h.lineTo(hx + hw, hz + hd);
                            h.lineTo(hx - hw, hz + hd);
                            h.closePath();
                            s.holes.push(h);

                            return s;
                        })(),
                        { depth: 0.7, bevelEnabled: false }
                    ]}
                />
                <meshStandardMaterial color="#e6dcc8" roughness={0.7} />
            </mesh>

            {/* ── 4. APPARATUS & EXPERIMENT TOOLS (Moved to LabScene) ── */}

            {/* Kick board */}
            <mesh position={[0, 0.035, 0]}>
                <boxGeometry args={[BW - 0.05, 0.07, BD - 0.05]} />
                <meshStandardMaterial color="#222" roughness={0.8} />
            </mesh>

            {/* Front drawer panels */}
            {[-2.0, -1.3, -0.6, 0.1, 0.8].map((cx, ci) => (
                <group key={`col-${ci}`} position={[cx, 0, BD / 2 - 0.02]}>
                    {drawerRows.map(({ y, h }, di) => (
                        <group key={di} position={[0, y, 0]}>
                            <mesh castShadow>
                                <boxGeometry args={[0.6, h - 0.03, 0.03]} />
                                <meshStandardMaterial color={CABINET_WHITE} roughness={0.65} />
                            </mesh>
                            {/* Handle */}
                            <mesh position={[0, 0, 0.02]}>
                                <boxGeometry args={[0.22, 0.015, 0.015]} />
                                <meshStandardMaterial color={HANDLE_COLOR} roughness={0.2} metalness={0.9} />
                            </mesh>
                        </group>
                    ))}
                </group>
            ))}

            {/* ── 3. SINK (Professional Ceramic Lab Sink) ── */}
            <LabSink />

            {/* ── 4. REAGENT RACK (Stainless steel U-frame) ─────────────── */}
            <group position={[0, 1.25, -0.8]}>
                {/* Side posts */}
                {[-2.3, 2.3].map((x, i) => (
                    <mesh key={`post-${i}`} position={[x, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.025, 0.025, 1.6, 16]} />
                        <meshStandardMaterial color={RACK_METAL} roughness={0.3} metalness={0.8} />
                    </mesh>
                ))}
                {/* Shelves */}
                {[-0.17, 0.43].map((y, i) => (
                    <mesh key={`shelf-${i}`} position={[0, y, 0]} receiveShadow>
                        <boxGeometry args={[4.6, 0.06, 0.2]} />
                        <meshPhysicalMaterial color={RACK_METAL} roughness={0.4} clearcoat={0.05} />
                    </mesh>
                ))}
            </group>




            {/* ── 6. LABORATORY ACCESSORIES (Reference inspired) ────────── */}


            {/* Watch Glass (Shallow dish) */}
            <mesh position={[-0.5, SY + 0.05, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
                <sphereGeometry args={[0.08, 16, 12, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.1]} />
                <meshPhysicalMaterial color="#ebf2f5" transparent opacity={0.25} roughness={0.0} transmission={1.0} thickness={0.01} side={THREE.DoubleSide} />
            </mesh>

        </group>
    );
};
