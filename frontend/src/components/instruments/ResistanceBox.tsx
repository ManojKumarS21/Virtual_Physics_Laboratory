import { useRef, useMemo } from 'react';
import { useLabStore } from '../../hooks/useLabStore';
import Terminal from '../terminals/Terminal';
import { Float, Text } from '@react-three/drei';

const PEG_VALUES = [1, 2, 2, 5, 10, 20, 20, 50, 100, 500]; // 10 pegs

export default function ResistanceBox({ id }: { id: string }) {
    const updateValue = useLabStore((state: any) => state.updateInstrumentValue);
    const instrumentValues = useLabStore((state: any) => state.instrumentValues);

    // We store the removed pegs state as a bitmask in the store under a dedicated key
    // or we just calculate the total R. Let's use individual keys for persistence.
    const getPegStatus = (idx: number) => instrumentValues[`${id}_peg_${idx}`] === 1;

    const togglePeg = (idx: number) => {
        const isRemoved = getPegStatus(idx);
        updateValue(`${id}_peg_${idx}`, isRemoved ? 0 : 1);

        // Recalculate total resistance
        let totalR = 0;
        PEG_VALUES.forEach((val, i) => {
            const removed = i === idx ? !isRemoved : getPegStatus(i);
            if (removed) totalR += val;
        });
        updateValue(id, totalR);
    };

    const totalR = instrumentValues[id] || 0;

    return (
        <group>
            {/* Box Body - Realistic Wood */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[2, 0.8, 1.4]} />
                <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
            </mesh>

            {/* Top Brass Plate */}
            <mesh position={[0, 0.405, 0]}>
                <boxGeometry args={[1.9, 0.02, 1.3]} />
                <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Pegs Grid */}
            {PEG_VALUES.map((val, idx) => {
                const row = Math.floor(idx / 5);
                const col = idx % 5;
                const x = -0.7 + col * 0.35;
                const z = -0.3 + row * 0.6;
                const isRemoved = getPegStatus(idx);

                return (
                    <group key={idx} position={[x, 0.41, z]} onClick={(e) => { e.stopPropagation(); togglePeg(idx); }}>
                        {/* Hole (dark circle) */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
                            <circleGeometry args={[0.06, 16]} />
                            <meshBasicMaterial color="#111111" />
                        </mesh>

                        {/* Text Label for Value */}
                        <Text
                            position={[0, 0.05, row === 0 ? -0.2 : 0.2]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={0.08}
                            color="#222222"
                        >
                            {val}Ω
                        </Text>

                        {/* The Peg */}
                        <group position={[0, isRemoved ? 0.4 : 0.05, 0]}>
                            {/* Peg Top Handle */}
                            <mesh>
                                <cylinderGeometry args={[0.08, 0.06, 0.15, 16]} />
                                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
                            </mesh>
                            {/* Peg Pin */}
                            <mesh position={[0, -0.1, 0]}>
                                <cylinderGeometry args={[0.04, 0.04, 0.2, 16]} />
                                <meshStandardMaterial color="#b8860b" metalness={0.8} />
                            </mesh>
                        </group>
                    </group>
                );
            })}

            {/* Total Resistance HUD Label on Device */}
            <group position={[0, 0.8, 0]}>
                <Text fontSize={0.12} color="white" outlineColor="black" outlineWidth={0.01}>
                    Total R: {totalR} Ω
                </Text>
            </group>

            {/* Terminals */}
            <Terminal id={`${id}_t1`} instrumentId={id} position={[-0.9, 0, 0.8]} />
            <Terminal id={`${id}_t2`} instrumentId={id} position={[0.9, 0, 0.8]} />
        </group>
    );
}
