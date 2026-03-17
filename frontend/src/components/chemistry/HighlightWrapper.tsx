'use client';

import React from 'react';
import { useLabState } from '@/lib/chemistry/LabContext';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HighlightWrapperProps {
    id: string;
    children: React.ReactNode;
    type?: 'apparatus' | 'tube' | 'bottle';
}

export const HighlightWrapper: React.FC<HighlightWrapperProps> = ({ id, children, type = 'apparatus' }) => {
    const { state } = useLabState();
    const isHighlighted = state.tourState?.highlightedIds?.includes(id);

    return (
        <group>
            {children}
            {isHighlighted && <PulsingRing id={id} />}
        </group>
    );
};

const PulsingRing = ({ id }: { id: string }) => {
    const meshRef = React.useRef<THREE.Mesh>(null!);
    
    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime;
            // Pulsing scale
            const s = 1 + Math.sin(t * 3) * 0.1;
            meshRef.current.scale.set(s, s, s);
            // Floating up and down slightly
            meshRef.current.position.y = 0.05 + Math.sin(t * 2) * 0.02;
            // Opacity breath
            const mat = meshRef.current.material as THREE.MeshStandardMaterial;
            mat.opacity = 0.4 + Math.sin(t * 3) * 0.2;
        }
    });

    // Adjust position/size based on component type if needed
    // Defaulting to a ring at the base of the object
    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[0.22, 0.28, 32]} />
            <meshStandardMaterial 
                color="#2F8D46" 
                transparent 
                opacity={0.6} 
                emissive="#2F8D46" 
                emissiveIntensity={1.5}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};
