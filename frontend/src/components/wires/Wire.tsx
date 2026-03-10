'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useLabStore } from '../../hooks/useLabStore';

export default function Wire({ fromId, toId }: { fromId: string, toId: string }) {
    const placedInstruments = useLabStore((state) => state.placedInstruments);

    const points = useMemo(() => {
        // Find terminal world positions
        let fromPos: [number, number, number] | null = null;
        let toPos: [number, number, number] | null = null;

        for (const inst of placedInstruments) {
            const fromTerm = inst.terminals.find(t => t.id === fromId);
            if (fromTerm) {
                fromPos = [
                    inst.position[0] + fromTerm.position[0],
                    inst.position[1] + fromTerm.position[1],
                    inst.position[2] + fromTerm.position[2],
                ];
            }
            const toTerm = inst.terminals.find(t => t.id === toId);
            if (toTerm) {
                toPos = [
                    inst.position[0] + toTerm.position[0],
                    inst.position[1] + toTerm.position[1],
                    inst.position[2] + toTerm.position[2],
                ];
            }
        }

        if (!fromPos || !toPos) return null;

        // Calculate distance between terminals
        const dx = toPos[0] - fromPos[0];
        const dy = toPos[1] - fromPos[1];
        const dz = toPos[2] - fromPos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Create a realistic arch "on the table"
        // Arch height depends on distance, ensuring it looks natural
        const archHeight = Math.max(0.3, dist * 0.4);

        const midPoint = [
            (fromPos[0] + toPos[0]) / 2 + (Math.random() - 0.5) * 0.1, // Slight random offset for realism
            Math.max(fromPos[1], toPos[1]) + archHeight, // Arch UP
            (fromPos[2] + toPos[2]) / 2 + (Math.random() - 0.5) * 0.1, // Slight random offset
        ];

        return [
            new THREE.Vector3(...fromPos),
            new THREE.Vector3(...midPoint),
            new THREE.Vector3(...toPos),
        ];
    }, [fromId, toId, placedInstruments]);

    if (!points) return null;

    const color = "#ffffff"; // Clean white as requested

    const curve = new THREE.CatmullRomCurve3(points);

    return (
        <group>
            {/* Main Wire - Thicker and matte for realism */}
            <mesh castShadow>
                <tubeGeometry args={[curve, 32, 0.02, 8, false]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.7}
                    metalness={0.1}
                    emissive="#ffffff"
                    emissiveIntensity={0.05} // Slight glow to make it pop on the dark table
                />
            </mesh>

            {/* Connector heads - more refined look */}
            <mesh position={points[0]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.8} />
            </mesh>
            <mesh position={points[points.length - 1]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.8} />
            </mesh>
        </group>
    );
}
