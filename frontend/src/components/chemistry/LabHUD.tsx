import React, { useState } from "react";
import { useLabState } from "@/lib/chemistry/LabContext";
import { ExperimentInfoPanel } from "./ExperimentInfoPanel";

const EXPERIMENTS = [
    { id: "chloride_test", title: "Chloride Ion Test", desc: "Detect Chloride ions using Silver Nitrate (AgNO3)." },
    { id: "sulphate_test", title: "Sulphate Ion Test", desc: "Detect Sulphate ions using Barium Chloride (BaCl2)." },
    { id: "copper_test", title: "Copper(II) Ion Test", desc: "Detect Copper(II) ions using Ammonium Hydroxide (NH4OH)." },
    { id: "iron_test", title: "Iron(III) Ion Test", desc: "Detect Iron(III) ions using Pot. Thiocyanate (KSCN)." },
    { id: "chromate_test", title: "Chromate Ion Test", desc: "Detect Chromate ions using Barium Chloride (BaCl2)." },
    { id: "ammonium_test", title: "Ammonium Ion Test", desc: "Detect Ammonium ions using Sodium Hydroxide and Heat." }
];

const STEPS: Record<string, { title: string, steps: string[] }> = {
    chloride_test: {
        title: "Chloride Ion Test",
        steps: [
            "Take a clean test tube from the rack.",
            "Add a Chloride Salt solution or Hydrochloric Acid (HCl).",
            "Using the dropper, collect Silver Nitrate (AgNO3).",
            "Add AgNO3 solution dropwise into the test tube.",
            "Observe formation of a white curdy precipitate of Silver Chloride (AgCl)."
        ]
    },
    sulphate_test: {
        title: "Sulphate Ion Test",
        steps: [
            "Take a clean test tube.",
            "Add Sulphate Salt solution into the test tube.",
            "Using the dropper, collect Barium Chloride (BaCl2).",
            "Add BaCl2 solution into the test tube.",
            "Observe the white precipitate of Barium Sulphate (BaSO4)."
        ]
    },
    copper_test: {
        title: "Copper(II) Ion Test",
        steps: [
            "Take a clean test tube.",
            "Add Copper(II) Sulphate (CuSO4) or Copper(II) Salt solution into the tube.",
            "Use the dropper to collect Ammonium Hydroxide (NH4OH).",
            "Add NH4OH solution dropwise.",
            "Observe the formation of deep blue complex solution."
        ]
    },
    iron_test: {
        title: "Iron(III) Ion Test",
        steps: [
            "Take a clean test tube.",
            "Add Iron(III) Chloride (FeCl3) or Iron(III) Salt solution.",
            "Using the dropper collect Pot. Thiocyanate (KSCN).",
            "Add KSCN solution into the test tube.",
            "Observe formation of a blood-red colored complex."
        ]
    },
    chromate_test: {
        title: "Chromate Ion Test",
        steps: [
            "Take a clean test tube.",
            "Add Potassium Chromate (K2CrO4) yellow solution or Chromate Salt.",
            "Use the dropper to collect Barium Chloride (BaCl2).",
            "Add BaCl2 solution into the test tube.",
            "Observe formation of yellow precipitate of Barium Chromate (BaCrO4)."
        ]
    },
    ammonium_test: {
        title: "Ammonium Ion Test",
        steps: [
            "Take a clean test tube.",
            "Add Ammonium Salt solution into the test tube.",
            "Add Sodium Hydroxide (NaOH) solution.",
            "Heat the test tube using the Bunsen burner.",
            "Observe evolution of Ammonia gas with pungent smell."
        ]
    }
};

