'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, useTexture } from '@react-three/drei';
import Table from './Table';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useLabStore } from '../hooks/useLabStore';
import InstrumentContainer from '../components/instruments/InstrumentContainer';
import Battery from '../components/instruments/Battery';
import Galvanometer from '../components/instruments/Galvanometer';
import ResistanceBox from '../components/instruments/ResistanceBox';
import MeterBridge from '../components/instruments/MeterBridge';
import PlugKey from '../components/instruments/PlugKey';
import Jockey from '../components/instruments/Jockey';
import Wire from '../components/wires/Wire';
import { Paper, Book, NoticeBoard } from './FurnitureProps';
import Chair from './Chair';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';

const COMPONENT_MAP: Record<string, React.FC<any>> = {
    battery: Battery,
    galvanometer: Galvanometer,
    resistance_box: ResistanceBox,
    meter_bridge: MeterBridge,
    plug_key: PlugKey,
    jockey: Jockey,
};

function PlacementGhost() {
    const { heldInstrument } = useLabStore();
    const { raycaster, mouse, camera } = useThree();
    const [pos, setPos] = useState<[number, number, number]>([0, 2.05, 0]);
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -2));
    const point = useRef(new THREE.Vector3());

    useFrame(() => {
        if (!heldInstrument) return;
        raycaster.ray.intersectPlane(plane.current, point.current);
        if (point.current) {
            setPos([point.current.x, 2.05, point.current.z]);
        }
    });

    if (!heldInstrument) return null;

    const InstrumentComponent = COMPONENT_MAP[heldInstrument.type];
    if (!InstrumentComponent) return null;

    return (
        <group position={pos} rotation={[0, 0, 0]}>
            <group>
                <InstrumentComponent id="ghost" isGhost />
            </group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
                <ringGeometry args={[0.5, 0.55, 32]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
            </mesh>
        </group>
    );
}

