"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface MeasuringCylinderProps {
    position: [number, number, number];
}

const CYL_H = 0.82;
const CYL_R = 0.082;
const FOOT_H = 0.045;
const FOOT_Y = -CYL_H / 2;

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

export const MeasuringCylinder: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const { dragProps, isHovered } = useApparatusDrag({ id: "measuringCylinder", groupRef, yOffset: 0 });
    const liquidRef = useRef<THREE.Mesh>(null!);

    return (
        <group
            ref={groupRef}
        >
            {/* Origin at bottom: y = 0 */}
            <group scale={0.45}>
                {/* ── Base / Foot (Integrated lathe) ────────────────────────────── */}
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
                                new THREE.Vector2(0.12, 0.001),
                                new THREE.Vector2(0.12, 0.03),
                                new THREE.Vector2(0.082, 0.06),
                                new THREE.Vector2(0.082, 0.82),
                                new THREE.Vector2(0.09, 0.83),
                                new THREE.Vector2(0.095, 0.84),
                                new THREE.Vector2(0, 0.84)
                            ],
                            12
                        ]}
                    />
                    <meshPhysicalMaterial {...GLASS} />
                </mesh>

                {/* ── Graduation markings ────────────────── */}
                {Array.from({ length: 9 }, (_, i) => {
                    const y = 0.15 + i * 0.07;
                    return (
                        <group key={i} position={[0.083, y, 0]}>
                            <mesh>
                                <planeGeometry args={[0.025, 0.006]} />
                                <meshStandardMaterial color="#4a88aa" roughness={0.9} transparent opacity={0.7} />
                            </mesh>
                            <Text
                                position={[0.035, 0, 0]}
                                fontSize={0.022}
                                color="#336688"
                                anchorX="left"
                            >
                                {(i + 1) * 10}
                            </Text>
                        </group>
                    );
                })}

                {/* ── Interaction Hints ────────────────── */}
                {isHovered && (
                    <Text
                        position={[0, 0.95, 0]}
                        fontSize={0.075}
                        color="white"
                        outlineWidth={0.006}
                        outlineColor="black"
                    >
                        {"Measuring Cylinder"}
                    </Text>
                )}
            </group>
        </group>
    );
};
