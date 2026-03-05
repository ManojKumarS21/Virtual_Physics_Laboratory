'use client';

import { useRef, useState, useMemo } from 'react';
import { useLabStore } from '../../hooks/useLabStore';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export default function InstrumentContainer({
    id,
    type,
    position,
    rotation,
    children
}: {
    id: string,
    type: string,
    position: [number, number, number],
    rotation: [number, number, number],
    children: React.ReactNode
}) {
    const instrument = useLabStore(state => state.placedInstruments.find(i => i.id === id));
    const isFixed = instrument?.isFixed;
    const updateInstrument = useLabStore((state) => state.updateInstrument);
    const isLocked = useLabStore((state) => state.isLocked);
    const isStaticMode = useLabStore((state) => state.isStaticMode);
    const groupRef = useRef<THREE.Group>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { raycaster, camera, gl } = useThree();

    // Plane for dragging (horizontal at Y=2)
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -2), []);

    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        if ((isLocked || isStaticMode) && type !== 'jockey') return;
        // Correctly set pointer capture on the canvas DOM element
        if (gl.domElement) {
            gl.domElement.setPointerCapture(e.pointerId);
        }
        setIsDragging(true);
    };

    const handlePointerMove = (e: any) => {
        if (!isDragging) return;
        e.stopPropagation();

        // Calculate intersection with drag plane
        const intersection = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(dragPlane, intersection);

        if (hit) {
            // Constrain to table area (roughly)
            const x = Math.max(-5.5, Math.min(5.5, intersection.x));
            const z = Math.max(-2.8, Math.min(2.8, intersection.z));

            // Only update if we have valid numbers to prevent "disappearing" (NaN)
            if (isFinite(x) && isFinite(z)) {
                updateInstrument(id, { position: [x, 2.05, z] });
            }
        }
    };

    const handlePointerUp = (e: any) => {
        e.stopPropagation();
        if (gl.domElement) {
            gl.domElement.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
    };

    const showHighlight = (isHovered || isDragging) && (!isLocked && !isStaticMode || type === 'jockey');

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOver={(e) => { e.stopPropagation(); if ((!isLocked && !isStaticMode) || type === 'jockey') setIsHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
        >
            {children}

            {/* Selection Highlight */}
            {showHighlight && (
                <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.5, 0.55, 32]} />
                    <meshBasicMaterial color={isDragging ? "#3b82f6" : "#ffffff"} transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}
