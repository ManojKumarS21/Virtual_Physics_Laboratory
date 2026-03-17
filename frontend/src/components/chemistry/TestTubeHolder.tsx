"use client";

import React, { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLabState } from "@/lib/chemistry/LabContext";
import { useApparatusDrag } from "@/lib/chemistry/useApparatusDrag";

interface TestTubeHolderProps {
    position?: [number, number, number];
}

const METAL_COLOR = "#a0a090";
const METAL_PROPS = {
    metalness: 0.8,
    roughness: 0.2,
};

/**
 * Test Tube Holder Apparatus
 * Wooden handle with metal gripping ring structure at the front.
 * Final Redesigned for High-Fidelity Laboratory Experiments.
 */
export const TestTubeHolder: React.FC = () => {
    const { state, attachHolder } = useLabState();
    const { scene } = useThree();
    const groupRef = useRef<THREE.Group>(null!);

    // Tracking for visual hints, release cooldown, and manual double-click
    const [nearbyTube, setNearbyTube] = useState<string | null>(null);
    const [isReleased, setIsReleased] = useState(false);
    const lastReleaseTime = useRef(0);

    // Pickup animation states
    const pickupAnim = useRef(false);
    const pickupStart = useRef(0);
    const pickupTarget = useRef<THREE.Vector3 | null>(null);

    const { dragProps, isHovered, isDragging } = useApparatusDrag({
        id: "holder",
        groupRef,
        yOffset: 0.015,
    });

    const activeDragProps: any = (state.holderAttachedId) ? {
        onPointerDown: undefined,
        onPointerMove: undefined,
        onPointerUp: undefined,
        onPointerEnter: undefined,
        onPointerLeave: undefined
    } : dragProps;

    const handlePointerUp = useCallback((e: any) => {
        // Pass through to drag engine so it resets state properly
        dragProps.onPointerUp(e);
    }, [dragProps]);

    const handleDoubleClick = useCallback((e: any) => {
        if (state.holderAttachedId) {
            e.stopPropagation();
            lastReleaseTime.current = performance.now(); // Start cooldown
            setIsReleased(true);
            setNearbyTube(null); // Clear any stale alignment hint
            attachHolder(null);
        }
    }, [state.holderAttachedId, attachHolder]);

    useFrame((_state) => {
        if (!groupRef.current) return;
        const pos = groupRef.current.position;
        const now = performance.now();

        if (state.holderAttachedId && !isDragging) {
            const tube = state.testTubes.find(t => t.id === state.holderAttachedId);
            if (tube) {
                groupRef.current.position.set(
                    tube.position[0],
                    tube.position[1] + 0.34,
                    tube.position[2]
                );
            }
        }

        if (isDragging && pickupAnim.current) {
            pickupAnim.current = false;
        }

        // Snapping logic for Attachment (with cooldown check)
        if (isReleased && (now - lastReleaseTime.current) > 800) {
            setIsReleased(false);
        }

        if (!state.holderAttachedId && !isReleased) {
            let found = false;
            for (const tube of state.testTubes) {
                const tubePos = new THREE.Vector3(
                    tube.position[0],
                    tube.position[1],
                    tube.position[2]
                );

                const dist = groupRef.current.position.distanceTo(tubePos);

                if (dist < 0.22) {
                    setNearbyTube(tube.id);
                    found = true;

                    const assist = new THREE.Vector3(
                        tube.position[0],
                        tube.position[1] + 0.34,
                        tube.position[2]
                    );

                    // Assist alignment only when not dragging
                    if (!isDragging) {
                        groupRef.current.position.lerp(assist, 0.05);
                    }

                    // Start pickup animation only when not dragging
                    if (dist < 0.09 && !pickupAnim.current && !isDragging) {
                        pickupAnim.current = true;
                        pickupStart.current = performance.now();
                        pickupTarget.current = assist.clone();
                        // Realistic tilt
                        groupRef.current.rotation.x = -0.1;
                    }
                    break;
                }
            }
            if (!found) setNearbyTube(null);
        } else {
            if (nearbyTube) setNearbyTube(null);
        }

        // 200ms Smooth pickup animation (only when not dragging)
        if (pickupAnim.current && pickupTarget.current && !isDragging) {
            const t = (performance.now() - pickupStart.current) / 200;
            if (t < 1) {
                groupRef.current.position.lerp(pickupTarget.current, 0.2);
            } else {
                pickupAnim.current = false;
                if (nearbyTube) {
                    attachHolder(nearbyTube);
                    setNearbyTube(null);
                }
            }
        }

        // ───────────────── Rack Collision (Solid collision) ─────────────────
        const RACK_X_MIN = 0.95;
        const RACK_X_MAX = 2.45;
        const RACK_Z_MIN = -0.22;
        const RACK_Z_MAX = 0.22;

        const MIN_RACK_Y = 1.06 + 0.015; // Top of rack + offset

        const insideRack =
            pos.x > RACK_X_MIN &&
            pos.x < RACK_X_MAX &&
            pos.z > RACK_Z_MIN &&
            pos.z < RACK_Z_MAX;

        if (insideRack) {
            const isNearTop = pos.y > MIN_RACK_Y - 0.05;

            if (isNearTop || state.holderAttachedId) {
                // Smoothly snap to top surface
                if (pos.y < MIN_RACK_Y) {
                    groupRef.current.position.y = THREE.MathUtils.lerp(
                        pos.y,
                        MIN_RACK_Y,
                        0.3
                    );
                }
            } else {
                // Below rack top: push sideways (Solid object feel)
                const edgeX = Math.abs(pos.x - RACK_X_MIN) < Math.abs(pos.x - RACK_X_MAX) 
                    ? RACK_X_MIN 
                    : RACK_X_MAX;
                
                groupRef.current.position.x = THREE.MathUtils.lerp(
                    pos.x,
                    edgeX,
                    0.2
                );
            }
        }

        // Tour/State-driven rotation support
        const stateRotation = state.apparatus["holder"]?.rotation;
        if (stateRotation && groupRef.current && !isDragging) {
            groupRef.current.rotation.set(...stateRotation);
        } else if (!isDragging) {
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.12);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.12);
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.12);
        }
    });

    return (
        <group
            ref={groupRef}
            name="apparatus_holder"
            renderOrder={10}
            onContextMenu={(e) => {
                if (!state.holderAttachedId) return;
                e.stopPropagation();
                if ((e as any).nativeEvent?.preventDefault) (e as any).nativeEvent.preventDefault();

                attachHolder(null);
                lastReleaseTime.current = performance.now();
                setIsReleased(true);
            }}
        >
            {/* ── Invisible Hit Area (Does not block rays) ── */}
            <mesh position={[0, 0.015, 0.12]} visible={false} raycast={() => null}>
                <boxGeometry args={[0.08, 0.08, 0.45]} />
            </mesh>

            {/* ── Wooden Handle (Shifted back so ring is at 0,0,0) ── */}
            <mesh 
                position={[0, 0, 0.32]} 
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
                    handlePointerUp(e);
                }}
                onPointerEnter={dragProps.onPointerEnter}
                onPointerLeave={dragProps.onPointerLeave}
                onDoubleClick={handleDoubleClick}
                raycast={THREE.Mesh.prototype.raycast}
            >
                <boxGeometry args={[0.045, 0.03, 0.18]} />
                <meshStandardMaterial color="#633b1f" roughness={0.9} />
            </mesh>

            {/* ── Dual Metal Jaws (Shifted back) ── */}
            <group position={[0, 0, 0.14]}>
                <mesh 
                    position={[0.012, 0, 0]} 
                    castShadow
                    {...activeDragProps}
                    onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                    onPointerEnter={activeDragProps.onPointerEnter}
                    onPointerLeave={activeDragProps.onPointerLeave}
                    onDoubleClick={handleDoubleClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <boxGeometry args={[0.01, 0.01, 0.22]} />
                    <meshStandardMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>
                <mesh 
                    position={[-0.012, 0, 0]} 
                    castShadow
                    {...activeDragProps}
                    onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                    onPointerEnter={activeDragProps.onPointerEnter}
                    onPointerLeave={activeDragProps.onPointerLeave}
                    onDoubleClick={handleDoubleClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <boxGeometry args={[0.01, 0.01, 0.22]} />
                    <meshStandardMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>

                <mesh 
                    position={[0, 0, 0.08]}
                    {...activeDragProps}
                    onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                    onPointerEnter={activeDragProps.onPointerEnter}
                    onPointerLeave={activeDragProps.onPointerLeave}
                    onDoubleClick={handleDoubleClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <boxGeometry args={[0.035, 0.012, 0.015]} />
                    <meshStandardMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>
            </group>

            {/* ── Gripping Mouth / Clamp (Centered at 0,0,0) ── */}
            <group position={[0, 0, 0]}>
                <mesh 
                    rotation={[Math.PI / 2, 0, 0]} 
                    castShadow
                    {...activeDragProps}
                    onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                    onPointerEnter={activeDragProps.onPointerEnter}
                    onPointerLeave={activeDragProps.onPointerLeave}
                    onDoubleClick={handleDoubleClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <torusGeometry args={[0.036, 0.008, 12, 24]} />
                    <meshStandardMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>

                <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.036, 0.004, 8, 16]} />
                    <meshStandardMaterial color="#808080" roughness={0.5} />
                </mesh>

                <mesh 
                    position={[0.042, 0, 0.03]} 
                    rotation={[0, 0.8, 0]}
                    {...activeDragProps}
                    onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                    onPointerEnter={activeDragProps.onPointerEnter}
                    onPointerLeave={activeDragProps.onPointerLeave}
                    onDoubleClick={handleDoubleClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <boxGeometry args={[0.025, 0.008, 0.01]} />
                    <meshStandardMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>
                <mesh 
                    position={[-0.042, 0, 0.03]} 
                    rotation={[0, -0.8, 0]}
                    {...activeDragProps}
                    onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                    onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                    onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                    onPointerEnter={activeDragProps.onPointerEnter}
                    onPointerLeave={activeDragProps.onPointerLeave}
                    onDoubleClick={handleDoubleClick}
                    raycast={THREE.Mesh.prototype.raycast}
                >
                    <boxGeometry args={[0.025, 0.008, 0.01]} />
                    <meshStandardMaterial color={METAL_COLOR} {...METAL_PROPS} />
                </mesh>
            </group>

            {/* ── Tension Bolt ── */}
            <mesh 
                position={[0, 0.03, 0.2]} 
                frustumCulled={false}
                {...activeDragProps}
                onPointerDown={(e) => { e.stopPropagation(); activeDragProps.onPointerDown?.(e); }}
                onPointerMove={(e) => { e.stopPropagation(); activeDragProps.onPointerMove?.(e); }}
                onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
                onPointerEnter={activeDragProps.onPointerEnter}
                onPointerLeave={activeDragProps.onPointerLeave}
                onDoubleClick={handleDoubleClick}
                raycast={THREE.Mesh.prototype.raycast}
            >
                <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} />
                <meshStandardMaterial color="#444" metalness={0.9} />
            </mesh>

            {/* ── Status HUD ── */}
            {(isHovered || isDragging || nearbyTube) && (
                <Billboard position={[0, 0.45, 0]}>
                    <Text
                        fontSize={0.055}
                        color="white"
                        outlineColor="black"
                        outlineWidth={0.005}
                        textAlign="center"
                        raycast={() => null}
                    >
                        {state.holderAttachedId
                            ? `SECURED: ${state.holderAttachedId}\nDOUBLE-CLICK to Release`
                            : nearbyTube
                                ? "CLAMP READY"
                                : isReleased
                                    ? "RELEASED"
                                    : "Test Tube Holder\nAlign with TUBE RIM"}
                    </Text>
                </Billboard>
            )}
        </group>
    );
};
