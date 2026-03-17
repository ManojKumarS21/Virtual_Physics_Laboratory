'use client';

import { useRef } from 'react';
import * as THREE from 'three';

export default function Chair({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <group position={position} rotation={rotation as [number, number, number]}>
            {/* Seat */}
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.15, 1.2]} />
                <meshStandardMaterial color="#795548" roughness={0.6} />
            </mesh>

            {/* Backrest */}
            <mesh position={[0, 1.8, -0.52]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 1.2, 0.1]} />
                <meshStandardMaterial color="#795548" roughness={0.6} />
            </mesh>

            {/* Legs */}
            {[[-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5]].map((pos, idx) => (
                <mesh key={idx} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.15, 1, 0.15]} />
                    <meshStandardMaterial color="#3E2723" roughness={0.8} />
                </mesh>
            ))}

            {/* Backrest Supports */}
            {[[-0.5, 1.3, -0.5], [0.5, 1.3, -0.5]].map((pos, idx) => (
                <mesh key={`support-${idx}`} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.1, 0.6, 0.1]} />
                    <meshStandardMaterial color="#3E2723" roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}
