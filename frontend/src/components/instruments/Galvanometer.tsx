import { Text } from '@react-three/drei';
import Terminal from '../terminals/Terminal';
import { useLabStore } from '../../hooks/useLabStore';

export default function Galvanometer({ id }: { id: string }) {
    const rawDeflection = useLabStore((state: any) => state.deflection);

    // Guard against undefined, null, or NaN which causes Three.js to drop the mesh
    const deflection = typeof rawDeflection === 'number' && !isNaN(rawDeflection) ? rawDeflection : 0;

    return (
        <group>
            {/* Main Body - Slanted Bench Type */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.4, 0.4, 1.2]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
            </mesh>

            {/* Slanted Face Housing */}
            <group position={[0, 0.6, 0.1]} rotation={[-Math.PI / 4, 0, 0]}>
                {/* Frame */}
                <mesh castShadow>
                    <boxGeometry args={[1.3, 1.0, 0.1]} />
                    <meshStandardMaterial color="#222222" />
                </mesh>

                {/* White Scale Plate */}
                <mesh position={[0, 0, 0.051]}>
                    <planeGeometry args={[1.1, 0.8]} />
                    <meshStandardMaterial color="#f0f0f0" />
                </mesh>

                {/* Scale Markings */}
                {[-30, -20, -10, 0, 10, 20, 30].map((val) => (
                    <group key={val} rotation={[0, 0, (-val / 40) * Math.PI / 2]} position={[0, -0.2, 0.052]}>
                        <mesh position={[0, 0.5, 0]}>
                            <boxGeometry args={[0.01, 0.08, 0.001]} />
                            <meshBasicMaterial color="#000000" />
                        </mesh>
                        <Text
                            position={[0, 0.62, 0]}
                            fontSize={0.06}
                            color="#000000"
                            rotation={[0, 0, (val / 40) * Math.PI / 2]}
                        >
                            {val}
                        </Text>
                    </group>
                ))}

                {/* Needle Pivot */}
                <mesh position={[0, -0.2, 0.06]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
                    <meshStandardMaterial color="#333333" metalness={0.5} />
                </mesh>

                {/* Needle — uses guarded deflection value */}
                <group position={[0, -0.2, 0.07]} rotation={[0, 0, -deflection * Math.PI / 2]}>
                    <mesh position={[0, 0.25, 0]}>
                        <boxGeometry args={[0.008, 0.5, 0.002]} />
                        <meshBasicMaterial color="#d00000" />
                    </mesh>
                </group>

                {/* Glass Cover */}
                <mesh position={[0, 0, 0.1]}>
                    <planeGeometry args={[1.2, 0.9]} />
                    <meshStandardMaterial color="#88ccff" transparent opacity={0.2} roughness={0} metalness={1} />
                </mesh>
            </group>

            {/* Large Terminal Knobs at bottom front */}
            <group position={[0, 0.2, 0.5]}>
                {/* Black (-) */}
                <group position={[-0.4, 0, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
                        <meshStandardMaterial color="#111111" roughness={0.3} />
                    </mesh>
                    <Terminal id={`${id}_t1`} instrumentId={id} position={[0, 0.1, 0.05]} />
                </group>
                {/* Red (+) */}
                <group position={[0.4, 0, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
                        <meshStandardMaterial color="#cc0000" roughness={0.3} />
                    </mesh>
                    <Terminal id={`${id}_t2`} instrumentId={id} position={[0, 0.1, 0.05]} />
                </group>
            </group>

            {/* Label "G" */}
            <Text position={[0, 0.35, 0.61]} fontSize={0.2} color="#ffffff">
                G
            </Text>
        </group>
    );
}

