"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";
import { ChemicalId, GET_CHEMICAL_CONFIG } from "@/lib/chemistry/engine";

const TUBE_HEIGHT = 0.55;
const TUBE_RADIUS = 0.055;
const SCALER = 0.45;
const BOTTOM_Y = 0.02;
const RIM_Y = 0.55;

const SINK_POS = new THREE.Vector3(-1.9, 0.58, -0.40);
const SINK_RADIUS = 0.45;

const BURNER_FLAME_HEIGHT = 0.41;
const HEATING_LOCK_RADIUS = 0.18;
const HEATING_LOCK_HEIGHT = 0.42;

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
};

// ── SOUND: Safe play helper ────────────────────────────
const playSound = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
        const clone = audio.cloneNode(true) as HTMLAudioElement;
        clone.play().catch(() => { });
    } catch { }
};

export const TestTube: React.FC<{ tubeId: string }> = ({ tubeId }) => {
    const { state, selectTube, setTubeHeating } = useLabState();
    const tube = state.testTubes.find((t) => t.id === tubeId);

    const groupRef = useRef<THREE.Group>(null!);
    const liquidRef = useRef<THREE.Mesh>(null!);
    const bubbleRefs = useRef<Array<THREE.Mesh>>([]);
    const overSinkRef = useRef(false);
    const insideSinkRef = useRef(false);
    const pourProgressRef = useRef(0);
    const heatingLockRef = useRef(false);
    const manualUnlockRef = useRef(false);
    const heatingTimerRef = useRef(0);
    const dropParticlesRef = useRef<THREE.Points>(null!);
    const gasPlayedRef = useRef(false);
    const hissSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const snd = new Audio("/sounds/hiss.mp3");
        snd.preload = "auto";
        snd.volume = 0.4;
        hissSoundRef.current = snd;
        snd.load();
    }, []);

    const isAttached = state.holderAttachedId === tubeId;

    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: tubeId,
        groupRef,
        yOffset: 0,
    });

    // Test tube remains always selectable and draggable
    const holderDragProps = dragProps;

    if (!tube) return null;

    const tubeColor = tube.hasPrecipitate
        ? (tube.precipitateColor || tube.color || "#ffffff")
        : (tube.color || "#ffffff");
    const displayColorRef = useRef(new THREE.Color(tubeColor));
    const rippleRef = useRef<THREE.Mesh>(null!);
    const cloudGroupRef = useRef<THREE.Group>(null!);
    const cloudMeshRef = useRef<THREE.Mesh>(null!);
    const impactRippleRef = useRef(0);
    const liquidTop = BOTTOM_Y + (tube.fillLevel * TUBE_HEIGHT);

    // Particle system for precipitate
    const particleCount = 100;
    const particles = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.08;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Centered vertical cloud
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
            velocities[i] = 0.05 + Math.random() * 0.1;
        }
        return { positions, velocities };
    }, []);

    const particlesRef = useRef<THREE.Points>(null!);

    // Clump offsets for chunky precipitate look
    const clumps = useMemo(() => {
        return Array.from({ length: 4 }).map(() => ({
            pos: [
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04
            ] as [number, number, number],
            scale: 0.6 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2
        }));
    }, []);

    const clumpRefs = useRef<Array<THREE.Mesh>>([]);
    const elasticScale = useRef(0);

    // Particle system for gas fumes
    const fumeCount = 80;
    const fumes = useMemo(() => {
        const positions = new Float32Array(fumeCount * 3);
        const velocities = new Float32Array(fumeCount);
        for (let i = 0; i < fumeCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.01;
            positions[i * 3 + 1] = -0.05; // Start slightly inside the tube
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
            velocities[i] = 0.15 + Math.random() * 0.25;
        }
        return { positions, velocities };
    }, []);

    // Programmatically create a soft smoke texture (Requirement: No pixelated dots)
    const smokeTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }, []);
    const fumesRef = useRef<THREE.Points>(null!);

    useFrame((stateFiber, delta) => {
        if (!groupRef.current || !tube) return;

        // ─── Sink Detection (Mouth-based world coordinates) ───
        const mouthPos = new THREE.Vector3(0, TUBE_HEIGHT * SCALER, 0);
        groupRef.current.localToWorld(mouthPos);

        const dx = mouthPos.x - SINK_POS.x;
        const dz = mouthPos.z - SINK_POS.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // start tilt when approaching sink
        const APPROACH_RADIUS = SINK_RADIUS + 0.35;
        const isEffectivelyDragging = state.draggingId === tubeId || (isAttached && state.draggingId === "holder");

        const approachingSink = dist < APPROACH_RADIUS && isEffectivelyDragging;
        const insideSink = dist < SINK_RADIUS;

        if (insideSink) {
            console.log("Tube inside sink:", tubeId);
        }

        overSinkRef.current = approachingSink;
        insideSinkRef.current = insideSink;

        // ─── Tube Pour Tilt ───
        if (overSinkRef.current && tube.fillLevel > 0) {
            pourProgressRef.current = THREE.MathUtils.lerp(
                pourProgressRef.current,
                1,
                delta * 2
            );
        } else {
            pourProgressRef.current = THREE.MathUtils.lerp(
                pourProgressRef.current,
                0,
                delta * 3
            );
        }
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
            groupRef.current.rotation.z,
            -pourProgressRef.current * 1.35,
            delta * 6
        );

        // ─── Liquid Draining ───
        if (insideSinkRef.current && tube.fillLevel > 0) {
            tube.fillLevel = Math.max(0, tube.fillLevel - delta * 0.9);

            if (tube.fillLevel <= 0.001) {
                tube.fillLevel = 0;
                tube.chemicals = [];
                tube.ions = [];
                tube.hasPrecipitate = false;
                tube.precipitateStatus = "none";
                tube.observation = undefined;
                tube.color = "#ffffff";
            }
        }

        // ─── Animate Liquid Drops ───
        if (insideSinkRef.current && dropParticlesRef.current && tube.fillLevel > 0) {
            const posArr = dropParticlesRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < posArr.length; i += 3) {
                posArr[i] = (Math.random() - 0.5) * 0.05;
                posArr[i + 1] = -Math.random() * 0.75;
                posArr[i + 2] = (Math.random() - 0.5) * 0.05;
            }
            dropParticlesRef.current.geometry.attributes.position.needsUpdate = true;
            dropParticlesRef.current.visible = true;
        } else if (dropParticlesRef.current) {
            dropParticlesRef.current.visible = false;
        }

        // Gas fumes upward movement & Conical Expansion
        if ((tube.isBubbling || (tube.observation && tube.observation.includes("gas"))) && fumesRef.current) {
            const posf = fumesRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < fumeCount; i++) {
                // Vertical movement
                fumes.velocities[i] += delta * 0.4;
                posf[i * 3 + 1] += delta * fumes.velocities[i];

                // Conical Expansion (widening more as it rises)
                const expansion = 1.0 + (posf[i * 3 + 1] * 0.8);
                posf[i * 3] += (Math.random() - 0.5) * 0.012 * expansion;
                posf[i * 3 + 2] += (Math.random() - 0.5) * 0.012 * expansion;

                // Reset logic when it reaches max height
                if (posf[i * 3 + 1] > 1.2) {
                    posf[i * 3] = (Math.random() - 0.5) * 0.01;
                    posf[i * 3 + 1] = -0.05; // Reset to inside the rim
                    posf[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
                    fumes.velocities[i] = 0.15 + Math.random() * 0.2;
                }
            }
            fumesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Color lerp
        const targetColor = new THREE.Color(tubeColor);
        if (!displayColorRef.current.equals(targetColor)) {
            displayColorRef.current.lerp(targetColor, 0.05);
            if (liquidRef.current) {
                (liquidRef.current.material as THREE.MeshPhysicalMaterial).color.copy(displayColorRef.current);
            }
        }

        // Ripple decay
        if (impactRippleRef.current > 0) {
            impactRippleRef.current = Math.max(0, impactRippleRef.current - 5 * delta);
            if (rippleRef.current) {
                rippleRef.current.visible = impactRippleRef.current > 0;
                rippleRef.current.scale.setScalar(impactRippleRef.current);
                (rippleRef.current.material as THREE.MeshBasicMaterial).opacity = impactRippleRef.current * 0.4;
            }
        } else if (rippleRef.current && rippleRef.current.visible) {
            rippleRef.current.visible = false;
        }

        // Enforce alignment
        if (groupRef.current) {
            if (!isDragging && !isAttached) {
                const RACK_X_MIN = 0.95;
                const RACK_X_MAX = 2.45;
                const RACK_Z_CENTER = 0.0;
                const px = groupRef.current.position.x;
                const pz = groupRef.current.position.z;
                const inRackWidth = px >= RACK_X_MIN && px <= RACK_X_MAX;
                const inRackDepth = Math.abs(pz - RACK_Z_CENTER) < 0.2;
                const minHeight = (inRackWidth && inRackDepth) ? 0.83 : 0.78;
                if (groupRef.current.position.y < minHeight - 0.01) {
                    groupRef.current.position.y = minHeight;
                }
            }
        }

        if (tube.isBubbling && bubbleRefs.current.length > 0) {
            bubbleRefs.current.forEach((b) => {
                if (b) {
                    b.position.y += delta * 0.4;
                    if (b.position.y > liquidTop) b.position.y = BOTTOM_Y + Math.random() * (liquidTop - BOTTOM_Y);
                }
            });
        }

        // Precipitate cloud/particle logic
        if (tube.hasPrecipitate && particlesRef.current) {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            const isDissolving = tube.precipitateStatus === 'dissolving';
            const isCurdy = tube.observation?.toLowerCase().includes("curdy");
            const liquidHeight = tube.fillLevel * TUBE_HEIGHT;
            const bottomLimit = -(liquidHeight / 2) + 0.005;

            for (let i = 0; i < particleCount; i++) {
                if (isDissolving) {
                    positions[i * 3 + 1] += delta * 0.2;
                    if (positions[i * 3 + 1] > (liquidHeight / 2)) positions[i * 3 + 1] = -(liquidHeight / 2);
                } else {
                    const settleSpeed = isCurdy ? 1.2 : 0.5;
                    positions[i * 3 + 1] -= delta * particles.velocities[i] * settleSpeed;
                    if (positions[i * 3 + 1] < bottomLimit) {
                        positions[i * 3 + 1] = bottomLimit + Math.random() * 0.02;
                    }
                }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;

            if (isCurdy && cloudGroupRef.current) {
                if (tube.precipitateStatus === 'forming') {
                    elasticScale.current = THREE.MathUtils.lerp(elasticScale.current, 1.1, 8 * delta);
                } else {
                    elasticScale.current = THREE.MathUtils.lerp(elasticScale.current, 1.0, 4 * delta);
                }
                cloudGroupRef.current.scale.setScalar(elasticScale.current);

                const targetY = BOTTOM_Y + 0.02;
                const time = stateFiber.clock.getElapsedTime();
                cloudGroupRef.current.position.y = THREE.MathUtils.lerp(
                    cloudGroupRef.current.position.y,
                    targetY + Math.sin(time * 2) * 0.005,
                    0.15 * delta
                );
                cloudGroupRef.current.rotation.y += delta * 0.2;

                clumpRefs.current.forEach((ref, i) => {
                    if (ref) {
                        ref.position.y = clumps[i].pos[1] + Math.sin(time * 3 + clumps[i].phase) * 0.008;
                    }
                });
            }
        }

        // ─── Realistic Heating Lock Logic ───
        const burner = stateFiber.scene.getObjectByName("apparatus_burner");
        const normalizedIons = tube.ions.map(i => i.replace(/(\d*[+\-])\s*$/g, '').trim());
        const requiresHeat = normalizedIons.includes("NH4") && normalizedIons.includes("OH");

        if (burner && state.burnerOn && requiresHeat) {
            const bx = burner.position.x;
            const bz = burner.position.z;
            const dx = groupRef.current.position.x - bx;
            const dz = groupRef.current.position.z - bz;
            const distSq = dx * dx + dz * dz;
            const dist = Math.sqrt(distSq);

            // If manually unlocked, we only snap back once the user has moved the tube away
            if (manualUnlockRef.current) {
                if (dist > HEATING_LOCK_RADIUS * 1.5) {
                    manualUnlockRef.current = false;
                }
            }

            if (dist < HEATING_LOCK_RADIUS && !manualUnlockRef.current) {
                heatingLockRef.current = true;

                // Snap to burner flame
                groupRef.current.position.x = bx;
                groupRef.current.position.z = bz;
                groupRef.current.position.y = burner.position.y + HEATING_LOCK_HEIGHT;

                // Thermal Shimmer (Shaking)
                const heatWave = Math.sin(stateFiber.clock.elapsedTime * 20) * 0.003;
                groupRef.current.position.x += heatWave;
                groupRef.current.position.z += heatWave;

                // Timer & Reaction Trigger
                heatingTimerRef.current += delta;
                if (heatingTimerRef.current > 3 && !tube.isBubbling) {
                    tube.isBubbling = true;
                    tube.observation = "Ammonia gas evolved. Pungent smell detected.";
                    tube.equation = "NH4⁺ + OH⁻ → NH3↑ + H2O";
                }

                // Ensure heating state is set for engine/UI
                if (!tube.isHeating) setTubeHeating(tubeId, true);
            } else {
                heatingLockRef.current = false;
                heatingTimerRef.current = 0;
                if (tube.isHeating) setTubeHeating(tubeId, false);
            }
        } else {
            heatingLockRef.current = false;
            heatingTimerRef.current = 0;

            // Standard Heating Detection (Fallback for other reactions)
            if (burner && state.burnerOn) {
                const dx = groupRef.current.position.x - burner.position.x;
                const dz = groupRef.current.position.z - burner.position.z;
                const distSq = dx * dx + dz * dz;
                const heightAboveBurner = groupRef.current.position.y - (burner.position.y + 0.28);
                const inZone = distSq < 0.16 && heightAboveBurner > -0.1 && heightAboveBurner < 0.5;
                if (tube.isHeating !== inZone) setTubeHeating(tubeId, inZone);
            } else if (tube.isHeating) {
                setTubeHeating(tubeId, false);
            }
        }
    });

    const activeDragProps: any = (heatingLockRef.current || isAttached) ? {
        onPointerDown: undefined,
        onPointerMove: undefined,
        onPointerUp: undefined,
        onPointerEnter: undefined,
        onPointerLeave: undefined
    } : holderDragProps;

    // Detect drop impact (triggered by tube volume change)
    useEffect(() => {
        if (tube.fillLevel > 0) impactRippleRef.current = 1.0;
    }, [tube.fillLevel]);

    // Reaction Gas/Smoke Sound Effect (Synthesized Hiss)
    useEffect(() => {
        const gasActive = tube.isBubbling || (tube.observation && tube.observation.includes("gas"));

        if (gasActive && !gasPlayedRef.current) {
            playSound(hissSoundRef.current);
            gasPlayedRef.current = true;
        }

        if (!gasActive) {
            gasPlayedRef.current = false;
        }
    }, [tube.isBubbling, tube.observation]);

    return (
        <group
            ref={groupRef}
            onContextMenu={(e) => {
                e.nativeEvent?.preventDefault?.();
                if (heatingLockRef.current) {
                    manualUnlockRef.current = true;
                    heatingLockRef.current = false;
                    heatingTimerRef.current = 0;
                    setTubeHeating(tubeId, false);
                }
            }}
        >
            <group scale={SCALER}>
                {/* Visual Snap Highlight (Glow) */}
                {state.activeSnapTarget?.type === "tube" && state.activeSnapTarget?.id === tubeId && (
                    <mesh position={[0, TUBE_HEIGHT - 0.05, 0]}>
                        <ringGeometry args={[TUBE_RADIUS + 0.005, TUBE_RADIUS + 0.015, 32]} />
                        <meshBasicMaterial
                            color="#00ffff"
                            transparent
                            opacity={0.6 + Math.sin(Date.now() / 200) * 0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                )}


                <mesh
                    castShadow
                    frustumCulled={false}
                    {...activeDragProps}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        (activeDragProps as any).onPointerDown?.(e);
                    }}
                    onPointerMove={(e) => {
                        e.stopPropagation();
                        (activeDragProps as any).onPointerMove?.(e);
                    }}
                    onPointerUp={(e) => {
                        e.stopPropagation();
                        (activeDragProps as any).onPointerUp?.(e);
                    }}
                    onPointerEnter={(activeDragProps as any).onPointerEnter}
                    onPointerLeave={(activeDragProps as any).onPointerLeave}
                    onClick={() => selectTube(tubeId)}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <latheGeometry
                        args={[
                            [
                                new THREE.Vector2(0, 0),
                                new THREE.Vector2(0.05, 0.01),
                                new THREE.Vector2(0.055, 0.05),
                                new THREE.Vector2(0.055, 0.55),
                                new THREE.Vector2(0.065, 0.56),
                                new THREE.Vector2(0, 0.56)
                            ],
                            16
                        ]}
                    />
                    <meshPhysicalMaterial {...GLASS_MAT} side={THREE.DoubleSide} />
                </mesh>

                {/* ── Liquid column ── */}
                {tube.fillLevel > 1e-4 && (
                    <mesh ref={liquidRef} position={[0, BOTTOM_Y + (tube.fillLevel * TUBE_HEIGHT) / 2, 0]}>
                        <cylinderGeometry args={[0.048, 0.048, tube.fillLevel * TUBE_HEIGHT, 12]} />
                        <meshPhysicalMaterial
                            color={displayColorRef.current}
                            transparent opacity={0.55}
                            roughness={0.04}
                        />
                    </mesh>
                )}

                {/* ── Impact Ripple ── */}
                <mesh ref={rippleRef} position={[0, liquidTop, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <ringGeometry args={[0, 0.045, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
                </mesh>

                {/* ── Solid Salt Pile (Bottom) ── */}
                {(tube.heldSaltAmount || 0) > 0 && (
                    <mesh position={[0, BOTTOM_Y + ((tube.heldSaltAmount || 0) * 0.05), 0]}>
                        <cylinderGeometry args={[0.04, 0.045, (tube.heldSaltAmount || 0) * 0.1, 8]} />
                        <meshStandardMaterial
                            color={tube.heldSalt ? GET_CHEMICAL_CONFIG(tube.heldSalt).color : (tube.color || "#ffffff")}
                            roughness={1.0}
                        />
                    </mesh>
                )}

                {/* ── Bubbles ── */}
                {tube.isBubbling && (
                    <group>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <mesh
                                key={i}
                                ref={(el) => (bubbleRefs.current[i] = el!)}
                                position={[(Math.random() - 0.5) * 0.06, BOTTOM_Y + Math.random() * 0.1, (Math.random() - 0.5) * 0.06]}
                            >
                                <sphereGeometry args={[0.008, 6, 6]} />
                                <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
                            </mesh>
                        ))}
                    </group>
                )}

                {/* ── Precipitate Cloud (AgCl animation) ── */}
                {tube.hasPrecipitate && (
                    <group
                        ref={cloudGroupRef}
                        position={[0, liquidTop - 0.005, 0]}
                    >
                        {/* Chunky Clumped Meshes */}
                        {clumps.map((c: any, i: number) => (
                            <mesh
                                key={i}
                                ref={(el: THREE.Mesh) => (clumpRefs.current[i] = el!)}
                                position={c.pos}
                                scale={c.scale}
                            >
                                <sphereGeometry args={[0.028, 12, 12]} />
                                <meshStandardMaterial
                                    color={tube.precipitateColor || "#ffffff"}
                                    transparent
                                    opacity={tube.precipitateStatus === 'dissolving' ? 0.3 : 0.9}
                                    emissive={tube.precipitateColor || "#ffffff"}
                                    emissiveIntensity={0.2}
                                />
                            </mesh>
                        ))}

                        <points ref={particlesRef}>
                            <bufferGeometry>
                                <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
                            </bufferGeometry>
                            <pointsMaterial
                                color={tube.precipitateColor || "#ffffff"}
                                size={tube.observation?.toLowerCase().includes("curdy") ? 0.015 : 0.01}
                                transparent
                                opacity={tube.precipitateStatus === 'dissolving' ? 0.2 : 0.8}
                            />
                        </points>
                    </group>
                )}

                {/* ── Falling Liquid Particles (Into Sink) ── */}
                <points ref={dropParticlesRef} visible={false}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[new Float32Array(120 * 3), 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        color={tube.color || "#ffffff"}
                        size={0.012}
                        transparent
                        opacity={0.8}
                    />
                </points>

                {/* ── Gas Fumes (Reaction escaping) ── */}
                {(tube.isBubbling || (tube.observation && tube.observation.toLowerCase().includes("gas"))) && (
                    <group position={[0, RIM_Y + 0.03, 0]}>
                        <points ref={fumesRef}>
                            <bufferGeometry>
                                <bufferAttribute attach="attributes-position" args={[fumes.positions, 3]} />
                            </bufferGeometry>
                            <pointsMaterial
                                color="#fff"
                                map={smokeTexture}
                                size={0.18}
                                transparent
                                opacity={0.15}
                                blending={THREE.AdditiveBlending}
                                sizeAttenuation={true}
                                depthWrite={false}
                            />
                        </points>
                    </group>
                )}

                {/* ── Reaction Observations (Always anchored above rim) ── */}
                {(isHovered || tube.observation) && (
                    <group position={[0, 0.7, 0]}>
                        <Billboard renderOrder={11}>
                            <Text
                                fontSize={0.07}
                                color="white"
                                outlineWidth={0.005}
                                outlineColor="black"
                                textAlign="center"
                                anchorY="bottom"
                            >
                                {overSinkRef.current && tube.fillLevel > 0
                                    ? (insideSinkRef.current ? "POURING..." : "READY TO POUR")
                                    : tube.precipitateStatus === 'dissolving' && tube.hasPrecipitate && tube.precipitateColor === '#ffffff'
                                        ? "Precipitate Dissolving in Ammonia..."
                                        : (tube.observation || "Test Tube")}
                            </Text>
                            {tube.observation?.toLowerCase().includes("confirmed") && (
                                <Text position={[0, -0.1, 0]} fontSize={0.04} color="#4fc3f7" fontWeight="bold">
                                    SUCCESS ✓
                                </Text>
                            )}
                        </Billboard>
                    </group>
                )}
            </group>
        </group>
    );
};

