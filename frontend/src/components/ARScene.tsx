import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { createXRStore, XR, useXR, useXRHitTest, Interactive } from '@react-three/xr';
import { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Environment, ContactShadows, Float, Text, OrbitControls } from '@react-three/drei';
import { useLabStore } from '../hooks/useLabStore';

// Import procedural components from their correct location
import Battery from './instruments/Battery';
import Galvanometer from './instruments/Galvanometer';
import ResistanceBox from './instruments/ResistanceBox';
import MeterBridge from './instruments/MeterBridge';
import PlugKey from './instruments/PlugKey';
import Jockey from './instruments/Jockey';

const store = createXRStore({
    hand: false,
    controller: false,
    sessionInit: {
        optionalFeatures: ['hit-test', 'plane-detection', 'dom-overlay'],
        domOverlay: { root: typeof document !== 'undefined' ? document.body : undefined }
    }
});

function Reticle({ onHitDetect }: { onHitDetect: (detected: boolean) => void }) {
    const reticleRef = useRef<THREE.Mesh>(null);
    const matrix = useMemo(() => new THREE.Matrix4(), []);

    useXRHitTest((results, getWorldMatrix) => {
        if (results.length > 0 && reticleRef.current) {
            reticleRef.current.visible = true;
            if (getWorldMatrix(matrix, results[0])) {
                reticleRef.current.matrix.copy(matrix);
            }
            onHitDetect(true);
        } else if (reticleRef.current) {
            reticleRef.current.visible = false;
            onHitDetect(false);
        }
    }, 'viewer');

    return (
        <mesh ref={reticleRef} matrixAutoUpdate={false} visible={false}>
            <ringGeometry args={[0.08, 0.1, 32]} />
            <meshBasicMaterial color="#2bb3a1" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.015, 32]} />
                <meshBasicMaterial color="#2bb3a1" />
            </mesh>
        </mesh>
    );
}

function ARInstrument({ inst }: { inst: any }) {
    const updateInstrument = useLabStore(s => s.updateInstrument);
    const [isDragging, setIsDragging] = useState(false);

    const InstrumentComponent = useMemo(() => {
        switch (inst.type) {
            case 'battery': return Battery;
            case 'galvanometer': return Galvanometer;
            case 'resistance_box': return ResistanceBox;
            case 'meter_bridge': return MeterBridge;
            case 'plug_key': return PlugKey;
            case 'jockey': return Jockey;
            default: return null;
        }
    }, [inst.type]);

    if (!InstrumentComponent) return null;

    const handleSelectStart = () => {
        setIsDragging(true);
    };

    const handleSelectEnd = () => {
        setIsDragging(false);
    };

    useFrame((state) => {
        if (isDragging) {
            const target = new THREE.Vector3();
            state.camera.getWorldDirection(target);
            target.multiplyScalar(0.5);
            target.add(state.camera.position);
            updateInstrument(inst.id, { position: [target.x, inst.position[1], target.z] });
        }
    });

    return (
        <Interactive onSelectStart={handleSelectStart} onSelectEnd={handleSelectEnd}>
            <group position={inst.position} rotation={inst.rotation} scale={0.12}>
                <InstrumentComponent id={inst.id} />
                {isDragging && (
                    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.6, 0.65, 32]} />
                        <meshBasicMaterial color="#2bb3a1" transparent opacity={0.5} />
                    </mesh>
                )}
            </group>
        </Interactive>
    );
}

function ExperimentContent({ rotation }: { rotation: number }) {
    const { placedInstruments } = useLabStore();
    return (
        <group rotation={[0, rotation, 0]}>
            {placedInstruments.map(inst => (
                <ARInstrument key={inst.id} inst={inst} />
            ))}
            <ContactShadows opacity={0.4} scale={5} blur={2.5} far={10} color="#000000" />
        </group>
    );
}

