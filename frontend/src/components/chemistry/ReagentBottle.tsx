"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useLabState } from "@/lib/chemistry/LabContext";
import { CHEMICALS, ChemicalId } from "@/lib/chemistry/engine";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface ReagentBottleProps {
    chemicalId: ChemicalId;
    position: [number, number, number];
}

// borosilicate glass settings
const CLEAR_GLASS: Partial<THREE.MeshPhysicalMaterialParameters> = {
    color: "#e8eff4",
    transparent: true,
    opacity: 0.65,
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.92,
    reflectivity: 1.0,
    envMapIntensity: 1.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.03,
    thickness: 0.08,
    ior: 1.5,
};

const AMBER_GLASS: Partial<THREE.MeshPhysicalMaterialParameters> = {
    color: "#3f2310", // Deep amber
    transparent: true,
    opacity: 0.7,
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.85,
    reflectivity: 1.0,
    envMapIntensity: 1.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.03,
    thickness: 0.08,
    ior: 1.5,
};

export const ReagentBottle: React.FC<{ chemicalId: ChemicalId }> = ({ chemicalId }) => {
    const { state, openBottle, pourChemical, dropChemical } = useLabState();
    const chem = CHEMICALS[chemicalId];
    if (!chem) return null;

    // Check if it's an amber bottle (AgNO3, KSCN are typically amber)
    const isAmber = chem.bottleColor === "#5c3a21";
    const glassMat = isAmber ? AMBER_GLASS : CLEAR_GLASS;

    const groupRef = useRef<THREE.Group>(null!);
    const apparatusId = `bot_${chemicalId}`;
    const { dragProps, isHovered, isDragging } = useApparatusDrag({ id: apparatusId, groupRef, yOffset: 0 });

    const capRef = useRef<THREE.Group>(null!);
    const dropRef = useRef<THREE.Mesh>(null!);
    const liquidRef = useRef<THREE.Mesh>(null!);

    const [tiltFactor, setTiltFactor] = useState(0);
    const [isDropping, setIsDropping] = useState(false);
    const dropStartTime = useRef<number>(0);
    const lastDropTime = useRef<number>(0);
    const isCapOpen = state.openBottle === chemicalId;

    useFrame((_, delta) => {
        // Bottle remains upright and stable in this version
        setTiltFactor(0);
        if (groupRef.current) {
            groupRef.current.rotation.set(0, 0, 0);
        }

        // ── Smooth Cap Animation ──
        if (capRef.current) {
            // Target rotation: 0 when closed, -Math.PI / 2 (90 deg) when open
            // Use rotation.x as requested by user for 100% open feel
            const targetRotX = isCapOpen ? -Math.PI / 2 : 0;
            const targetY = isCapOpen ? 0.44 + 0.05 : 0.44; // Slight lift when open

            capRef.current.rotation.x = THREE.MathUtils.lerp(capRef.current.rotation.x, targetRotX, 0.15);
            capRef.current.position.y = THREE.MathUtils.lerp(capRef.current.position.y, targetY, 0.15);
        }
    });

    const liquidColor = useMemo(() =>
        new THREE.Color(chem.color).lerp(new THREE.Color("#d0d8dc"), 0.3).getStyle(),
        [chem.color]);

    return (
        <group 
            ref={groupRef} 
            onContextMenu={(e) => {
                e.nativeEvent?.preventDefault?.();
                e.stopPropagation();
                // Requirement 5: Prevent toggle while dragging
                if (isDragging || state.draggingId === apparatusId) return;
                openBottle(isCapOpen ? null : chemicalId);
            }}
        >
            {/* Liquid Drop (Single drop that repeats) */}
            <mesh ref={dropRef} position={[0, 0, 0]} visible={false}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshStandardMaterial color={chem.color} transparent opacity={0.8} />
            </mesh>

            <group scale={0.63}>
                {/* ── Realistic Lathe Bottle Body ── */}
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
                    <latheGeometry
                        args={[
                            [
                                new THREE.Vector2(0, 0.001),
                                new THREE.Vector2(0.07, 0.001),
                                new THREE.Vector2(0.082, 0.02),
                                new THREE.Vector2(0.082, 0.3),   // Body
                                new THREE.Vector2(0.065, 0.36),  // Shoulder
                                new THREE.Vector2(0.035, 0.38),  // Neck base
                                new THREE.Vector2(0.035, 0.44),  // Neck top
                                new THREE.Vector2(0.042, 0.445), // Rim
                                new THREE.Vector2(0, 0.445)
                            ],
                            16
                        ]}
                    />
                    <meshPhysicalMaterial {...glassMat} side={THREE.DoubleSide} />
                </mesh>
 
                {/* Visual Snap Highlight (Glow for Pipette) */}
                {state.activeSnapTarget?.type === "bottle" && state.activeSnapTarget?.id === apparatusId && (
                    <mesh position={[0, 0.445, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.04, 0.05, 32]} />
                        <meshBasicMaterial 
                            color="#00ffff" 
                            transparent 
                            opacity={0.6 + Math.sin(Date.now() / 200) * 0.3} 
                        />
                    </mesh>
                )}

                {/* ── Liquid Content ── */}
                <mesh ref={liquidRef} position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[0.076, 0.076, 0.28, 12]} />
                    <meshPhysicalMaterial
                        color={liquidColor}
                        transparent opacity={0.65}
                        roughness={0.02}
                        transmission={0.8}
                        thickness={0.05}
                        ior={1.4}
                    />
                </mesh>

                {/* ── Realistic White Label ── */}
                <group position={[0, 0.16, 0.083]}>
                    <mesh>
                        <planeGeometry args={[0.09, 0.1]} />
                        <meshStandardMaterial color="#fdfcf8" roughness={0.9} />
                    </mesh>
                    <Text position={[0, 0.02, 0.001]} fontSize={0.012} color="#cc0000" fontWeight="bold">
                        DANGER
                    </Text>
                    <Text position={[0, -0.005, 0.001]} fontSize={0.022} color="#111" fontWeight="bold">
                        {chemicalId}
                    </Text>
                    <Text position={[0, -0.03, 0.001]} fontSize={0.009} color="#222" maxWidth={0.08} textAlign="center">
                        {chem.name}
                    </Text>
                </group>

                {/* ── Black Screw Cap ── */}
                <group
                    ref={capRef}
                    position={[0, 0.44, 0]}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <mesh position={[0, 0.03, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
                        <meshStandardMaterial color="#0a0a0a" roughness={0.65} metalness={0.2} />
                    </mesh>
                    {/* Ridges */}
                    {[0, 1, 2].map(i => (
                        <mesh key={i} position={[0, 0.015 + i * 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.041, 0.003, 8, 32]} />
                            <meshStandardMaterial color="#111" />
                        </mesh>
                    ))}
                </group>

                {/* ── Interaction Hints ── */}
                {isHovered && (
                    <group position={[0, 0.65, 0]}>
                        <Text
                            fontSize={0.065}
                            color="white"
                            outlineWidth={0.005}
                            outlineColor="black"
                            textAlign="center"
                        >
                            {isCapOpen 
                                ? `Bottle: ${chem.name}\nRight-Click to CLOSE` 
                                : `Bottle: ${chem.name}\nRight-Click to OPEN`}
                        </Text>
                    </group>
                )}
            </group>
        </group>
    );
};