export const LabHUD: React.FC = () => {
    const { state, nextStep, selectExperiment, resetLab, setTourState } = useLabState();
    const { currentStep, observations, activeExperiment, tourState } = state;

    const [activeMode, setActiveMode] = useState<'tour' | 'practice' | null>(null);
    const [isPracticeOpen, setIsPracticeOpen] = useState(true);
    const [isLogOpen, setIsLogOpen] = useState(true);
    const [isSelectorOpen, setIsSelectorOpen] = useState(true);

    const experiment = activeExperiment ? STEPS[activeExperiment] : null;

    // Reset mode selection when exiting experiment or tour
    const handleExit = () => {
        selectExperiment(null);
        setTourState({ isActive: false });
        setActiveMode(null);
    };

    return (
        <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1000,
            pointerEvents: "none",
            fontFamily: "'Segoe UI', Roboto, sans-serif"
        }}>
            <ExperimentInfoPanel />

            {/* ── Mode Selection Overlay ── */}
            {!activeMode && !tourState.isActive && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(45, 48, 50, 0.4)",
                    backdropFilter: "blur(10px)",
                    pointerEvents: "auto",
                    zIndex: 2000
                }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "30px",
                        width: "100%",
                        maxWidth: "900px",
                        padding: "40px"
                    }}>
                        {/* Guided Tour Card */}
                        <div 
                            style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "30px",
                                padding: "40px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(47, 141, 70, 0.1)";
                                e.currentTarget.style.borderColor = "rgba(47, 141, 70, 0.4)";
                                e.currentTarget.style.transform = "translateY(-10px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                            onClick={() => {
                                resetLab();
                                setTourState({ isActive: true, stepIndex: 0, isPaused: false });
                                setActiveMode('tour');
                            }}
                        >
                            <div style={{
                                width: "80px",
                                height: "80px",
                                background: "rgba(47, 141, 70, 0.1)",
                                borderRadius: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "24px",
                                fontSize: "32px",
                            }}>🧭</div>
                            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Guided Tour</h2>
                            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                                Experience a narrated walkthrough of the laboratory equipment and safety procedures.
                            </p>
                            <button style={{
                                background: "#2F8D46",
                                color: "black",
                                border: "none",
                                borderRadius: "12px",
                                padding: "12px 30px",
                                fontWeight: "800",
                                fontSize: "12px",
                                letterSpacing: "1px",
                                textTransform: "uppercase"
                            }}>Start Guided Tour</button>
                        </div>

                        {/* Practice Session Card */}
                        <div 
                            style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "30px",
                                padding: "40px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                                e.currentTarget.style.transform = "translateY(-10px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                            onClick={() => setActiveMode('practice')}
                        >
                            <div style={{
                                width: "80px",
                                height: "80px",
                                background: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "24px",
                                fontSize: "32px",
                            }}>🧪</div>
                            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Practice</h2>
                            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                                Open exploration mode. Select an experiment and perform it at your own pace.
                            </p>
                            <button style={{
                                background: "#ffffff",
                                color: "black",
                                border: "none",
                                borderRadius: "12px",
                                padding: "12px 30px",
                                fontWeight: "800",
                                fontSize: "12px",
                                letterSpacing: "1px",
                                textTransform: "uppercase"
                            }}>Practice Session</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                display: activeMode === 'practice' || tourState.isActive ? "flex" : "none",
                flexDirection: "column",
                gap: "20px",
            }}>
                {/* ── Experiment Selector ── */}
                {!activeExperiment ? (
                    <div style={{
                        position: "relative",
                        display: "flex",
                        transform: isSelectorOpen ? "translateX(0)" : "translateX(calc(-100% - 20px))",
                        transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    }}>
                        <div style={{
                            width: "350px",
                            background: "rgba(10, 15, 25, 0.85)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "16px",
                            padding: "20px",
                            color: "white",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                            pointerEvents: "auto"
                        }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#2F8D46" }}>Select Experiment</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {EXPERIMENTS.map((ex) => (
                                    <button
                                        key={ex.id}
                                        onClick={() => selectExperiment(ex.id)}
                                        style={{
                                            padding: "12px",
                                            background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "10px",
                                            color: "white",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(47, 141, 70, 0.1)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                    >
                                        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{ex.title}</div>
                                        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>{ex.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Tab Button */}
                        <button
                            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                            style={{
                                position: "absolute",
                                right: "-32px",
                                top: "20px",
                                width: "32px",
                                height: "48px",
                                background: "rgba(10, 15, 25, 0.85)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderLeft: "none",
                                borderRadius: "0 12px 12px 0",
                                color: "#2F8D46",
                                cursor: "pointer",
                                pointerEvents: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                backdropFilter: "blur(12px)",
                                boxShadow: "5px 0 15px rgba(0,0,0,0.3)"
                            }}
                        >
                            {isSelectorOpen ? "◀" : "▶"}
                        </button>
                    </div>
                ) : (
                    <div style={{
                        position: "relative",
                        display: "flex",
                        transform: isPracticeOpen ? "translateX(0)" : "translateX(calc(-100% - 20px))",
                        transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    }}>
                        <div style={{
                            width: "350px",
                            background: "rgba(10, 15, 25, 0.85)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "16px",
                            padding: "20px",
                            color: "white",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                            pointerEvents: "auto"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                <div style={{ fontSize: "12px", color: "#2F8D46", fontWeight: "bold", textTransform: "uppercase" }}>
                                    Experiment In Progress
                                </div>
                                <button 
                                    onClick={() => selectExperiment(null)}
                                    style={{ background: "none", border: "none", color: "#ff5252", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}
                                >
                                    EXIT
                                </button>
                            </div>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>{experiment?.title}</h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                                {experiment?.steps.map((step, i) => (
                                    <div key={i} style={{ 
                                        display: "flex", 
                                        gap: "10px", 
                                        fontSize: "13px", 
                                        color: i === currentStep ? "white" : "#666",
                                        opacity: i <= currentStep ? 1 : 0.5
                                    }}>
                                        <div style={{ 
                                            minWidth: "18px", 
                                            height: "18px", 
                                            borderRadius: "50%", 
                                            background: i < currentStep ? "#4caf50" : (i === currentStep ? "#2F8D46" : "rgba(255,255,255,0.1)"),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "10px",
                                            fontWeight: "bold"
                                        }}>
                                            {i < currentStep ? "✓" : i + 1}
                                        </div>
                                        <div style={{ fontWeight: i === currentStep ? "600" : "400" }}>{step}</div>
                                    </div>
                                ))}
                            </div>

                            {currentStep < (experiment?.steps.length || 0) && (
                                <button
                                    onClick={nextStep}
                                    style={{
                                        marginTop: "20px",
                                        padding: "10px 16px",
                                        width: "100%",
                                        background: "rgba(47, 141, 70, 0.2)",
                                        border: "1px solid #2F8D46",
                                        color: "#2F8D46",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(47, 141, 70, 0.3)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(47, 141, 70, 0.2)"}
                                >
                                    NEXT STEP
                                </button>
                            )}
                        </div>
                        {/* Tab Button */}
                        <button
                            onClick={() => setIsPracticeOpen(!isPracticeOpen)}
                            style={{
                                position: "absolute",
                                right: "-32px",
                                top: "20px",
                                width: "32px",
                                height: "48px",
                                background: "rgba(10, 15, 25, 0.85)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderLeft: "none",
                                borderRadius: "0 12px 12px 0",
                                color: "#2F8D46",
                                cursor: "pointer",
                                pointerEvents: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                backdropFilter: "blur(12px)",
                                boxShadow: "5px 0 15px rgba(0,0,0,0.3)"
                            }}
                        >
                            {isPracticeOpen ? "◀" : "▶"}
                        </button>
                    </div>
                )}

                {/* ── Observations Feed ── */}
                <div style={{
                    position: "relative",
                    display: "flex",
                    transform: isLogOpen ? "translateX(0)" : "translateX(calc(-100% - 20px))",
                    transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}>
                    <div style={{
                        width: "350px",
                        background: "rgba(45, 48, 50, 0.85)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        padding: "15px",
                        maxHeight: "300px",
                        color: "white",
                        pointerEvents: "auto",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <div style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", marginBottom: "10px", fontWeight: "bold", letterSpacing: "0.5px" }}>Observation Log</div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", paddingRight: "5px" }}>
                            {observations.length === 0 && <div style={{ fontSize: "13px", fontStyle: "italic", color: "#666" }}>No observations yet...</div>}
                            {observations.map((obs) => (
                                <div key={obs.id} style={{ 
                                    borderLeft: `3px solid ${obs.color || "#2F8D46"}`, 
                                    paddingLeft: "12px",
                                    padding: "4px 0",
                                    background: "rgba(255,255,255,0.03)",
                                    borderRadius: "0 8px 8px 0"
                                }}>
                                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{obs.text}</div>
                                    {obs.equation && <div style={{ fontSize: "11px", color: "#2F8D46", marginTop: "4px", fontFamily: "'Fira Code', monospace" }}>{obs.equation}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Tab Button */}
                    <button
                        onClick={() => setIsLogOpen(!isLogOpen)}
                        style={{
                            position: "absolute",
                            right: "-32px",
                            top: "20px",
                            width: "32px",
                            height: "48px",
                            background: "rgba(45, 48, 50, 0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderLeft: "none",
                            borderRadius: "0 12px 12px 0",
                            color: "#aaa",
                            cursor: "pointer",
                            pointerEvents: "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            backdropFilter: "blur(12px)",
                            boxShadow: "5px 0 15px rgba(0,0,0,0.3)"
                        }}
                    >
                        {isLogOpen ? "◀" : "▶"}
                    </button>
                </div>
            </div>

            {/* ── Top Right Controls ── */}
            <div style={{
                position: "absolute",
                top: 20,
                right: 20,
                display: "flex",
                gap: "12px",
                pointerEvents: "auto"
            }}>
                <button
                    onClick={handleExit}
                    style={{
                        padding: "10px 16px",
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    CHANGE MODE
                </button>

                <button
                    onClick={resetLab}
                    style={{
                        padding: "10px 16px",
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    ↺ Reset
                </button>
            </div>
        </div>
    );
};
