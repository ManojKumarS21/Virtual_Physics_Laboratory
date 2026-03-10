import { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useLabStore } from '../../hooks/useLabStore';
import { Text } from '@react-three/drei';
import Terminal from '../terminals/Terminal';
import * as THREE from 'three';
export default function MeterBridge({ id, isGhost }: { id: string, isGhost?: boolean }) {
    const updateInstrument = useLabStore((state: any) => state.updateInstrument);
    const placedInstruments = useLabStore((state: any) => state.placedInstruments);
    const [isSliding, setIsSliding] = useState(false);
    const { gl } = useThree();

    const handlePointerDown = (e: any) => {
        if (isGhost) return;
        const jockey = placedInstruments.find((i: any) => i.type === 'jockey');
        if (!jockey) return;

        e.stopPropagation();
        setIsSliding(true);
        if (gl.domElement) {
            gl.domElement.setPointerCapture(e.pointerId);
        }
        updateJockeyPosition(e.point.x, jockey.id);
    };

    const handlePointerMove = (e: any) => {
        if (!isSliding || isGhost) return;
        const jockey = placedInstruments.find((i: any) => i.type === 'jockey');
        if (!jockey) return;

        e.stopPropagation();
        updateJockeyPosition(e.point.x, jockey.id);
    };

    const handlePointerUp = (e: any) => {
        if (!isSliding || isGhost) return;
        e.stopPropagation();
        setIsSliding(false);
        if (gl.domElement) {
            gl.domElement.releasePointerCapture(e.pointerId);
        }
    };

    const updateJockeyPosition = (worldX: number, jockeyId: string) => {
        const mb = placedInstruments.find((i: any) => i.id === id);
        if (!mb) return;

        const localX = worldX - mb.position[0];
        const clampedLocalX = Math.max(-5.0, Math.min(5.0, localX));
        const finalX = mb.position[0] + clampedLocalX;
        const wireZ = mb.position[2] + 0.4;
        const wireY = 2.18;

        updateInstrument(jockeyId, { position: [finalX, wireY, wireZ] });
    };

    return (
        <group>
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[11, 0.1, 1.8]} />
                <meshStandardMaterial color="#4a2a18" roughness={0.85} metalness={0.05} />
            </mesh>

            {/* Brass Plates - More slender and realistic */}
            <group position={[-5.1, 0.15, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[0.4, 0.06, 1.4]} />
                    <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                </mesh>
                {!isGhost && (
                    <>
                        <Terminal id={`${id}_A1`} instrumentId={id} position={[0, 0.1, 0.5]} />
                        <Terminal id={`${id}_A2`} instrumentId={id} position={[0, 0.1, -0.5]} />
                    </>
                )}
            </group>

            {/* Left Gap Assembly */}
            <group position={[-2.5, 0.15, -0.5]}>
                <mesh castShadow>
                    <boxGeometry args={[1.2, 0.06, 0.3]} />
                    <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                </mesh>
                {!isGhost && (
                    <>
                        <Terminal id={`${id}_L1`} instrumentId={id} position={[-0.5, 0.1, 0]} />
                        <Terminal id={`${id}_L2`} instrumentId={id} position={[0.5, 0.1, 0]} />
                    </>
                )}
            </group>

            {/* Central D-Plate */}
            <group position={[0, 0.15, -0.5]}>
                <mesh castShadow>
                    <boxGeometry args={[1.2, 0.06, 0.3]} />
                    <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                </mesh>
                {!isGhost && <Terminal id={`${id}_D`} instrumentId={id} position={[0, 0.1, 0]} />}
            </group>

            {/* Right Gap Assembly */}
            <group position={[2.5, 0.15, -0.5]}>
                <mesh castShadow>
                    <boxGeometry args={[1.2, 0.06, 0.3]} />
                    <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                </mesh>
                {!isGhost && (
                    <>
                        <Terminal id={`${id}_R1`} instrumentId={id} position={[-0.5, 0.1, 0]} />
                        <Terminal id={`${id}_R2`} instrumentId={id} position={[0.5, 0.1, 0]} />
                    </>
                )}
            </group>

            {/* Right Plate (C) */}
            <group position={[5.1, 0.15, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[0.4, 0.06, 1.4]} />
                    <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                </mesh>
                {!isGhost && (
                    <>
                        <Terminal id={`${id}_C1`} instrumentId={id} position={[0, 0.1, 0.5]} />
                        <Terminal id={`${id}_C2`} instrumentId={id} position={[0, 0.1, -0.5]} />
                    </>
                )}
            </group>

            {/* Centered Measuring Scale */}
            <mesh position={[0, 0.12, 0]} receiveShadow>
                <boxGeometry args={[10, 0.01, 0.8]} />
                <meshStandardMaterial color="#e8dcc4" roughness={0.9} />
            </mesh>

            {/* Wire along the center of the scale */}
            <mesh position={[0, 0.14, 0.35]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, 10.2, 8]} />
                <meshStandardMaterial color="#8b4513" metalness={1} roughness={0.5} />
            </mesh>

            {/* Invisible Hitbox for Jockey tracking */}
            <mesh
                position={[0, 0.16, 0.35]}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOut={handlePointerUp}
                visible={false}
            >
                <boxGeometry args={[10.5, 0.2, 0.6]} />
                <meshBasicMaterial transparent opacity={0} depthTest={false} />
            </mesh>

            {/* Scale Markings (0 to 100 cm, 1 cm increments) */}
            {Array.from({ length: 101 }).map((_, i) => {
                const cm = i;
                const x = -5 + (cm / 100) * 10;
                const isMajor = cm % 10 === 0;
                const isMedium = cm % 5 === 0 && !isMajor;
                const lineLength = isMajor ? 0.35 : isMedium ? 0.22 : 0.12;

                // Align lines to the bottom edge of the white scale visually
                // Center of the line depends on its length
                const startZ = 0.25;
                const zPos = startZ - (lineLength / 2);

                return (
                    <group key={cm} position={[x, 0.13, zPos]}>
                        <mesh>
                            <boxGeometry args={[isMajor ? 0.015 : 0.008, 0.005, lineLength]} />
                            <meshBasicMaterial color="#333333" />
                        </mesh>
                        {isMajor && (
                            <Text
                                position={[0, 0.015, -0.22]}
                                fontSize={0.08}
                                color="#222222"
                                rotation={[-Math.PI / 2, 0, 0]}
                                fontWeight="bold"
                            >
                                {cm}
                            </Text>
                        )}
                    </group>
                );
            })}
        </group>
    );
}
