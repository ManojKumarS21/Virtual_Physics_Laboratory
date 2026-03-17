"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useLabState } from "@/lib/chemistry/LabContext";

// ─── SHARED MATERIALS ─────────────────────────────────────────────────────────
const CERAMIC    = new THREE.MeshPhysicalMaterial({ 
    color: "#f9fafb", 
    roughness: 0.12, 
    metalness: 0, 
    clearcoat: 1, 
    clearcoatRoughness: 0.03,
    reflectivity: 0.6
});
const STEEL      = new THREE.MeshPhysicalMaterial({ 
    color: "#dfe4ea", 
    roughness: 0.22, 
    metalness: 1.0, 
    clearcoat: 0.8, 
    clearcoatRoughness: 0.1, 
    reflectivity: 1.0, 
    envMapIntensity: 2.0 
});
const DARK_STEEL = new THREE.MeshPhysicalMaterial({ color: "#9ca3af", roughness: 0.2,  metalness: 0.9  });
const PIPE_MAT   = new THREE.MeshPhysicalMaterial({ color: "#7b8794", roughness: 0.3,  metalness: 0.8  });
const COUNTER    = new THREE.MeshStandardMaterial ({ color: "#1a1d23", roughness: 0.6,  metalness: 0.1  });
const WALL_MAT   = new THREE.MeshStandardMaterial ({ color: "#c8d0d8", roughness: 0.9,  metalness: 0.0  });
const COLD_MAT   = new THREE.MeshStandardMaterial ({ color: "#3b82f6", roughness: 0.4,  metalness: 0.6  });
const HOT_MAT    = new THREE.MeshStandardMaterial ({ color: "#ef4444", roughness: 0.4,  metalness: 0.6  });
const HANDLE_MAT = new THREE.MeshPhysicalMaterial ({ color: "#374151", roughness: 0.3,  metalness: 0.7  });

// ─── DRAIN STRAINER ───────────────────────────────────────────────────────────
function DrainStrainer() {
    const holes = useMemo(() => {
        const h: [number, number][] = [];
        const numArms = 6;
        const ptsPerArm = 10;
        for (let a = 0; a < numArms; a++) {
            const startAngle = (a / numArms) * Math.PI * 2;
            for (let p = 0; p < ptsPerArm; p++) {
                const t = p / (ptsPerArm - 1);
                const r = 0.008 + t * 0.038;
                // Spiral/swirl effect: angle increases as radius increases
                const angle = startAngle + t * 1.5; 
                h.push([Math.cos(angle) * r, Math.sin(angle) * r]);
            }
        }
        // Center screw/hole
        h.push([0, 0]);
        return h;
    }, []);

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.048, 0.048, 0.012, 32]} />
                <primitive object={STEEL} attach="material" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
                <torusGeometry args={[0.044, 0.005, 8, 32]} />
                <primitive object={DARK_STEEL} attach="material" />
            </mesh>
            {holes.map(([x, z], i) => (
                <mesh key={i} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.003, 0.003, 0.016, 8]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
            ))}
        </group>
    );
}

// ─── GOOSENECK FAUCET (CatmullRom curve) ─────────────────────────────────────
function GooseneckFaucet() {
    const geometry = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0,    0),
            new THREE.Vector3(0, 0.06, 0.01),
            new THREE.Vector3(0, 0.14, 0.04),
            new THREE.Vector3(0, 0.22, 0.10),
            new THREE.Vector3(0, 0.28, 0.18),
            new THREE.Vector3(0, 0.31, 0.26),
            new THREE.Vector3(0, 0.30, 0.34),
            new THREE.Vector3(0, 0.26, 0.40),
        ]);
        return new THREE.TubeGeometry(curve, 80, 0.016, 16, false);
    }, []);

    return (
        <group>
            {/* Faucet pipe */}
            <mesh geometry={geometry}>
                <primitive object={STEEL} attach="material" />
            </mesh>

            {/* Aerator nozzle — anchored to curve endpoint [0, 0.26, 0.40] */}
            <mesh position={[0, 0.26, 0.40]}>
                <cylinderGeometry args={[0.013, 0.016, 0.028, 12]} />
                <primitive object={DARK_STEEL} attach="material" />
            </mesh>

            {/* Nozzle cap */}
            <mesh position={[0, 0.245, 0.40]}>
                <cylinderGeometry args={[0.018, 0.018, 0.006, 12]} />
                <primitive object={DARK_STEEL} attach="material" />
            </mesh>
        </group>
    );
}


