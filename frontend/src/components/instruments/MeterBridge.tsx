import { Text } from '@react-three/drei';
import Terminal from '../terminals/Terminal';

export default function MeterBridge({ id }: { id: string }) {
    return (
        <group>
            {/* Wooden Base - Realistic dark mahogany texture */}
            <mesh position={[0, 0.075, 0]} castShadow receiveShadow>
                <boxGeometry args={[11, 0.15, 2.0]} />
                <meshStandardMaterial color="#4d2c18" roughness={0.6} />
            </mesh>

            {/* Brass Plates (5 plates version) */}
            {/* 1. Left L-plate (A) */}
            <group position={[-5.1, 0.2, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[0.6, 0.1, 1.6]} />
                    <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
                </mesh>
                <Terminal id={`${id}_A1`} instrumentId={id} position={[0, 0.1, 0.6]} />
                <Terminal id={`${id}_A2`} instrumentId={id} position={[0, 0.1, -0.6]} />
                <Text position={[-0.1, -0.15, 0.5]} fontSize={0.15} color="white">A</Text>
            </group>

            {/* 2. Left Intermediate Plate */}
            <group position={[-2.5, 0.2, -0.6]}>
                <mesh castShadow>
                    <boxGeometry args={[1.5, 0.1, 0.4]} />
                    <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
                </mesh>
                <Terminal id={`${id}_L1`} instrumentId={id} position={[-0.6, 0.1, 0]} />
                <Terminal id={`${id}_L2`} instrumentId={id} position={[0.6, 0.1, 0]} />
                <Text position={[0, 0.15, 0.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="white">Left gap</Text>
            </group>

            {/* 3. Central Plate (D) */}
            <group position={[0, 0.2, -0.6]}>
                <mesh castShadow>
                    <boxGeometry args={[1.5, 0.1, 0.4]} />
                    <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
                </mesh>
                <Terminal id={`${id}_D`} instrumentId={id} position={[0, 0.1, 0]} />
                <Text position={[0, -0.15, 0.4]} fontSize={0.15} color="white">D</Text>
            </group>

            {/* 4. Right Intermediate Plate */}
            <group position={[2.5, 0.2, -0.6]}>
                <mesh castShadow>
                    <boxGeometry args={[1.5, 0.1, 0.4]} />
                    <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
                </mesh>
                <Terminal id={`${id}_R1`} instrumentId={id} position={[-0.6, 0.1, 0]} />
                <Terminal id={`${id}_R2`} instrumentId={id} position={[0.6, 0.1, 0]} />
                <Text position={[0, 0.15, 0.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="white">Right gap</Text>
            </group>

            {/* 5. Right L-plate (C) */}
            <group position={[5.1, 0.2, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[0.6, 0.1, 1.6]} />
                    <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
                </mesh>
                <Terminal id={`${id}_C1`} instrumentId={id} position={[0, 0.1, 0.6]} />
                <Terminal id={`${id}_C2`} instrumentId={id} position={[0, 0.1, -0.6]} />
                <Text position={[0.1, -0.15, 0.5]} fontSize={0.15} color="white">C</Text>
            </group>

            {/* White scale strip */}
            <mesh position={[0, 0.155, 0]} receiveShadow>
                <boxGeometry args={[10, 0.012, 1.0]} />
                <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>

            {/* Resistance Wire */}
            <mesh position={[0, 0.17, 0.4]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.005, 0.005, 10.2, 12]} />
                <meshStandardMaterial color="#b8860b" metalness={1} roughness={0.3} />
            </mesh>

            {/* Scale markings */}
            {Array.from({ length: 11 }).map((_, i) => {
                const cm = i * 10;
                const x = -5 + (cm / 100) * 10;
                return (
                    <group key={cm} position={[x, 0.17, -0.1]}>
                        <mesh>
                            <boxGeometry args={[0.015, 0.012, 0.4]} />
                            <meshBasicMaterial color="#111111" />
                        </mesh>
                        <Text
                            position={[0, 0.02, 0.3]}
                            fontSize={0.12}
                            color="#333333"
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            {cm}
                        </Text>
                    </group>
                );
            })}
        </group>
    );
}