function SceneContent({ onReady }: { onReady: () => void }) {
    const { 
        addInstrument, 
        resetLab, 
        arPlacementTrigger, 
        setArPlacementTrigger,
        isARPlaced,
        setIsARPlaced,
        setIsXRPresenting
    } = useLabStore();
    const [hasHit, setHasHit] = useState(false);
    const [experimentRotation, setExperimentRotation] = useState(0);
    const { isPresenter } = useXR();
    const { camera, gl } = useThree();

    // Signal readiness when renderer is available
    useEffect(() => {
        if (gl) onReady();
    }, [gl, onReady]);

    useEffect(() => {
        setIsXRPresenting(isPresenter);
    }, [isPresenter, setIsXRPresenting]);

    const spawnExperiment = (pos: THREE.Vector3) => {
        // Calculate orientation to face camera (projected on XZ plane)
        const toCamera = new THREE.Vector3().copy(camera.position).sub(pos);
        toCamera.y = 0;
        toCamera.normalize();
        
        // Meter Bridge is default aligned along X. Angle will be between toCamera and Z.
        const angle = Math.atan2(toCamera.x, toCamera.z) + Math.PI;
        setExperimentRotation(angle);

        setIsARPlaced(true);
        resetLab();
        
        // Spawn relative to origin [0,0,0] as the group parent will handle the world position pos
        // But wait, the instruments are stored with world positions. 
        // Let's spawn them relative to pos but use the group for rotation.
        // Actually, simpler: spawn them at pos with the relative offsets.
        const spawnAt = (x: number, y: number, z: number) => {
            const rotated = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            return [pos.x + rotated.x, pos.y + rotated.y, pos.z + rotated.z] as [number, number, number];
        };

        addInstrument('meter_bridge', 'Meter Bridge', [], 'ar_mb', spawnAt(0, 0, 0));
        addInstrument('battery', 'Battery', [], 'ar_batt', spawnAt(-0.4, 0, -0.3));
        addInstrument('resistance_box', 'Res. Box', [], 'ar_rb', spawnAt(0, 0, -0.3));
        addInstrument('galvanometer', 'Galvanometer', [], 'ar_galvano', spawnAt(0.4, 0, -0.3));
        addInstrument('plug_key', 'Plug Key', [], 'ar_pk', spawnAt(-0.2, 0, -0.5));
        addInstrument('jockey', 'Jockey', [], 'ar_jockey', spawnAt(0.2, 0.1, 0.1));
    };

    const handlePlaceByHit = (e: any) => {
        if (isARPlaced || !e.intersection) return;
        spawnExperiment(e.intersection.point);
    };

    useEffect(() => {
        if (arPlacementTrigger && !isARPlaced) {
            const target = new THREE.Vector3();
            camera.getWorldDirection(target);
            target.multiplyScalar(2.0).add(camera.position); // Spawn slightly further for better view
            target.y -= 0.6;
            spawnExperiment(target);
            setArPlacementTrigger(false);
        }
    }, [arPlacementTrigger, isARPlaced, camera, setArPlacementTrigger]);

    return (
        <>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
            <directionalLight position={[-5, 5, 5]} intensity={1.0} />
            <Environment preset="city" />
            
            {!isPresenter && <OrbitControls makeDefault minDistance={0.5} maxDistance={10} />}
            
            {!isARPlaced && <Reticle onHitDetect={setHasHit} />}
            
            <ExperimentContent rotation={experimentRotation} />
            
            {!isARPlaced && (
                <Interactive onSelect={handlePlaceByHit}>
                    <mesh visible={false}>
                        <planeGeometry args={[100, 100]} />
                    </mesh>
                </Interactive>
            )}
            
            {isARPlaced && !isPresenter && (
                <Text
                    position={[0, 1.5, 0]}
                    fontSize={0.1}
                    color="#2bb3a1"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="black"
                >
                    Experiment Placed. Use mouse/touch to view.
                </Text>
            )}
        </>
    );
}

export default function ARScene() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEnterAR = async () => {
        try {
            setError(null);
            await store.enterAR();
        } catch (err: any) {
            console.error("AR Entry Failed:", err);
            setError("Renderer Error. Refresh and try again.");
        }
    };

    return (
        <div className="w-full h-full relative" id="ar-container">
            {!isReady ? (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0a2538]">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#2bb3a1]/20 rounded-full" />
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#2bb3a1] border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[#2bb3a1] font-black text-sm tracking-[0.3em] uppercase animate-pulse">BOOTING ENGINE</span>
                            <span className="text-white/30 text-[9px] font-bold tracking-widest">INITIALIZING PHYSICS CORE</span>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleEnterAR}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 px-10 py-6 bg-[#2bb3a1] text-black font-black text-xl rounded-2xl z-50 shadow-[0_20px_50px_rgba(43,179,161,0.5)] transition-all hover:scale-110 active:scale-95 flex items-center gap-4 border-b-8 border-black/20"
                >
                    <div className="w-4 h-4 bg-black rounded-full animate-ping" />
                    LAUNCH AR EXPERIENCE
                </button>
            )}

            {error && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-2xl uppercase tracking-[0.2em] border-2 border-white/20">
                    {error}
                </div>
            )}

            <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
                <XR store={store}>
                    <Suspense fallback={null}>
                        <SceneContent onReady={() => setIsReady(true)} />
                    </Suspense>
                </XR>
            </Canvas>
        </div>
    );
}
