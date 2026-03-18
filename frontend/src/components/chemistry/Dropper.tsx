"use client";

import React, { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";
import { useLabState } from "@/lib/chemistry/LabContext";
import { CHEMICALS, ChemicalId } from "@/lib/chemistry/engine";

const SINK_POS = new THREE.Vector3(-1.9, 0.58, -0.40);
const SINK_RADIUS = 0.45;

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

// ── SOUND: Safe play helper ────────────────────────────
const playSound = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
        const clone = audio.cloneNode(true) as HTMLAudioElement;
        clone.play().catch(() => {});
    } catch {}
};

export const Dropper: React.FC = () => {
    const { state, dropOneFromDropper, pickDropper, emptyDropper } = useLabState();
    const groupRef = useRef<THREE.Group>(null!);
    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: "dropper",
        groupRef,
        yOffset: 0.085,
        liftHeight: 0.15,
    });
    const { dropperContent, dropperLevel } = state;

    // Real Audio Files Refs
    const suctionSoundRef = useRef<HTMLAudioElement | null>(null);
    const dropSoundRef = useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        const suction = new Audio("/sounds/suction.mp3");
        const drop = new Audio("/sounds/drop.mp3");

        suction.preload = "auto";
        drop.preload = "auto";
        suction.volume = 0.6;
        drop.volume = 0.7;

        suctionSoundRef.current = suction;
        dropSoundRef.current = drop;

        suction.load();
        drop.load();
    }, []);

    // Animation & Interaction Refs
    const bulbSqueezeRef = useRef(0);
    const lastInteractionTime = useRef(0);
    const nozzleRef = useRef<THREE.Mesh>(null!);
    const bulbGroupRef = useRef<THREE.Group>(null!);
    const innerGroupRef = useRef<THREE.Group>(null!);
    const squeezeStartRef = useRef<number | null>(null);
    const squeezeCountRef = useRef(0);
    const [feedback, setFeedback] = useState<string | null>(null);

    // Sync bulb animation with global state (for tour support)
    React.useEffect(() => {
        if (state.lastSqueezeTime > 0) {
            squeezeStartRef.current = performance.now() / 1000;
            squeezeCountRef.current = 0;
        }
    }, [state.lastSqueezeTime]);

    const [lockedTubeId, setLockedTubeId] = useState<string | null>(null);
    const [lockedBottleId, setLockedBottleId] = useState<string | null>(null);
    const activeTubeIdRef = useRef<string | null>(null);
    const activeBottleIdRef = useRef<string | null>(null);
    const activeSinkRef = useRef(false);
    const lockTimerRef = useRef(0);

    const processClick = useCallback((now: number) => {
        const INTERACT_COOLDOWN = 0.15;
        if (now - lastInteractionTime.current < INTERACT_COOLDOWN) return;

        if (activeSinkRef.current && dropperLevel > 0.001) {
            emptyDropper();
            
            // small visual tilt when dumping
            if (innerGroupRef.current) {
                innerGroupRef.current.rotation.x = -0.8;
                setTimeout(() => {
                    if (innerGroupRef.current) innerGroupRef.current.rotation.x = 0;
                }, 200);
            }

            if (dropSoundRef.current) {
                const clone = dropSoundRef.current.cloneNode(true) as HTMLAudioElement;
                clone.playbackRate = 0.75 + Math.random() * 0.5;
                clone.volume = 0.6 + Math.random() * 0.2;
                clone.play().catch(() => {});
            }
            setFeedback("Dropper emptied in sink");
            setTimeout(() => setFeedback(null), 1500);
            squeezeStartRef.current = performance.now() / 1000;
            squeezeCountRef.current = 0;
            lastInteractionTime.current = now;
            return;
        }

        lastInteractionTime.current = now;

        const targetBottle = activeBottleIdRef.current;
        const targetTube = activeTubeIdRef.current;

        if (targetBottle) {
            const chemId = targetBottle.replace("bot_", "") as ChemicalId;
            if (state.openBottle !== chemId) {
                setFeedback("Open the bottle cap first!");
                setTimeout(() => setFeedback(null), 2000);
                return;
            }
            if (dropperLevel > 0.95) return;

            // Immediate State Action
            pickDropper(chemId);
            playSound(suctionSoundRef.current);

            squeezeStartRef.current = performance.now() / 1000;
            squeezeCountRef.current = 0;

        } else if (targetTube && dropperContent && dropperLevel > 0.001) {
            // Immediate State Action
            dropOneFromDropper(targetTube);
            squeezeStartRef.current = performance.now() / 1000;
            squeezeCountRef.current = 0;
           if (dropSoundRef.current) {
                const clone = dropSoundRef.current.cloneNode(true) as HTMLAudioElement;
                clone.playbackRate = 0.75 + Math.random() * 0.5;
                clone.volume = 0.6 + Math.random() * 0.2;
                clone.play().catch(() => {});
            }
        }
    }, [dropperContent, dropperLevel, state.openBottle, pickDropper, dropOneFromDropper]);

    const handleRightClick = useCallback((e: any) => {
        e.nativeEvent?.preventDefault?.();
        e.stopPropagation();
        processClick(performance.now() / 1000);
    }, [processClick]);

    useFrame((state3r, delta) => {
        if (!groupRef.current) return;
        const pos = groupRef.current.position;

        // 1. Detection Logic
        let overTubeId: string | null = null;
        let overBottleId: string | null = null;

        for (const bId in state.apparatus) {
            if (bId.startsWith("bot_")) {
                const bot = state.apparatus[bId];
                const dx = pos.x - bot.position[0];
                const dz = pos.z - bot.position[2];
                if (Math.sqrt(dx * dx + dz * dz) < 0.08 && Math.abs(pos.y - (bot.position[1] + 0.36)) < 0.2) {
                    overBottleId = bId;
                    break;
                }
            }
        }
        if (!overBottleId) {
            for (const tube of state.testTubes) {
                const dx = pos.x - tube.position[0];
                const dz = pos.z - tube.position[2];
                if (Math.sqrt(dx * dx + dz * dz) < 0.08 && Math.abs(pos.y - (tube.position[1] + 0.35)) < 0.2) {
                    overTubeId = tube.id;
                    break;
                }
            }
        }
        activeTubeIdRef.current = overTubeId;
        activeBottleIdRef.current = overBottleId;

        // ─── Sink Detection (Tip-based) ───
        const tip = new THREE.Vector3(0, -0.08, 0);
        groupRef.current.localToWorld(tip);

        const dxSink = tip.x - SINK_POS.x;
        const dzSink = tip.z - SINK_POS.z;
        const distSink = Math.sqrt(dxSink * dxSink + dzSink * dzSink);
        
        // allow detection slightly below rim
        const heightOK = tip.y > SINK_POS.y - 0.15;
        activeSinkRef.current = distSink < SINK_RADIUS && heightOK;

        // 2. Lock Stability (80ms)
        if (overBottleId || overTubeId) {
            lockTimerRef.current += delta;
            if (lockTimerRef.current > 0.08) {
                if (lockedBottleId !== overBottleId) setLockedBottleId(overBottleId);
                if (lockedTubeId !== overTubeId) setLockedTubeId(overTubeId);
            }
        } else {
            lockTimerRef.current = 0;
            if (lockedBottleId) {
                const bot = state.apparatus[lockedBottleId];
                if (!bot || Math.sqrt(Math.pow(pos.x - bot.position[0], 2) + Math.pow(pos.z - bot.position[2], 2)) > 0.12) setLockedBottleId(null);
            }
            if (lockedTubeId) {
                const tube = state.testTubes.find(t => t.id === lockedTubeId);
                if (!tube || Math.sqrt(Math.pow(pos.x - tube.position[0], 2) + Math.pow(pos.z - tube.position[2], 2)) > 0.12) setLockedTubeId(null);
            }
        }

        // 3. Precise Snapping
        if (!isDragging) {
            if (lockedBottleId) {
                const bot = state.apparatus[lockedBottleId];
                if (bot) {
                    pos.x = bot.position[0]; pos.z = bot.position[2]; pos.y = bot.position[1] + 0.36;
                    if (innerGroupRef.current) innerGroupRef.current.rotation.set(0, 0, 0);
                }
            } else if (lockedTubeId) {
                const tube = state.testTubes.find(t => t.id === lockedTubeId);
                if (tube) {
                    pos.x = tube.position[0]; pos.z = tube.position[2]; pos.y = tube.position[1] + 0.35;
                    if (innerGroupRef.current) innerGroupRef.current.rotation.set(0, 0, 0);
                }
            }
        }
        // Rotation restoration
        if (!isDragging && !lockedBottleId && !lockedTubeId && innerGroupRef.current) {
            innerGroupRef.current.rotation.x = THREE.MathUtils.lerp(innerGroupRef.current.rotation.x, 0, 6 * delta);
            innerGroupRef.current.rotation.z = THREE.MathUtils.lerp(innerGroupRef.current.rotation.z, 0, 6 * delta);
        }

        // 4. Bulb Squeeze Animation (Standardized Clock)
        const now = performance.now() / 1000; 
        if (squeezeStartRef.current !== null) {
            const elapsed = now - squeezeStartRef.current;

            const duration = 0.22; // shorter = snappy
            const bounceCount = 2; // EXACT 2 bounces
            const damping = 5.5;   // kills long wobble

            if (elapsed < duration) {
                const t = elapsed / duration;

                // 🔥 DAMPED OSCILLATION (real rubber feel)
                const oscillation = Math.sin(t * Math.PI * bounceCount);
                const decay = Math.exp(-t * damping);

                bulbSqueezeRef.current = oscillation * decay * 0.22;
            } else {
                bulbSqueezeRef.current = 0;
                squeezeStartRef.current = null;
            }
        }

        if (bulbGroupRef.current) {
            const s = bulbSqueezeRef.current;
            // Squeeze Y, expand XZ slightly to conserve volume (look more rubbery)
            bulbGroupRef.current.scale.set(
                1 + s * 0.15, 
                1 - s,
                1 + s * 0.15
            );
        }

        // Tour/State-driven rotation support
        const stateRotation = state.apparatus["dropper"]?.rotation;
        if (stateRotation && innerGroupRef.current && !isDragging) {
            innerGroupRef.current.rotation.set(...stateRotation);
        }
    });


    return (
        <group ref={groupRef}>
            <group ref={innerGroupRef}>

                {/* ── Visual Hierarchy ── */}
                <mesh position={[0, -0.05, 0]} castShadow><cylinderGeometry args={[0.008, 0.001, 0.1, 8]} /><meshPhysicalMaterial {...GLASS_MAT} /></mesh>
                <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.022, 0.008, 0.06, 8]} /><meshPhysicalMaterial {...GLASS_MAT} /></mesh>
                
                {/* Main Body Ghost (Precision Drag Area) */}
                <mesh 
                    position={[0, 0.17, 0]} 
                    castShadow
                    {...dragProps}
                    onPointerDown={(e) => { e.stopPropagation(); dragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); dragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); dragProps.onPointerUp?.(e); }}
                    onPointerEnter={dragProps.onPointerEnter}
                    onPointerLeave={dragProps.onPointerLeave}
                    onContextMenu={handleRightClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <cylinderGeometry args={[0.022, 0.022, 0.22, 12, 1, true]} />
                    <meshPhysicalMaterial {...GLASS_MAT} />
                </mesh>

                {dropperContent && CHEMICALS[dropperContent] && dropperLevel > 0.001 && (
                    <mesh position={[0, 0.05 + (dropperLevel * 0.08), 0]}>
                        <cylinderGeometry args={[0.02, 0.02, dropperLevel * 0.16, 8]} />
                        <meshPhysicalMaterial color={CHEMICALS[dropperContent].color} transparent opacity={0.7} />
                    </mesh>
                )}

                <group 
                    ref={bulbGroupRef} 
                    position={[0, 0.3, 0]}
                    {...dragProps}
                    onPointerDown={(e) => { e.stopPropagation(); dragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); dragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); dragProps.onPointerUp?.(e); }}
                    onPointerEnter={dragProps.onPointerEnter}
                    onPointerLeave={dragProps.onPointerLeave}
                    onContextMenu={handleRightClick}
                >
                    <mesh castShadow><sphereGeometry args={[0.028, 12, 12]} /><meshStandardMaterial color="#333" roughness={0.8} /></mesh>
                    <mesh position={[0, 0.04, 0]} castShadow><sphereGeometry args={[0.035, 12, 12]} /><meshStandardMaterial color="#333" roughness={0.8} /></mesh>
                </group>
            </group>

            {isHovered && (
                <Text position={[0, 0.6, 0]} fontSize={0.06} color="white" outlineWidth={0.005} outlineColor="black" textAlign="center">
                    {feedback || (
                        activeSinkRef.current
                            ? "SINK DETECTED\nRight-Click to empty dropper"
                            : lockedBottleId
                            ? "LOCKED TO BOTTLE\nRight-Click to fill"
                            : lockedTubeId
                            ? "LOCKED & ALIGNED\nRight-Click to dispense drop"
                            : (activeTubeIdRef.current || activeBottleIdRef.current)
                            ? "APPARATUS NEAR\nDrag closer to lock"
                            : (dropperContent && dropperLevel > 0.001
                            ? `Pipette (${CHEMICALS[dropperContent].name})\nMove over Tube mouth`
                            : "Pipette (Empty)\nInsert into Bottle & Right-Click to fill")
                    )}
                </Text>
            )}
        </group>
    );
};
