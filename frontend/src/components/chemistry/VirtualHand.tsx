"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { useLabState } from "@/lib/chemistry/LabContext";

const POINTER_COLOR = "#f0f0f0"; // Near white for high visibility
const POINTER_MAT = new THREE.MeshStandardMaterial({ 
    color: POINTER_COLOR, 
    roughness: 0.05, 
    metalness: 0.2,
    emissive: "#ffffff",
    emissiveIntensity: 0.1
});

export const VirtualHand = () => {
    const { state } = useLabState();
    const { virtualHandPosition, virtualHandRotation, isActive } = state.tourState;
    const groupRef = useRef<THREE.Group>(null!);
    
    // Smooth lerping refs
    const currentPos = useRef(new THREE.Vector3(0, 0, 0));

    useFrame((_, delta) => {
        if (!isActive || !virtualHandPosition) {
            if (groupRef.current) groupRef.current.visible = false;
            return;
        }

        groupRef.current.visible = true;
        const targetPos = new THREE.Vector3(...virtualHandPosition);
        const targetRot = new THREE.Euler(...(virtualHandRotation || [0, 0, 0]));
        const lerpFactor = 10 * delta; // Very snappy for pointer feel

        currentPos.current.lerp(targetPos, lerpFactor);
        groupRef.current.position.copy(currentPos.current);
        
        // Match rotation immediately or smoothly
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRot.x, lerpFactor);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot.y, lerpFactor);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot.z, lerpFactor);
    });

    if (!isActive) return null;

    return (
        <group ref={groupRef} visible={false}>
            {/* Pointer Glove/Base */}
            <RoundedBox args={[0.045, 0.02, 0.055]} radius={0.012} position={[0, -0.005, 0.005]}>
                <primitive object={POINTER_MAT} attach="material" />
            </RoundedBox>

            {/* Pointing Index Finger */}
            <mesh position={[0.0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.008, 0.035, 8, 12]} />
                <primitive object={POINTER_MAT} attach="material" />
            </mesh>
            
            {/* Thumb (slight outward angle) */}
            <mesh position={[0.02, 0, 0.012]} rotation={[0, 0.4, 0.5]}>
                <capsuleGeometry args={[0.008, 0.015, 8, 8]} />
                <primitive object={POINTER_MAT} attach="material" />
            </mesh>

            {/* Subtle glow for high visibility */}
            <pointLight position={[0, 0.08, 0]} intensity={0.2} color="#ffffff" distance={0.4} />
        </group>
    );
};
