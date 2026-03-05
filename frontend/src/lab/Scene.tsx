'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import Table from './Table';
import { Suspense } from 'react';
import { useLabStore } from '../hooks/useLabStore';
import InstrumentContainer from '../components/instruments/InstrumentContainer';
import Battery from '../components/instruments/Battery';
import Galvanometer from '../components/instruments/Galvanometer';
import ResistanceBox from '../components/instruments/ResistanceBox';
import MeterBridge from '../components/instruments/MeterBridge';
import PlugKey from '../components/instruments/PlugKey';
import Jockey from '../components/instruments/Jockey';
import Wire from '../components/wires/Wire';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';

const COMPONENT_MAP: Record<string, React.FC<any>> = {
    battery: Battery,
    galvanometer: Galvanometer,
    resistance_box: ResistanceBox,
    meter_bridge: MeterBridge,
    plug_key: PlugKey,
    jockey: Jockey,
};

export default function Scene() {
    const { placedInstruments, connections, isLocked } = useLabStore();
    usePhysicsEngine(); // Start physics loop

    return (
        <div className="w-full h-full bg-[#1a1a1a]">
            <Canvas shadows>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={45} />
                    <OrbitControls
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2.2}
                        minDistance={5}
                        maxDistance={25}
                        makeDefault
                        enabled={!isLocked}
                    />

                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
                    <Environment preset="apartment" />

                    <Table position={[0, 0, 0]} />

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
