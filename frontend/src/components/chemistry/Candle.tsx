"use client";

import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

export const Candle: React.FC = () => {
    const { state, toggleCandle } = useLabState();
    const groupRef = useRef<THREE.Group>(null!);
    const flameRef = useRef<THREE.Group>(null!);
    const candleId = "candle";
    
    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: candleId,
        groupRef,
        yOffset: 0,
        liftHeight: 0.05,
    });

    // Sub-candle wick flame animation
    useFrame((stateClock) => {
        if (state.candleOn && flameRef.current) {
            const time = stateClock.clock.elapsedTime;
            // Flicker effect
            const flicker = Math.sin(time * 12) * 0.05 + 0.95;
            flameRef.current.scale.set(
                (0.9 + Math.sin(time * 18) * 0.1) * flicker,
                (1.1 + Math.cos(time * 15) * 0.15) * flicker,
                (0.9 + Math.cos(time * 18) * 0.1) * flicker
            );
            flameRef.current.position.y = 0.31 + (Math.sin(time * 10) * 0.01);
        }
    });

    const isLit = state.candleOn;

    return (
        <group ref={groupRef} {...dragProps}>
            <group scale={0.6}>
                {/* ── Candle Body (Wax) ── */}
                <mesh position={[0, 0.1, 0]} castShadow receiveShadow 
                    onClick={(e) => { e.stopPropagation(); if (!isDragging) toggleCandle(); }}>
                    <cylinderGeometry args={[0.08, 0.082, 0.2, 16]} />
                    <meshPhysicalMaterial 
                        color="#f5e8c8" 
                        roughness={0.4} 
                        metalness={0.0} 
                        transmission={0.05} // Subtle wax transparency
                        thickness={0.05}
                    />
                </mesh>

                {/* ── Wick ── */}
                <mesh position={[0, 0.21, 0]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.02, 6]} />
                    <meshStandardMaterial color="#333" roughness={0.9} />
                </mesh>

                {/* ── Flame (Inspired by BunsenBurner) ── */}
                {isLit && (
                    <group ref={flameRef} position={[0, 0.3, 0]}>
                        {/* Core Flame (Blue/Yellow Inner) */}
                        <mesh>
                            <sphereGeometry args={[0.02, 16, 16]} />
                            <meshBasicMaterial color="#fff0b3" />
                        </mesh>
                        
                        {/* Outer Glow (Orange Glow) */}
                        <mesh scale={[1.2, 2.8, 1.2]} position={[0, 0.04, 0]}>
                            <sphereGeometry args={[0.03, 16, 16]} />
                            <meshStandardMaterial 
                                color="#ff6600" 
                                transparent 
                                opacity={0.65} 
                                emissive="#ff4d00" 
                                emissiveIntensity={2} 
                            />
                        </mesh>

                        {/* Point Light for the flame */}
                        <pointLight 
                            intensity={0.6} 
                            distance={1.0} 
                            color="#ff9933" 
                            decay={2}
                        />
                    </group>
                )}

                {isHovered && (
                    <Text
                        position={[0, 0.45, 0]}
                        fontSize={0.08}
                        color="white"
                        outlineWidth={0.005}
                        outlineColor="black"
                        textAlign="center"
                    >
                        {isLit ? "Candle (Burning)\nClick wax to extinguish" : "Candle\nClick wax to ignite"}
                    </Text>
                )}
            </group>
        </group>
    );
};
