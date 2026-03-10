'use client';

import { useLabStore } from '../../hooks/useLabStore';
import { useState } from 'react';

export default function Terminal({ id, instrumentId, position }: { id: string, instrumentId: string, position: [number, number, number] }) {
    const { activeTerminal, setActiveTerminal, addConnection, connections, isHoldingWire, setHoldingWire } = useLabStore((s: any) => s);
    const [isHovered, setIsHovered] = useState(false);

    const isConnected = connections.some((c: any) => c.from === id || c.to === id);
    const isActive = activeTerminal === id;
    const isPendingTarget = !!activeTerminal && activeTerminal !== id;

    const handleClick = (e: any) => {
        e.stopPropagation();

        // If not holding a wire, show a hint or do nothing
        if (!isHoldingWire && !activeTerminal) {
            // Optional: notify user they need to take a wire
            return;
        }

        if (!activeTerminal) {
            setActiveTerminal(id);
        } else if (activeTerminal !== id) {
            addConnection(activeTerminal, id);
            setHoldingWire(false); // Reset after connection
        } else {
            setActiveTerminal(null);
        }
    };

    // Color logic
    let color = '#555555'; // default
    if (isHovered) color = '#3b82f6'; // blue = hover
    if (isPendingTarget) color = '#f59e0b'; // orange = can connect here
    if (isActive) color = '#facc15'; // yellow = selected
    if (isConnected) color = '#22c55e'; // green = connected (highest priority)

    const emissive = isActive ? '#facc15' : isPendingTarget ? '#f59e0b' : (isConnected ? '#22c55e' : '#000000');

    return (
        <group
            position={position}
            onClick={handleClick}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
        >
            {/* Terminal sphere */}
            <mesh userData={{ isFunctional: true }}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={isActive ? 1.5 : isPendingTarget ? 0.8 : 0}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>

            {/* Invisible Hit Area - Moderate size to make connecting easy without blocking the whole model */}
            <mesh userData={{ isFunctional: true }}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Glow ring when active */}
            {(isActive || isPendingTarget) && (
                <mesh>
                    <ringGeometry args={[0.15, 0.22, 32]} />
                    <meshBasicMaterial color={isActive ? '#facc15' : '#f59e0b'} transparent opacity={0.6} />
                </mesh>
            )}

            {/* Pulse outer ring for pending target */}
            {isPendingTarget && (
                <mesh>
                    <ringGeometry args={[0.22, 0.28, 32]} />
                    <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
}
