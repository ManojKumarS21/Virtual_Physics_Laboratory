"use client";

import React from "react";
import { useLabState } from "@/lib/chemistry/LabContext";

export const ExperimentInfoPanel: React.FC = () => {
    const { state } = useLabState();
    const [dismissedId, setDismissedId] = React.useState<string | null>(null);
    const lastObservation = state.observations[0];

    if (!lastObservation || !lastObservation.equation) return null;
    if (dismissedId === lastObservation.id) return null;

    // We only show this panel for major reactions (confirmators)
    const text = lastObservation.text.toLowerCase();
    const isMajorReaction = text.includes("confirm") || 
                           text.includes("converted") ||
                           text.includes("reverted");

    if (!isMajorReaction) return null;

    return (
        <div style={{
            position: "absolute",
            bottom: "40px",
            right: "40px",
            width: "400px",
            padding: "24px",
            background: "rgba(45, 48, 50, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(47, 141, 70, 0.3)",
            borderRadius: "20px",
            color: "white",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(47, 141, 70, 0.1)",
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            zIndex: 2000,
            animation: "panel-slide-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes panel-slide-in {
                    from { transform: translateY(50px) scale(0.9); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .glow-text {
                    text-shadow: 0 0 10px rgba(47, 141, 70, 0.5);
                }
            `}} />

            {/* Close Button */}
            <button 
                onClick={() => setDismissedId(lastObservation.id)}
                style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "4px",
                    lineHeight: "1",
                    transition: "color 0.2s",
                    pointerEvents: "auto",
                    zIndex: 2001
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
                ×
            </button>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "10px", 
                    background: lastObservation.color || "#2F8D46",
                    boxShadow: `0 0 15px ${lastObservation.color || "#2F8D46"}`
                }} />
                <div>
                    <div style={{ fontSize: "12px", color: "#2F8D46", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Experiment Result
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "600" }} className="glow-text">
                        Reaction Successful
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "4px" }}>Observation</div>
                <div style={{ fontSize: "15px", lineHeight: "1.4" }}>{lastObservation.text}</div>
            </div>

            <div style={{ 
                background: "rgba(0,0,0,0.3)", 
                padding: "16px", 
                borderRadius: "12px", 
                border: "1px solid rgba(255,255,255,0.05)"
            }}>
                <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase" }}>Chemical Equation</div>
                <div style={{ 
                    fontFamily: "'Fira Code', monospace", 
                    fontSize: "14px", 
                    color: "#2F8D46",
                    wordBreak: "break-all"
                }}>
                    {lastObservation.equation}
                </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ 
                    fontSize: "12px", 
                    color: "#2F8D46", 
                    padding: "4px 12px", 
                    borderRadius: "20px", 
                    background: "rgba(47, 141, 70, 0.1)",
                    border: "1px solid rgba(47, 141, 70, 0.2)"
                }}>
                    Qualitative Analysis Verified
                </div>
            </div>
        </div>
    );
};
