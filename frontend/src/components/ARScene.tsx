import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { createXRStore, XR, useXR, useXRHitTest, Interactive } from '@react-three/xr';
import { useRef, useState, Suspense, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Environment, Text } from '@react-three/drei';
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
});

function Reticle({
    onHitDetect,
    reticleRef,
}: {
    onHitDetect: (detected: boolean) => void;
    reticleRef: React.RefObject<THREE.Mesh>;
}) {
    const matrix = useMemo(() => new THREE.Matrix4(), []);

    const setIsSurfaceDetected = useLabStore(s => s.setIsSurfaceDetected);
    const setIsARStable = useLabStore(s => s.setIsARStable);
    const isARStable = useLabStore(s => s.isARStable);
    const setLastHitResult = useLabStore(s => s.setLastHitResult);
    const stableTimer = useRef(0);

    useXRHitTest((results, getWorldMatrix) => {
        if (results.length > 0 && reticleRef.current) {
            if (getWorldMatrix(matrix, results[0])) {
                reticleRef.current.matrix.copy(matrix);
                reticleRef.current.matrix.decompose(
                    reticleRef.current.position,
                    reticleRef.current.quaternion,
                    reticleRef.current.scale
                );
                // Force rotation to be flat on the surface
                reticleRef.current.rotation.set(-Math.PI / 2, 0, 0);
                reticleRef.current.updateMatrixWorld(true);
                reticleRef.current.visible = true;
            }

            setLastHitResult(results[0]);
            onHitDetect(true);
            setIsSurfaceDetected(true);

            // Stability check
            stableTimer.current++;
            if (stableTimer.current > 30) {
                setIsARStable(true);
            }
        } else if (reticleRef.current) {
            reticleRef.current.visible = false;
            onHitDetect(false);
            setIsSurfaceDetected(false);
            setIsARStable(false);
            stableTimer.current = 0;
            setLastHitResult(null);
        }
    }, 'viewer');

    return (
        <mesh ref={reticleRef} matrixAutoUpdate={false} visible={false}>
            <ringGeometry args={[0.08, 0.1, 32]} />
            <meshBasicMaterial color="#2F8D46" transparent opacity={0.6} side={THREE.DoubleSide} />
            <mesh>
                <circleGeometry args={[0.02, 32]} />
                <meshBasicMaterial color="#2F8D46" side={THREE.DoubleSide} />
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
        <Interactive
            onSelectStart={() => setIsDragging(true)}
            onSelectEnd={() => setIsDragging(false)}
        >
            <group position={inst.position} rotation={inst.rotation} scale={0.091}>
                <InstrumentComponent id={inst.id} />
            </group>
        </Interactive>
    );
}

function ExperimentContent({ rotation }: { rotation: number }) {
    const placedInstruments = useLabStore(s => s.placedInstruments);

    return (
        <group rotation={[0, rotation, 0]}>
            {placedInstruments.map(inst => (
                <ARInstrument key={inst.id} inst={inst} />
            ))}
        </group>
    );
}

