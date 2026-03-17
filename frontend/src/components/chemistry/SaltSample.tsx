"use client";

import React, { useRef } from "react";
import { Text, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";
import { SALT_CONFIG } from "@/lib/chemistry/engine";

interface SaltSampleProps {
    id: string;
}

export const SaltSample: React.FC<SaltSampleProps> = ({ id }) => {
    const { state, addSalt, pickSalt } = useLabState();
    const configId = id.replace("salt_", "");
    const config = SALT_CONFIG[configId as keyof typeof SALT_CONFIG] || { name: "Unknown", color: "#ffffff" };
    const label = config.name.split(" ")[0] + " Salt";
    const color = config.color;
    const groupRef = useRef<THREE.Group>(null!);

    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id,
        groupRef,
        liftHeight: 0.1,
        onSnapDrop: (dragId, pos) => {
            // Check if dish itself is dropped near a test tube to "dump" all salt
            for (const tube of state.testTubes) {
                const dx = pos[0] - tube.position[0];
                const dz = pos[2] - tube.position[2];
                if (Math.sqrt(dx * dx + dz * dz) < 0.2) {
                    addSalt(tube.id, id);
                    break;
                }
            }
        }
    });

    const isSpatulaNearby = state.draggingId === "spatula";

    return (
        <group
            ref={groupRef}
        >
            <group onClick={() => isSpatulaNearby && pickSalt(id)}>
                {/* Small petri dish or watch glass */}
                <Cylinder 
                    args={[0.08, 0.08, 0.01, 16]}
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
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={0} />
                </Cylinder>

                {/* Small pile of salt (Conical mound) */}
                <mesh 
                    position={[0, 0.012, 0]}
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
                    <cylinderGeometry args={[0.01, 0.055, 0.04, 12]} />
                    <meshStandardMaterial color={color} roughness={1} />
                </mesh>

                {/* Label */}
                <Text
                    position={[0, 0.06, 0]}
                    fontSize={0.04}
                    color="#ffffff"
                    outlineWidth={0.004}
                    outlineColor="#000000"
                >
                    {label}
                </Text>

                {/* Interaction Hint */}
                {(isHovered || isDragging) && (
                    <Text
                        position={[0, 0.15, 0]}
                        fontSize={0.05}
                        color="white"
                        outlineWidth={0.004}
                        outlineColor="black"
                        textAlign="center"
                    >
                        {isSpatulaNearby
                            ? `Salt: ${label}\nTOUCH WITH SPATULA TO SCOOP`
                            : `Salt: ${label}\nDrag dish to drop into Tube`}
                    </Text>
                )}
            </group>
        </group>
    );
};
