'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useLabStore } from '../hooks/useLabStore';

export default function Table({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Group>(null);
    const { heldInstrument, setHeldInstrument, addInstrument } = useLabStore();

    const handlePlacement = (e: any) => {
        if (heldInstrument) {
            e.stopPropagation();
            // Y position is slightly above table top (1.9 + 0.1)
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
            ref={meshRef}
            position={position}
            receiveShadow
            castShadow
            onPointerUp={handlePlacement}
        >
            {/* Table Top - Thick Solid Wood Finish */}
            <mesh position={[0, 1.9, 0]} receiveShadow castShadow>
                <boxGeometry args={[12, 0.3, 6]} /> {/* Slightly thicker */}
                <meshStandardMaterial
                    color="#5C4033" // Dark glossy wood
                    roughness={0.4} // Slightly glossy
                    metalness={0.1}
                />
            </mesh>

            {/* Table Legs - Heavy Wooden lab legs */}
            {[[-5.8, 0.9, -2.8], [5.8, 0.9, -2.8], [-5.8, 0.9, 2.8], [5.8, 0.9, 2.8]].map((pos, idx) => (
                <mesh key={idx} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.3, 1.8, 0.3]} /> {/* Thicker legs */}
                    <meshStandardMaterial color="#3E2723" roughness={0.7} />
                </mesh>
            ))}
        </group>
    );
}
