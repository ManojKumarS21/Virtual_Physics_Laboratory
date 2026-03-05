'use client';

import { useEffect, useMemo } from 'react';
import { useLabStore } from '../hooks/useLabStore';
import { calculateGalvanometerDeflection } from '../physics/meterBridgePhysics';

export function usePhysicsEngine() {
    const { placedInstruments, connections, instrumentValues, setDeflection } = useLabStore();

    const simulationState = useMemo(() => {
        const battery = placedInstruments.find(i => i.type === 'battery');
        const resBox = placedInstruments.find(i => i.type === 'resistance_box');
        const meterBridge = placedInstruments.find(i => i.type === 'meter_bridge');
        const jockey = placedInstruments.find(i => i.type === 'jockey');
        const plugKey = placedInstruments.find(i => i.type === 'plug_key');

        if (!battery || !resBox || !meterBridge || !jockey) return null;

        // Check if circuit is "closed" via wires
        // Simple connectivity check (direct or via plug key)
        const isConnected = (tid1: string, tid2: string) => {
            return connections.some(c => (c.from === tid1 && c.to === tid2) || (c.from === tid2 && c.to === tid1));
        };

        const batteryPos = `${battery.id}_pos`;
        const batteryNeg = `${battery.id}_neg`;
        const mbA = `${meterBridge.id}_A1`;
        const mbC = `${meterBridge.id}_C1`;
        const pkT1 = plugKey ? `${plugKey.id}_t1` : null;
        const pkT2 = plugKey ? `${plugKey.id}_t2` : null;

        // Requirement: Battery connects to A and C (possibly via Plug Key)
        const mainLoopClosed =
            (isConnected(batteryPos, mbA) || isConnected(batteryPos, mbC)) &&
            (isConnected(batteryNeg, mbC) || isConnected(batteryNeg, mbA) ||
                (pkT1 && pkT2 && isConnected(batteryNeg, pkT1) && isConnected(pkT2, mbC)));

        if (!mainLoopClosed) return { R: 0, X: 0, voltage: 0, l: -1, error: 'Circuit Open' };

        // Check if Plug Key is closed
        const isPlugKeyClosed = plugKey ? instrumentValues[plugKey.id] === 1 : true;
        if (!isPlugKeyClosed) return { R: 0, X: 0, voltage: 0, l: -1, error: 'Key Open' };

        // Resistance Box connection (Left Gap)
        const rbT1 = `${resBox.id}_t1`;
        const rbT2 = `${resBox.id}_t2`;
        const mbA2 = `${meterBridge.id}_A2`;
        const mbL1 = `${meterBridge.id}_L1`;

        const rbConnected = isConnected(rbT1, mbA2) && isConnected(rbT2, mbL1);
        if (!rbConnected) return { R: 0, X: 0, voltage: 0, l: -1, error: 'RB not in gap' };

        // Galvanometer path
        const galv = placedInstruments.find(i => i.type === 'galvanometer');
        if (!galv) return { R: 0, X: 0, voltage: 0, l: -1, error: 'Galv missing' };

        const galvT1 = `${galv.id}_t1`;
        const galvT2 = `${galv.id}_t2`;
        const mbD = `${meterBridge.id}_D`;
        const jkT = `${jockey.id}_t`;

        const galvConnected =
            (isConnected(mbD, galvT1) && isConnected(galvT2, jkT)) ||
            (isConnected(mbD, galvT2) && isConnected(galvT1, jkT));

        if (!galvConnected) return { R: 0, X: 0, voltage: 0, l: -1, error: 'Galv/Jockey open' };

        // Calculate distance 'l' from Meter Bridge left
        const relativeX = jockey.position[0] - meterBridge.position[0];
        if (isNaN(relativeX)) return { R: 0, X: 0, voltage: 0, l: -1 };

        const bridgeWidth = 10;
        const l = ((relativeX + bridgeWidth / 2) / bridgeWidth) * 100;

        // Resistance values
        const R = instrumentValues[resBox.id] || 0;
        const X = 10; // Fixed unknown resistance for now
        const voltage = instrumentValues[battery.id] || 2;

        return { R, X, voltage, l };
    }, [placedInstruments, connections, instrumentValues]);

    useEffect(() => {
        if (simulationState && !simulationState.error) {
            const { R, X, voltage, l } = simulationState;
            if (!isNaN(l) && l >= 0 && l <= 100) {
                const deflection = calculateGalvanometerDeflection({
                    R, X, voltage, jockeyPos: l, wireResistancePerCm: 0.1
                });
                setDeflection(isNaN(deflection) ? 0 : deflection);
            } else {
                setDeflection(0);
            }
        } else {
            setDeflection(0);
        }
    }, [simulationState, setDeflection]);

    return simulationState;
}
