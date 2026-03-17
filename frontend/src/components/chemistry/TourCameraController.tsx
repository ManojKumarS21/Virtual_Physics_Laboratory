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

    // Update target positions based on focus
    useEffect(() => {
        if (!isActive) {
            targetPos.current.copy(DEFAULT_POS);
            targetLookAt.current.copy(DEFAULT_TARGET);
            return;
        }

        if (cameraFocusId) {
            const apparatus = state.apparatus[cameraFocusId];
            const tube = state.testTubes.find((t) => t.id === cameraFocusId);
            
            let focusPos = new THREE.Vector3();
            if (apparatus) {
                focusPos.set(...apparatus.position);
            } else if (tube) {
                focusPos.set(...tube.position);
            } else {
                // fallback to default if ID not found
                targetPos.current.copy(DEFAULT_POS);
                targetLookAt.current.copy(DEFAULT_TARGET);
                return;
            }

            // Calculate a good zoom position
            // We want to be closer and slightly above
            targetLookAt.current.copy(focusPos);
            targetLookAt.current.y += 0.15; // Focus slightly above base

            const offset = new THREE.Vector3(0, 0.6, 1.2); // Closer zoom offset
            targetPos.current.copy(focusPos).add(offset);
        } else {
            // General tour overview if no specific focus
            targetPos.current.copy(DEFAULT_POS);
            targetLookAt.current.copy(DEFAULT_TARGET);
        }
    }, [isActive, cameraFocusId, state.apparatus, state.testTubes]);

    useFrame((_, delta) => {
        if (!isActive) return;

        const lerpFactor = 6.5 * delta; // Smoother but responsive

        // 1. Smoothly lerp camera position
        camera.position.lerp(targetPos.current, lerpFactor);

        // 2. Direct lookAt ( lerped target)
        currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
        camera.lookAt(currentLookAt.current);
    });

    return null;
};
