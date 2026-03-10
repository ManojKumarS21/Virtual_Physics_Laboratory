'use client';

import { Terminal } from '../../hooks/useLabStore';
import TerminalComponent from '../terminals/Terminal';
import { useLabStore } from '../../hooks/useLabStore';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Jockey({ id, isGhost }: { id: string, isGhost?: boolean }) {
    const position = useLabStore((state: any) =>
        state.placedInstruments.find((i: any) => i.id === id)?.position
    );
    const updateInstrument = useLabStore((state: any) => state.updateInstrument);
    const currentL = useLabStore((state: any) => state.currentL);
    const isContact = currentL !== -1;

    return (
        <group>
            {/* Black Insulated Handle */}
            <mesh position={[0, 0.6, 0]} userData={{ isFunctional: true }}>
                <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
                <meshStandardMaterial color="#111111" roughness={0.3} />
            </mesh>

            {/* Brass Neck */}
            <mesh position={[0, 0.2, 0]} userData={{ isFunctional: true }}>
                <cylinderGeometry args={[0.06, 0.08, 0.2, 16]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
            </mesh>

            {/* Brass Knife-Edge Tip */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]} userData={{ isFunctional: true }}>
                <boxGeometry args={[0.12, 0.12, 0.02]} />
                <meshStandardMaterial
                    color="#d4af37"
                    metalness={1}
                    roughness={0.1}
                    emissive={isContact ? "#ffcc00" : "#000000"}
                    emissiveIntensity={isContact ? 0.6 : 0}
                />
            </mesh>

            {/* Terminal for connecting wire to Galvanometer (placed on top of handle) */}
            {!isGhost && <TerminalComponent id={`${id}_t`} instrumentId={id} position={[0, 1.0, 0]} />}

            {/* Top Cap */}
            <mesh position={[0, 1.0, 0]} userData={{ isFunctional: true }}>
                <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
        </group>
    );
}
