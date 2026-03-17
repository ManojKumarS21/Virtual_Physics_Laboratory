"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

export const WashBottle: React.FC = () => {
    const { state, pourChemical } = useLabState();
    const groupRef = useRef<THREE.Group>(null!);
    const [isSquirting, setIsSquirting] = React.useState(false);
    const [nearbyTubeId, setNearbyTubeId] = React.useState<string | null>(null);
    const lastSquirtTime = useRef(0);

    const nozzleRef = useRef<THREE.Mesh>(null!);
    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: "washBottle",
        groupRef,
        yOffset: 0.09, 
        liftHeight: 0.1,
    });

    // Particle System (Water stream)
    const particleCount = 160;
    const [particlePositions] = React.useState(() => new Float32Array(particleCount * 3));
    const [particleVelocities] = React.useState(() => new Float32Array(particleCount * 3));
    const [particleLives] = React.useState(() => new Float32Array(particleCount).fill(0));
    const pointsRef = useRef<THREE.Points>(null!);
    const tipWorld = useRef(new THREE.Vector3());

    useFrame((stateFiber, delta) => {
        // Get the real world positions
        if (nozzleRef.current) {
            nozzleRef.current.getWorldPosition(tipWorld.current);
        }
        
        const tipX = tipWorld.current.x;
        const tipY = tipWorld.current.y;
        const tipZ = tipWorld.current.z;

        let foundTube: string | null = null;
        let targetTubeData: any = null;

        for (const tube of state.testTubes) {
            const dx = tipX - tube.position[0];
            const dz = tipZ - tube.position[2];
            if (Math.sqrt(dx * dx + dz * dz) < 0.25) { // Increased detection range for targeting
                foundTube = tube.id;
                targetTubeData = tube;
                break;
            }
        }
        setNearbyTubeId(foundTube);

        if (isSquirting) {
            // Target direction
            const direction = new THREE.Vector3(0, -0.3, 1.0); // Default arc
            let spawnY = tipY;

            if (targetTubeData) {
                const tubeTopY = targetTubeData.position[1] + 0.252;
                // Requirement 5: Prevent particles spawning below tube
                if (spawnY < tubeTopY) {
                    spawnY = tubeTopY + 0.02;
                }

                // Requirement 2: Compute direction toward tube mouth
                direction.set(
                    targetTubeData.position[0] - tipX,
                    tubeTopY - spawnY,
                    targetTubeData.position[2] - tipZ
                ).normalize();
            }

            // Spawn particles
            let spawned = 0;
            for (let i = 0; i < particleCount && spawned < 4; i++) {
                if (particleLives[i] <= 0) {
                    particlePositions[i * 3] = tipX;
                    particlePositions[i * 3 + 1] = spawnY;
                    particlePositions[i * 3 + 2] = tipZ;

                    // Requirement 3: Apply Forward Velocity
                    particleVelocities[i * 3] = direction.x * 1.5;
                    particleVelocities[i * 3 + 1] = direction.y * 1.5;
                    particleVelocities[i * 3 + 2] = direction.z * 1.5;

                    particleLives[i] = 1.0;
                    spawned++;
                }
            }

            // Logic: Add water to tube
            if (foundTube && stateFiber.clock.elapsedTime - lastSquirtTime.current > 0.4) {
                pourChemical(foundTube, "H2O");
                lastSquirtTime.current = stateFiber.clock.elapsedTime;
            }
        }

        // Particle Physics (Requirement 4)
        for (let i = 0; i < particleCount; i++) {
            if (particleLives[i] > 0) {
                // Apply Gravity (1.2 per Requirement 4)
                particleVelocities[i * 3 + 1] -= 1.2 * delta;

                // Move Positions
                particlePositions[i * 3] += particleVelocities[i * 3] * delta;
                particlePositions[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta;
                particlePositions[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta;

                particleLives[i] -= delta * 1.2; 
            } else {
                particlePositions[i * 3 + 1] = -10;
            }
        }
        if (pointsRef.current) {
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const handleRightClick = (e: any) => {
        if (e.nativeEvent) e.nativeEvent.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        
        if (isDragging) return;
        setIsSquirting(!isSquirting);
    };

    let hintText = "Wash Bottle (Distilled Water)\nRight-Click to Squirt";
    if (isSquirting) hintText = "SQUIRTING WATER...";
    if (isDragging) hintText = "Moving Wash Bottle...";

    return (
        <group 
            ref={groupRef} 
        >
            <group rotation={[0, -0.5, 0]}>
                {/* Bottle Body */}
                <mesh 
                    castShadow 
                    receiveShadow
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
                    onContextMenu={handleRightClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <cylinderGeometry args={[0.038, 0.038, 0.18, 16]} />
                    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.6} roughness={0.3} transmission={0.1} />
                </mesh>
                <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.01, 0.038, 0.02, 12]} />
                    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.6} />
                </mesh>
                <mesh 
                    ref={nozzleRef}
                    position={[0, 0.12, 0.03]} 
                    rotation={[0.8, 0, 0]} 
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
                    onContextMenu={handleRightClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <cylinderGeometry args={[0.003, 0.003, 0.12, 8]} />
                    <meshStandardMaterial color="#fff" />
                </mesh>

                {(isHovered || isDragging || isSquirting) && (
                    <Text
                        position={[0, 0.25, 0]}
                        fontSize={0.06}
                        color="white"
                        outlineColor="black"
                        outlineWidth={0.005}
                        textAlign="center"
                    >
                        {hintText}
                    </Text>
                )}
            </group>

            {/* High Performance Water Stream */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute 
                        attach="attributes-position" 
                        args={[particlePositions, 3]} 
                    />
                </bufferGeometry>
                <pointsMaterial 
                    color="#e0f7fa" 
                    size={0.016} 
                    transparent 
                    opacity={0.6} 
                    sizeAttenuation 
                />
            </points>
        </group>
    );
};
