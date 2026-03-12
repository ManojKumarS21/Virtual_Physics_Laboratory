'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, FlaskConical, ArrowRight } from 'lucide-react';
import { useLabStore } from '../hooks/useLabStore';

// Defines the allowed connections for each step.
// Order of from/to does not matter as we will check both ways
const WORKOUT_STEPS = [
    {
        title: "Step 1: Power Loop (Positive)",
        instruction: "Connect the Battery positive to the Meter Bridge (A1 or A2).",
        id: 'battery_pos-meter_bridge_A1', alternatives: [{ from: 'battery_pos', to: 'meter_bridge_A1' }, { from: 'battery_pos', to: 'meter_bridge_A2' }]
    },
    {
        title: "Step 2: Power Loop (Negative)",
        instruction: "Connect the Battery negative to one side of the Plug Key.",
        id: 'battery_neg-plug_key_t1', alternatives: [{ from: 'battery_neg', to: 'plug_key_t1' }, { from: 'battery_neg', to: 'plug_key_t2' }]
    },
    {
        title: "Step 3: Power Loop (Completion)",
        instruction: "Connect the other side of the Plug Key to the Meter Bridge (C1 or C2).",
        id: 'plug_key_t2-meter_bridge_C1', alternatives: [{ from: 'plug_key_t2', to: 'meter_bridge_C1' }, { from: 'plug_key_t1', to: 'meter_bridge_C1' }, { from: 'plug_key_t2', to: 'meter_bridge_C2' }, { from: 'plug_key_t1', to: 'meter_bridge_C2' }]
    },
    {
        title: "Step 4: Known Resistance (Side 1)",
        instruction: "Connect one side of the Resistance Box to the LEFT gap of the Meter Bridge.",
        id: 'resbox_t1-meter_bridge_L1', alternatives: [{ from: 'resistance_box_t1', to: 'meter_bridge_A2' }, { from: 'resistance_box_t1', to: 'meter_bridge_L1' }, { from: 'resistance_box_t1', to: 'meter_bridge_A1' }, { from: 'resistance_box_t1', to: 'meter_bridge_L2' }, { from: 'resistance_box_t2', to: 'meter_bridge_A2' }, { from: 'resistance_box_t2', to: 'meter_bridge_L1' }, { from: 'resistance_box_t2', to: 'meter_bridge_A1' }, { from: 'resistance_box_t2', to: 'meter_bridge_L2' }]
    },
    {
        title: "Step 5: Known Resistance (Side 2)",
        instruction: "Connect the other side of the Resistance Box to the other terminal of the LEFT gap.",
        id: 'resbox_t2-meter_bridge_L2', alternatives: [{ from: 'resistance_box_t2', to: 'meter_bridge_L1' }, { from: 'resistance_box_t2', to: 'meter_bridge_A2' }, { from: 'resistance_box_t2', to: 'meter_bridge_L2' }, { from: 'resistance_box_t2', to: 'meter_bridge_A1' }, { from: 'resistance_box_t1', to: 'meter_bridge_L1' }, { from: 'resistance_box_t1', to: 'meter_bridge_A2' }, { from: 'resistance_box_t1', to: 'meter_bridge_L2' }, { from: 'resistance_box_t1', to: 'meter_bridge_A1' }]
    },
    {
        title: "Step 6: Galvanometer",
        instruction: "Connect the Galvanometer to the central terminal of the Meter Bridge.",
        id: 'galv_t1-meter_bridge_D', alternatives: [{ from: 'galvanometer_t1', to: 'meter_bridge_D' }, { from: 'galvanometer_t2', to: 'meter_bridge_D' }]
    },
    {
        title: "Step 7: Jockey",
        instruction: "Connect the Jockey to the other terminal of the Galvanometer.",
        id: 'jockey-galvanometer', alternatives: [{ from: 'jockey_t', to: 'galvanometer_t2' }, { from: 'jockey_t', to: 'galvanometer_t1' }]
    }
];

