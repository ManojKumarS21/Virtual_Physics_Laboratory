'use client';

import { useEffect, useMemo } from 'react';
import { useLabStore } from '../hooks/useLabStore';
import { calculateGalvanometerDeflection } from '../physics/meterBridgePhysics';

export function usePhysicsEngine() {
    const { placedInstruments, connections, instrumentValues, setDeflection, setCurrentL, setSimulationError } = useLabStore();

    const simulationState = useMemo(() => {
        const battery = placedInstruments.find(i => i.type === 'battery');
        const resBox = placedInstruments.find(i => i.type === 'resistance_box');
        const meterBridge = placedInstruments.find(i => i.type === 'meter_bridge');
        const jockey = placedInstruments.find(i => i.type === 'jockey');
        const plugKey = placedInstruments.find(i => i.type === 'plug_key');

        if (!battery || !resBox || !meterBridge || !jockey) return null;

        /**
         * Graph-based search to find all nodes in the same electrical circuit.
         * Handles wires, brass plates, and closed switches.
         */
        const getElectricalGroup = (startNode: string): Set<string> => {
            const normalize = (s: string) => s.trim().toLowerCase();
            const visited = new Set<string>();
            const queue = [normalize(startNode)];
            visited.add(normalize(startNode));

            while (queue.length > 0) {
                const node = queue.shift()!;

                // 1. Travelers via Wires
                connections.forEach(c => {
                    const from = normalize(c.from);
                    const to = normalize(c.to);
                    if (from === node && !visited.has(to)) {
                        visited.add(to);
                        queue.push(to);
                    } else if (to === node && !visited.has(from)) {
                        visited.add(from);
                        queue.push(from);
                    }
                });

                // 2. Travelers via Internal Brass Plates (Meter Bridge)
                const mbIdNorm = normalize(meterBridge.id);
                if (node.startsWith(`${mbIdNorm}_`)) {
                    const suffix = node.split('_').pop() || '';
                    const plateType = suffix.charAt(0).toUpperCase(); // A, L, D, R, C

                    const plateTerminals: string[] = [];
                    if (plateType === 'A') plateTerminals.push('A1', 'A2');
                    else if (plateType === 'L') plateTerminals.push('L1', 'L2');
                    else if (plateType === 'D') plateTerminals.push('D');
                    else if (plateType === 'R') plateTerminals.push('R1', 'R2');
                    else if (plateType === 'C') plateTerminals.push('C1', 'C2');

                    plateTerminals.forEach(pSuffix => {
                        const neighbor = normalize(`${meterBridge.id}_${pSuffix}`);
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    });
                }

                // 3. Travelers via Plug Key (if closed)
                if (plugKey) {
                    const pkIdNorm = normalize(plugKey.id);
                    if (node.startsWith(`${pkIdNorm}_`)) {
                        const isClosed = instrumentValues[plugKey.id] === 1;
                        if (isClosed) {
                            const other = node.endsWith('_t1') ? normalize(`${plugKey.id}_t2`) : normalize(`${plugKey.id}_t1`);
                            if (!visited.has(other)) {
                                visited.add(other);
                                queue.push(other);
                            }
                        }
                    }
                }
            }
            return visited;
        };

        const batteryPos = `${battery.id}_pos`;
        const batteryNeg = `${battery.id}_neg`;

        const posCircuit = getElectricalGroup(batteryPos);
        const negCircuit = getElectricalGroup(batteryNeg);

        // Normalized plate terminal sets for easier checking
        const mbId = meterBridge.id;
        const plateA = [`${mbId}_A1`, `${mbId}_A2`].map(s => s.toLowerCase());
        const plateL = [`${mbId}_L1`, `${mbId}_L2`].map(s => s.toLowerCase());
        const plateD = [`${mbId}_D`].map(s => s.toLowerCase());
        const plateR = [`${mbId}_R1`, `${mbId}_R2`].map(s => s.toLowerCase());
        const plateC = [`${mbId}_C1`, `${mbId}_C2`].map(s => s.toLowerCase());

        const mainLoopClosed =
            (plateA.some(t => posCircuit.has(t)) && plateC.some(t => negCircuit.has(t))) ||
            (plateC.some(t => posCircuit.has(t)) && plateA.some(t => negCircuit.has(t)));

        if (!mainLoopClosed) {
            return { R: 0, X: 0, voltage: 0, l: -1, error: 'Circuit Open' };
        }

        // Resistance Box Check (must bridge Gap A-L or Gap R-C)
        const rbT1 = `${resBox.id}_t1`;
        const rbT2 = `${resBox.id}_t2`;
        const rbCircuit1 = getElectricalGroup(rbT1);
        const rbCircuit2 = getElectricalGroup(rbT2);

        const rbInLeftGap =
            (plateA.some(t => rbCircuit1.has(t)) && plateL.some(t => rbCircuit2.has(t))) ||
            (plateA.some(t => rbCircuit2.has(t)) && plateL.some(t => rbCircuit1.has(t)));

        const rbInRightGap =
            (plateR.some(t => rbCircuit1.has(t)) && plateC.some(t => rbCircuit2.has(t))) ||
            (plateR.some(t => rbCircuit2.has(t)) && plateC.some(t => rbCircuit1.has(t)));

        if (!rbInLeftGap && !rbInRightGap) {
            return { R: 0, X: 0, voltage: 0, l: -1, error: 'RB not in gap' };
        }

        // Galvanometer Check
        const galv = placedInstruments.find(i => i.type === 'galvanometer');
        if (!galv) return { R: 0, X: 0, voltage: 0, l: -1, error: 'Galvanometer missing' };

        const galvT1 = `${galv.id}_t1`;
        const galvT2 = `${galv.id}_t2`;
        const jkT = `${jockey.id}_t`;

        const groupT1 = getElectricalGroup(galvT1);
        const groupT2 = getElectricalGroup(galvT2);

        const galvConnected =
            (plateD.some(t => groupT1.has(t)) && groupT2.has(jkT.toLowerCase())) ||
            (groupT1.has(jkT.toLowerCase()) && plateD.some(t => groupT2.has(t)));

        if (!galvConnected) {
            return { R: 0, X: 0, voltage: 0, l: -1, error: 'Galv/Jockey open' };
        }

        // If we reach here, the electrical paths are physically connected.
        const isPlugKeyClosed = plugKey ? instrumentValues[plugKey.id] === 1 : true;
        if (!isPlugKeyClosed) {
            return { R: 0, X: 0, voltage: 0, l: -1, error: 'Key Open' };
        }

        // Calculate distance 'l'
        const relativeX = jockey.position[0] - meterBridge.position[0];
        const bridgeWidth = 10;
        const l = parseFloat((((relativeX + bridgeWidth / 2) / bridgeWidth) * 100).toFixed(1));

        const R_val = instrumentValues[resBox.id] || 5;
        const targetXKey = `targetX_${meterBridge.id}`;
        const X_val = instrumentValues[targetXKey] || 7.5;
        const voltage_val = instrumentValues[battery.id] || 2;

        // CONTACT CHECK:
        // Combined world coordinates from Scene.tsx and Table.tsx
        // Table top Y=1.9. Instruments at Y=2.0. Jockey dragger at Y=2.18.
        const mbZ = meterBridge.position[2];
        const wireZ = mbZ + 0.35; // Matches MeterBridge.tsx wire position

        const isTouchingWire =
            Math.abs(jockey.position[2] - wireZ) < 0.25 && // Relaxed from 0.6 to 0.25 but stricter in alignment
            jockey.position[1] < 2.6 && jockey.position[1] > 1.7; // Lowered bottom bound to 1.7 for better detection

        if (!isTouchingWire) {
            return { R: R_val, X: X_val, voltage: voltage_val, l, error: 'Touch the wire with jockey' };
        }

        return { R: R_val, X: X_val, voltage: voltage_val, l, error: null };
    }, [placedInstruments, connections, instrumentValues]);

    useEffect(() => {
        setSimulationError(simulationState?.error || null);

        if (simulationState && !simulationState.error) {
            const { R, X, voltage, l } = simulationState;
            if (!isNaN(l) && l >= 0 && l <= 100) {
                const deflection = calculateGalvanometerDeflection({
                    R, X, voltage, jockeyPos: l, wireResistancePerCm: 0.1
                });
                setDeflection(isNaN(deflection) ? 0 : deflection);
                setCurrentL(l);
            } else {
                setDeflection(0);
                setCurrentL(-1);
            }
        } else {
            setDeflection(0);
            setCurrentL(-1);
        }
    }, [simulationState, setDeflection, setCurrentL, setSimulationError]);

    return simulationState;
}
