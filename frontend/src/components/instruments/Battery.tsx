import { MeshTransmissionMaterial } from '@react-three/drei';
import Terminal from '../terminals/Terminal';
import { useLabStore } from '../../hooks/useLabStore';

export default function Battery({ id }: { id: string }) {
    const value = useLabStore((state: any) => state.instrumentValues[id] || 2);
    const updateValue = useLabStore((state: any) => state.updateInstrumentValue);

    const toggleVoltage = () => {
        const next = value >= 6 ? 2 : value + 2;
        updateValue(id, next);
    };

    return (
        <group onClick={(e) => { e.stopPropagation(); toggleVoltage(); }}>
            {/* Glass Jar */}
            <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.5, 0.48, 0.9, 32]} />
                <MeshTransmissionMaterial
                    backside
                    samples={4}
                    thickness={0.1}
                    chromaticAberration={0.05}
                    anisotropy={0.1}
                    distortion={0.1}
                    distortionScale={0.1}
                    temporalDistortion={0.1}
                    transparent
                    opacity={0.4}
                    color="#ffffff"
                />
            </mesh>

            {/* Electrolyte (NH4Cl solution - orange/amber) */}
            <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.45, 0.45, 0.65, 32]} />
                <meshStandardMaterial
                    color="#ff9900"
                    transparent
                    opacity={0.6}
                    roughness={0.1}
                    metalness={0.2}
                    emissive="#ff6600"
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Carbon Rod (Positive - Centre) */}
            <group position={[0, 0.5, 0]}>
                {/* Porous Pot wrapper */}
                <mesh position={[0, -0.05, 0]}>
                    <cylinderGeometry args={[0.2, 0.18, 0.7, 32]} />
                    <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
                </mesh>
                {/* Carbon Rod */}
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.9, 16]} />
                    <meshStandardMaterial color="#222222" roughness={0.8} />
                </mesh>
                {/* Brass Terminal Cap */}
                <mesh position={[0, 0.55, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
                    <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
                </mesh>
            </group>

            {/* Zinc Rod (Negative - Offset) */}
            <group position={[0.3, 0.5, 0]}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
                    <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Brass Terminal Cap */}
                <mesh position={[0, 0.45, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
                    <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
                </mesh>
            </group>

            {/* Terminals (Placed on brass caps) */}
            <Terminal id={`${id}_pos`} instrumentId={id} position={[0, 1.1, 0]} />
            <Terminal id={`${id}_neg`} instrumentId={id} position={[0.3, 1.0, 0]} />

            {/* Label Base */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.55, 0.55, 0.1, 32]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* Value Display */}
            <mesh position={[0, 0.5, 0.51]}>
                <planeGeometry args={[0.4, 0.2]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
}