const WORKOUT_INSTRUMENTS = [
    { type: 'battery', name: 'Laclanche Cell', id: 'battery', pos: [-4.8, 2.05, -1.2] },
    { type: 'plug_key', name: 'Plug Key', id: 'plug_key', pos: [-2.8, 2.05, -1.2] },
    { type: 'jockey', name: 'Jockey', id: 'jockey', pos: [-0.6, 2.15, -1.2] },
    { type: 'resistance_box', name: 'Resistance Box', id: 'resistance_box', pos: [2.0, 2.1, -1.2] },
    { type: 'galvanometer', name: 'Galvanometer', id: 'galvanometer', pos: [4.6, 2.1, -1.2] },
    { type: 'meter_bridge', name: 'Meter Bridge', id: 'meter_bridge', pos: [0, 2.05, 0.8] },
];

const WORKOUT_CONTENT: Record<string, Record<string, string>> = {
    en: {
        step1: "Connect the Battery positive to the Meter Bridge (A1 or A2).",
        step2: "Connect the Battery negative to one side of the Plug Key.",
        step3: "Connect the other side of the Plug Key to the Meter Bridge (C1 or C2).",
        step4: "Connect one side of the Resistance Box to the LEFT gap of the Meter Bridge.",
        step5: "Connect the other side of the Resistance Box to the other terminal of the LEFT gap.",
        step6: "Connect the Galvanometer to the central terminal of the Meter Bridge.",
        step7: "Connect the Jockey to the other terminal of the Galvanometer.",
        complete: "Workout Complete! Great! All connections are correct. You are ready to perform the experiment.",
        correct: "Correct Connection",
        wrong: "Wrong Connection"
    },
    hi: {
        step1: "बैटरी के पॉजिटिव को मीटर ब्रिज (A1 या A2) से जोड़ें।",
        step2: "बैटरी के नेगेटिव को प्लग की के एक तरफ जोड़ें।",
        step3: "प्लग की के दूसरी तरफ को मीटर ब्रिज (C1 या C2) से जोड़ें।",
        step4: "रेजिस्टेंस बॉक्स के एक हिस्से को मीटर ब्रिज के बाएं गैप से जोड़ें।",
        step5: "रेजिस्टेंस बॉक्स के दूसरे हिस्से को बाएं गैप के दूसरे टर्मिनल से जोड़ें।",
        step6: "गैल्वेनोमीटर को मीटर ब्रिज के केंद्रीय टर्मिनल से जोड़ें।",
        step7: "जॉकी को गैल्वेनोमीटर के दूसरे टर्मिनल से जोड़ें।",
        complete: "वर्कआउट पूरा हुआ! बहुत बढ़िया! सभी कनेक्शन सही हैं। अब आप प्रयोग करने के लिए तैयार हैं।",
        correct: "सही कनेक्शन",
        wrong: "गलत कनेक्शन"
    },
    te: {
        step1: "బ్యాటరీ పాజిటివ్‌ను మీటర్ బ్రిడ్జ్ (A1 లేదా A2)కి కనెక్ట్ చేయండి.",
        step2: "బ్యాటరీ నెగిటివ్‌ను ప్లగ్ కీకి ఒక వైపు కనెక్ట్ చేయండి.",
        step3: "ప్లగ్ కీ యొక్క دوسری వైపును మీటర్ బ్రిడ్జ్ (C1 లేదా C2)కి కనెక్ట్ చేయండి.",
        step4: "రెసిస్టెన్స్ బాక్స్ యొక్క ఒక వైపును మీటర్ బ్రిడ్జ్ యొక్క ఎడమ గ్యాప్‌కు కనెక్ట్ చేయండి.",
        step5: "రెసిస్టెన్స్ బాక్స్ యొక్క మరొక వైపును ఎడమ గ్యాప్ యొక్క మరొక టెర్మినల్‌కు కనెక్ట్ చేయండి.",
        step6: "గాల్వనోమీటర్‌ను మీటర్ బ్రిడ్జ్ యొక్క సెంట్రల్ టెర్మినల్‌కు కనెక్ట్ చేయండి.",
        step7: "జోకానీని గాల్వనోమీటర్ యొక్క మరొక టెర్మినల్‌కు కనెక్ట్ చేయండి.",
        complete: "వర్కౌట్ పూర్తయింది! గ్రేట్! అన్ని కనెక్షన్‌లు సరైనవి. మీరు ప్రయోగాన్ని నిర్వహించడానికి సిద్ధంగా ఉన్నారు.",
        correct: "సరైన కనెక్షన్",
        wrong: "తప్పు కనెక్షన్"
    },
    mr: {
        step1: "बॅटरीचा पॉझिटिव्ह मीटर ब्रिजला (A1 किंवा A2) जोडा.",
        step2: "बॅटरीचा निगेटिव्ह प्लग की च्या एका बाजूला जोडा.",
        step3: "प्लग की ची दुसरी बाजू मीटर ब्रिजला (C1 किंवा C2) जोडा.",
        step4: "रेझिस्टन्स बॉक्सची एक बाजू मीटर ब्रिजच्या डाव्या गॅपला जोडा.",
        step5: "रेझिस्टन्स बॉक्सची दुसरी बाजू डाव्या गॅपच्या दुसऱ्या टर्मिनलला जोडा.",
        step6: "गॅल्व्हानोमीटर मीटर ब्रिजच्या मध्यवर्ती टर्मिनलला जोडा.",
        step7: "जॉकी गॅल्व्हानोमीटरच्या दुसऱ्या टर्मिनलला जोडा.",
        complete: "वर्कआउट पूर्ण झाले! खूप छान! सर्व कनेक्शन अचूक आहेत. आपण प्रयोग करण्यासाठी तयार आहात.",
        correct: "योग्य कनेक्शन",
        wrong: "चुकीचे कनेक्शन"
    }
};