// ─── LAMINAR WATER STREAM ───────────────────────────────────────────────────
function WaterStream({ active }: { active: boolean }) {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (!ref.current || !active) return;

        const t = state.clock.elapsedTime;

        // Subtle water pressure vibration
        ref.current.scale.x = 1 + Math.sin(t * 14) * 0.03;
        ref.current.scale.z = 1 + Math.cos(t * 14) * 0.03;

        // Slight wobble (laminar flow instability)
        ref.current.rotation.x = Math.sin(t * 1.5) * 0.01;
        ref.current.rotation.z = Math.cos(t * 1.5) * 0.01;
    });

    if (!active) return null;

    return (
        <mesh ref={ref} position={[0, -0.17, 0]}>
            {/* height=0.34, half=0.17 → top of cylinder = 0 → aligns with nozzle */}
            <cylinderGeometry args={[0.007, 0.013, 0.34, 14]} />
            <meshPhysicalMaterial
                color="#9bd9ff"
                transparent
                opacity={0.6}
                transmission={1}
                roughness={0}
                ior={1.33}
                thickness={0.06}
            />
        </mesh>
    );
}




// ─── SPLASH PARTICLES ─────────────────────────────────────────────────────────
function SplashParticles({ active }: { active: boolean }) {
    const ref   = useRef<THREE.Points>(null!);
    const count = 60;

    const { positions: initPos, velocities } = useMemo(() => {
        const positions  = new Float32Array(count * 3);
        const velocities: { vx: number; vy: number; vz: number; life: number }[] = [];
        for (let i = 0; i < count; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 0.04;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.01 + Math.random() * 0.04;
            velocities.push({ vx: Math.cos(angle) * speed, vy: 0.02 + Math.random() * 0.03, vz: Math.sin(angle) * speed, life: Math.random() });
        }
        return { positions, velocities };
    }, []);

    useFrame((_, delta) => {
        if (!ref.current || !active) return;
        const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
            const v = velocities[i];
            v.life += delta * (1.2 + Math.random() * 0.5);
            if (v.life > 1) {
                v.life = 0;
                (pos.array as Float32Array)[i * 3]     = (Math.random() - 0.5) * 0.03;
                (pos.array as Float32Array)[i * 3 + 1] = 0;
                (pos.array as Float32Array)[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.01 + Math.random() * 0.04;
                v.vx = Math.cos(angle) * speed; v.vy = 0.025 + Math.random() * 0.03; v.vz = Math.sin(angle) * speed;
            } else {
                (pos.array as Float32Array)[i * 3]     += v.vx * delta * 8;
                (pos.array as Float32Array)[i * 3 + 1] += (v.vy - v.life * 0.06) * delta * 8;
                (pos.array as Float32Array)[i * 3 + 2] += v.vz * delta * 8;
            }
        }
        pos.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <points ref={ref} position={[0, -0.08, 0.04]}>

            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[initPos, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#bfdbfe" size={0.007} transparent opacity={0.7} sizeAttenuation />
        </points>

    );
}


// ─── DRAIN SUCTION VORTEX ─────────────────────────────────────────────────────
function DrainSuction({ active }: { active: boolean }) {
    const ref    = useRef<THREE.Points>(null!);
    const count  = 80;
    const angles = useRef(new Float32Array(count).map(() => Math.random() * Math.PI * 2));
    const radii  = useRef(new Float32Array(count).map(() => 0.01 + Math.random() * 0.06));

    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r     = 0.01 + Math.random() * 0.06;
            arr[i * 3]     = Math.cos(angle) * r;
            arr[i * 3 + 1] = Math.random() * 0.01;
            arr[i * 3 + 2] = Math.sin(angle) * r;
        }
        return arr;
    }, []);

    useFrame((_, delta) => {
        if (!ref.current || !active) return;
        const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
            angles.current[i] += delta * (3 + (0.07 - radii.current[i]) * 40);
            radii.current[i]   -= delta * 0.012;
            if (radii.current[i] < 0.002) {
                radii.current[i]  = 0.01 + Math.random() * 0.065;
                angles.current[i] = Math.random() * Math.PI * 2;
            }
            const r = radii.current[i];
            (pos.array as Float32Array)[i * 3]     = Math.cos(angles.current[i]) * r;
            (pos.array as Float32Array)[i * 3 + 1] = -r * 0.3;
            (pos.array as Float32Array)[i * 3 + 2] = Math.sin(angles.current[i]) * r;
        }
        pos.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <points ref={ref} position={[0, -0.13, 0]}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#93c5fd" size={0.006} transparent opacity={0.65} sizeAttenuation />
        </points>

    );
}

