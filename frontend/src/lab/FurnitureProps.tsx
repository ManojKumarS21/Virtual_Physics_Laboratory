'use client';

import * as THREE from 'three';

export function Book({ position, rotation = [0, 0, 0], color = "#4a90e2" }: { position: [number, number, number], rotation?: [number, number, number], color?: string }) {
    return (
        <group position={position} rotation={rotation as [number, number, number]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.08, 0.6]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0]} scale={[1.01, 1, 1.01]}>
                <boxGeometry args={[0.38, 0.07, 0.58]} />
                <meshBasicMaterial color="white" />
            </mesh>
        </group>
    );
}

export function Paper({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <mesh position={position} rotation={rotation as [number, number, number]} receiveShadow>
            <planeGeometry args={[0.4, 0.5]} />
            <meshStandardMaterial color="#f3f4f6" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
    );
}

export function NoticeBoard({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <group position={position} rotation={rotation as [number, number, number]}>
            {/* Board Frame */}
            <mesh castShadow>
                <boxGeometry args={[6.2, 4.2, 0.1]} />
                <meshStandardMaterial color="#5d4037" roughness={0.8} />
            </mesh>
            {/* Cork Surface */}
            <mesh position={[0, 0, 0.06]} receiveShadow>
                <planeGeometry args={[6, 4]} />
                <meshStandardMaterial color="#bcaaa4" roughness={1} />
            </mesh>
            {/* Decorative Papers on Board */}
            <mesh position={[-1, 0.5, 0.07]} rotation={[0, 0, 0.1]}>
                <planeGeometry args={[0.8, 1]} />
                <meshBasicMaterial color="white" />
            </mesh>
            <mesh position={[1.5, -0.3, 0.07]} rotation={[0, 0, -0.2]}>
                <planeGeometry args={[1, 1.2]} />
                <meshBasicMaterial color="#fff176" />
            </mesh>
        </group>
    );
}
