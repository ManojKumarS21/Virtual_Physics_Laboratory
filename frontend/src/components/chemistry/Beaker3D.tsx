"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface Beaker3DProps {
    position: [number, number, number];
}

const GLASS_MAT_PROPS: Partial<THREE.MeshPhysicalMaterialParameters> = {
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

export const Beaker3D: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const { dragProps, isHovered } = useApparatusDrag({ id: "beaker", groupRef, yOffset: 0 });

    const liquidRef = useRef<THREE.Mesh>(null!);

    // Subtle liquid shimmer
    useFrame((state) => {
        if (liquidRef.current) {
            const mat = liquidRef.current.material as THREE.MeshPhysicalMaterial;
            mat.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 1.8) * 0.03;
        }
    });

    return (
        <group
            ref={groupRef}
        >
            {/* Origin at bottom: y = 0 */}
            <group scale={0.45}>
                {/* ── Main Body (Integrated base) ────────────────────────────── */}
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
                                new THREE.Vector2(0.14, 0.001),
                                new THREE.Vector2(0.155, 0.015),
                                new THREE.Vector2(0.18, 0.5),
                                new THREE.Vector2(0, 0.5)
                            ],
                            16
                        ]}
                    />
                    <meshPhysicalMaterial {...GLASS_MAT_PROPS} />
                </mesh>

                {/* ── Thick rim ring at top ────────────────────────────────── */}
                <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.18, 0.009, 8, 24]} />
                    <meshPhysicalMaterial
                        color="#c8e4f4"
                        transparent opacity={0.35}
                        roughness={0} transmission={0.0}
                    />
                </mesh>

                {/* ── Beaker spout ──────────────────────────────────────────── */}
                <mesh position={[0.18, 0.49, 0]} rotation={[0, 0, -0.35]}>
                    <cylinderGeometry args={[0.025, 0.018, 0.04, 10]} />
                    <meshPhysicalMaterial {...GLASS_MAT_PROPS} opacity={0.3} />
                </mesh>

                {/* graduation lines */}
                {[0.12, 0.22, 0.32, 0.42].map((y, i) => (
                    <mesh key={i} position={[0.165, y, 0]}>
                        <planeGeometry args={[0.045, 0.008]} />
                        <meshStandardMaterial color="#5588aa" roughness={0.9} transparent opacity={0.65} />
                    </mesh>
                ))}

                {/* ── Interaction Hints ─────────────────────────────────── */}
                {isHovered && (
                    <Text
                        position={[0, 0.65, 0]}
                        fontSize={0.075}
                        color="white"
                        outlineWidth={0.006}
                        outlineColor="black"
                    >
                        Beaker (250 mL)
                    </Text>
                )}
            </group>
        </group>
    );
};