// ─── P-TRAP + WASTE PIPE (CatmullRom curves) ──────────────────────────────────
function Plumbing() {
    const tailGeo = useMemo(() => new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.10, 0)]),
        8, 0.018, 12, false
    ), []);

    const ptrapGeo = useMemo(() => new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.10, 0),
            new THREE.Vector3(0, -0.16, 0.01),
            new THREE.Vector3(0, -0.20, 0.06),
            new THREE.Vector3(0, -0.20, 0.12),
            new THREE.Vector3(0, -0.18, 0.17),
            new THREE.Vector3(0, -0.14, 0.20),
            new THREE.Vector3(0, -0.10, 0.20),
        ]), 64, 0.018, 12, false
    ), []);

    const wasteGeo = useMemo(() => new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.10, 0.20), new THREE.Vector3(0, -0.10, 0.30)]),
        8, 0.018, 12, false
    ), []);

    return (
        <group>
            <mesh geometry={tailGeo}><primitive object={PIPE_MAT} attach="material" /></mesh>
            <mesh geometry={ptrapGeo}><primitive object={PIPE_MAT} attach="material" /></mesh>
            <mesh geometry={wasteGeo}><primitive object={PIPE_MAT} attach="material" /></mesh>

            {/* Wall flange */}
            <mesh position={[0, -0.10, 0.315]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.034, 0.034, 0.012, 16]} />
                <primitive object={DARK_STEEL} attach="material" />
            </mesh>

            {/* Cold supply line */}
            <mesh position={[-0.12, -0.22, -0.04]}>
                <cylinderGeometry args={[0.010, 0.010, 0.44, 10]} />
                <primitive object={COLD_MAT} attach="material" />
            </mesh>
            <mesh position={[-0.12, 0.00, -0.04]}>
                <cylinderGeometry args={[0.016, 0.016, 0.024, 10]} />
                <primitive object={DARK_STEEL} attach="material" />
            </mesh>

            {/* Hot supply line */}
            <mesh position={[0.12, -0.22, -0.04]}>
                <cylinderGeometry args={[0.010, 0.010, 0.44, 10]} />
                <primitive object={HOT_MAT} attach="material" />
            </mesh>
            <mesh position={[0.12, 0.00, -0.04]}>
                <cylinderGeometry args={[0.016, 0.016, 0.024, 10]} />
                <primitive object={DARK_STEEL} attach="material" />
            </mesh>
        </group>
    );
}

// ─── ANIMATED FAUCET HANDLE ───────────────────────────────────────────────────
function FaucetHandle({ sinkOn, onClick }: { sinkOn: boolean; onClick: () => void }) {
    const groupRef = useRef<THREE.Group>(null!);
    const targetRot = sinkOn ? Math.PI / 2.2 : 0;

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot, delta * 10);
    });

    return (
        <group 
            ref={groupRef} 
            position={[0, 0.07, -0.04]} 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <mesh>
                <cylinderGeometry args={[0.014, 0.014, 0.055, 12]} />
                <primitive object={HANDLE_MAT} attach="material" />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.007, 0.007, 0.16, 8]} />
                <primitive object={HANDLE_MAT} attach="material" />
            </mesh>
            {([-0.072, 0.072] as const).map((x, i) => (
                <mesh key={i} position={[x, 0, 0]}>
                    <sphereGeometry args={[0.010, 8, 8]} />
                    <meshStandardMaterial color={i === 0 ? "#3b82f6" : "#ef4444"} />
                </mesh>
            ))}
        </group>
    );
}

