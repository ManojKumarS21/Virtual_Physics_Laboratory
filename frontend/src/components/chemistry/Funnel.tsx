"use client";

import React, { useState, useRef } from "react";
import * as THREE from "three";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";
import { Text } from "@react-three/drei";

export const Funnel: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const { dragProps, isHovered } = useApparatusDrag({
        id: "funnel",
        groupRef,
        yOffset: 0.12,
        liftHeight: 0.05,
    });

    const GLASS_MAT: Partial<THREE.MeshPhysicalMaterialParameters> = {
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

    return (
        <group ref={groupRef}>
            {/* Cone of the funnel */}
            <mesh 
                position={[0, 0.08, 0]}
                {...dragProps}
                onPointerDown={(e) => { e.stopPropagation(); dragProps.onPointerDown?.(e); }}
                onPointerMove={(e) => { e.stopPropagation(); dragProps.onPointerMove?.(e); }}
                onPointerUp={(e) => { e.stopPropagation(); dragProps.onPointerUp?.(e); }}
                onPointerEnter={dragProps.onPointerEnter}
                onPointerLeave={dragProps.onPointerLeave}
                raycast={THREE.Mesh.prototype.raycast}
            >
                <cylinderGeometry args={[0.15, 0.015, 0.16, 12, 1, true]} />
                <meshPhysicalMaterial {...GLASS_MAT} />
            </mesh>

            {/* Stem of the funnel */}
            <mesh 
                position={[0, -0.06, 0]}
                {...dragProps}
                onPointerDown={(e) => { e.stopPropagation(); dragProps.onPointerDown?.(e); }}
                onPointerMove={(e) => { e.stopPropagation(); dragProps.onPointerMove?.(e); }}
                onPointerUp={(e) => { e.stopPropagation(); dragProps.onPointerUp?.(e); }}
                onPointerEnter={dragProps.onPointerEnter}
                onPointerLeave={dragProps.onPointerLeave}
                raycast={THREE.Mesh.prototype.raycast}
            >
                <cylinderGeometry args={[0.015, 0.012, 0.12, 8, 1, true]} />
                <meshPhysicalMaterial {...GLASS_MAT} />
            </mesh>

            {isHovered && (
                <Text
                    position={[0, 0.3, 0]}
                    fontSize={0.06}
                    color="white"
                    outlineWidth={0.005}
                    outlineColor="#000"
                >
                    {"Funnel"}
                </Text>
            )}
        </group>
    );
};
