"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface BunsenBurnerProps {
    position: [number, number, number];
}

// ── SOUND: Safe play helper ────────────────────────────
const playSound = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
        const clone = audio.cloneNode(true) as HTMLAudioElement;
        clone.play().catch(() => {});
    } catch {}
};

export const BunsenBurner: React.FC = () => {
    const { state, toggleBurner } = useLabState();
    const { burnerOn } = state;
    const groupRef = useRef<THREE.Group>(null!);

    const flameRef = useRef<THREE.Mesh>(null!);
    const glowRef = useRef<THREE.PointLight>(null!);
    const innerFlameRef = useRef<THREE.Mesh>(null!);
    const heatHazeRef = useRef<THREE.Mesh>(null!);
    const blueBaseRef = useRef<THREE.Mesh>(null!);
    const igniteSoundRef = useRef<HTMLAudioElement | null>(null);
    const flameLoopSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const ignite = new Audio("/sounds/ignite.mp3");
        ignite.preload = "auto";
        ignite.volume = 0.5;
        igniteSoundRef.current = ignite;
        ignite.load();

        const loop = new Audio("/sounds/flame_loop.mp3");
        loop.preload = "auto";
        loop.loop = true;
        loop.volume = 0.35;
        flameLoopSoundRef.current = loop;
        loop.load();
    }, []);

    const { dragProps, isDragging, isHovered } = useApparatusDrag({ 
        id: "burner", 
        groupRef,
        yOffset: 0,
        liftHeight: 0.05,
    });

    // Spark particles for ignition visual
    const sparkGroupRef = useRef<THREE.Group>(null!);
    const [sparking, setSparking] = useState(false);
    const [hovered, setHovered] = useState(false);
    const currentColor = useRef(new THREE.Color("#ff8c1a"));
    const targetColorObj = useRef(new THREE.Color("#ff8c1a"));
    const prevBurnerOn = useRef(burnerOn);

    // Detect toggle — trigger spark anim & manage loop sound
    useEffect(() => {
        if (!prevBurnerOn.current && burnerOn) {
            setSparking(true);
            const t = setTimeout(() => setSparking(false), 600);
            
            if (flameLoopSoundRef.current) {
                flameLoopSoundRef.current.play().catch(() => {});
            }
            return () => clearTimeout(t);
        } else if (prevBurnerOn.current && !burnerOn) {
            if (flameLoopSoundRef.current) {
                flameLoopSoundRef.current.pause();
                flameLoopSoundRef.current.currentTime = 0;
            }
        }
        prevBurnerOn.current = burnerOn;
    }, [burnerOn]);

    // ── Animate flame, glow & heat haze ──────────────────────────────────────
    useFrame((clockState, delta) => {
        const t = clockState.clock.elapsedTime;

        if (burnerOn) {
            // Outer flame - Requirement 3: Flicker animation
            if (flameRef.current) {
                const flickerScale = 1 + Math.sin(t * 15) * 0.05 + (Math.random() - 0.5) * 0.03;
                flameRef.current.scale.set(1 + Math.sin(t * 10) * 0.02, flickerScale, 1 + Math.sin(t * 10) * 0.02);
                flameRef.current.position.x = (Math.random() - 0.5) * 0.005;
                flameRef.current.position.z = (Math.random() - 0.5) * 0.005;
            }
            // Inner flame
            if (innerFlameRef.current) {
                const scaleY = 0.9 + Math.sin(t * 15 + 0.5) * 0.07;
                innerFlameRef.current.scale.set(1, scaleY, 1);
            }
            // Blue base - Requirement 3: Flicker in sync
            if (blueBaseRef.current) {
                blueBaseRef.current.scale.y = 1 + Math.sin(t * 20) * 0.1;
                blueBaseRef.current.scale.x = 1 + Math.sin(t * 15) * 0.05;
                blueBaseRef.current.scale.z = 1 + Math.sin(t * 15) * 0.05;
            }
            // Glow pulsing
            if (glowRef.current) {
                glowRef.current.intensity = 1.8 + Math.sin(t * 11) * 0.4 + Math.sin(t * 6.5) * 0.2;
            }
            if (heatHazeRef.current) {
                const s = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 5) * 0.04;
                heatHazeRef.current.scale.set(s, 1 + Math.sin(t * 7) * 0.08, s);
                (heatHazeRef.current.material as THREE.MeshBasicMaterial).opacity =
                    0.06 + Math.abs(Math.sin(t * 6)) * 0.04;
            }

            // ── Dynamic Flame Color based on heating tube ──
            const heatingTube = state.testTubes.find(tube => tube.isHeating && tube.chemicals.length > 0);
            let targetHex = "#ff8c1a";
            if (heatingTube) {
                const primaryChem = heatingTube.chemicals[0];
                if (primaryChem === "Ca") targetHex = "#FF5722";
                else if (primaryChem === "Na") targetHex = "#FFD600";
                else if (primaryChem === "K") targetHex = "#D1C4E9";
            }

            targetColorObj.current.set(targetHex);
            if (!currentColor.current.equals(targetColorObj.current)) {
                currentColor.current.lerp(targetColorObj.current, 0.1);
                if (flameRef.current) {
                    (flameRef.current.material as THREE.MeshStandardMaterial).color.copy(currentColor.current);
                    (flameRef.current.material as THREE.MeshStandardMaterial).emissive.copy(currentColor.current);
                }
                if (glowRef.current) {
                    glowRef.current.color.copy(currentColor.current);
                }
            }
        }

        // Spark rotation
        if (sparking && sparkGroupRef.current) {
            sparkGroupRef.current.rotation.y += delta * 15;
        }
    });

    return (
        <group
            name="apparatus_burner"
            ref={groupRef}
        >
            <group scale={0.715}>
                {/* ── Base ─────────────────────────────────────────────────── */}
                <mesh 
                    position={[0, 0.04, 0]} 
                    castShadow
                    {...dragProps}
                    onPointerEnter={(e) => { 
                        e.stopPropagation();
                        dragProps.onPointerEnter(e); 
                        setHovered(true); 
                    }}
                    onPointerLeave={(e) => { 
                        e.stopPropagation();
                        dragProps.onPointerLeave(e); 
                        setHovered(false); 
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        // preserve drag logic
                        dragProps.onPointerDown?.(e);

                        if (isDragging || e.button !== 2) return;
                        
                        // Toggle state
                        const turningOn = !burnerOn;
                        toggleBurner();

                        // Direct audio trigger for browser stability
                        if (turningOn) {
                            playSound(igniteSoundRef.current);
                        }
                    }}
                    onContextMenu={(e) => {
                        e.stopPropagation();
                        e.nativeEvent?.preventDefault?.();
                    }}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <cylinderGeometry args={[0.14, 0.18, 0.08, 20]} />
                    <meshStandardMaterial color={hovered ? "#3a4258" : "#2a3248"} roughness={0.3} metalness={0.8} />
                </mesh>

                {/* Air-valve ring */}
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.04, 20]} />
                    <meshStandardMaterial color="#1e2840" roughness={0.2} metalness={0.9} />
                </mesh>

                {/* ── Barrel (Vertical tube) ──────────────────────────────── */}
                <mesh 
                    position={[0, 0.24, 0]} 
                    castShadow
                    {...dragProps}
                    onPointerEnter={(e) => { 
                        e.stopPropagation();
                        dragProps.onPointerEnter(e); 
                        setHovered(true); 
                    }}
                    onPointerLeave={(e) => { 
                        e.stopPropagation();
                        dragProps.onPointerLeave(e); 
                        setHovered(false); 
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        // preserve drag logic
                        dragProps.onPointerDown?.(e);

                        if (isDragging || e.button !== 2) return;
                        
                        // Toggle state
                        const turningOn = !burnerOn;
                        toggleBurner();

                        // Direct audio trigger for browser stability
                        if (turningOn) {
                            playSound(igniteSoundRef.current);
                        }
                    }}
                    onContextMenu={(e) => {
                        e.stopPropagation();
                        e.nativeEvent?.preventDefault?.();
                    }}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <cylinderGeometry args={[0.06, 0.1, 0.28, 16]} />
                    <meshStandardMaterial color={hovered ? "#3a4258" : "#2a3248"} roughness={0.4} metalness={0.7} />
                </mesh>
                {/* ── Heat Discoloration from repeated heating ────────────── */}
                <mesh position={[0, 0.33, 0]}>
                    <cylinderGeometry args={[0.062, 0.08, 0.1, 16]} />
                    <meshStandardMaterial color="#352848" transparent opacity={0.6} roughness={0.3} metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.26, 0]}>
                    <cylinderGeometry args={[0.076, 0.088, 0.06, 16]} />
                    <meshStandardMaterial color="#4a3e35" transparent opacity={0.4} roughness={0.5} metalness={0.6} />
                </mesh>

                {/* ── Gas jet ring at top ──────────────────────────────────── */}
                <mesh position={[0, 0.39, 0]}>
                    <cylinderGeometry args={[0.065, 0.065, 0.03, 16]} />
                    <meshStandardMaterial color="#1a2030" roughness={0.2} metalness={0.95} />
                </mesh>

                {/* ── Gas inlet pipe ──────────────────────────────────────── */}
                <mesh position={[0.12, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, 0.2, 10]} />
                    <meshStandardMaterial color="#1e2840" roughness={0.3} metalness={0.8} />
                </mesh>
                <mesh position={[0.24, 0.04, 0]}>
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshStandardMaterial color="#1e2840" roughness={0.4} metalness={0.6} />
                </mesh>
                {/* ── Orange Rubber Tubing (Flexible, trailing off) ──────── */}
                <mesh position={[0.3, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.028, 0.028, 0.16, 12]} />
                    <meshStandardMaterial color="#cd5c3a" roughness={0.8} />
                </mesh>
                {/* Curve down to table */}
                <mesh position={[0.38, 0.015, 0]} rotation={[Math.PI / 2, Math.PI, 0] as any}>
                    <torusGeometry args={[0.025, 0.028, 12, 16, Math.PI]} />
                    <meshStandardMaterial color="#cd5c3a" roughness={0.8} />
                </mesh>
                {/* Trailing back along bench */}
                <mesh position={[0.405, -0.01, -0.1]} rotation={[Math.PI / 2, 0, 0] as any}>
                    <cylinderGeometry args={[0.028, 0.028, 0.2, 12]} />
                    <meshStandardMaterial color="#cd5c3a" roughness={0.8} />
                </mesh>

                {/* ── Spark effect on ignition ─────────────────────────────── */}
                {sparking && (
                    <group ref={sparkGroupRef} position={[0, 0.44, 0]}>
                        {Array.from({ length: 8 }).map((_, i) => {
                            const angle = (i / 8) * Math.PI * 2;
                            return (
                                <mesh
                                    key={i}
                                    position={[
                                        Math.cos(angle) * 0.06,
                                        Math.random() * 0.05,
                                        Math.sin(angle) * 0.06,
                                    ]}
                                >
                                    <sphereGeometry args={[0.006 + Math.random() * 0.006, 4, 4]} />
                                    <meshBasicMaterial
                                        color={i % 2 === 0 ? "#ffee88" : "#ff8800"}
                                        transparent
                                        opacity={0.9}
                                    />
                                </mesh>
                            );
                        })}
                    </group>
                )}

                {/* ── Flame ───────────────────────────────────────────────── */}
                {burnerOn && (
                    <group position={[0, 0.41, 0]}>
                        {/* Outer flame */}
                        <mesh ref={flameRef}>
                            <coneGeometry args={[0.055, 0.28, 12]} />
                            <meshStandardMaterial
                                color="#ff8c1a"
                                emissive="#ff8c1a"
                                emissiveIntensity={3.5}
                                transparent
                                opacity={0.88}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Mid flame */}
                        <mesh position={[0, 0.02, 0]}>
                            <coneGeometry args={[0.038, 0.22, 10]} />
                            <meshStandardMaterial
                                color="#ffcc44"
                                emissive="#ff9900"
                                emissiveIntensity={4}
                                transparent
                                opacity={0.75}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Inner core */}
                        <mesh ref={innerFlameRef} position={[0, 0.04, 0]}>
                            <coneGeometry args={[0.022, 0.15, 8]} />
                            <meshStandardMaterial
                                color="#fffbe8"
                                emissive="#ffe0a0"
                                emissiveIntensity={5}
                                transparent
                                opacity={0.7}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Blue base - Requirement 3: Glow at base */}
                        <mesh ref={blueBaseRef} position={[0, -0.04, 0]}>
                            <coneGeometry args={[0.052, 0.08, 12]} />
                            <meshStandardMaterial
                                color="#4488ff"
                                emissive="#2255dd"
                                emissiveIntensity={4}
                                transparent
                                opacity={0.75}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>

                        {/* Heat haze shimmer (slightly above flame) */}
                        <mesh ref={heatHazeRef} position={[0, 0.24, 0]}>
                            <cylinderGeometry args={[0.065, 0.045, 0.18, 10, 1, true]} />
                            <meshBasicMaterial
                                color="#ffe8c0"
                                transparent
                                opacity={0.07}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>

                        {/* Dynamic point light from flame */}
                        <pointLight
                            ref={glowRef}
                            position={[0, 0.1, 0]}
                            color="#ff8c1a"
                            intensity={2.0}
                            distance={2.8}
                            decay={2}
                        />
                    </group>
                )}

                {hovered && (
                    <Text
                        position={[0, 0.85, 0]}
                        fontSize={0.085}
                        color="white"
                        outlineWidth={0.006}
                        outlineColor="black"
                        textAlign="center"
                    >
                        {burnerOn ? "Bunsen Burner\n🔥 Right-Click to Turn OFF" : "Bunsen Burner\nRight-Click to Ignite"}
                    </Text>
                )}
            </group>
        </group>
    );
};