// ─── WATER SURFACE IN BASIN ───────────────────────────────────────────────────
function WaterSurface({ active }: { active: boolean }) {
    const ref     = useRef<THREE.Mesh>(null!);
    const fillRef = useRef(0);

    useFrame((state, delta) => {
        if (!ref.current) return;
        const target = active ? 0.01 : -0.05;
        fillRef.current = THREE.MathUtils.lerp(fillRef.current, target, delta * 0.8);
        ref.current.position.y     = -0.055 + fillRef.current;
        (ref.current.material as THREE.MeshPhysicalMaterial).opacity =
            active ? 0.55 : Math.max(0, fillRef.current + 0.04) * 8;
        const t = state.clock.elapsedTime;
        ref.current.rotation.y = Math.sin(t * 0.7) * 0.04;
        
        // Water ripples (oscillation)
        if (active) {
            ref.current.scale.x = 1 + Math.sin(t * 2) * 0.02;
            ref.current.scale.z = 1 + Math.cos(t * 2) * 0.02;
        } else {
            ref.current.scale.set(1, 1, 1);
        }
    });

    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0.04]}>
            <circleGeometry args={[0.29, 32]} />
            <meshPhysicalMaterial
                color="#7dd3fc"
                transparent opacity={0.5}
                roughness={0.02} metalness={0}
                clearcoat={1} clearcoatRoughness={0}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export const LabSink = () => {
    const { state, toggleSink } = useLabState();
    const { gl } = useThree();
    const [isHovered, setIsHovered] = useState(false);
    const basinRef = useRef<THREE.Mesh>(null!);
    
    // Sync cursor
    useEffect(() => {
        gl.domElement.style.cursor = isHovered ? "pointer" : "default";
        return () => { gl.domElement.style.cursor = "default"; };
    }, [isHovered, gl]);

    useFrame((_, delta) => {
        if (!basinRef.current) return;
        const mat = basinRef.current.material as THREE.MeshPhysicalMaterial;
        const target = state.sinkOn ? 0.02 : 0.12;
        mat.roughness = THREE.MathUtils.lerp(mat.roughness, target, delta * 3);
    });

    const sinkOn = state.sinkOn;
    const onToggle = useCallback(() => toggleSink(), [toggleSink]);

    return (
        <group position={[-1.9, 0.58, -0.40]}>




            {/* ── BACK SPLASH + TILES ── */}
            <mesh position={[0, 0.20, -0.26]} receiveShadow>
                <boxGeometry args={[0.72, 0.44, 0.022]} />
                <primitive object={WALL_MAT} attach="material" />
            </mesh>
            {/* Vertical grout lines */}
            {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
                <mesh key={`vg${i}`} position={[x, 0.20, -0.248]}>
                    <boxGeometry args={[0.003, 0.44, 0.002]} />
                    <meshStandardMaterial color="#a0aab4" />
                </mesh>
            ))}
            {/* Horizontal grout lines */}
            {[-0.10, 0.04, 0.18, 0.32].map((y, i) => (
                <mesh key={`hg${i}`} position={[0, y, -0.248]}>
                    <boxGeometry args={[0.72, 0.003, 0.002]} />
                    <meshStandardMaterial color="#a0aab4" />
                </mesh>
            ))}



            {/* ── RECTANGULAR CERAMIC BASIN (Adjusted shape) ── */}
            <group position={[0, -0.02, 0.04]}>
                {/* Bottom Plate */}
                <RoundedBox args={[0.62, 0.02, 0.56]} radius={0.005} position={[0, -0.13, 0]} receiveShadow ref={basinRef}>
                    <meshPhysicalMaterial color="#f9fafb" roughness={0.12} metalness={0} clearcoat={1} />
                </RoundedBox>

                {/* Left Wall */}
                <RoundedBox args={[0.02, 0.28, 0.56]} radius={0.005} position={[-0.30, 0, 0]} receiveShadow>
                    <meshPhysicalMaterial color="#f9fafb" roughness={0.12} metalness={0} clearcoat={1} side={THREE.DoubleSide} />
                </RoundedBox>
                {/* Right Wall */}
                <RoundedBox args={[0.02, 0.28, 0.56]} radius={0.005} position={[0.30, 0, 0]} receiveShadow>
                    <meshPhysicalMaterial color="#f9fafb" roughness={0.12} metalness={0} clearcoat={1} side={THREE.DoubleSide} />
                </RoundedBox>
                {/* Front Wall */}
                <RoundedBox args={[0.62, 0.28, 0.02]} radius={0.005} position={[0, 0, 0.27]} receiveShadow>
                    <meshPhysicalMaterial color="#f9fafb" roughness={0.12} metalness={0} clearcoat={1} side={THREE.DoubleSide} />
                </RoundedBox>
                {/* Back Wall */}
                <RoundedBox args={[0.62, 0.28, 0.02]} radius={0.005} position={[0, 0, -0.27]} receiveShadow>
                    <meshPhysicalMaterial color="#f9fafb" roughness={0.12} metalness={0} clearcoat={1} side={THREE.DoubleSide} />
                </RoundedBox>
            </group>


            {/* Interior basin shadow for depth */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0.04]} receiveShadow>
                <planeGeometry args={[0.58, 0.52]} />
                <shadowMaterial opacity={0.35} />
            </mesh>


            {/* ── DRAIN CONTINUITY STACK ── */}
            <group position={[0, -0.18, 0.04]}>
                <DrainStrainer />
                
                {/* Drain throat pipe */}
                <mesh position={[0, -0.035, 0]}>
                    <cylinderGeometry args={[0.026, 0.028, 0.08, 24]} />
                    <meshPhysicalMaterial color="#cfd6dd" metalness={0.9} roughness={0.25} />
                </mesh>

                <DrainSuction active={sinkOn} />
            </group>

            {/* Drain funnel */}
            <mesh position={[0, -0.075, 0.04]}>
                <coneGeometry args={[0.05, 0.06, 32]} />
                <meshPhysicalMaterial color="#cfd6dd" metalness={0.9} roughness={0.25} />
            </mesh>

            {/* Drain connector ring */}
            <mesh position={[0, -0.11, 0.04]}>
                <torusGeometry args={[0.035, 0.006, 12, 24]} />
                <meshPhysicalMaterial color="#9ca3af" metalness={1} roughness={0.25} />
            </mesh>

            {/* Sink outlet pipe (Connector to plumbing) */}
            <mesh position={[0, -0.15, 0.04]}>
                <cylinderGeometry args={[0.035, 0.035, 0.22, 20]} />
                <meshPhysicalMaterial color="#9ca3af" metalness={1} roughness={0.25} />
            </mesh>



            {/* ── WATER SURFACE ── */}
            <WaterSurface active={sinkOn} />

            {/* ── PLUMBING ── */}
            <group position={[0, -0.28, 0.04]}>
                <Plumbing />
            </group>

            {/* ── FAUCET ASSEMBLY (On bench top) ── */}
            <group 
                position={[0, 0.20, -0.22]}
            >

                {/* Hitbox for easier clicking */}
                <mesh 
                    position={[0, 0.15, 0.2]} 
                    visible={false}
                    onPointerEnter={(e) => { e.stopPropagation(); setIsHovered(true); }}
                    onPointerLeave={(e) => { e.stopPropagation(); setIsHovered(false); }}
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                >
                    <boxGeometry args={[0.2, 0.35, 0.5]} />
                </mesh>
                {/* Faucet shadow contact (Grounding trick) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <circleGeometry args={[0.08, 24]} />
                    <shadowMaterial opacity={0.35} />
                </mesh>


                {/* Faucet base plate */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.038, 0.040, 0.018, 20]} />
                    <primitive object={STEEL} attach="material" />
                </mesh>

                {/* Main riser pipe — 40% of original height */}
                <mesh position={[0, 0.053, 0]}>
                    <cylinderGeometry args={[0.018, 0.018, 0.106, 16]} />
                    <primitive object={STEEL} attach="material" />
                </mesh>
                {/* Collar ring */}
                <mesh position={[0, 0.106, 0]}>
                    <cylinderGeometry args={[0.024, 0.024, 0.018, 16]} />
                    <primitive object={DARK_STEEL} attach="material" />
                </mesh>

                {/* Animated handle — click to toggle */}
                <FaucetHandle sinkOn={sinkOn} onClick={onToggle} />

                {/* Gooseneck spout — nozzle is now embedded inside GooseneckFaucet */}
                <group 
                    position={[0, 0.115, 0]}
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                >
                    <GooseneckFaucet />
                </group>



                {/* Laminar water stream — group origin = nozzle tip [0, 0.375, 0.40] in faucet local space */}
                <group position={[0, 0.375, 0.40]}>
                    <WaterStream active={sinkOn} />
                    {/* Splash — offset back to basin/drain center */}
                    <group position={[0, -0.52, -0.36]}>
                        <SplashParticles active={sinkOn} />
                    </group>
                </group>



            </group>

            {/* ── SOAP DISPENSER ── */}
            <group position={[0.20, 0.23, -0.15]}>

                <mesh>
                    <cylinderGeometry args={[0.018, 0.022, 0.07, 12]} />
                    <meshStandardMaterial color="#dbeafe" roughness={0.3} transparent opacity={0.85} />
                </mesh>
                <mesh position={[0, 0.042, 0]}>
                    <cylinderGeometry args={[0.010, 0.010, 0.05, 8]} />
                    <primitive object={DARK_STEEL} attach="material" />
                </mesh>
            </group>

        </group>
    );
};
