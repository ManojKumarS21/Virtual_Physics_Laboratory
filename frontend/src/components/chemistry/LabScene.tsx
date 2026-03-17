"use client";

import React, { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    PerspectiveCamera,
    Environment,
    ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { Workbench } from "./Workbench";
import { BunsenBurner } from "./BunsenBurner";
import { TestTubeRack, TestTube } from "./TestTube";
import { ReagentBottle } from "./ReagentBottle";
import { Beaker3D } from "./Beaker3D";
import { Flask3D } from "./Flask3D";
import { GlassRod } from "./GlassRod";
import { Dropper } from "./Dropper";
import { SaltSample } from "./SaltSample";
import { Funnel } from "./Funnel";
import { RoomEnvironment } from "./RoomEnvironment";
import { MeasuringCylinder } from "./MeasuringCylinder";
import { Spatula } from "./Spatula";
import { TestTubeHolder } from "./TestTubeHolder";
import { FilterPaper } from "./FilterPaper";
import { Candle } from "./Candle";
import { RetortStand } from "./RetortStand";
import { WashBottle } from "./WashBottle";
import { DEFAULT_APPARATUS_LAYOUT } from "@/lib/chemistry/apparatusLayout";
import { ChemicalId } from "@/lib/chemistry/engine";
import { useLabState } from "@/lib/chemistry/LabContext";
import GuidedTour from "./GuidedTour";
import { HighlightWrapper } from "./HighlightWrapper";
import { TourCameraController } from "./TourCameraController";
import { VirtualHand } from "./VirtualHand";

const BENCH_TOP = 0.78;

export const LabScene = () => {
    const { state } = useLabState();
    const isDragging = state.draggingId !== null;

    // Prevent global browser context menu
    useEffect(() => {
        const disableMenu = (e: any) => e.preventDefault();
        window.addEventListener("contextmenu", disableMenu);
        return () => window.removeEventListener("contextmenu", disableMenu);
    }, []);

    return (
        <div className="w-full h-full" style={{ background: "transparent" }}>
            <Canvas
                shadows
                onContextMenu={(e) => e.nativeEvent?.preventDefault?.()}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    outputColorSpace: THREE.SRGBColorSpace,
                }}
                onCreated={({ gl, scene }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 0.147; // increased by 5%
                    gl.shadowMap.type = THREE.PCFShadowMap;
                    scene.background = new THREE.Color("#0b0f1a");
                }}
                dpr={[1, 2]}
                style={{ width: "100%", height: "100%", imageRendering: "auto" }}
            >
                <color attach="background" args={["#0b0f1a"]} />
                <PerspectiveCamera
                    makeDefault
                    position={[0, 2.1, 4.2]}
                    fov={55}
                    near={0.1}
                    far={100}
                />
                <OrbitControls
                    makeDefault
                    enablePan
                    enableZoom
                    enableRotate
                    minPolarAngle={Math.PI / 2.8}
                    maxPolarAngle={Math.PI / 2.05}
                    minDistance={1.8}
                    maxDistance={4.0}
                    target={[0, 1.1, 0]}
                    dampingFactor={0.07}
                    enableDamping
                    enabled={!isDragging && !state.tourState.isActive}
                />
                <TourCameraController />
                <VirtualHand />

                <ambientLight intensity={0.095} color="#dbe6ea" />

                <directionalLight
                    position={[5, 8, 5]}
                    intensity={0.074}
                    color="#f5f0e6"
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                    shadow-bias={-0.001}
                />

                {/* Point light over workbench removed entirely */}

                <Suspense fallback={null}>
                    <Environment preset="studio" background={false} />
                    <RoomEnvironment />
                    <ContactShadows
                        position={[0, BENCH_TOP + 0.001, 0]}
                        scale={20}
                        blur={2.5}
                        far={0.5}
                        opacity={0.7}
                        color="#080808"
                    />
                    <ContactShadows
                        position={[0, 1.081, -0.8]}
                        scale={5}
                        blur={1.5}
                        far={0.3}
                        opacity={0.65}
                        color="#080808"
                    />
                    <ContactShadows
                        position={[0, 1.681, -0.8]}
                        scale={5}
                        blur={1.5}
                        far={0.3}
                        opacity={0.65}
                        color="#080808"
                    />
                    <Workbench />

                    {/* All state-managed apparatus */}
                    {Object.values(state.apparatus).map((item) => {
                        const { id, type } = item;
                        if (type === "bottle") {
                            return (
                                <HighlightWrapper key={id} id={id} type="bottle">
                                    <ReagentBottle
                                        chemicalId={id.replace("bot_", "") as ChemicalId}
                                    />
                                </HighlightWrapper>
                            );
                        }
                        if (id.startsWith("tt")) {
                            return (
                                <HighlightWrapper key={id} id={id} type="tube">
                                    <TestTube tubeId={id} />
                                </HighlightWrapper>
                            );
                        }
                        
                        // Map other types to their components
                        const component = (() => {
                            switch (type) {
                                case "cylinder": return <MeasuringCylinder />;
                                case "flask": return <Flask3D />;
                                case "beaker": return <Beaker3D />;
                                case "rod": return <GlassRod />;
                                case "salt": return <SaltSample id={id} />;
                                case "burner": return <BunsenBurner />;
                                case "dropper": return <Dropper />;
                                case "funnel": return <Funnel />;
                                case "spatula": return <Spatula />;
                                case "holder": return <TestTubeHolder />;
                                case "rack": return <TestTubeRack />;
                                case "paper": return <FilterPaper />;
                                case "candle": return <Candle />;
                                case "stand": return <RetortStand />;
                                case "washBottle": return <WashBottle />;
                                default: return null;
                            }
                        })();

                        if (!component) return null;

                        return (
                            <HighlightWrapper key={id} id={id}>
                                {component}
                            </HighlightWrapper>
                        );
                    })}
                </Suspense>
            </Canvas>
            <GuidedTour />
        </div>
    );
};
