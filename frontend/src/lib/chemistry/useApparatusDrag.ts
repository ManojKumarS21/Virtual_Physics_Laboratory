import { useCallback, useRef, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLabState } from "./LabContext";

const BENCH_TOP = 0.78;
const MIN_X = -2.7;
const MAX_X = 2.7;
const MIN_Z = -1.0;
const MAX_Z = 0.95;

const SURFACES = [
    { id: "top_shelf", y: 1.68, xMin: -2.5, xMax: 2.5, zMin: -1.0, zMax: -0.5 },
    { id: "mid_shelf", y: 1.08, xMin: -2.5, xMax: 2.5, zMin: -1.0, zMax: -0.5 },
    { id: "rack_top", y: 1.06, xMin: 0.95, xMax: 2.45, zMin: -0.25, zMax: 0.25 }, // Stand upper plate
    { id: "rack_base", y: 0.83, xMin: 0.95, xMax: 2.45, zMin: -0.25, zMax: 0.25 }, // Stand lower plate
    { id: "bench", y: BENCH_TOP, xMin: MIN_X, xMax: MAX_X, zMin: MIN_Z, zMax: MAX_Z }
];

const getSurfaceUnder = (ray: THREE.Ray, targetId?: string) => {
    const plane = new THREE.Plane();
    const point = new THREE.Vector3();

    const isTube = targetId?.startsWith("tt");

    for (let i = 0; i < SURFACES.length; i++) {
        const s = SURFACES[i];

        if (isTube && s.id === "rack_top") continue;
        if (!isTube && s.id === "rack_base") continue;

        plane.setComponents(0, 1, 0, -s.y);

        if (!ray.intersectPlane(plane, point)) continue;

        if (
            point.x >= s.xMin &&
            point.x <= s.xMax &&
            point.z >= s.zMin &&
            point.z <= s.zMax
        ) {
            return {
                y: s.y,
                point: point.clone(),
                surfaceId: s.id
            };
        }
    }

    return {
        y: BENCH_TOP,
        point: point.set(0, BENCH_TOP, 0),
        surfaceId: "bench"
    };
};

const MOVE_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BENCH_TOP);
const INTERSECT_VEC = new THREE.Vector3();

// ── Snap targets ─────────────────────────────────────────────────────────────
const RACK_X = 1.7;
const RACK_Z = 0.0;
const RACK_Y = 0.83; // Base of the rack (surface)
const RACK_SLOTS = [1.08, 1.33, 1.58, 1.82, 2.07, 2.32];

const BURNER_X = 0.4;
const BURNER_Z = -0.35;
const BURNER_HEAT_RADIUS = 0.4;
const BURNER_HEAT_Y = 1.12;
const SNAP_THRESHOLD = 0.12;

interface DragOptions {
    id: string;
    groupRef: React.RefObject<THREE.Group>;
    yOffset?: number;
    liftHeight?: number;
    allowFreeLift?: boolean;
    defaultPos?: [number, number, number];
    onSnapDrop?: (id: string, newPos: [number, number, number]) => void;
}

