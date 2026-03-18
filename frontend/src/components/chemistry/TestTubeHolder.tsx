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

    const activeDragProps = dragProps; // Fix 4: Always allow dragging

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

        // Sync holder state (only when not dragging)
        if (state.holderAttachedId && !isDragging) {
            const tube = state.testTubes.find(t => t.id === state.holderAttachedId);
            if (tube) {
                groupRef.current.position.set(
                    tube.position[0],
                    tube.position[1] + (0.55 * 0.45),
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
                const rimPos = new THREE.Vector3(
                    tube.position[0],
                    tube.position[1] + (0.55 * 0.45),
                    tube.position[2]
                );

                const dist = groupRef.current.position.distanceTo(rimPos);

                if (dist < 0.25) { // Use rimPos for distance check
                    setNearbyTube(tube.id);
                    found = true;

                    const clampTarget = rimPos.clone();

                    // Assist alignment only when not dragging
                    if (!isDragging) {
                        groupRef.current.position.lerp(clampTarget, 0.05);
                    }

                    // Start pickup animation (Fix 1: Match 12cm sensitivity to 25cm for bench pick)
                    if (dist < 0.25 && !pickupAnim.current) {
                        pickupAnim.current = true;
                        pickupStart.current = performance.now();
                        pickupTarget.current = clampTarget.clone();
                    }
                    break;
                }
            }
            if (!found) setNearbyTube(null);
        } else {
            if (nearbyTube) setNearbyTube(null);
        }

        // ───────────────── TWO-STAGE PICK (Fix 2: Lift -> Clamp) ─────────────────
        if (pickupAnim.current && pickupTarget.current) {
            const t = (performance.now() - pickupStart.current) / 220;
            const clampTarget = pickupTarget.current;
            const liftTarget = new THREE.Vector3(clampTarget.x, clampTarget.y + 0.1, clampTarget.z);

            if (t < 0.5) {
                groupRef.current.position.lerp(liftTarget, 0.2);
            } else if (t < 1) {
                groupRef.current.position.lerp(clampTarget, 0.25);
            } else {
                pickupAnim.current = false;
                if (nearbyTube) {
                    attachHolder(nearbyTube);
                    setNearbyTube(null);
                }
            }
        }

        // ───────────────── HARD BLOCK COLLISIONS (Fix 5 & 6) ─────────────────
        const BENCH_TOP = 0.78;
        const isCarrying = !!state.holderAttachedId;
        
        const RACK_X_MIN = 0.90;
        const RACK_X_MAX = 2.50;
        const RACK_Z_MIN = -0.22;
        const RACK_Z_MAX = 0.22;
        const MIN_RACK_Y = 1.05;

        const overRack =
            pos.x > RACK_X_MIN &&
            pos.x < RACK_X_MAX &&
            pos.z > RACK_Z_MIN &&
            pos.z < RACK_Z_MAX;

        // Force minimum heights for carrying and bench clearance
        if (isCarrying) {
            const minCarryY = overRack ? 1.28 : 1.12; // Clear rack (1.28) vs clear bench (1.12)
            if (pos.y < minCarryY) {
                groupRef.current.position.y = minCarryY; // Fix 6: Hard clamp
            }
        } else if (overRack) {
            if (pos.y < MIN_RACK_Y) {
                groupRef.current.position.y = MIN_RACK_Y; // Fix 5: Hard clamp
            }
        } else {
            // Prevent bench penetration for empty holder
            if (pos.y < BENCH_TOP + 0.015) {
                groupRef.current.position.y = BENCH_TOP + 0.015;
            }

            // Side repulsion from rack
            const APPROACH_X = pos.x > RACK_X_MIN - 0.1 && pos.x < RACK_X_MAX + 0.1;
            const APPROACH_Z = pos.z > RACK_Z_MIN - 0.1 && pos.z < RACK_Z_MAX + 0.1;
            if (APPROACH_X && APPROACH_Z && pos.y < MIN_RACK_Y) {
                 const distL = Math.abs(pos.x - (RACK_X_MIN - 0.1));
                 const distR = Math.abs(pos.x - (RACK_X_MAX + 0.1));
                 const distF = Math.abs(pos.z - (RACK_Z_MAX + 0.1));
                 const distB = Math.abs(pos.z - (RACK_Z_MIN - 0.1));
                 const minDist = Math.min(distL, distR, distF, distB);
                 if (minDist === distL) pos.x = RACK_X_MIN - 0.1;
                 else if (minDist === distR) pos.x = RACK_X_MAX + 0.1;
                 else if (minDist === distF) pos.z = RACK_Z_MAX + 0.1;
                 else pos.z = RACK_Z_MIN - 0.1;
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
