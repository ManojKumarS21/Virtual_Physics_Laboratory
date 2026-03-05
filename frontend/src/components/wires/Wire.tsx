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

        // Create a curve with a "sag" for cable look
        const midPoint = [
            (fromPos[0] + toPos[0]) / 2,
            Math.min(fromPos[1], toPos[1]) - 0.5, // Sag down
            (fromPos[2] + toPos[2]) / 2,
        ];

        return [
            new THREE.Vector3(...fromPos),
            new THREE.Vector3(...midPoint),
            new THREE.Vector3(...toPos),
        ];
    }, [fromId, toId, placedInstruments]);

    if (!points) return null;

    const color = useMemo(() => {
        const colors = ['#cc0000', '#0000cc', '#007700', '#dddd00', '#660066', '#ff6600'];
        const hash = (fromId + toId).split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    }, [fromId, toId]);

    const curve = new THREE.CatmullRomCurve3(points);

    return (
        <group>
            <mesh>
                <tubeGeometry args={[curve, 20, 0.03, 8, false]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Connector heads */}
            <mesh position={points[0]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={points[points.length - 1]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
        </group>
    );
}
