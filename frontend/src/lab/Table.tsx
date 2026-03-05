'use client';

import { useRef } from 'react';
import * as THREE from 'three';

export default function Table({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Group>(null);

    return (
        <group ref={meshRef} position={position} receiveShadow castShadow>
            {/* Table Top - Dark Wood Finish */}
            <mesh position={[0, 1.9, 0]} receiveShadow castShadow>
                <boxGeometry args={[12, 0.2, 6]} />
                <meshStandardMaterial
                    color="#4a3728"
                    roughness={0.6}
                    metalness={0.1}
                // Wood texture approximation
                />
            </mesh>

            {/* Table Legs */}
            {[
                [-5.8, 0.9, -2.8],
                [5.8, 0.9, -2.8],
                [-5.8, 0.9, 2.8],
                [5.8, 0.9, 2.8],
            ].map((pos, idx) => (
                <mesh key={idx} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.3, 1.8, 0.3]} />
                    <meshStandardMaterial color="#2a1f18" roughness={0.8} />
                </mesh>
            ))}

            {/* Cross Bars */}
            <mesh position={[0, 0.2, -2.8]} castShadow>
                <boxGeometry args={[11.6, 0.15, 0.2]} />
                <meshStandardMaterial color="#2a1f18" />
            </mesh>
            <mesh position={[0, 0.2, 2.8]} castShadow>
                <boxGeometry args={[11.6, 0.15, 0.2]} />
                <meshStandardMaterial color="#2a1f18" />
            </mesh>
        </group>
    );
}
