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
    const lockedTubeRef = useRef<string | null>(null);
    const lockTimer = useRef(0);
    const dropCooldown = useRef(false);

    // Tip offset after 0.48 scale and PI/2 rotation: 
    // Sub-group tip at local Y = 0.675 (blade end).
    // Final local Y = (0.675 * 0.48) - 0.06 = 0.264.
    // In world-relative X (at PI/2 rotation), this is -0.264.
    const TIP_OFFSET = -0.264;

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
    const [particleVelocity] = React.useState(() => new Float32Array(particleCount * 3));
    const [particleLives] = React.useState(() => new Float32Array(particleCount).fill(0));
    const pointsRef = useRef<THREE.Points>(null!);

    // Detect nearby targets during drag for labels and auto-actions
    useFrame((state_gl, delta) => {
        if (!groupRef.current) return;

        const pos = groupRef.current.position;

        const isActiveDrag = isDragging || state.tourState.isTourDragging;

        // Apply orientation from state/tour OR dragging
        if (isActiveDrag) {
            groupRef.current.rotation.z = Math.PI / 2 + (tiltFactor * 0.85);
        } else {
            const stateRotation = state.apparatus["spatula"]?.rotation;
            if (stateRotation && groupRef.current) {
                groupRef.current.rotation.set(...stateRotation);
            }
        }

        const currentZRot = groupRef.current.rotation.z;
        const currentTilt = currentZRot - Math.PI / 2;

        // Detect nearby targets during drag for labels and auto-actions
        groupRef.current.updateMatrixWorld();
        const tipWorld = new THREE.Vector3(0, 0.264, 0); // Correct local tip Y in sub-scaled group
        groupRef.current.localToWorld(tipWorld);

        let foundTarget = false;
        let closestTube: any = null;
        let closestDist = Infinity;

        // 1. STABLE DETECTION
        for (const tube of state.testTubes) {
            const dx = tipWorld.x - tube.position[0];
            const dz = tipWorld.z - tube.position[2];
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.2 && dist < closestDist) {
                closestTube = tube;
                closestDist = dist;
            }
        }

        // 2. LOCK LOGIC (with timer to prevent flicker)
        if (closestTube && isActiveDrag && state.heldSalt) {
            lockTimer.current += delta;
            if (lockTimer.current > 0.08) {
                lockedTubeRef.current = closestTube.id;
                setNearbyTarget(closestTube.id);
                foundTarget = true;
            }
        } else {
            lockTimer.current = 0;
            if (!isActiveDrag) lockedTubeRef.current = null;
        }

        const lockedTube = state.testTubes.find(t => t.id === lockedTubeRef.current);
        const TEST_TUBE_MOUTH_HEIGHT = lockedTube ? lockedTube.position[1] + 0.22 : 0;

        // 3. DYNAMIC HARD SNAP (Trig-based precision)
        if (lockedTube && isActiveDrag && state.heldSalt) {
            const L = 0.264; // Distance to tip
            const angle = groupRef.current.rotation.z;

            // Calculate where group needs to be so tip (0, L, 0) ends up at tube center
            // World_Tip = Group_Pos + Rotation * Local_Tip
            // World_Tip.x = Group.x + (0 * cos(z) - L * sin(z)) = Group.x - L * sin(z)
            // World_Tip.y = Group.y + (0 * sin(z) + L * cos(z)) = Group.y + L * cos(z)

            // So:
            // Group.x = Tube.x + L * sin(angle)
            // Group.y = (TEST_TUBE_MOUTH_HEIGHT - 0.02) - L * cos(angle)

            groupRef.current.position.x = lockedTube.position[0] + L * Math.sin(angle);
            groupRef.current.position.y = (TEST_TUBE_MOUTH_HEIGHT - 0.02) - L * Math.cos(angle);
            groupRef.current.position.z = lockedTube.position[2];

            groupRef.current.updateMatrixWorld();
            foundTarget = true;

            // Auto Tilt for user (once locked)
            setTiltFactor(prev => THREE.MathUtils.lerp(prev, 1, 5 * delta));
        } else {
            setTiltFactor(prev => THREE.MathUtils.lerp(prev, 0, 5 * delta));
        }

        // 4. PRECISION POUR CHECK
        const tipCheck = new THREE.Vector3(0, 0.264, 0);
        groupRef.current.localToWorld(tipCheck);

        const isInsideMouth = lockedTube &&
            Math.abs(tipCheck.x - lockedTube.position[0]) < 0.03 &&
            Math.abs(tipCheck.z - lockedTube.position[2]) < 0.03 &&
            tipCheck.y < TEST_TUBE_MOUTH_HEIGHT + 0.01 &&
            tipCheck.y > TEST_TUBE_MOUTH_HEIGHT - 0.05;

        // 5. CONTINUOUS POUR (Now rock solid)
        if (lockedTube && isActiveDrag && state.heldSalt && state.heldSaltAmount > 0 && isInsideMouth && tiltFactor > 0.5) {
            const FLOW_RATE = 0.18; // Further reduction for fine control
            const amountToDrop = Math.min(state.heldSaltAmount, FLOW_RATE * delta);
            addSalt(lockedTube.id, state.heldSalt, amountToDrop);

            // Flow Particles (using tipCheck for visual origin)
            const tubeTarget = new THREE.Vector3(lockedTube.position[0], TEST_TUBE_MOUTH_HEIGHT - 0.08, lockedTube.position[2]);
            for (let i = 0; i < 4; i++) {
                const idx = Math.floor(Math.random() * particleCount);
                if (particleLives[idx] < 0.2) {
                    particlePositions[idx * 3] = tipCheck.x + (Math.random() - 0.5) * 0.015;
                    particlePositions[idx * 3 + 1] = tipCheck.y;
                    particlePositions[idx * 3 + 2] = tipCheck.z + (Math.random() - 0.5) * 0.015;

                    const dir = new THREE.Vector3(tubeTarget.x - particlePositions[idx * 3], tubeTarget.y - tipCheck.y, tubeTarget.z - particlePositions[idx * 3 + 2]).normalize();
                    dir.x += (Math.random() - 0.5) * 0.2;
                    dir.z += (Math.random() - 0.5) * 0.2;
                    dir.normalize();

                    particleVelocity[idx * 3] = dir.x * 0.45;
                    particleVelocity[idx * 3 + 1] = dir.y * 0.45;
                    particleVelocity[idx * 3 + 2] = dir.z * 0.45;
                    particleLives[idx] = 1.0;
                }
            }
        }

        // 6. SALT PICKING Logic (Fixed: Only when actively being used/dragged)
        if (isActiveDrag) {
            for (const appId in state.apparatus) {
                if (appId.startsWith("salt_")) {
                    const salt = state.apparatus[appId];
                    const saltId = appId.replace("salt_", "");
                    
                    const dx = tipWorld.x - salt.position[0];
                    const dz = tipWorld.z - (salt.position[2] + 0.05);
                    const distanceSq = dx * dx + dz * dz;

                    if (distanceSq < 0.0144) {
                        setNearbyTarget(appId);
                        foundTarget = true;
                        // Debounce/Prevent rapid re-pick
                        if (!state.heldSalt || state.heldSalt !== saltId || state.heldSaltAmount < 0.95) {
                            pickSalt(saltId);
                        }
                        break;
                    }
                }
            }
        }

        if (!foundTarget) {
            setNearbyTarget(null);
            if (!isActiveDrag) {
                setTiltFactor(THREE.MathUtils.lerp(tiltFactor, 0, 5 * delta));
                // Fade out particles if not near a target
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
                // Apply velocity
                particlePositions[i * 3] += particleVelocity[i * 3] * delta;
                particlePositions[i * 3 + 1] += particleVelocity[i * 3 + 1] * delta;
                particlePositions[i * 3 + 2] += particleVelocity[i * 3 + 2] * delta;

                // Gravity (adds realism)
                particleVelocity[i * 3 + 1] -= 0.4 * delta;

                // Slight inward pull (funnel effect)
                particleVelocity[i * 3] *= 0.98;
                particleVelocity[i * 3 + 2] *= 0.98;

                particleLives[i] -= delta * 1.2;

                // Kill if inside tube or floor (dynamic based on tube)
                const deathY = (nearbyTarget && state.testTubes.find(t => t.id === nearbyTarget))
                    ? state.testTubes.find(t => t.id === nearbyTarget)!.position[1] + 0.02
                    : 0.78; // bench top if no tube nearby

                if (particlePositions[i * 3 + 1] < deathY) {
                    particleLives[i] = 0;
                }
            } else {
                particlePositions[i * 3 + 1] = -10; // Hide below floor
            }
        }
        if (pointsRef.current) {
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const saltConfig = state.heldSalt ? GET_CHEMICAL_CONFIG(state.heldSalt) : null;
    const saltColor = saltConfig ? saltConfig.color : "#fff";

    // Create dynamic label
    let hintText = "Laboratory Spatula\nSlide over Salt Dish to Scoop";
    if (isDragging) {
        if (state.heldSalt && saltConfig) {
            const qty = Math.ceil(state.heldSaltAmount * 100);
            hintText = `${saltConfig.name} (${qty}%)\nTilt over Test Tube to Pour`;
        } else {
            hintText = "Spatula (Empty)\nTouch Salt Jar to Refill";
        }
    } else if (isHovered) {
        if (state.heldSalt && saltConfig) {
            const qty = Math.ceil(state.heldSaltAmount * 100);
            hintText = `${saltConfig.name} (${qty}%)\nDrag to Test Tube mouth`;
        } else {
            hintText = "Laboratory Spatula\nDrag OVER salt dish to scoop";
        }
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
                    <mesh position={[0, 0.65, 0.01]} rotation={[-Math.PI / 2, 0, 0]} scale={[state.heldSaltAmount, state.heldSaltAmount, state.heldSaltAmount]}>
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