function SceneContent({ onReady }: { onReady: () => void }) {
    const {
        arPlacementTrigger,
        setArPlacementTrigger,
        isARPlaced,
        setIsARPlaced,
        setIsXRPresenting,
        setIsSurfaceDetected,
        isARStable,
        isSurfaceDetected,
        lastHitResult,
        initConnectedExperiment,
        canForcePlace,
        setCanForcePlace
    } = useLabStore();

    const reticleRef = useRef<THREE.Mesh>(null);
    const [hasHit, setHasHit] = useState(false);
    const [experimentRotation, setExperimentRotation] = useState(0);
    const anchorRef = useRef<any>(null);
    const [anchorMatrix, setAnchorMatrix] = useState<THREE.Matrix4 | null>(null);

    const session = useXR(s => s.session);
    const { camera, gl } = useThree();

    useEffect(() => {
        if (gl) onReady();
    }, [gl, onReady]);

    useEffect(() => {
        setIsXRPresenting(!!session);
    }, [session, setIsXRPresenting]);

    const spawnExperiment = useCallback(async (pos: THREE.Vector3) => {
        const toCamera = new THREE.Vector3().copy(camera.position).sub(pos);
        toCamera.y = 0;
        toCamera.normalize();

        const angle = Math.atan2(toCamera.x, toCamera.z) + Math.PI;
        setExperimentRotation(angle);

        if (lastHitResult) {
            try {
                const anchor = await lastHitResult.createAnchor();
                anchorRef.current = anchor;
            } catch (err) {
                console.warn("Anchor creation failed, using static placement:", err);
            }
        }

        setIsARPlaced(true);
        initConnectedExperiment(pos.toArray(), angle);
    }, [camera, lastHitResult, setIsARPlaced, initConnectedExperiment]);

    const handlePlaceByHit = useCallback(() => {
        if (isARPlaced) return;
        if (!isSurfaceDetected && !canForcePlace) {
            console.log("Tap detected but surface not detected yet.");
            return;
        }

        const target = new THREE.Vector3();
        if (reticleRef.current) {
            target.setFromMatrixPosition(reticleRef.current.matrix);
        }

        // Fallback for force place
        if (target.lengthSq() < 0.0001) {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            target.copy(camera.position).addScaledVector(dir, 1);
            target.y = camera.position.y - 1.2;
        }

        spawnExperiment(target);
    }, [isARPlaced, isSurfaceDetected, canForcePlace, camera, spawnExperiment]);

    useEffect(() => {
        if (arPlacementTrigger && !isARPlaced) {
            handlePlaceByHit();
            setArPlacementTrigger(false);
        }
    }, [arPlacementTrigger, isARPlaced, handlePlaceByHit, setArPlacementTrigger]);

    useFrame((state) => {
        if (anchorRef.current && session) {
            const frame = state.gl.xr.getFrame();
            const referenceSpace = state.gl.xr.getReferenceSpace();
            if (frame && referenceSpace) {
                const pose = frame.getPose(anchorRef.current, referenceSpace);
                if (pose) {
                    const mat = new THREE.Matrix4().fromArray(pose.transform.matrix);
                    setAnchorMatrix(mat);
                }
            }
        }
    });

    return (
        <>
            <hemisphereLight intensity={0.5} groundColor="#444444" />
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <directionalLight position={[-5, 5, 5]} intensity={1.0} />

            <Reticle onHitDetect={setHasHit} reticleRef={reticleRef} />
            
            {!isARPlaced && session && (
                <mesh position={[0, 0.1, -1]}>
                    <boxGeometry args={[0.08, 0.08, 0.08]} />
                    <meshBasicMaterial color="red" />
                </mesh>
            )}

            <Suspense fallback={null}>
                <Environment preset="studio" />
            </Suspense>

            <Suspense fallback={null}>
                {anchorMatrix ? (
                    <group matrix={anchorMatrix} matrixAutoUpdate={false}>
                        <ExperimentContent rotation={experimentRotation} />
                    </group>
                ) : (
                    isARPlaced && <ExperimentContent rotation={experimentRotation} />
                )}
            </Suspense>

            {!isARPlaced && (
                <Interactive onSelect={handlePlaceByHit}>
                    <mesh position={[0, 0, -1]} visible={false}>
                        <planeGeometry args={[10, 10]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                </Interactive>
            )}

            {isARPlaced && !session && (
                <Text
                    position={[0, 1.5, 0]}
                    fontSize={0.1}
                    color="#2F8D46"
                    anchorX="center"
                    anchorY="middle"
                >
                    Experiment Placed. Use mouse/touch to view.
                </Text>
            )}
        </>
    );
}

export default function ARScene() {
    const [isReady, setIsReady] = useState(false);

    return (
        <div className="w-full h-full relative">
            {!isReady && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0a2538]">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-4 border-[#2F8D46] border-t-transparent rounded-full animate-spin" />
                        <div className="text-[#2F8D46] font-bold tracking-widest animate-pulse">OPTIMIZING PHYSICS ENGINE...</div>
                    </div>
                </div>
            )}

            {isReady && (
                <button
                    onClick={() => store.enterAR()}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 px-10 py-5 bg-[#2F8D46] text-black font-black text-xl rounded-2xl z-50 shadow-2xl active:scale-95 transition-all"
                >
                    LAUNCH EXPERIENCE
                </button>
            )}

            <Canvas
                shadows
                camera={{ position: [0, 2, 5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <XR store={store}>
                    <Suspense fallback={null}>
                        <SceneContent onReady={() => setIsReady(true)} />
                    </Suspense>
                </XR>
            </Canvas>
        </div>
    );
}
