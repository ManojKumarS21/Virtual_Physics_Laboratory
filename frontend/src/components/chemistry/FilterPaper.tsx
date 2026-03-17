"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

export const FilterPaper: React.FC = () => {
    const { state, setFilterPaper } = useLabState();
    const groupRef = useRef<THREE.Group>(null!);
    
    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: "filterPaper",
        groupRef,
        yOffset: 0,
        liftHeight: 0.04,
    });

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // Snapping logic to Funnel
        if (isDragging) {
            const funnel = state.apparatus["funnel"];
            if (funnel) {
                const pos = groupRef.current.position;
                const fx = funnel.position[0];
                const fz = funnel.position[2];
                const dist = Math.sqrt(Math.pow(pos.x - fx, 2) + Math.pow(pos.z - fz, 2));

                // Snap distance
                if (dist < 0.15) {
                    // Snap towards the funnel top ring center
                    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, fx, 10 * delta);
                    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, fz, 10 * delta);
                    // Sit inside the cone (funnel Y is center of stem, cone is above)
                    // Funnel cone is at y=0.08 in Funnel.tsx, which is relative to its group
                    // So we sit at funnel.y + 0.08
                    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, funnel.position[1] + 0.08, 10 * delta);
                    
                    if (dist < 0.05 && !state.filterPaperInFunnel) {
                        setFilterPaper(true);
                    }
                } else if (state.filterPaperInFunnel) {
                    setFilterPaper(false);
                }
            }
        }
    });

    return (
        <group ref={groupRef} {...dragProps}>
            <group scale={0.75} position={[0, 0.01, 0]}>
                {/* Triangular Folded Cone */}
                <mesh castShadow>
                    <coneGeometry args={[0.13, 0.11, 4]} />
                    <meshStandardMaterial 
                        color="#fefefe" 
                        roughness={0.9} 
                        side={THREE.DoubleSide}
                        polygonOffset
                        polygonOffsetFactor={1}
                    />
                </mesh>
                
                {/* Visual detail - second fold layer */}
                <mesh rotation={[0, 1.2, 0]} position={[0.02, 0, 0.02]}>
                    <coneGeometry args={[0.132, 0.112, 4]} />
                    <meshStandardMaterial color="#f8f8f8" roughness={0.9} transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>

                {isHovered && (
                    <Text
                        position={[0, 0.2, 0]}
                        fontSize={0.06}
                        color="white"
                        outlineColor="black"
                        outlineWidth={0.005}
                    >
                        {state.filterPaperInFunnel ? "Filter Paper (In Funnel)" : "Filter Paper (Folded)"}
                    </Text>
                )}
            </group>
        </group>
    );
};