function ClassroomWindow({ position }: { position: [number, number, number] }) {
    return (
        <group position={position} rotation={[0, -Math.PI / 2, 0]}>
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[16, 12]} />
                <meshBasicMaterial color="#e0f2fe" />
            </mesh>
            <mesh position={[0, 6, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[16.8, 0.4, 0.3]} />
                <meshStandardMaterial color="#4a2a18" roughness={0.8} />
            </mesh>
            <mesh position={[0, -6, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[16.8, 0.4, 0.3]} />
                <meshStandardMaterial color="#4a2a18" roughness={0.8} />
            </mesh>
            <mesh position={[-8.2, 0, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 12, 0.3]} />
                <meshStandardMaterial color="#4a2a18" roughness={0.8} />
            </mesh>
            <mesh position={[8.2, 0, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 12, 0.3]} />
                <meshStandardMaterial color="#4a2a18" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 12, 0.3]} />
                <meshStandardMaterial color="#4a2a18" roughness={0.8} />
            </mesh>
            <group position={[-8, 0, 0.2]} rotation={[0, 1.2, 0]}>
                <mesh position={[4, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[8, 11.6, 0.1]} />
                    <meshStandardMaterial color="#5c3a21" roughness={0.7} />
                </mesh>
                <mesh position={[4, 0, 0.06]} castShadow receiveShadow>
                    <boxGeometry args={[7, 10.6, 0.12]} />
                    <meshBasicMaterial color="#bae6fd" transparent opacity={0.4} />
                </mesh>
            </group>
            <group position={[8, 0, 0.2]} rotation={[0, -1.2, 0]}>
                <mesh position={[-4, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[8, 11.6, 0.1]} />
                    <meshStandardMaterial color="#5c3a21" roughness={0.7} />
                </mesh>
                <mesh position={[-4, 0, 0.06]} castShadow receiveShadow>
                    <boxGeometry args={[7, 10.6, 0.12]} />
                    <meshBasicMaterial color="#bae6fd" transparent opacity={0.4} />
                </mesh>
            </group>
        </group>
    );
}

function CameraHandler({ onAnimationComplete }: { onAnimationComplete: () => void }) {
    const { camera } = useThree();
    const currentScreen = useLabStore(s => s.currentScreen);
    const isAnimatingRef = useRef(false);
    const lastScreenRef = useRef(currentScreen);
    
    const targets = {
        WELCOME: { pos: [0, 40, 60] },
        FRONT: { pos: [0, 15, 25] },
        TOUR: { pos: [0, 8, 12] },
        PRACTICE: { pos: [0, 8, 12] },
        WORKOUT: { pos: [0, 8, 12] }
    };

    useEffect(() => {
        if (currentScreen !== lastScreenRef.current) {
            isAnimatingRef.current = true;
            lastScreenRef.current = currentScreen;
        }
    }, [currentScreen]);

    useFrame((state, delta) => {
        if (!isAnimatingRef.current) return;

        const target = targets[currentScreen];
        const targetPos = new THREE.Vector3(...target.pos);
        
        camera.position.lerp(targetPos, delta * 2.5);
        
        if (camera.position.distanceTo(targetPos) < 0.1) {
            camera.position.copy(targetPos);
            isAnimatingRef.current = false;
            onAnimationComplete();
        }
    });

    return null;
}

export default function Scene() {
    const { placedInstruments, connections, isLocked, heldInstrument, currentScreen } = useLabStore();
    const [isCameraAnimating, setIsCameraAnimating] = useState(true);
    usePhysicsEngine();

    return (
        <div className="w-full h-full bg-[#fdfbf7]"> 
            <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
                <Suspense fallback={null}>
                    <Environment preset="apartment" />
                    <PerspectiveCamera makeDefault fov={45} />
                    <CameraHandler onAnimationComplete={() => setIsCameraAnimating(false)} />
                    <OrbitControls
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2.2}
                        minDistance={5}
                        maxDistance={25}
                        makeDefault
                        enabled={!isCameraAnimating && !isLocked && !heldInstrument && (currentScreen === 'PRACTICE' || currentScreen === 'TOUR' || currentScreen === 'WORKOUT')}
                    />

                    {/* Soft Indoor Ambient Lighting */}
                    <ambientLight intensity={0.5} />

                    {/* Daylight from 'Window' (Right Side) */}
                    <directionalLight
                        position={[20, 15, -5]}
                        intensity={1.2}
                        color="#fffbf0" // Warm daylight
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />

                    {/* Soft Fill Light from left to soften shadows */}
                    <pointLight position={[-15, 10, 5]} intensity={0.4} color="#e0f2fe" />

                    {/* --- CLASSROOM ARCHITECTURE --- */}

                    {/* 1. Floor (Light institutional tile) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} />
                        <meshStandardMaterial color="#d1d5db" roughness={0.9} />
                    </mesh>

                    {/* 2. Back Wall */}
                    <mesh position={[0, 15, -30]} receiveShadow>
                        <boxGeometry args={[60, 30, 0.5]} />
                        <meshStandardMaterial color="#fdfbf7" roughness={1} />
                    </mesh>

                    {/* 3. Left Wall */}
                    <mesh position={[-30, 15, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                        <boxGeometry args={[60, 30, 0.5]} />
                        <meshStandardMaterial color="#fdfbf7" roughness={1} />
                    </mesh>

                    {/* 4. Right Wall (With large physical Windows) */}
                    <mesh position={[30, 15, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                        <boxGeometry args={[60, 30, 0.5]} />
                        <meshStandardMaterial color="#fdfbf7" roughness={1} />
                    </mesh>

                    {/* Add Windows to Right Wall */}
                    <ClassroomWindow position={[29.7, 12, -12]} />
                    <ClassroomWindow position={[29.7, 12, 12]} />

                    {/* 5. Front Wall */}
                    <mesh position={[0, 15, 30]} receiveShadow>
                        <boxGeometry args={[60, 30, 0.5]} />
                        <meshStandardMaterial color="#fdfbf7" roughness={1} />
                    </mesh>

                    {/* --- CLASSROOM DETAILS --- */}

                    {/* Large Chalkboard on Back Wall */}
                    <group position={[0, 8, -29.7]}>
                        {/* Chalkboard Frame */}
                        <mesh position={[0, 0, 0]} castShadow>
                            <boxGeometry args={[24.2, 8.2, 0.1]} />
                            <meshStandardMaterial color="#3E2723" roughness={0.8} />
                        </mesh>
                        {/* Chalkboard Surface (Green) */}
                        <mesh position={[0, 0, 0.06]} receiveShadow>
                            <planeGeometry args={[24, 8]} />
                            <meshStandardMaterial color="#2d4a22" roughness={0.9} />
                        </mesh>
                        {/* Chalk Dust / Writing Simulation (Very subtle) */}
                        <mesh position={[0, 0, 0.07]}>
                            <planeGeometry args={[22, 7]} />
                            <meshBasicMaterial color="#ffffff" transparent opacity={0.03} />
                        </mesh>
                    </group>

                    {/* Educational Poster 1 (Left of chalkboard) */}
                    <group position={[-16, 8, -29.7]}>
                        {/* Poster Paper */}
                        <mesh position={[0, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[4, 5, 0.05]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.8} />
                        </mesh>
                        {/* Poster Header */}
                        <mesh position={[0, 2, 0.03]}>
                            <planeGeometry args={[3.2, 0.6]} />
                            <meshBasicMaterial color="#1e3a8a" />
                        </mesh>
                        {/* Poster Diagrams (Simulated text/images) */}
                        <mesh position={[0, -0.4, 0.03]}>
                            <planeGeometry args={[3.2, 3.2]} />
                            <meshBasicMaterial color="#e5e7eb" />
                        </mesh>
                    </group>

                    {/* Educational Poster 2 (Right of chalkboard) */}
                    <group position={[16, 7, -29.7]}>
                        <mesh position={[0, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[5, 4, 0.05]} />
                            <meshStandardMaterial color="#fef3c7" roughness={0.8} /> {/* Slightly yellowish vintage paper */}
                        </mesh>
                        <mesh position={[0, 0, 0.03]}>
                            <planeGeometry args={[4.2, 3.2]} />
                            <meshBasicMaterial color="#d1d5db" />
                        </mesh>
                    </group>

                    {/* Classroom Clock above chalkboard */}
                    <group position={[0, 14, -29.6]}>
                        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
                            <meshStandardMaterial color="#111827" />
                        </mesh>
                        <mesh position={[0, 0, 0.11]}>
                            <circleGeometry args={[1.4, 32]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <mesh position={[0, 0, 0.12]}>
                            <planeGeometry args={[0.15, 1.0]} />
                            <meshBasicMaterial color="#000000" />
                        </mesh>
                    </group>

                    {/* --- EXPERIMENT TABLE --- */}

                    <Table position={[0, 0, 0]} />

                    {/* --- SIDE FURNITURE --- */}
                    
                    {/* Left Side Table and Chair */}
                    <group position={[-15, 0, 5]}>
                        <Table position={[0, 0, 0]} />
                        <Chair position={[0, 0, 4]} rotation={[0, 0, 0]} />
                        <Book position={[-1, 2.1, 0]} rotation={[0, 0.5, 0]} color="#ef4444" />
                        <Paper position={[1, 2.06, 0.5]} rotation={[-Math.PI / 2, 0, 0.2]} />
                        <Paper position={[1.2, 2.06, -0.3]} rotation={[-Math.PI / 2, 0, -0.1]} />
                    </group>

                    {/* Right Side Table and Chair */}
                    <group position={[15, 0, 5]}>
                        <Table position={[0, 0, 0]} />
                        <Chair position={[0, 0, 4]} rotation={[0, 0, 0]} />
                        <Book position={[1, 2.1, -0.5]} rotation={[0, -0.3, 0]} color="#10b981" />
                        <Book position={[1, 2.2, -0.5]} rotation={[0, 0.1, 0]} color="#6366f1" />
                        <Paper position={[-1, 2.06, 0.2]} rotation={[-Math.PI / 2, 0, 0.5]} />
                    </group>

                    {/* Additional Notice Board on Back Wall */}
                    <NoticeBoard position={[-22, 12, -29.7]} />
                    <NoticeBoard position={[22, 12, -29.7]} />

                    {placedInstruments.map((inst) => {
                        const InstrumentComponent = COMPONENT_MAP[inst.type];
                        if (!InstrumentComponent) return null;

                        return (
                            <InstrumentContainer
                                key={inst.id}
                                id={inst.id}
                                type={inst.type}
                                position={inst.position}
                                rotation={inst.rotation}
                            >
                                <InstrumentComponent id={inst.id} />
                            </InstrumentContainer>
                        );
                    })}

                    <PlacementGhost />

                    {connections.map((conn) => (
                        <Wire key={conn.id} fromId={conn.from} toId={conn.to} />
                    ))}

                    <ContactShadows
                        opacity={0.3}
                        scale={30}
                        blur={2}
                        far={10}
                        resolution={1024}
                        color="#000000"
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
