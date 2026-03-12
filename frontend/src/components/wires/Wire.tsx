'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useLabStore } from '../../hooks/useLabStore';

export default function Wire({ fromId, toId }: { fromId: string, toId: string }) {
    const placedInstruments = useLabStore((state) => state.placedInstruments);
    const [drawProgress, setDrawProgress] = useState(0);

    useEffect(() => {
        let start: number;
        const duration = 800; // ms

        const animate = (time: number) => {
            if (!start) start = time;
            const progress = Math.min(1, (time - start) / duration);
            setDrawProgress(progress);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, []);

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

        const dx = toPos[0] - fromPos[0];
        const dy = toPos[1] - fromPos[1];
        const dz = toPos[2] - fromPos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const archHeight = Math.max(0.3, dist * 0.4);

        const midPoint = [
            (fromPos[0] + toPos[0]) / 2,
            Math.max(fromPos[1], toPos[1]) + archHeight,
            (fromPos[2] + toPos[2]) / 2,
        ];

        return [
            new THREE.Vector3(...fromPos),
            new THREE.Vector3(...midPoint),
            new THREE.Vector3(...toPos),
        ];
    }, [fromId, toId, placedInstruments]);

    const curve = useMemo(() => {
        if (!points) return null;
        return new THREE.CatmullRomCurve3(points);
    }, [points]);

    const partialCurve = useMemo(() => {
        if (!curve || drawProgress === 0) return null;
        if (drawProgress === 1) return curve;
        
        // Create a sub-curve for animation
        const points = curve.getPoints(50);
        const slicedPoints = points.slice(0, Math.ceil(points.length * drawProgress));
        if (slicedPoints.length < 2) return null;
        return new THREE.CatmullRomCurve3(slicedPoints);
    }, [curve, drawProgress]);

    if (!partialCurve) return null;

    const color = "#ffffff";

    return (
        <group>
            <mesh castShadow>
                <tubeGeometry args={[partialCurve, 32, 0.02, 8, false]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.7}
                    metalness={0.1}
                    emissive="#ffffff"
                    emissiveIntensity={0.05}
                />
            </mesh>

            {/* Connector heads */}
            <mesh position={points![0]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.8} />
            </mesh>
            {drawProgress > 0.95 && (
                <mesh position={points![points!.length - 1]}>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.8} />
                </mesh>
            )}
        </group>
    );
}
