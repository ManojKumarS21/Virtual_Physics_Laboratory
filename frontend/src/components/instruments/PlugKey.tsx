import Terminal from '../terminals/Terminal';
import { useLabStore } from '../../hooks/useLabStore';

export default function PlugKey({ id, isGhost }: { id: string, isGhost?: boolean }) {
    const isClosed = useLabStore((state: any) => state.instrumentValues[id] === 1);
    const updateValue = useLabStore((state: any) => state.updateInstrumentValue);

    const toggleKey = () => {
        updateValue(id, isClosed ? 0 : 1);
    };

    return (
        <group onClick={(e) => { if (!isGhost) { e.stopPropagation(); toggleKey(); } }}>
            {/* Ebonite Base (Black textured) */}
            <mesh castShadow receiveShadow userData={{ isFunctional: true }}>
                <boxGeometry args={[1.2, 0.25, 0.9]} />
                <meshStandardMaterial color="#222222" roughness={0.4} />
            </mesh>

            {/* Brass Blocks */}
            {[-0.3, 0.3].map((x) => (
                <group key={x} position={[x, 0.25, 0]}>
                    <mesh castShadow userData={{ isFunctional: true }}>
                        <boxGeometry args={[0.5, 0.25, 0.7]} />
                        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Screw caps */}
                    <mesh position={[0, 0.15, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
                        <meshStandardMaterial color="#b8860b" metalness={0.8} />
                    </mesh>
                </group>
            ))}

            {/* The Bridge (Plug Gap) */}
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.2, 0.05, 0.4]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Tapered Brass Plug */}
            <group position={[0, isClosed ? 0.35 : 0.8, 0]} userData={{ isFunctional: true }}>
                {/* Plug Knob */}
                <mesh userData={{ isFunctional: true }}>
                    <cylinderGeometry args={[0.1, 0.06, 0.3, 16]} />
                    <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
                </mesh>
                {/* Plug Stem */}
                <mesh userData={{ isFunctional: true }}>
                    <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
                    <meshStandardMaterial color="#b8860b" metalness={0.9} />
                </mesh>
            </group>

            {/* Terminals */}
            {!isGhost && (
                <>
                    <Terminal id={`${id}_t1`} instrumentId={id} position={[-0.45, 0.4, 0.2]} />
                    <Terminal id={`${id}_t2`} instrumentId={id} position={[0.45, 0.4, 0.2]} />
                </>
            )}
        </group>
    );
}
