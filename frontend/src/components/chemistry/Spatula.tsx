"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";
import { GET_CHEMICAL_CONFIG } from "@/lib/chemistry/engine";

interface SpatulaProps {
    position?: [number, number, number];
}

export const Spatula: React.FC = () => {
    const { state, addSalt, pickSalt } = useLabState();
    const groupRef = useRef<THREE.Group>(null!);
    const [nearbyTarget, setNearbyTarget] = React.useState<string | null>(null);
    const [tiltFactor, setTiltFactor] = React.useState(0);
    const dropCooldown = useRef(false);

    // Tip offset after 0.48 scale and PI/2 rotation: Blade at origin 0, 0.6, 0 -> rotated -> -0.6, 0, 0 -> scale -> -0.288, 0, 0
    const TIP_OFFSET = -0.288;

    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: "spatula",
        groupRef,
        yOffset: 0.0096, // Radius of the handle to lay perfectly flat
        liftHeight: 0.025, // 2.5cm lift
        onSnapDrop: (id, pos) => {
            // Drop logic handled by auto-tilt now, but keeping snap for safety
        }
    });

    const particleCount = 60;
    const [particlePositions] = React.useState(() => new Float32Array(particleCount * 3));
    const [particleLives] = React.useState(() => new Float32Array(particleCount).fill(0));
    const pointsRef = useRef<THREE.Points>(null!);

    // Detect nearby targets during drag for labels and auto-actions
    useFrame((state_gl, delta) => {
        const pos = groupRef.current.position;
        const tipX = pos.x + TIP_OFFSET;
        const tipZ = pos.z;

        // Apply orientation from state/tour OR dragging
        if (isDragging) {
            groupRef.current.rotation.z = Math.PI / 2 + (tiltFactor * 0.85);
        } else {
            const stateRotation = state.apparatus["spatula"]?.rotation;
            if (stateRotation && groupRef.current) {
                groupRef.current.rotation.set(...stateRotation);
            }
        }

        const currentZRot = groupRef.current.rotation.z;
        const currentTilt = currentZRot - Math.PI / 2;

        let foundTarget = false;

        // Check tubes for salt dropping (DRAG or TOUR)
        for (const tube of state.testTubes) {
            const dx = tipX - tube.position[0];
            const dz = tipZ - tube.position[2];

            if (Math.sqrt(dx * dx + dz * dz) < 0.144) {
                const TEST_TUBE_MOUTH_HEIGHT = tube.position[1] + 0.22;
                const distToMouthY = Math.abs(pos.y - (TEST_TUBE_MOUTH_HEIGHT + 0.05));

                if (distToMouthY < 0.2) {
                    setNearbyTarget(tube.id);
                    foundTarget = true;

                    // Trigger particles if tilted enough
                    if (state.heldSalt && currentTilt > 0.6) {
                        // Spawn particles at tip
                        let spawned = 0;
                        for (let i = 0; i < particleCount && spawned < 2; i++) {
                            if (particleLives[i] <= 0) {
                                particlePositions[i * 3] = tipX + (Math.random() - 0.5) * 0.02;
                                particlePositions[i * 3 + 1] = pos.y + 0.01;
                                particlePositions[i * 3 + 2] = tipZ + (Math.random() - 0.5) * 0.02;
                                particleLives[i] = 1.0;
                                spawned++;
                            }
                        }

                        // Logical transfer during drag only (Tour handles its own addSalt)
                        if (isDragging && !dropCooldown.current) {
                            const activeCount = particleLives.filter(l => l > 0).length;
                            if (activeCount > 15) { 
                                addSalt(tube.id, state.heldSalt);
                                dropCooldown.current = true;
                                setTimeout(() => { dropCooldown.current = false; }, 2000);
                            }
                        }
                    }
                }
            }
        }

        if (isDragging && !foundTarget) {
            setTiltFactor(THREE.MathUtils.lerp(tiltFactor, 0, 5 * delta));
            // Check salt dishes
            for (const appId in state.apparatus) {
                if (appId.startsWith("salt_")) {
                    const salt = state.apparatus[appId];
                    const dx = tipX - salt.position[0];
                    const dz = tipZ - salt.position[2];
                    if (Math.sqrt(dx * dx + dz * dz) < 0.08) {
                        setNearbyTarget(appId);
                        foundTarget = true;
                        const saltId = appId.replace("salt_", "");
                        if (state.heldSalt !== saltId) pickSalt(saltId);
                        break;
                    }
                }
            }
        }

        if (!foundTarget) {
            setNearbyTarget(null);
            if (!isDragging) {
                // Fade out particles if not near a target or not tilted
                for (let i = 0; i < particleCount; i++) {
                    if (particleLives[i] > 0) particleLives[i] -= delta * 2;
                }
            }
        }

        // Requirement 6: Prevent workbench penetration (clamp)
        const MIN_HEIGHT = 0.012;
        if (groupRef.current.position.y < MIN_HEIGHT) {
            groupRef.current.position.y = MIN_HEIGHT;
        }

        // Physics update for particles
        for (let i = 0; i < particleCount; i++) {
            if (particleLives[i] > 0) {
                particlePositions[i * 3 + 1] -= 0.6 * delta; // Gravity
                particleLives[i] -= delta * 1.2; // Life decay
            } else {
                particlePositions[i * 3 + 1] = -10; // Hide below floor
            }
        }
        if (pointsRef.current) {
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const saltColor = state.heldSalt ? GET_CHEMICAL_CONFIG(state.heldSalt)?.color : "#fff";

    // Create dynamic label
    let hintText = "Laboratory Spatula\nSlide over Salt Dish to Scoop";
    if (isDragging) {
        if (state.heldSalt) {
            hintText = `Held: ${GET_CHEMICAL_CONFIG(state.heldSalt)?.name || state.heldSalt}\n`;
            if (nearbyTarget && nearbyTarget.startsWith("tt")) {
                hintText += "RELEASING SALT...";
            } else {
                hintText += "Move tip over Test Tube mouth";
            }
        } else {
            if (nearbyTarget && nearbyTarget.startsWith("salt_")) {
                hintText = "SCOOPING SALT...";
            } else {
                hintText = "Move tip over Salt Dish to scoop";
            }
        }
    } else if (isHovered) {
        hintText = state.heldSalt
            ? `Held: ${GET_CHEMICAL_CONFIG(state.heldSalt)?.name}\nDrag to Test Tube`
            : "Laboratory Spatula\nDrag OVER salt dish to scoop";
    }

    return (
        <group
            ref={groupRef}
            {...dragProps}
            rotation={[0, 0, Math.PI / 2]}
        >
            {/* COMPOUND COLLIDER for precision and ease of use */}
            {/* Reduced by 40% (60% of current) as per rule 1 */}
            <group position={[0, -0.06, 0]}>
                {/* Handle Collider - Narrower to match visual geometry */}
                <mesh visible={false}>
                    <cylinderGeometry args={[0.0096, 0.0096, 0.576, 8]} />
                    <meshBasicMaterial color="green" wireframe />
                </mesh>
                {/* Blade Collider - Smaller box to match visible blade */}
                <mesh visible={false} position={[0, 0.288, 0]}>
                    <boxGeometry args={[0.0288, 0.0576, 0.0096]} />
                    <meshBasicMaterial color="blue" wireframe />
                </mesh>
            </group>

            <group scale={0.48} position={[0, -0.06, 0]}>
                <mesh castShadow>
                    <cylinderGeometry args={[0.012, 0.012, 1.2, 12]} />
                    <meshStandardMaterial color="#b8b8b8" metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.15, 0.005]} />
                    <meshStandardMaterial color="#d0d0d0" metalness={1} roughness={0.05} />
                </mesh>
                {state.heldSalt && (
                    <mesh position={[0, 0.65, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.01, 0.04, 0.02, 10]} />
                        <meshStandardMaterial color={saltColor} roughness={1} />
                    </mesh>
                )}
            </group>

            {(isHovered || isDragging) && (
                <Billboard position={[0.32, 0, 0]}>
                    <Text
                        fontSize={0.065}
                        color="white"
                        outlineWidth={0.004}
                        outlineColor="black"
                        textAlign="center"
                        anchorY="bottom"
                    >
                        {hintText}
                    </Text>
                </Billboard>
            )}

            {/* High Performance Falling Salt Particles */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute 
                        attach="attributes-position" 
                        args={[particlePositions, 3]} 
                    />
                </bufferGeometry>
                <pointsMaterial 
                    color={saltColor} 
                    size={0.012} 
                    transparent 
                    opacity={0.8} 
                    sizeAttenuation 
                />
            </points>
        </group>
    );
};