export function useApparatusDrag({ id, groupRef, yOffset = 0, liftHeight = 0.05, allowFreeLift = false, defaultPos, onSnapDrop }: DragOptions) {
    const { state, setApparatusPosition, setDragging, endDragging, pourChemical, setTubeHeating, togglePickup, pickDropper, releaseDropper, stirTube, setHolder, attachHolder, setSnapTarget } = useLabState();
    const { gl } = useThree();

    const [hovered, setHovered] = useState(false);
    const [isActuallyDragging, setIsActuallyDragging] = useState(false);

    const draggingRef = useRef(false);
    const dragStarted = useRef(false);
    const startPoint = useRef(new THREE.Vector3());
    const targetPos = useRef<THREE.Vector3 | null>(null);
    const currentPos = useRef(new THREE.Vector3());
    const grabOffset = useRef(new THREE.Vector3());
    const dragPlane = useRef(new THREE.Plane());

    const hoverStartTime = useRef<number | null>(null);
    const lastBestX = useRef<number | null>(null);

    const apparatus = state.apparatus?.[id];
    const initialPos = apparatus?.position || defaultPos || [0, 0, 0];

    // Observe state position and animate towards it if not dragging
    useEffect(() => {
        if (!groupRef.current || !initialPos) return;
        if (draggingRef.current) return; // Don't fight manual dragging

        const newTarget = new THREE.Vector3(...initialPos);
        const dist = currentPos.current.distanceTo(newTarget);

        if (dist > 0.001) {
            // Check for huge jumps (e.g., reset or teleport to home)
            if (dist > 5) {
                currentPos.current.copy(newTarget);
                groupRef.current.position.copy(newTarget);
                targetPos.current = null;
            } else {
                // Smoothly lerp towards the new state position
                targetPos.current = newTarget;
            }
        }
    }, [id, initialPos]); // Triggers when state position array ref changes

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        if (targetPos.current) {
            const isTourActive = state.tourState.isActive;
            const lerpFactor = draggingRef.current
                ? 0.45   // smoother motion
                : isTourActive ? 0.95 : 0.15;  // near-instant sync during tour, smooth settle otherwise

            currentPos.current.lerp(targetPos.current, lerpFactor);
            groupRef.current.position.copy(currentPos.current);

            const dist = currentPos.current.distanceTo(targetPos.current);
            if (dist < 0.0005) {
                targetPos.current = null;
            }
        }
    });

    const onPointerDown = useCallback((e: any) => {
        e.stopPropagation();

        // Prevent accidental double drag
        if (draggingRef.current) return;

        // Prevent dragging if something else is already being dragged
        if (state.draggingId && state.draggingId !== id) return;

        if (apparatus && !apparatus.draggable) return;

        // Only allow if ray actually hit the apparatus group
        if (!groupRef.current) return;

        e.target.setPointerCapture(e.pointerId);
        draggingRef.current = true;
        dragStarted.current = false;
        startPoint.current.copy(e.point);
        hoverStartTime.current = null;
        lastBestX.current = null;

        setDragging(id);
        if (id.startsWith("tt")) togglePickup(id, true);
        gl.domElement.style.cursor = "grabbing";

        // Requirement: Real-time responsiveness (Zero delay hint)
        setIsActuallyDragging(true);
        dragStarted.current = true; // Skip move threshold entirely

        // CRITICAL FIX: Sync internal tracker with actual mesh position at start of drag
        if (groupRef.current) {
            currentPos.current.copy(groupRef.current.position);
        }
        targetPos.current = null; // Clear any active settle animations

        const p = groupRef.current?.position || currentPos.current;
        
        // LOCK drag plane height
        dragPlane.current.set(new THREE.Vector3(0, 1, 0), -p.y);
        const hit = new THREE.Vector3();

        if (e.ray.intersectPlane(dragPlane.current, hit)) {
            grabOffset.current.copy(hit).sub(p);
        } else {
            grabOffset.current.set(0, 0, 0);
        }

        const currentHolder = state.apparatus[id]?.holder;
        if (currentHolder === "retortStand") {
            setApparatusPosition(id, p.toArray() as [number, number, number]);
            setHolder(id, null);
        }

    }, [id, apparatus, gl, togglePickup, setDragging, state, setApparatusPosition, setHolder, groupRef]);

    const onPointerMove = useCallback((e: any) => {
        e.stopPropagation();
        if (!draggingRef.current || !e.ray) return;
        if (state.draggingId !== id) return;

        if (!dragStarted.current) {
            dragStarted.current = true;
            setIsActuallyDragging(true);
        }

        if (allowFreeLift) {
            let curY = groupRef.current?.position.y || BENCH_TOP;
            if (id === "holder" && state.holderAttachedId) {
                curY = Math.max(curY, BENCH_TOP + 0.25);
            }

            MOVE_PLANE.setComponents(0, 1, 0, -curY);
            if (e.ray.intersectPlane(MOVE_PLANE, INTERSECT_VEC)) {
                const px = Math.max(MIN_X, Math.min(MAX_X, INTERSECT_VEC.x - grabOffset.current.x));
                const pz = Math.max(MIN_Z, Math.min(MAX_Z, INTERSECT_VEC.z - grabOffset.current.z));
                targetPos.current = new THREE.Vector3(px, curY, pz);
            }
        } else {
            const plane = dragPlane.current;
            let rx = 0, rz = 0;

            if (e.ray.intersectPlane(plane, INTERSECT_VEC)) {
                rx = INTERSECT_VEC.x;
                rz = INTERSECT_VEC.z;
            } else if (e.ray.intersectPlane(MOVE_PLANE, INTERSECT_VEC)) {
                rx = INTERSECT_VEC.x;
                rz = INTERSECT_VEC.z;
            }

            const surfaceMatch = getSurfaceUnder(e.ray, id);
            const baseHeight = surfaceMatch ? surfaceMatch.y : BENCH_TOP;

            let lift = liftHeight;
            let finalY = baseHeight + yOffset + lift;

            let hoveredContainerPos: THREE.Vector3 | null = null;

            if (id === "holder") {
                const dxRack = rx - grabOffset.current.x - RACK_X;
                const dzRack = rz - grabOffset.current.z - RACK_Z;
                const distRackSq = dxRack * dxRack + dzRack * dzRack;

                // 1. Magnetic Attraction to Tubes (Requirement 1)
                if (!state.holderAttachedId) {
                    for (const tube of state.testTubes) {
                        const tubeNeckY = tube.position[1] + 0.22;
                        const dx = rx - grabOffset.current.x - tube.position[0];
                        const dz = rz - grabOffset.current.z - tube.position[2];
                        const dist = Math.sqrt(dx * dx + dz * dz);

                        if (dist < 0.18) {
                            const weight = Math.max(0, 1 - dist / 0.18);
                            // Magnetic pull to tube center
                            const targetX = THREE.MathUtils.lerp(rx - grabOffset.current.x, tube.position[0], weight * 0.5);
                            const targetZ = THREE.MathUtils.lerp(rz - grabOffset.current.z, tube.position[2], weight * 0.5);
                            const targetY = THREE.MathUtils.lerp(finalY, tubeNeckY + yOffset, weight * 0.5);

                            hoveredContainerPos = new THREE.Vector3(targetX, targetY, targetZ);
                            break;
                        }
                    }
                }

                if (distRackSq < 0.36 && !hoveredContainerPos) {
                    const distRack = Math.sqrt(distRackSq);
                    const alignmentLevel = 1.05 + yOffset;
                    finalY = Math.max(finalY, 1.06 + yOffset);

                    if (!state.holderAttachedId) {
                        const weight = Math.max(0, 1 - distRack / 0.5);
                        finalY = THREE.MathUtils.lerp(finalY, alignmentLevel, weight);
                    } else {
                        finalY = Math.max(finalY, alignmentLevel);
                    }
                }

                // Requirement 1: Holder always above rack
                const RACK_TOP_Y = 1.06;
                finalY = Math.max(finalY, RACK_TOP_Y + yOffset);
            }

            if (id === "holder" && state.holderAttachedId) {
                const rx_h = rx - grabOffset.current.x;
                const rz_h = rz - grabOffset.current.z;

                // If over the rack area, we allow the "floor" for the tube to be the rack base (holes)
                // instead of the rack top surface.
                const isOverRack = rx_h > 0.95 && rx_h < 2.45 && rz_h > -0.25 && rz_h < 0.25;
                const tubeFloor = isOverRack ? RACK_Y : baseHeight;
                finalY = Math.max(finalY, tubeFloor + 0.22 + yOffset);
            }

            // Snapping to bottles/tubes while dragging
            if (id === "dropper") {
                const tipOffset = 0.1;
                const currentMeshY = groupRef.current?.position.y || finalY;
                const currentTipY = currentMeshY - tipOffset;

                // Priority 1: Reagent Bottle
                for (const bId in state.apparatus) {
                    if (bId.startsWith("bot_")) {
                        const bot = state.apparatus[bId];
                        const dx = rx - grabOffset.current.x - bot.position[0];
                        const dz = rz - grabOffset.current.z - bot.position[2];
                        const dist = Math.sqrt(dx * dx + dz * dz);

                        const bottleSnapRadius = 0.03; // Strict lock
                        if (dist < 0.18) { // Hover detection
                            const openingY = bot.position[1] + 0.28;
                            if (currentTipY < openingY - 0.02) break;

                            const restY = openingY + 0.02;
                            const deepMatch = e.ray.intersectPlane(MOVE_PLANE, INTERSECT_VEC);
                            let targetTipY = deepMatch ? INTERSECT_VEC.y : finalY - tipOffset;
                            targetTipY = Math.max(openingY - 0.05, Math.min(restY + 0.3, targetTipY));

                            // Magnetic Locking
                            let finalX = rx - grabOffset.current.x;
                            let finalZ = rz - grabOffset.current.z;
                            if (dist < bottleSnapRadius) {
                                finalX = bot.position[0];
                                finalZ = bot.position[2];
                                setSnapTarget({ type: "bottle", id: bId });
                            } else {
                                setSnapTarget(null);
                            }

                            hoveredContainerPos = new THREE.Vector3(finalX, targetTipY + tipOffset + yOffset, finalZ);
                            break;
                        }
                    }
                }

                // Priority 2: Test Tube
                if (!hoveredContainerPos) {
                    for (const tube of state.testTubes) {
                        const dx = rx - grabOffset.current.x - tube.position[0];
                        const dz = rz - grabOffset.current.z - tube.position[2];
                        const dist = Math.sqrt(dx * dx + dz * dz);

                        const tubeSnapRadius = 0.03; // Strict lock
                        if (dist < 0.12) {
                            const openingY = tube.position[1] + 0.252;
                            if (currentTipY < openingY - 0.02) continue;

                            const maxDepth = (0.55 * 0.45) * 0.5;
                            const minTipY = openingY - maxDepth;
                            const restTipY = openingY + 0.02;

                            const deepMatch = e.ray.intersectPlane(MOVE_PLANE, INTERSECT_VEC);
                            let targetTipY = deepMatch ? INTERSECT_VEC.y : finalY - tipOffset;
                            targetTipY = Math.max(minTipY, Math.min(restTipY + 0.3, targetTipY));

                            // Magnetic Locking
                            let finalX = rx - grabOffset.current.x;
                            let finalZ = rz - grabOffset.current.z;
                            if (dist < tubeSnapRadius) {
                                finalX = tube.position[0];
                                finalZ = tube.position[2];
                                setSnapTarget({ type: "tube", id: tube.id });
                            } else {
                                setSnapTarget(null);
                            }

                            hoveredContainerPos = new THREE.Vector3(finalX, targetTipY + tipOffset + yOffset, finalZ);
                            break;
                        }
                    }
                }
            } else if (id === "washBottle") {
                const nozzleZ = 0.08;
                const rx_tip = rx - grabOffset.current.x;
                const rz_tip = rz - grabOffset.current.z + nozzleZ;

                for (const tube of state.testTubes) {
                    const dx = rx_tip - tube.position[0];
                    const dz = rz_tip - tube.position[2];
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const openingY = tube.position[1] + 0.252;

                    if (dist < 0.2) {
                        finalY = Math.max(finalY, openingY + 0.02 + yOffset);
                    }

                    if (dist < 0.12) {
                        hoveredContainerPos = new THREE.Vector3(tube.position[0], openingY + 0.08 + yOffset, tube.position[2] - nozzleZ);
                        break;
                    }
                }
            }

            if (hoveredContainerPos) {
                targetPos.current = hoveredContainerPos;
            } else {
                const px = Math.max(MIN_X, Math.min(MAX_X, rx - grabOffset.current.x));
                const pz = Math.max(MIN_Z, Math.min(MAX_Z, rz - grabOffset.current.z));
                targetPos.current = new THREE.Vector3(px, finalY, pz);
            }
        }

        const isTube = apparatus?.type === "tube";
        const isBottle = apparatus?.type === "bottle";
        const isHolderAttached = id === "holder" && state.holderAttachedId;

        if (isBottle && targetPos.current) {
            const isNearShelfArea = targetPos.current.z < -0.6;
            if (isNearShelfArea) {
                const shelfY = targetPos.current.y > 1.38 ? 1.68 : 1.08;
                const shelfZ = -0.8;
                const snapX = Math.round(targetPos.current.x / 0.4) * 0.4;
                const clampedSnapX = Math.max(-2.2, Math.min(2.2, snapX));
                const dx = targetPos.current.x - clampedSnapX;
                const dz = targetPos.current.z - shelfZ;
                const distToSlot = Math.sqrt(dx * dx + dz * dz);

                if (distToSlot < 0.15) {
                    const isOccupied = Object.values(state.apparatus).some(a =>
                        a.id !== id && a.type === "bottle" &&
                        Math.abs(a.position[0] - clampedSnapX) < 0.1 && a.position[2] === shelfZ && a.position[1] === shelfY
                    );
                    if (!isOccupied) {
                        const weight = Math.max(0, 1 - distToSlot / 0.15);
                        targetPos.current.x = THREE.MathUtils.lerp(targetPos.current.x, clampedSnapX, weight);
                        targetPos.current.z = THREE.MathUtils.lerp(targetPos.current.z, shelfZ, weight);
                        targetPos.current.y = shelfY + yOffset;
                    }
                }
            }
        }

        if ((isTube || isHolderAttached) && targetPos.current) {
            const dxRack = targetPos.current.x - RACK_X;
            const dzRack = targetPos.current.z - RACK_Z;
            const distRack = Math.sqrt(dxRack * dxRack + dzRack * dzRack);

            if (distRack < 0.6) {
                let bestX = RACK_SLOTS[0];
                let minDistX = 999;
                RACK_SLOTS.forEach(sx => {
                    const d = Math.abs(targetPos.current!.x - sx);
                    if (d < minDistX) { minDistX = d; bestX = sx; }
                });

                const STRICT_SNAP_RADIUS = 0.035; // Requirement 2
                const HOVER_DELAY = 150; // 0.15s in ms (Requirement 3)

                if (minDistX < STRICT_SNAP_RADIUS) {
                    const now = performance.now();
                    if (lastBestX.current !== bestX) {
                        lastBestX.current = bestX;
                        hoverStartTime.current = now;
                    }

                    if (now - (hoverStartTime.current || 0) > HOVER_DELAY) {
                        const activeTubeId = isTube ? id : state.holderAttachedId;
                        const isOccupied = state.testTubes.some(t =>
                            t.id !== activeTubeId && t.position[0] === bestX && t.position[2] === RACK_Z
                        );

                        if (!isOccupied) {
                            targetPos.current.x = bestX;
                            targetPos.current.z = RACK_Z;
                            targetPos.current.y = (isTube ? RACK_Y : 1.05) + yOffset;
                            setSnapTarget({ type: "rack", index: RACK_SLOTS.indexOf(bestX) });
                        }
                    }
                } else {
                    hoverStartTime.current = null;
                    lastBestX.current = null;
                    // If we were showing a rack snap target, clear it
                    if (state.activeSnapTarget?.type === "rack") setSnapTarget(null);
                }
            }

            // --- RETORT STAND SNAPPING ---
            const retortStand = state.apparatus["retortStand"];
            if (retortStand) {
                const rsX = retortStand.position[0];
                const rsY = retortStand.position[1];
                const rsZ = retortStand.position[2];

                // Clamp coordinates
                const clampX = rsX;
                const clampY = rsY + 0.225;
                const clampZ = rsZ + 0.14;

                const dxRS = targetPos.current.x - clampX;
                const dzRS = targetPos.current.z - clampZ;
                const distRS = Math.sqrt(dxRS * dxRS + dzRS * dzRS);

                // OCCUPANCY CHECK
                const attachedTubeId = Object.keys(state.apparatus).find(k => state.apparatus[k].holder === "retortStand");
                const activeTubeId = isTube ? id : state.holderAttachedId;
                const isOccupied = !!attachedTubeId && attachedTubeId !== activeTubeId;

                // 0.12m snap threshold
                if (distRS < 0.15 && !isOccupied) {
                    const weight = Math.max(0, 1 - distRS / 0.15);
                    const snapPos = new THREE.Vector3(clampX, clampY + yOffset, clampZ);
                    if (isHolderAttached) snapPos.y += 0.22;

                    targetPos.current.lerp(snapPos, weight * 0.8);

                    // LOCK on extreme proximity (under 3cm)
                    if (distRS < 0.03) {
                        targetPos.current.copy(snapPos);

                        if (isTube) {
                            setHolder(id, "retortStand");
                        } else if (isHolderAttached) {
                            // Placing tube with holder -> release holder, lock in stand
                            const tubeToLock = state.holderAttachedId!;
                            attachHolder(null);
                            setHolder(tubeToLock, "retortStand");
                            setApparatusPosition(tubeToLock, [clampX, clampY, clampZ]);
                        }
                    }
                }

                // HOLDER PICKUP from stand
                if (id === "holder" && !state.holderAttachedId && attachedTubeId) {
                    const tubePos = state.apparatus[attachedTubeId].position;
                    // Proximity check between holder "rim" position and tube neck
                    // Holder rim = currentPos - 0.22
                    const holderRimY = targetPos.current.y - 0.22;
                    const dyRim = Math.abs(holderRimY - (clampY + 0.22)); // Tube neck is around 0.22 above clamp center

                    if (distRS < 0.1 && dyRim < 0.05) {
                        attachHolder(attachedTubeId);
                        setHolder(attachedTubeId, null);
                    }
                }
            }
        }
    }, [id, state, yOffset, liftHeight, allowFreeLift, setHolder, attachHolder, setSnapTarget, setApparatusPosition, groupRef]);

    const onPointerUp = useCallback((e: any) => {
        e.stopPropagation();
        if (!draggingRef.current) return;
        if (state.draggingId && state.draggingId !== id) return;

        if (e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }

        const wasDragged = dragStarted.current;
        draggingRef.current = false;
        dragStarted.current = false;
        setIsActuallyDragging(false);

        gl.domElement.style.cursor = hovered ? "grab" : "default";

        // IMPORTANT: We MUST clear the dragging state even if no threshold was met,
        // otherwise OrbitControls will remain disabled.
        endDragging(id);

        if (!wasDragged) {
            if (id.startsWith("tt")) togglePickup(id, false);
            return;
        }

        // Capture 'EXACT' dropped position from Mesh to prevent jumping
        // Use the actual MESH position as the source of truth, as it may have been moved by external logic.
        const meshPos = groupRef.current.position;
        let dropX = meshPos.x;
        let dropY = meshPos.y - (isActuallyDragging ? liftHeight : 0);
        let dropZ = meshPos.z;

        // Final Surface Clamp (Safety)
        if (e.ray && !allowFreeLift) {
            const surfaceMatch = getSurfaceUnder(e.ray, id);
            if (surfaceMatch) {
                // For non-bottles on non-shelves, use the detected surface Y
                if (dropZ > -0.5) {
                    dropY = surfaceMatch.y + yOffset;
                }
            }
        }

        // HOLDER SAFETY: Ensure tubes in holder don't sink into bench
        if (id === "holder" && state.holderAttachedId) {
            const dropSurface = e.ray ? getSurfaceUnder(e.ray) : null;
            const rx_h = dropX;
            const rz_h = dropZ;
            const isOverRack = rx_h > 0.95 && rx_h < 2.45 && rz_h > -0.25 && rz_h < 0.25;
            const sLevel = isOverRack ? RACK_Y : (dropSurface ? dropSurface.y : BENCH_TOP);
            dropY = Math.max(dropY, sLevel + 0.22 + yOffset);
        }

        let dropPos = new THREE.Vector3(
            Math.max(MIN_X, Math.min(MAX_X, dropX)),
            dropY,
            Math.max(MIN_Z, Math.min(MAX_Z, dropZ))
        );

        // 1. Final snapping on release
        const isTube = apparatus?.type === "tube";
        const isBottle = apparatus?.type === "bottle";

        if (isTube) {
            const distToRack = Math.sqrt(Math.pow(dropPos.x - RACK_X, 2) + Math.pow(dropPos.z - RACK_Z, 2));
            if (distToRack < 0.6) {
                let bestX = RACK_SLOTS[0];
                let minDist = 999;
                RACK_SLOTS.forEach(slotX => {
                    const d = Math.abs(dropPos.x - slotX);
                    if (d < minDist) { minDist = d; bestX = slotX; }
                });

                if (minDist < SNAP_THRESHOLD) {
                    const isOccupied = state.testTubes.some(t =>
                        t.id !== id &&
                        Math.abs(t.position[0] - bestX) < 0.05 &&
                        Math.abs(t.position[2] - RACK_Z) < 0.05
                    );
                    if (!isOccupied) {
                        // FIX: Explicitly set height to RACK_Y to prevent "drop-pulse" sinking
                        dropPos.set(bestX, RACK_Y + yOffset, RACK_Z);
                    }
                }
            }
        }

        // 2. Bottle shelf snapping
        if (isBottle && dropPos.z < -0.5) {
            const snapX = Math.round(dropPos.x / 0.4) * 0.4;
            const clampedSnapX = Math.max(-2.2, Math.min(2.2, snapX));
            if (Math.abs(dropPos.x - clampedSnapX) < 0.15) {
                dropPos.x = clampedSnapX;
                dropPos.z = -0.8;
                dropPos.y = (dropPos.y > 1.38 ? 1.68 : 1.08) + yOffset;
            }
        }

        const finalPosArr: [number, number, number] = [dropPos.x, dropPos.y, dropPos.z];

        // Update global state
        setApparatusPosition(id, finalPosArr);

        if (apparatus?.type === "tube") {
            togglePickup(id, false);
            setTubeHeating(id, false);
        }

        gl.domElement.style.cursor = hovered ? "grab" : "default";

        // Interaction triggers moved to manual controls in components (Dropper.tsx)
        if (id === "glassRod") {
            for (const tube of state.testTubes) {
                if (dropPos.distanceTo(new THREE.Vector3(tube.position[0], tube.position[1], tube.position[2])) < 0.15) {
                    stirTube(tube.id, true);
                    setTimeout(() => stirTube(tube.id, false), 1500);
                    break;
                }
            }
        }

        // Final settle animation
        if (onSnapDrop) {
            onSnapDrop(id, finalPosArr);
        } else {
            targetPos.current = dropPos;
        }

        gl.domElement.style.cursor = "default";
        draggingRef.current = false;
        dragStarted.current = false;
        setIsActuallyDragging(false);
    }, [id, state, gl, hovered, allowFreeLift, yOffset, liftHeight, onSnapDrop, setApparatusPosition, togglePickup, setTubeHeating, pickDropper, stirTube, endDragging, apparatus, groupRef, isActuallyDragging]);

    const onPointerEnter = useCallback((e: any) => {
        e.stopPropagation();
        if (apparatus && !apparatus.draggable) return;
        setHovered(true);
        if (!draggingRef.current) gl.domElement.style.cursor = "grab";
    }, [apparatus, gl]);

    const onPointerLeave = useCallback((e: any) => {
        e.stopPropagation();
        if (apparatus && !apparatus.draggable) return;
        setHovered(false);
        if (!draggingRef.current) gl.domElement.style.cursor = "default";
    }, [apparatus, gl]);

    return {
        dragProps: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerEnter,
            onPointerLeave
        },
        isDragging: isActuallyDragging,
        isHovered: hovered
    };
}
