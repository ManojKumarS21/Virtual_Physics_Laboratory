import { Canvas, useThree } from '@react-three/fiber';
import { createXRStore, XR, useXR, useXRHitTest } from '@react-three/xr';
import { useRef, useState, Suspense, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { useLabStore } from '../hooks/useLabStore';

import Battery from './instruments/Battery';
import Galvanometer from './instruments/Galvanometer';
import ResistanceBox from './instruments/ResistanceBox';
import MeterBridge from './instruments/MeterBridge';
import PlugKey from './instruments/PlugKey';
import Jockey from './instruments/Jockey';

// ─── XR Store ────────────────────────────────────────────────────────────────
const store = createXRStore({
    hand: false,
    controller: false,
    customSessionInit: {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['anchors', 'dom-overlay'],
    },
});

// ─── Instrument positions (relative offsets in scene units before scale) ─────
const INSTRUMENT_LAYOUT = [
    { id: 'battery-1', type: 'battery', offset: [-4.0, 0, 0.5] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { id: 'meter-bridge-1', type: 'meter_bridge', offset: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { id: 'resistance-box-1', type: 'resistance_box', offset: [2.0, 0, 0.5] as [number, number, number], rotation: [0, Math.PI / 6, 0] as [number, number, number] },
    { id: 'galvanometer-1', type: 'galvanometer', offset: [4.2, 0, 0.2] as [number, number, number], rotation: [0, -Math.PI / 8, 0] as [number, number, number] },
    { id: 'plug-key-1', type: 'plug_key', offset: [-1.8, 0, 0.8] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { id: 'jockey-1', type: 'jockey', offset: [0, 0, -0.2] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
];

const COMPONENT_MAP: Record<string, React.ComponentType<{ id: string }>> = {
    battery: Battery,
    galvanometer: Galvanometer,
    resistance_box: ResistanceBox,
    meter_bridge: MeterBridge,
    plug_key: PlugKey,
    jockey: Jockey,
};

// ─── The full static experiment group ────────────────────────────────────────
function StaticExperiment({ anchor }: { anchor: THREE.Vector3 }) {
    // Scale: 0.09 makes the scene ~table-sized in AR (tweak if too big/small)
    const SCALE = 0.09;

    return (
        <group position={anchor} scale={SCALE}>
            {INSTRUMENT_LAYOUT.map((inst) => {
                const Component = COMPONENT_MAP[inst.type];
                if (!Component) return null;
                return (
                    <group
                        key={inst.id}
                        position={inst.offset}
                        rotation={inst.rotation}
                    >
                        <Component id={inst.id} />
                    </group>
                );
            })}
        </group>
    );
}

// ─── Reticle ─────────────────────────────────────────────────────────────────
function Reticle({
    reticleRef,
    onPlaced,
}: {
    reticleRef: React.RefObject<THREE.Mesh>;
    onPlaced: (pos: THREE.Vector3) => void;
}) {
    const matrix = useMemo(() => new THREE.Matrix4(), []);
    const fired = useRef(false);
    const count = useRef(0);

    useXRHitTest((results, getWorldMatrix) => {
        if (results.length > 0 && reticleRef.current) {
            if (getWorldMatrix(matrix, results[0])) {
                const pos = new THREE.Vector3();
                matrix.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
                reticleRef.current.position.copy(pos);
                reticleRef.current.visible = true;

                count.current++;
                // Place after ~1 second of stable detection
                if (count.current > 30 && !fired.current) {
                    fired.current = true;
                    onPlaced(pos.clone());
                }
            }
        } else if (reticleRef.current) {
            reticleRef.current.visible = false;
            count.current = 0;
        }
    }, 'local-floor');

    return (
        <mesh ref={reticleRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.13, 32]} />
            <meshBasicMaterial color="#2F8D46" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
    );
}

// ─── Session watcher ─────────────────────────────────────────────────────────
function SessionWatcher({ onStart, onEnd }: { onStart: () => void; onEnd: () => void }) {
    const session = useXR(s => s.session);
    const prev = useRef<XRSession | null>(null);
    useEffect(() => {
        if (session && !prev.current) onStart();
        if (!session && prev.current) onEnd();
        prev.current = session ?? null;
    }, [session, onStart, onEnd]);
    return null;
}

// ─── AR Scene content (runs inside XR context) ───────────────────────────────
function ARContent({
    onSessionStart,
    onSessionEnd,
}: {
    onSessionStart: () => void;
    onSessionEnd: () => void;
}) {
    const session = useXR(s => s.session);
    const { gl } = useThree();
    const reticleRef = useRef<THREE.Mesh>(null);
    const [anchor, setAnchor] = useState<THREE.Vector3 | null>(null);

    // ✅ Initialize the store so instrument components have data to render
    const initConnectedExperiment = useLabStore(s => s.initConnectedExperiment);

    // Transparent background = AR camera shows through
    useEffect(() => {
        gl.setClearColor(0x000000, 0);
    }, [gl]);

    const handlePlaced = useCallback((pos: THREE.Vector3) => {
        // ✅ Init store with placement position — instruments read from this
        initConnectedExperiment(pos.toArray() as [number, number, number], 0);
        setAnchor(pos);
    }, [initConnectedExperiment]);

    return (
        <>
            <SessionWatcher onStart={onSessionStart} onEnd={onSessionEnd} />

            <ambientLight intensity={1.5} />
            <directionalLight position={[2, 5, 3]} intensity={2} castShadow />
            <hemisphereLight intensity={0.8} groundColor="#222" />

            <Suspense fallback={null}>
                <Environment preset="studio" />
            </Suspense>

            {/* Show reticle while scanning */}
            {session && !anchor && (
                <Reticle reticleRef={reticleRef} onPlaced={handlePlaced} />
            )}

            {/* Show experiment once surface is found */}
            {anchor && (
                <Suspense fallback={null}>
                    <StaticExperiment anchor={anchor} />
                </Suspense>
            )}
        </>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ARScene() {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'placed' | 'error'>('idle');
    const [arSupported, setArSupported] = useState<boolean | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSessionStart = useCallback(() => setStatus('scanning'), []);
    const handleSessionEnd = useCallback(() => setStatus('idle'), []);

    // Check support only — do NOT launch
    useEffect(() => {
        if (!navigator?.xr) {
            setArSupported(false);
            setStatus('error');
            setErrorMsg('WebXR not available. Use Chrome on an ARCore Android device.');
            return;
        }
        navigator.xr.isSessionSupported('immersive-ar')
            .then(ok => {
                setArSupported(ok);
                if (!ok) {
                    setStatus('error');
                    setErrorMsg('AR not supported on this device or browser.');
                }
            })
            .catch(e => {
                setArSupported(false);
                setStatus('error');
                setErrorMsg(e?.message || 'AR support check failed.');
            });
    }, []);

    // ✅ Must be called synchronously from onClick — no async wrapper
    const handleTap = () => {
        store.enterAR().catch((e: any) => {
            console.error('[AR] Launch failed:', e);
            setErrorMsg(e?.message || 'Failed to start AR. Grant camera permission and retry.');
            setStatus('error');
        });
    };

    return (
        <div
            id="ar-root"
            className="w-full h-full relative overflow-hidden"
            style={{ background: '#0a0a1a' }}
        >
            {/* ── Idle: launch screen ───────────────────────────────────────── */}
            {status === 'idle' && arSupported !== false && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a1a] px-8">
                    <div className="w-20 h-20 rounded-full bg-[#2F8D46]/20 flex items-center justify-center mb-6">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <path d="M4 14V8a4 4 0 0 1 4-4h6M26 4h6a4 4 0 0 1 4 4v6M36 26v6a4 4 0 0 1-4 4h-6M14 36H8a4 4 0 0 1-4-4v-6"
                                stroke="#2F8D46" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="20" cy="20" r="5" fill="#2F8D46" />
                        </svg>
                    </div>
                    <p className="text-white text-2xl font-bold mb-1 text-center">Meter Bridge</p>
                    <p className="text-gray-400 text-sm mb-1 text-center">Meter Bridge Experiment</p>
                    <p className="text-gray-500 text-xs mb-10 text-center">
                        Point your camera at a flat table or floor after tapping
                    </p>
                    <button
                        onClick={handleTap}
                        className="w-full max-w-xs py-5 bg-[#2F8D46] text-black font-black text-xl rounded-2xl shadow-2xl active:scale-95 transition-transform"
                    >
                        VIEW IN AR
                    </button>
                    {arSupported === null && (
                        <p className="text-gray-600 text-xs mt-4 animate-pulse">Checking AR support...</p>
                    )}
                </div>
            )}

            {/* ── Scanning: surface detection hint ─────────────────────────── */}
            {status === 'scanning' && (
                <div className="absolute bottom-10 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
                    <div className="bg-black/70 rounded-2xl px-6 py-3 text-center">
                        <p className="text-white text-base font-semibold">🔍 Scanning surface...</p>
                        <p className="text-gray-300 text-xs mt-1">
                            Slowly move phone over a flat table or floor
                        </p>
                    </div>
                </div>
            )}

            {/* ── Placed: experiment is visible ─────────────────────────────── */}
            {status === 'placed' && (
                <div className="absolute bottom-10 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
                    <div className="bg-black/60 rounded-2xl px-6 py-3 text-center">
                        <p className="text-white text-sm">✅ Walk around to explore the experiment</p>
                    </div>
                </div>
            )}

            {/* ── Error ────────────────────────────────────────────────────── */}
            {status === 'error' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a1a] px-8 text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-white font-bold text-lg mb-2">AR Not Available</p>
                    <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">
                        Requires Chrome on Android with ARCore.{'\n'}
                        Enable WebXR in chrome://flags if needed.
                    </p>
                </div>
            )}

            {/* ── Canvas ───────────────────────────────────────────────────── */}
            <Canvas
                shadows
                camera={{ position: [0, 0.5, 1.2], fov: 50 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    premultipliedAlpha: false,
                    preserveDrawingBuffer: true,
                }}
                style={{ background: 'transparent' }}
            >
                <XR store={store}>
                    <Suspense fallback={null}>
                        <ARContent
                            onSessionStart={handleSessionStart}
                            onSessionEnd={handleSessionEnd}
                        />
                    </Suspense>
                </XR>
            </Canvas>
        </div>
    );
}