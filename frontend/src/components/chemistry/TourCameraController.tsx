"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useLabState } from "@/lib/chemistry/LabContext";

// Default camera state
const DEFAULT_POS = new THREE.Vector3(0, 2.1, 4.2);
const DEFAULT_TARGET = new THREE.Vector3(0, 1.1, 0);

export const TourCameraController = () => {
    const { state } = useLabState();
    const { camera, controls } = useThree();
    const { tourState } = state;
    const { isActive, cameraFocusId } = tourState;

    const targetPos = useRef(DEFAULT_POS.clone());
    const targetLookAt = useRef(DEFAULT_TARGET.clone());
    const currentLookAt = useRef(DEFAULT_TARGET.clone());
    const isTransitioning = useRef(false);

    useFrame((_, delta) => {
        if (!isActive) return;

        // 1. Calculate target positions (Moved from useEffect to ensure frame-sync)
        if (cameraFocusId) {
            const apparatus = state.apparatus[cameraFocusId];
            const tube = state.testTubes.find((t) => t.id === cameraFocusId);
            
            let focusPos = new THREE.Vector3();
            if (apparatus) {
                focusPos.set(...apparatus.position);
            } else if (tube) {
                focusPos.set(...tube.position);
            }

            if (focusPos.length() > 0 || cameraFocusId === "tt1") { // valid target
                targetLookAt.current.copy(focusPos);
                targetLookAt.current.y += 0.15; 
                const offset = new THREE.Vector3(0, 0.6, 1.2); 
                targetPos.current.copy(focusPos).add(offset);
            }
        } else {
            targetPos.current.copy(DEFAULT_POS);
            targetLookAt.current.copy(DEFAULT_TARGET);
        }

        const lerpFactor = 6.5 * delta;

        // 2. Smoothly lerp camera position
        camera.position.lerp(targetPos.current, lerpFactor);

        // 3. Direct lookAt (lerped target)
        currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
        camera.lookAt(currentLookAt.current);
    });

    return null;
};
