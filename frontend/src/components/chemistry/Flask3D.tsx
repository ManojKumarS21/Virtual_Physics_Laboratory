"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface Flask3DProps {
    position: [number, number, number];
}

const GLASS: Partial<THREE.MeshPhysicalMaterialParameters> = {
    color: "#e8eff4",
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.0,
    reflectivity: 1.0,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    side: THREE.DoubleSide,
};

export const Flask3D: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const { dragProps, isHovered } = useApparatusDrag({ id: "flask", groupRef, yOffset: 0 });

    const liquidRef = useRef<THREE.Mesh>(null!);

    return (
        <group
            ref={groupRef}
        >
            {/* Origin at bottom: y = 0 */}
            <group scale={0.42}>
                {/* ── Main Body (Integrated base + neck) ────────────────────── */}
                <mesh 
                    castShadow
                    {...dragProps}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerDown?.(e);
                    }}
                    onPointerMove={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerMove?.(e);
                    }}
                    onPointerUp={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerUp?.(e);
                    }}
                    onPointerEnter={dragProps.onPointerEnter}
                    onPointerLeave={dragProps.onPointerLeave}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <latheGeometry
                        args={[
                            [
                                new THREE.Vector2(0, 0.001),
                                new THREE.Vector2(0.18, 0.001),
                                new THREE.Vector2(0.19, 0.015),
                                new THREE.Vector2(0.05, 0.42),
                                new THREE.Vector2(0.045, 0.6),
                                new THREE.Vector2(0, 0.6)
                            ],
                            16
                        ]}
                    />
                    <meshPhysicalMaterial {...GLASS} />
                </mesh>

                {/* ── Neck rim ring ─────────────────────────────────────────── */}
                <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.045, 0.008, 8, 24]} />
                    <meshPhysicalMaterial
                        color="#c0d8ec"
                        transparent opacity={0.35}
                        roughness={0} transmission={0.0}
                    />
                </mesh>

                {/* graduation marks */}
                {[0.15, 0.25, 0.35].map((y, i) => (
                    <mesh key={i} position={[0.12, y, 0]} rotation={[0, -0.4, 0]}>
                        <planeGeometry args={[0.04, 0.008]} />
                        <meshStandardMaterial color="#5a8899" roughness={0.9} transparent opacity={0.6} />
                    </mesh>
                ))}

                {/* ── Stopper / plug ────────────────────────────── */}
                <mesh position={[0, 0.64, 0]}>
                    <cylinderGeometry args={[0.032, 0.045, 0.08, 14]} />
                    <meshStandardMaterial color="#1f1f1f" roughness={0.8} />
                </mesh>

                {/* ── Hover label ───────────────────────────────────────────── */}
                {isHovered && (
                    <Text
                        position={[0, 0.82, 0]}
                        fontSize={0.075}
                        color="white"
                        outlineWidth={0.006}
                        outlineColor="black"
                    >
                        {"Flask"}
                    </Text>
                )}
            </group>
        </group>
    );
};
