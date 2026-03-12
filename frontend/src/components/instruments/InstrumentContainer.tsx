'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useLabStore } from '../../hooks/useLabStore';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

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
    const tourHighlightedIds = useLabStore((state) => state.tourHighlightedIds);
    const isTourHighlighted = tourHighlightedIds.includes(id);

    const groupRef = useRef<THREE.Group>(null);
    const highlightRef = useRef<THREE.Mesh>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const posStartX = useRef(0);
    const { raycaster, gl, clock } = useThree();

    // Pulse effect for tour highlight
    useFrame(() => {
        if (highlightRef.current && isTourHighlighted) {
            const scale = 1 + Math.sin(clock.elapsedTime * 4) * 0.05;
            highlightRef.current.scale.set(scale, scale, 1);
            if (highlightRef.current.material instanceof THREE.MeshBasicMaterial) {
                highlightRef.current.material.opacity = 0.4 + Math.sin(clock.elapsedTime * 4) * 0.2;
            }
        }
    });

    // Fix: Ensure all instruments are raycastable
    useEffect(() => {
        if (!groupRef.current) return;
        const group = groupRef.current;

        group.traverse((child: any) => {
            if (child.isMesh) {
                // Reset to default raycast
                child.raycast = THREE.Mesh.prototype.raycast;
            }
        });
    }, [type]);

    // Plane for dragging (horizontal at Y=2)
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -2), []);

    const handlePointerDown = (e: any) => {
        // Jockey is moved STRICTLY by hovering over the Meter Bridge now.
        if (type === 'jockey') return;

        const canMove = !isStaticMode && !isFixed;
        if (!canMove) return;

        e.stopPropagation();
        if (gl.domElement) {
            gl.domElement.setPointerCapture(e.pointerId);
        }
        setIsDragging(true);

        // For relative dragging or raycast start
        dragStartX.current = e.clientX;
        posStartX.current = position[0];
    };

    const handlePointerMove = (e: any) => {
        if (!isDragging || type === 'jockey') return;

        e.stopPropagation();

        // Standard Raycast Dragging for other instruments
        const intersection = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(dragPlane, intersection);

        if (hit) {
            let x = Math.max(-5.5, Math.min(5.5, intersection.x));
            let z = Math.max(-2.8, Math.min(2.8, intersection.z));
            let y = 2.05;

            if (isFinite(x) && isFinite(z)) {
                updateInstrument(id, { position: [x, y, z] });
            }
        }
    };

    const handlePointerUp = (e: any) => {
        if (!isDragging) return;
        e.stopPropagation();
        if (gl.domElement) {
            gl.domElement.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
    };

    const canMove = type !== 'jockey' && (!isStaticMode && !isFixed);
    const showHighlight = (isHovered || isDragging) && canMove;

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOver={(e) => {
                e.stopPropagation();
                if (canMove) setIsHovered(true);
            }}
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

            {/* Tour Highlight */}
            {isTourHighlighted && (
                <group position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <mesh ref={highlightRef}>
                        <ringGeometry args={[0.55, 0.7, 32]} />
                        <meshBasicMaterial color="#2bb3a1" transparent opacity={0.4} />
                    </mesh>
                    <mesh>
                        <ringGeometry args={[0.55, 0.6, 32]} />
                        <meshBasicMaterial color="#2bb3a1" transparent opacity={0.2} />
                    </mesh>
                </group>
            )}

            {/* Hover Label (Tooltip) */}
            {isHovered && !isDragging && (
                <Html position={[0, 1.2, 0]} center distanceFactor={10}>
                    <div className="bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-xl">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Instrument</p>
                        <p className="text-sm text-white font-bold">{instrument?.name || type.replace('_', ' ')}</p>
                    </div>
                </Html>
            )}
        </group>
    );
}
