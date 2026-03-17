"use client";

import React, { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface GlassRodProps {
    position: [number, number, number];
}

/**
 * Realistic glass stirring rod — lying at a slight angle on the bench.
 * Borosilicate glass: thin, clear, slightly reflective.
 */
export const GlassRod: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: "glassRod",
        groupRef,
        yOffset: 0.015, // Small offset for horizontal lying flat
        liftHeight: 0.1,
    });

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
    };

    // Set horizontal rotation
    useFrame((_, delta) => {
        if (!groupRef.current) return;
        // Keep horizontal (PI/2) when not dragging, go vertical (0) when dragging for stirring
        const targetRot = isDragging ? 0 : Math.PI / 2;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot, 10 * delta);
    });

    return (
        <group
            ref={groupRef}
            rotation={[0, 0, Math.PI / 2]}
        >
            {/* ── Main rod body ─────────────────────────────────────── */}
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
                <cylinderGeometry args={[0.013, 0.013, 0.62, 8]} />
                <meshPhysicalMaterial {...GLASS} />
            </mesh>

            {/* Slight highlight seam along the rod surface */}
            <mesh position={[0.011, 0, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.60, 8]} />
                <meshBasicMaterial
                    color="#e8f4ff"
                    transparent opacity={0.35}
                    depthWrite={false}
                />
            </mesh>

            {/* ── Rounded top end ───────────────────────────────────── */}
            <mesh position={[0, 0.31, 0]}>
                <sphereGeometry args={[0.013, 8, 8]} />
                <meshPhysicalMaterial {...GLASS} />
            </mesh>

            {/* ── Rounded bottom end ────────────────────────────────── */}
            <mesh position={[0, -0.31, 0]}>
                <sphereGeometry args={[0.013, 8, 8]} />
                <meshPhysicalMaterial {...GLASS} />
            </mesh>
            {
                isHovered && (
                    <Billboard position={[0.4, 0, 0]}>
                        <Text
                            fontSize={0.075}
                            color="white"
                            outlineWidth={0.006}
                            outlineColor="black"
                            textAlign="center"
                        >
                            {"Glass Stirring Rod\nDrag over Test Tube to Stir"}
                        </Text>
                    </Billboard>
                )
            }
        </group >
    );
};
