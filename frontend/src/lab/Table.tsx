'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useLabStore } from '../hooks/useLabStore';
import { useFrame } from '@react-three/fiber';

export default function Table({ position }: { position: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);
    const topMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
    const legMaterialsRef = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    
    const { heldInstrument, setHeldInstrument, addInstrument, currentScreen } = useLabStore();
    const [revealProgress, setRevealProgress] = useState(0);

    const isVisible = currentScreen !== 'WELCOME';

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Target progress based on visibility
        const target = isVisible ? 1 : 0;
        const newProgress = THREE.MathUtils.lerp(revealProgress, target, delta * 2);
        
        if (Math.abs(newProgress - revealProgress) > 0.001) {
            setRevealProgress(newProgress);
            
            // Apply scale and position shift
            groupRef.current.scale.setScalar(0.9 + 0.1 * newProgress);
            groupRef.current.position.y = position[1] - (1 - newProgress) * 2;
            
            // Apply opacity
            if (topMaterialRef.current) topMaterialRef.current.opacity = newProgress;
            legMaterialsRef.current.forEach(mat => {
                if (mat) mat.opacity = newProgress;
            });
        }
    });

    const handlePlacement = (e: any) => {
        if (heldInstrument) {
            e.stopPropagation();
            const placeY = 2.05;
            addInstrument(
                heldInstrument.type,
                heldInstrument.name,
                heldInstrument.terminals,
                heldInstrument.id,
                [e.point.x, placeY, e.point.z]
            );
            setHeldInstrument(null);
        }
    };

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerUp={handlePlacement}
        >
            {/* Table Top */}
            <mesh position={[0, 1.9, 0]} receiveShadow castShadow>
                <boxGeometry args={[12, 0.3, 6]} />
                <meshStandardMaterial
                    ref={topMaterialRef}
                    color="#795548"
                    roughness={0.4}
                    metalness={0.1}
                    transparent
                    opacity={revealProgress}
                />
            </mesh>

            {/* Table Legs */}
            {[[-5.8, 0.9, -2.8], [5.8, 0.9, -2.8], [-5.8, 0.9, 2.8], [5.8, 0.9, 2.8]].map((pos, idx) => (
                <mesh key={idx} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.3, 1.8, 0.3]} />
                    <meshStandardMaterial 
                        ref={el => legMaterialsRef.current[idx] = el}
                        color="#3E2723" 
                        roughness={0.7} 
                        transparent 
                        opacity={revealProgress}
                    />
                </mesh>
            ))}
        </group>
    );
}
