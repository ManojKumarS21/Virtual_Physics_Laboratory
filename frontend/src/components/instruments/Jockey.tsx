'use client';

import { Terminal } from '../../hooks/useLabStore';
import TerminalComponent from '../terminals/Terminal';
import { useLabStore } from '../../hooks/useLabStore';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Jockey({ id }: { id: string }) {
    const position = useLabStore((state: any) =>
        state.placedInstruments.find((i: any) => i.id === id)?.position
    );
    const updateInstrument = useLabStore((state: any) => state.updateInstrument);

    // Constrain jockey to Meter Bridge wire if close enough
    useEffect(() => {
        if (!position) return;

        const meterBridge = (window as any).MB_POS || { x: 0, y: 2, z: 0 }; // Temporary global search or better: store ref

        // If jockey is near the wire height and z-axis, we could snap it.
        // For now, the user manually places it.
    }, [position]);

    return (
        <group>
            {/* Black Insulated Handle */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
                <meshStandardMaterial color="#111111" roughness={0.3} />
            </mesh>

            {/* Brass Neck */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.2, 16]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
            </mesh>

            {/* Brass Knife-Edge Tip */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.12, 0.12, 0.02]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
            </mesh>

            {/* Terminal for connecting wire to Galvanometer (placed on top of handle) */}
            <TerminalComponent id={`${id}_t`} instrumentId={id} position={[0, 1.0, 0]} />

            {/* Top Cap */}
            <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
        </group>
    );
}