// ── REFINED METAL RACK (Reference inspired) ──────────────────────────────────
export const TestTubeRack: React.FC = () => {
    const { state } = useLabState();
    const rack = state.apparatus["testTubeRack"];
    const position = rack?.position || [1.7, 0.78, 0.0];
    const tubeXPositions = [-0.62, -0.37, -0.12, 0.12, 0.37, 0.62];

    const METAL_COLOR = "#2a2e33"; // mathces workbench color
    const METAL_PROPS: Partial<THREE.MeshPhysicalMaterialParameters> = {
        roughness: 0.35,
        metalness: 0.85,
        clearcoat: 0.2,
    };

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-0.7, -0.16);
        s.lineTo(0.7, -0.16);
        s.lineTo(0.7, 0.16);
        s.lineTo(-0.7, 0.16);
        s.lineTo(-0.7, -0.16);
        tubeXPositions.forEach(x => {
            const hole = new THREE.Path();
            hole.absarc(x, 0, 0.065, 0, Math.PI * 2, false);
            s.holes.push(hole);
        });
        return s;
    }, []);

    return (
        <group position={position}>
            {/* ── Base plate ── */}
            <mesh position={[0, 0.025, 0]} receiveShadow>
                <boxGeometry args={[1.4, 0.05, 0.32]} />
                <meshPhysicalMaterial color={METAL_COLOR} {...METAL_PROPS} />
            </mesh>

            {/* ── Top plate with holes ── */}
            <mesh position={[0, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <extrudeGeometry args={[shape, { depth: 0.03, bevelEnabled: false }]} />
                <meshPhysicalMaterial color={METAL_COLOR} {...METAL_PROPS} />
            </mesh>

            {/* ── Thin vertical support rods ── */}
            {[
                [-0.68, -0.14], [-0.68, 0.14], [0.68, -0.14], [0.68, 0.14],
                [0, -0.14], [0, 0.14]
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.135, z]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
                    <meshPhysicalMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>
            ))}

            {/* ── Snap Highlights (Requirement 5) ── */}
            {state.activeSnapTarget?.type === "rack" && state.activeSnapTarget.index !== undefined && (
                <mesh position={[tubeXPositions[state.activeSnapTarget.index], 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.066, 0.08, 32]} />
                    <meshBasicMaterial
                        color="#00ffff"
                        transparent
                        opacity={0.5 + Math.sin(Date.now() / 200) * 0.3}
                    />
                </mesh>
            )}

        </group>
    );
};

export default TestTubeRack;
