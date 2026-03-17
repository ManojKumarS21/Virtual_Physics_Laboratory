"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";
import { useLabState } from "@/lib/chemistry/LabContext";

interface RetortStandProps {
    position?: [number, number, number];
}

export const RetortStand: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const { state } = useLabState();
    const apparatus = state.apparatus["retortStand"];
    const rotation = apparatus?.rotation || [0, 0, 0];
    const scale = apparatus?.scale || [1, 1, 1];

    const { dragProps, isHovered } = useApparatusDrag({
        id: "retortStand",
        groupRef,
        yOffset: 0,
        liftHeight: 0.04,
    });

    return (
        <group 
            ref={groupRef} 
            rotation={rotation}
            scale={scale}
        >
            <group>
                {/* ── Heavy Base Plate ──────────────────────── */}
                <mesh 
                    position={[0, 0.015, -0.05]} 
                    castShadow 
                    receiveShadow
                    {...dragProps}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerDown?.(e);
                    }}
                    onPointerMove={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerMove?.(e);
                    }}
                    onPointerUp={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerUp?.(e);
                    }}
                    onPointerEnter={dragProps.onPointerEnter}
                    onPointerLeave={dragProps.onPointerLeave}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <boxGeometry args={[0.18, 0.03, 0.26]} />
                    <meshStandardMaterial color="#2d3036" roughness={0.75} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.035, -0.05]} receiveShadow>
                    {/* slight bevel/top detail for the base */}
                    <boxGeometry args={[0.17, 0.01, 0.25]} />
                    <meshStandardMaterial color="#2a2c30" roughness={0.8} metalness={0.3} />
                </mesh>

                {/* ── Vertical Iron Rod ──────────────────────── */}
                <mesh 
                    position={[0, 0.35, -0.15]} 
                    castShadow
                    {...dragProps}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerDown?.(e);
                    }}
                    onPointerMove={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerMove?.(e);
                    }}
                    onPointerUp={(e) => {
                        e.stopPropagation();
                        dragProps.onPointerUp?.(e);
                    }}
                    onPointerEnter={dragProps.onPointerEnter}
                    onPointerLeave={dragProps.onPointerLeave}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <cylinderGeometry args={[0.008, 0.008, 0.70, 16]} />
                    <meshStandardMaterial color="#4a4d52" roughness={0.4} metalness={0.7} />
                </mesh>

                {/* ── Clamp Bosshead (Connector) ──────────────── */}
                <group position={[0, 0.35, -0.15]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.028, 0.035, 0.028]} />
                        <meshStandardMaterial color="#32353b" roughness={0.6} metalness={0.5} />
                    </mesh>
                    {/* Tightening knob for bosshead onto vertical rod */}
                    <mesh position={[0.02, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.008, 0.008, 0.02, 12]} />
                        <meshStandardMaterial color="#888c94" roughness={0.5} metalness={0.6} />
                    </mesh>
                    {/* Tightening knob for horizontal rod */}
                    <mesh position={[0, 0.02, -0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.008, 0.008, 0.02, 12]} />
                        <meshStandardMaterial color="#888c94" roughness={0.5} metalness={0.6} />
                    </mesh>
                </group>

                {/* ── Horizontal Support Arm ──────────────────── */}
                <mesh position={[0, 0.35, -0.035]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.006, 0.006, 0.23, 12]} />
                    <meshStandardMaterial color="#3a3d42" roughness={0.5} metalness={0.7} />
                </mesh>

                {/* ── Clamp Gripping Mechanism ────────────────── */}
                <group position={[0, 0.35, 0.08]}>
                    <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.018, 0.018, 0.012, 16]} />
                        <meshStandardMaterial color="#2d3036" roughness={0.6} metalness={0.5} />
                    </mesh>
                    
                    {/* Left curved arm */}
                    <mesh position={[-0.03, 0, 0.03]} rotation={[0, -Math.PI / 5, 0]} castShadow>
                        <boxGeometry args={[0.006, 0.015, 0.05]} />
                        <meshStandardMaterial color="#3a3d42" roughness={0.6} metalness={0.5} />
                    </mesh>
                    {/* Right curved arm */}
                    <mesh position={[0.03, 0, 0.03]} rotation={[0, Math.PI / 5, 0]} castShadow>
                        <boxGeometry args={[0.006, 0.015, 0.05]} />
                        <meshStandardMaterial color="#3a3d42" roughness={0.6} metalness={0.5} />
                    </mesh>

                    {/* Left fingertip */}
                    <mesh position={[-0.04, 0, 0.06]} rotation={[0, Math.PI / 6, 0]} castShadow>
                        <boxGeometry args={[0.004, 0.015, 0.03]} />
                        <meshStandardMaterial color="#1f2124" roughness={0.8} />
                    </mesh>
                    {/* Right fingertip */}
                    <mesh position={[0.04, 0, 0.06]} rotation={[0, -Math.PI / 6, 0]} castShadow>
                        <boxGeometry args={[0.004, 0.015, 0.03]} />
                        <meshStandardMaterial color="#1f2124" roughness={0.8} />
                    </mesh>
                </group>


            </group>
        </group>
    );
};
