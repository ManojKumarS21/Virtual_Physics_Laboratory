import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import Terminal from '../terminals/Terminal';
import { useLabStore } from '../../hooks/useLabStore';
import * as THREE from 'three';

// Constants for moving-coil physics
const SPRING_CONSTANT = 0.15;
const DAMPING_FACTOR = 0.82;
const MAX_DEFLECTION = 50; // Divisions on the scale (-50 to +50)

export default function Galvanometer({ id, isGhost }: { id: string, isGhost?: boolean }) {
    const rawDeflection = useLabStore((state: any) => state.deflection);

    // Convert 0-1 deflection scale to -50 to +50 divisions
    // In our physics engine, deflection is between -1.0 and 1.0 (or theoretically higher if unbounded)
    // We'll map a raw deflection of 1.0 to 50 divisions.
    const targetDeflection = useMemo(() => {
        let val = typeof rawDeflection === 'number' && !isNaN(rawDeflection) ? rawDeflection * 100 : 0;
        // Clamp to physical bounds
        return Math.max(-MAX_DEFLECTION, Math.min(MAX_DEFLECTION, val));
    }, [rawDeflection]);

    // Physics state
    const currentPosition = useRef(0);
    const velocity = useRef(0);
    const needleGroupRef = useRef<THREE.Group>(null);
    const setVisualDeflection = useLabStore(s => s.setVisualDeflection);

    useFrame(() => {
        if (!needleGroupRef.current) return;

        // Moving-coil simulation
        velocity.current += (targetDeflection - currentPosition.current) * SPRING_CONSTANT;
        velocity.current *= DAMPING_FACTOR;
        currentPosition.current += velocity.current;

        // Convert -50/50 divisions to rotation (-45 deg to +45 deg approx -> Math.PI/4)
        // Note: Z-axis rotation is counter-clockwise. 
        // A positive current deflecting right means negative rotation around Z.
        // We ensure polarity matches the standard.
        const rotationAngle = -(currentPosition.current / MAX_DEFLECTION) * (Math.PI / 4.5);

        needleGroupRef.current.rotation.z = rotationAngle;
        
        // Sync to global store for 2D monitor parity
        setVisualDeflection(currentPosition.current / MAX_DEFLECTION);
    });

    return (
        <group>
            {/* Main Base - Glossy Black Plastic */}
            <mesh castShadow receiveShadow position={[0, 0.1, 0.1]}>
                <boxGeometry args={[1.8, 0.2, 1.4]} />
                <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.4} />
            </mesh>

            {/* Rear Slanted Housing (Wedge Approximation) */}
            <group position={[0, 0.45, -0.6]}>
                <mesh castShadow receiveShadow position={[0, 0, 0]}>
                    <boxGeometry args={[1.75, 0.9, 0.6]} />
                    <meshStandardMaterial color="#050505" roughness={0.3} />
                </mesh>
                {/* Add a top slant to complete the wedge look */}
                <mesh castShadow receiveShadow position={[0, 0.45, -0.2]} rotation={[Math.PI / 4, 0, 0]}>
                    <boxGeometry args={[1.75, 1.2, 0.1]} />
                    <meshStandardMaterial color="#050505" roughness={0.3} />
                </mesh>
            </group>

            {/* Front Terminal Deck */}
            <group position={[0, 0.2, 0.5]}>
                <mesh castShadow>
                    <boxGeometry args={[1.8, 0.2, 0.6]} />
                    <meshStandardMaterial color="#000000" roughness={0.5} />
                </mesh>

                {/* Terminals */}
                <group position={[-0.5, 0.1, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.1, 0.12, 0.15, 16]} />
                        <meshStandardMaterial color="#cc0000" roughness={0.4} /> {/* RED (+) */}
                    </mesh>
                    <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
                        <meshStandardMaterial color="#d4af37" metalness={0.8} /> {/* Metal core */}
                    </mesh>
                    {!isGhost && <Terminal id={`${id}_t2`} instrumentId={id} position={[0, 0.15, 0]} />}
                </group>

                <group position={[0.5, 0.1, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.1, 0.12, 0.15, 16]} />
                        <meshStandardMaterial color="#111111" roughness={0.4} /> {/* BLACK (-) */}
                    </mesh>
                    <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
                        <meshStandardMaterial color="#d4af37" metalness={0.8} /> {/* Metal core */}
                    </mesh>
                    {!isGhost && <Terminal id={`${id}_t1`} instrumentId={id} position={[0, 0.15, 0]} />}
                </group>

                {/* Bottom Label Box */}
                <mesh position={[0, 0.1, 0.22]}>
                    <boxGeometry args={[1.3, 0.01, 0.1]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[0, 0.101, 0.22]}>
                    <planeGeometry args={[1.25, 0.08]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
                <Text position={[0, 0.102, 0.22]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.06} color="#000000" fontWeight="bold">
                    +        DC MOVING COIL        -
                </Text>
            </group>

            {/* Slanted Display Panel (Approx 45 degrees) */}
            <group position={[0, 0.7, 0.05]} rotation={[-Math.PI / 4, 0, 0]}>

                {/* Silver/Metallic Lower Grill Pattern (Stylized) */}
                <mesh position={[0, -0.4, 0.01]}>
                    <boxGeometry args={[1.75, 0.35, 0.05]} />
                    <meshStandardMaterial color="#888888" map={
                        // We simulate the diamond texture via simple metalness and roughness values for now
                        null
                    } metalness={0.7} roughness={0.3} />
                </mesh>

                {/* White Dial Plate */}
                <mesh position={[0, 0.1, 0]}>
                    <planeGeometry args={[1.7, 0.7]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>

                {/* Scale Arc and Ticks */}
                {Array.from({ length: 21 }).map((_, i) => {
                    const val = -50 + (i * 5); // From -50 to 50 in steps of 5
                    const angle = (val / 50) * Math.PI / 4.5;
                    const isMajor = val % 10 === 0;

                    return (
                        <group key={val} rotation={[0, 0, -angle]} position={[0, -0.4, 0.01]}>
                            {/* Tick mark */}
                            <mesh position={[0, 0.65, 0]}>
                                <boxGeometry args={[isMajor ? 0.012 : 0.006, isMajor ? 0.06 : 0.04, 0.001]} />
                                <meshBasicMaterial color="#333333" />
                            </mesh>
                            {/* Number label for major divisions */}
                            {isMajor && (
                                <Text
                                    position={[0, 0.74, 0]}
                                    fontSize={0.06}
                                    color="#111111"
                                    rotation={[0, 0, angle]}
                                    fontWeight="bold"
                                >
                                    {Math.abs(val)}
                                </Text>
                            )}
                        </group>
                    );
                })}

                {/* Texts on Dial */}
                <Text position={[0, 0.15, 0.01]} fontSize={0.16} color="#222222" fontWeight="bold">
                    GALVO
                </Text>

                {/* Magnet/Coil Symbol near center */}
                <group position={[0, -0.05, 0.01]}>
                    <Text position={[-0.08, 0, 0]} fontSize={0.08} color="#222222">
                        ☊
                    </Text>
                    <Text position={[0.08, 0, 0]} fontSize={0.1} color="#222222">
                        ⊥
                    </Text>
                    <mesh position={[-0.08, -0.05, 0]}>
                        <boxGeometry args={[0.06, 0.01, 0.001]} />
                        <meshBasicMaterial color="#222222" />
                    </mesh>
                </group>

                {/* MR-100 texts on the left */}
                <Text position={[-0.5, 0.05, 0.01]} fontSize={0.05} color="#222222" fontWeight="bold">
                    MR - 100
                </Text>
                <Text position={[-0.5, -0.02, 0.01]} fontSize={0.04} color="#222222" fontWeight="bold">
                    CLASS 2.0
                </Text>

                {/* Black Pivot Hub Cover - Half circle appearance via placement */}
                <mesh position={[0, -0.45, 0.02]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
                    <meshStandardMaterial color="#000000" roughness={0.8} />
                </mesh>

                {/* The Red Needle (Animated by useFrame) */}
                <group ref={needleGroupRef} position={[0, -0.4, 0.03]}>
                    {/* Needle Tail */}
                    <mesh position={[0, -0.06, 0]}>
                        <boxGeometry args={[0.008, 0.12, 0.002]} />
                        <meshBasicMaterial color="#ff0000" />
                    </mesh>
                    {/* Needle Pointer */}
                    <mesh position={[0, 0.38, 0]}>
                        <boxGeometry args={[0.006, 0.76, 0.002]} />
                        <meshBasicMaterial color="#ff0000" />
                    </mesh>
                </group>

                {/* Transparent Acrylic/Glass Cover */}
                <mesh position={[0, 0.0, 0.1]}>
                    <planeGeometry args={[1.8, 1.05]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.15}
                        roughness={0.05}
                        metalness={0.9}
                        envMapIntensity={2.0}
                    />
                </mesh>

                {/* Chrome Bezel Frame */}
                <group position={[0, 0.0, 0.1]} castShadow>
                    {/* Top */}
                    <mesh position={[0, 0.515, 0]}>
                        <boxGeometry args={[1.8, 0.02, 0.02]} />
                        <meshStandardMaterial color="#bbbbbb" metalness={0.8} />
                    </mesh>
                    {/* Bottom */}
                    <mesh position={[0, -0.515, 0]}>
                        <boxGeometry args={[1.8, 0.02, 0.02]} />
                        <meshStandardMaterial color="#bbbbbb" metalness={0.8} />
                    </mesh>
                    {/* Left */}
                    <mesh position={[-0.89, 0, 0]}>
                        <boxGeometry args={[0.02, 1.05, 0.02]} />
                        <meshStandardMaterial color="#bbbbbb" metalness={0.8} />
                    </mesh>
                    {/* Right */}
                    <mesh position={[0.89, 0, 0]}>
                        <boxGeometry args={[0.02, 1.05, 0.02]} />
                        <meshStandardMaterial color="#bbbbbb" metalness={0.8} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