export default function WorkoutMode() {
    const { workoutState, setWorkoutState, currentScreen, setScreen, resetLab, addInstrument, connections, undoConnection, setHoldingWire, isHoldingWire, language, voiceEnabled } = useLabStore();
    const { isActive, stepIndex } = workoutState;
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const prevConnectionsRef = useRef(connections.length);
    const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSpeakIdRef = useRef(0);

    // Ensure voices are loaded
    useEffect(() => {
        const loadVoices = () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.getVoices();
            }
        };
        loadVoices();
        if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const isComplete = stepIndex > WORKOUT_STEPS.length;
    const currentStepData = !isComplete ? WORKOUT_STEPS[stepIndex - 1] : null;

    const speak = (text: string) => {
        if (!voiceEnabled) return;
        
        const speakId = ++currentSpeakIdRef.current;

        // Stop all previous speech immediately
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
        
        if (!window.speechSynthesis) return;
        
        // Use a small timeout to let cancel() take full effect across different browsers
        setTimeout(() => {
            if (speakId !== currentSpeakIdRef.current) return;

            const voices = window.speechSynthesis.getVoices();
            const targetLang = language === 'te' ? 'te-IN' : (language === 'hi' ? 'hi-IN' : (language === 'mr' ? 'mr-IN' : 'en-IN'));
            
            // Find voices for the target language and prioritize ones that look "male"
            const langVoices = voices.filter(v => v.lang.startsWith(targetLang));
            const maleVoice = langVoices.find(v => 
                v.name.toLowerCase().includes('male') || 
                v.name.toLowerCase().includes('david') || 
                v.name.toLowerCase().includes('guy') || 
                v.name.toLowerCase().includes('stefan') ||
                v.name.toLowerCase().includes('ravi') ||
                v.name.toLowerCase().includes('prakash') ||
                v.name.toLowerCase().includes('prabhat')
            );
            const voice = maleVoice || langVoices[0];
            
            if (voice) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = voice;
                utterance.lang = targetLang;
                utterance.rate = 1.0; // Slightly faster for clarity
                utterance.pitch = 0.9; // Adjusted for a clear male tone
                window.speechSynthesis.speak(utterance);
            } else {
                const playAudio = async () => {
                    const proxyUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${language}`;
                    try {
                        const response = await fetch(proxyUrl);
                        if (!response.ok) return;
                        if (speakId !== currentSpeakIdRef.current) return;
                        const blob = await response.blob();
                        const audioUrl = URL.createObjectURL(blob);
                        if (speakId !== currentSpeakIdRef.current) return;
                        const audio = new Audio(audioUrl);
                        audioRef.current = audio;
                        await audio.play();
                    } catch (e) {}
                };
                playAudio();
            }
        }, 100);
    };

    // Trigger voice on step change
    useEffect(() => {
        if (isActive && currentScreen === 'WORKOUT') {
            if (isComplete) {
                speak(WORKOUT_CONTENT[language].complete);
            } else {
                const stepKey = `step${stepIndex}`;
                speak(WORKOUT_CONTENT[language][stepKey]);
            }
        }
    }, [isActive, stepIndex, language, currentScreen]);

    // Auto-equip wire in Workout mode if not holding one 
    useEffect(() => {
        if (isActive && !isComplete && !isHoldingWire) {
            setHoldingWire(true);
        }
    }, [isActive, isHoldingWire, isComplete, setHoldingWire]);

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message });
        
        // Voice feedback for success/wrong
        speak(type === 'success' ? WORKOUT_CONTENT[language].correct : WORKOUT_CONTENT[language].wrong);
        
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
            setFeedback(null);
        }, 3000);
    };

    // Connection Validation Logic
    useEffect(() => {
        if (!isActive || stepIndex > WORKOUT_STEPS.length) return;

        // A new connection was added
        if (connections.length > prevConnectionsRef.current) {
            const newConnection = connections[connections.length - 1];
            const currentStepData = WORKOUT_STEPS[stepIndex - 1];
            
            // Check if this connection matches the CURRENT step's alternatives
            const matches = currentStepData.alternatives.some(alt => 
                (alt.from === newConnection.from && alt.to === newConnection.to) ||
                (alt.from === newConnection.to && alt.to === newConnection.from)
            );

            if (matches) {
                showFeedback('success', 'Correct Connection ✓');
                
                if (stepIndex < WORKOUT_STEPS.length) {
                    setTimeout(() => {
                        setWorkoutState({ stepIndex: stepIndex + 1 });
                        setHoldingWire(true);
                    }, 500); // .5s delay before moving to next step
                } else {
                    // Finished all steps
                    setTimeout(() => {
                        setWorkoutState({ stepIndex: stepIndex + 1 }); // Proceed to completion state
                        setHoldingWire(false);
                    }, 1000);
                }

            } else {
                // Invalid connection
                showFeedback('error', 'Wrong Connection ✗');
                setTimeout(() => {
                    undoConnection(); // Remove the wrong wire after brief delay
                    setHoldingWire(true); // Re-equip immediately so they can try again
                }, 500);
            }
        }
        
        // Always update ref to current length, even if it decreased due to undo
        prevConnectionsRef.current = connections.length;

    }, [connections, isActive, stepIndex, setWorkoutState, undoConnection]);

    if (!isActive || currentScreen !== 'WORKOUT') return null;

    return (
        <div className="absolute inset-x-0 bottom-32 z-50 pointer-events-none flex flex-col items-center justify-end">
            
            <AnimatePresence mode="wait">
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`mb-4 px-6 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 backdrop-blur-xl border ${
                            feedback.type === 'success' 
                                ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                : 'bg-red-500/20 border-red-500/50 text-red-400'
                        }`}
                    >
                        {feedback.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <span className="font-bold tracking-wide">{feedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!isComplete ? (
                    <motion.div
                        key={`step-${stepIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl w-full mx-4 bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[#e5e744] font-bold tracking-[0.2em] uppercase text-sm">
                                {currentStepData?.title}
                            </h3>
                            <span className="text-white/40 text-sm font-bold">
                                STEP {stepIndex} OF {WORKOUT_STEPS.length}
                            </span>
                        </div>
                        
                        <p className="text-white text-lg leading-relaxed mb-6">
                            {currentStepData?.instruction}
                        </p>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            <p className="text-[#3b82f6] font-bold text-sm tracking-wide">
                                Click two valid terminals to connect them with a wire.
                            </p>
                        </div>

                        <div className="flex gap-2 h-1.5">
                            {WORKOUT_STEPS.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                        i + 1 < stepIndex ? 'bg-green-500' :
                                        i + 1 === stepIndex ? 'bg-[#e5e744]' :
                                        'bg-white/10'
                                    }`} 
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="completion"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full mx-4 bg-[#2bb3a1]/20 backdrop-blur-xl border border-[#2bb3a1]/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(43,179,161,0.2)] text-center pointer-events-auto"
                    >
                        <div className="w-16 h-16 bg-[#2bb3a1] rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-black" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-4">Workout Complete!</h2>
                        <p className="text-white/80 mb-8 leading-relaxed">
                            Great! All {WORKOUT_STEPS.length} connections are correct. You are ready to perform the experiment.
                        </p>

                        <button
                            onClick={() => {
                                resetLab();
                                setWorkoutState({ isActive: false, stepIndex: 1 });
                                setScreen('PRACTICE');
                            }}
                            className="w-full py-4 bg-[#2bb3a1] hover:bg-[#259b8a] text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            MOVE TO PRACTICE MODE
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper (Copied from GuidedTour for instant instrument spawning)
function getTerminalsForType(type: string, instrumentId: string): any[] {
    switch (type) {
        case 'battery':
            return [
                { id: `${instrumentId}_pos`, instrumentId, position: [-0.3, 0.85, 0] },
                { id: `${instrumentId}_neg`, instrumentId, position: [0.3, 0.85, 0] },
            ];
        case 'galvanometer':
            return [
                { id: `${instrumentId}_t1`, instrumentId, position: [-0.4, 0, 0.2] },
                { id: `${instrumentId}_t2`, instrumentId, position: [0.4, 0, 0.2] },
            ];
        case 'resistance_box':
            return [
                { id: `${instrumentId}_t1`, instrumentId, position: [-0.6, 0, 0.65] },
                { id: `${instrumentId}_t2`, instrumentId, position: [0.6, 0, 0.65] },
            ];
        case 'meter_bridge':
            return [
                { id: `${instrumentId}_A1`, instrumentId, position: [-5.1, 0.3, 0.6] },
                { id: `${instrumentId}_A2`, instrumentId, position: [-5.1, 0.3, -0.6] },
                { id: `${instrumentId}_L1`, instrumentId, position: [-3.1, 0.3, -0.6] },
                { id: `${instrumentId}_L2`, instrumentId, position: [-1.9, 0.3, -0.6] },
                { id: `${instrumentId}_D`, instrumentId, position: [0, 0.3, -0.6] },
                { id: `${instrumentId}_R1`, instrumentId, position: [1.9, 0.3, -0.6] },
                { id: `${instrumentId}_R2`, instrumentId, position: [3.1, 0.3, -0.6] },
                { id: `${instrumentId}_C1`, instrumentId, position: [5.1, 0.3, 0.6] },
                { id: `${instrumentId}_C2`, instrumentId, position: [5.1, 0.3, -0.6] },
            ];
        case 'plug_key':
            return [
                { id: `${instrumentId}_t1`, instrumentId, position: [-0.4, 0.1, 0.4] },
                { id: `${instrumentId}_t2`, instrumentId, position: [0.4, 0.1, 0.4] },
            ];
        case 'jockey':
            return [
                { id: `${instrumentId}_t`, instrumentId, position: [0, 0.75, 0] }
            ];
        default:
            return [];
    }
}

export const initWorkoutInstruments = () => {
    const store = useLabStore.getState();
    store.resetLab();
    
    setTimeout(() => {
        const currentStore = useLabStore.getState();
        WORKOUT_INSTRUMENTS.forEach(inst => {
            const terminals = getTerminalsForType(inst.type, inst.id);
            currentStore.addInstrument(inst.type, inst.name, terminals, inst.id, inst.pos as [number, number, number]);
        });
    }, 100);
};
