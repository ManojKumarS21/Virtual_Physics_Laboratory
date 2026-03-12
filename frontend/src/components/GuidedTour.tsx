'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, ChevronRight, ChevronLeft, Info, Volume2, VolumeX, FlaskConical, Languages, Check } from 'lucide-react';
import { useLabStore } from '../hooks/useLabStore';
import { initWorkoutInstruments } from './WorkoutMode';

const TOUR_CONTENT: Record<string, Record<string, string>> = {
    en: {
        intro_gal: "This is the Galvanometer. It is used to detect small electric currents in the circuit.",
        intro_rb: "This is the Resistance Box. It is used to vary the resistance in the circuit.",
        intro_mb: "This is the Meter Bridge. It is the core instrument used to compare resistances and find the unknown one.",
        intro_bat: "This is the Laclanche Cell. It serves as the primary power source for your experiment.",
        intro_key: "This is the Plug Key. It acts as a switch to complete or break the electrical circuit.",
        intro_jok: "This is the Jockey. It is used to make contact at various points on the meter wire to find the null point.",
        intro_wires: "Finally, these are the Connecting Wires. They are used to create secure electrical paths between all instruments.",
        
        intro: "Now that we know the instruments, let's see how to find the resistance of a wire.",
        setup: "The Meter Bridge is the main instrument. We use a Resistance Box for known resistance and an Unknown Resistance Wire in the right gap.",
        connections: "Connecting the Laclanche Cell, Plug Key, Meter Bridge, Resistance Box, and Galvanometer as per the standard circuit.",
        sliding: "The Jockey is touched to the wire and moved along its length to find the balance point.",
        nullPoint: "Keep moving the Jockey until the Galvanometer needle returns to zero.",
        balanceLength: "The length 'l' from the left end to the null point is recorded from the meter scale.",
        calculation: "X = R * (100 - l) / l. You've successfully found the resistance!",
        unlockHint: "( You can slide the jockey now )"
    },
    hi: {
        intro_gal: "यह गैल्वेनोमीटर है। इसका उपयोग सर्किट में छोटी विद्युत धाराओं का पता लगाने के लिए किया जाता है।",
        intro_rb: "यह रेजिस्टेंस बॉक्स है। इसका उपयोग सर्किट में प्रतिरोध को बदलने के लिए किया जाता है।",
        intro_mb: "यह मीटर ब्रिज है। यह प्रतिरोधों की तुलना करने और अज्ञात को खोजने के लिए उपयोग किया जाने वाला मुख्य उपकरण है।",
        intro_bat: "यह लेक्लांचे सेल है। यह आपके प्रयोग के लिए प्राथमिक शक्ति स्रोत के रूप में कार्य करता है।",
        intro_key: "यह प्लग की है। यह विद्युत सर्किट को पूरा करने या तोड़ने के लिए स्विच के रूप में कार्य करता है।",
        intro_jok: "यह जॉकी है। इसका उपयोग शून्य बिंदु खोजने के लिए मीटर तार पर विभिन्न बिंदुओं पर संपर्क बनाने के लिए किया जाता है।",
        intro_wires: "अंत में, ये कनेक्टिंग वायर हैं। इनका उपयोग सभी उपकरणों के बीच सुरक्षित विद्युत पथ बनाने के लिए किया जाता है।",
        
        intro: "अब जब हम उपकरणों को जानते हैं, तो आइए देखें कि तार का प्रतिरोध कैसे ज्ञात किया जाता है।",
        setup: "मीटर ब्रिज मुख्य उपकरण है। हम ज्ञात प्रतिरोध के लिए रेजिस्टेंस बॉक्स और दाएं अंतराल में एक अज्ञात प्रतिरोध तार का उपयोग करते हैं।",
        connections: "निर्धारित सर्किट के अनुसार लेक्लांचे सेल, प्लग की, मीटर ब्रिज, रेजिस्टेंस बॉक्स और गैल्वेनोमीटर को जोड़ना।",
        sliding: "जॉकी को तार से स्पर्श किया जाता है और संतुलन बिंदु खोजने के लिए इसकी लंबाई के साथ घुमाया जाता है।",
        nullPoint: "जॉकी को तब तक घुमाते रहें जब तक कि गैल्वेनोमीटर की सुई शून्य पर न आ जाए।",
        balanceLength: "बाएं छोर से संतुलन बिंदु तक की लंबाई 'l' को मीटर स्केल से रिकॉर्ड किया जाता है।",
        calculation: "X = R * (100 - l) / l. आपने सफलतापूर्वक प्रतिरोध खोज लिया है!",
        unlockHint: "( अब आप जॉकी को स्लाइड कर सकते हैं )"
    },
    te: {
        intro_gal: "ఇది గాల్వనోమీటర్. సర్క్యూట్‌లో చిన్న విద్యుత్ ప్రవాహాలను గుర్తించడానికి దీనిని ఉపయోగిస్తారు.",
        intro_rb: "ఇది రెసిస్టెన్స్ బాక్స్. సర్క్యూట్‌లో నిరోధకతను మార్చడానికి దీనిని ఉపయోగిస్తారు.",
        intro_mb: "ఇది మీటర్ బ్రిడ్జ్. నిరోధకతలను పోల్చడానికి మరియు తెలియని దానిని కనుగొనడానికి ఉపయోగించే ప్రధాన పరికరం ఇది.",
        intro_bat: "ఇది లాక్లాంచ్ సెల్. ఇది మీ ప్రయోగానికి ప్రాథమిక విద్యుత్ వనరుగా పనిచేస్తుంది.",
        intro_key: "ఇది ప్లగ్ కీ. ఇది విద్యుత్ సర్క్యూట్‌ను పూర్తి చేయడానికి లేదా విచ్ఛిన్నం చేయడానికి స్విచ్‌గా పనిచేస్తుంది.",
        intro_jok: "ఇది జోకానీ. శూన్య బిందువును కనుగొనడానికి మీటర్ తీగపై వివిధ పాయింట్ల వద్ద సంబంధాన్ని ఏర్పరచడానికి దీనిని ఉపయోగిస్తారు.",
        intro_wires: "చివరగా, ఇవి కనెక్టింగ్ వైర్లు. అన్ని పరికరాల మధ్య సురక్షితమైన విద్యుత్ మార్గాలను సృష్టించడానికి వీటిని ఉపయోగిస్తారు.",
        
        intro: "పరికరాల గురించి తెలుసుకున్నాం కాబట్టి, తీగ నిరోధకతను ఎలా కనుగొనాలో ఇప్పుడు చూద్దాం.",
        setup: "మీటర్ బ్రిడ్జ్ ప్రధాన పరికరం. మేము తెలిసిన నిరోధకత కోసం రెసిస్టెన్స్ బాక్స్ మరియు కుడి గ్యాప్‌లో తెలియని నిరోధక తీగను ఉపయోగిస్తాము.",
        connections: "సర్క్యూట్ ప్రకారం లాక్లాంచ్ సెల్, ప్లగ్ కీ, మీటర్ బ్రిడ్జ్, రెసిస్టెన్స్ బాక్స్ మరియు గాల్వనోమీటర్‌లను కలపడం.",
        sliding: "జోకానీ తీగకు తాకించి, బ్యాలెన్స్ పాయింట్‌ను కనుగొనడానికి దాని పొడవునా కదిలిస్తాము.",
        nullPoint: "గాల్వనోమీటర్ సూది సున్నాకి వచ్చే వరకు జోకానీని కదిలిస్తూ ఉండండి.",
        balanceLength: "ఎడమ చివర నుండి బ్యాలెన్స్ పాయింట్ వరకు ఉన్న పొడవు 'l'ని మీటర్ స్కేల్ నుండి నమోదు చేస్తారు.",
        calculation: "X = R * (100 - l) / l. మీరు విజయవంతంగా నిరోధకతను కనుగొన్నారు!",
        unlockHint: "( ఇప్పుడు మీరు జోకానీని జరపవచ్చు )"
    },
    mr: {
        intro_gal: "हे गॅल्व्हानोमीटर आहे. याचा उपयोग सर्किटमधील लहान विद्युत प्रवाह शोधण्यासाठी केला जातो.",
        intro_rb: "हे रेझिस्टन्स बॉक्स आहे. याचा उपयोग सर्किटमधील प्रतिरोध बदलण्यासाठी केला जातो.",
        intro_mb: "हे मीटर ब्रिज आहे. प्रयोगातील मुख्य साधन म्‍हणून याचा उपयोग प्रतिरोधांची तुलना करण्यासाठी आणि अज्ञात प्रतिरोध शोधण्यासाठी केला जातो.",
        intro_bat: "हे लेक्लांचे सेल आहे. हे तुमच्या प्रयोगासाठी प्राथमिक उर्जा स्त्रोत म्हणून कार्य करते.",
        intro_key: "हे प्लग की आहे. हे विद्युत सर्किट पूर्ण करण्यासाठी किंवा तोडण्यासाठी स्विच म्हणून काम करते.",
        intro_jok: "हे जॉकी आहे. शून्य बिंदू शोधण्यासाठी मीटर वायरवर विविध बिंदूंवर संपर्क करण्यासाठी याचा वापर केला जातो.",
        intro_wires: "शेवटी, या कनेक्टिंग वायर्स आहेत. यांचा वापर सर्व उपकरणांमधील सुरक्षित विद्युत मार्ग तयार करण्यासाठी केला जातो.",
        
        intro: "आता आपल्याला उपकरणांची माहिती झाली आहे, तर चला पाहूया की वायरचा प्रतिरोध कसा शोधायचा.",
        setup: "मीटर ब्रिज हे मुख्य साधन आहे. आम्ही ज्ञात प्रतिरोधासाठी रेझिस्टन्स बॉक्स आणि उजव्या गॅपमध्ये अज्ञात प्रतिरोध वायर वापरतो.",
        connections: "मानक सर्किटनुसार लेक्लांचे सेल, प्लग की, मीटर ब्रिज, रेझिस्टन्स बॉक्स आणि गॅल्व्हानोमीटर जोडणे.",
        sliding: "जॉकी वायरला स्पर्श केला जातो आणि संतुलन बिंदू शोधण्यासाठी त्याच्या लांबीनुसार फिरवला जातो.",
        nullPoint: "गॅल्व्हानोमीटरची सुई शून्यावर येईपर्यंत जॉकी फिरवत राहा.",
        balanceLength: "डाव्या टोकापासून शून्य बिंदूपर्यंतची लांबी 'l' मीटर स्केलवरून मोजली जाते.",
        calculation: "X = R * (100 - l) / l. तुम्ही यशस्वीरित्या प्रतिरोध शोधला आहे!",
        unlockHint: "( तुम्ही आता जॉकी सरकवू शकता )"
    }
};

const STEP_KEYS = [
    "intro_gal", "intro_rb", "intro_mb", "intro_bat", "intro_key", "intro_jok", "intro_wires",
    "intro", "setup", "connections", "sliding", "nullPoint", "balanceLength", "calculation"
];

const TOUR_STEPS = [
    { title: "Galvanometer", highlights: ["tour_gal"] },
    { title: "Resistance Box", highlights: ["tour_rb"] },
    { title: "Meter Bridge", highlights: ["tour_mb"] },
    { title: "Laclanche Cell", highlights: ["tour_bat"] },
    { title: "Plug Key", highlights: ["tour_key"] },
    { title: "Jockey", highlights: ["tour_jok"] },
    { title: "Connecting Wires", highlights: ["tour_bat", "tour_key", "tour_mb", "tour_rb", "tour_gal"] },
    { title: "Process Introduction", highlights: ["tour_mb", "tour_gal", "tour_rb", "tour_bat", "tour_key", "tour_jok"] },
    { title: "Experimental Setup", highlights: ["tour_mb", "tour_rb"] },
    { title: "Circuit Connections", highlights: ["tour_bat", "tour_key", "tour_mb", "tour_rb", "tour_gal"] },
    { title: "Sliding the Jockey", highlights: ["tour_jok", "tour_mb"] },
    { title: "Finding the Null Point", highlights: ["tour_gal"] },
    { title: "Measuring Balance Length", highlights: ["tour_mb"] },
    { title: "Calculation", highlights: [] },
];

const TOUR_INSTRUMENTS = [
    { type: 'galvanometer', name: 'Galvanometer', id: 'tour_gal', pos: [4.6, 2.1, -1.2] },     // index 0: Step 0
    { type: 'resistance_box', name: 'Resistance Box', id: 'tour_rb', pos: [2.0, 2.1, -1.2] }, // index 1: Step 1
    { type: 'meter_bridge', name: 'Meter Bridge', id: 'tour_mb', pos: [0, 2.05, 0.8] },       // index 2: Step 2
    { type: 'battery', name: 'Laclanche Cell', id: 'tour_bat', pos: [-4.8, 2.05, -1.2] },     // index 3: Step 3
    { type: 'plug_key', name: 'Plug Key', id: 'tour_key', pos: [-2.8, 2.05, -1.2] },          // index 4: Step 4
    { type: 'jockey', name: 'Jockey', id: 'tour_jok', pos: [-0.6, 2.15, -1.2] },              // index 5: Step 5
];

const TOUR_CONNECTIONS = [
    { from: 'tour_bat_pos', to: 'tour_mb_A1' },
    { from: 'tour_bat_neg', to: 'tour_key_t1' },
    { from: 'tour_key_t2', to: 'tour_mb_C1' },
    { from: 'tour_mb_A2', to: 'tour_rb_t1' }, // Correct gap bridge
    { from: 'tour_mb_L1', to: 'tour_rb_t2' }, // Correct gap bridge
    { from: 'tour_mb_D', to: 'tour_gal_t1' },
    { from: 'tour_gal_t2', to: 'tour_jok_t' },
];

export default function GuidedTour() {
    // Selectors for stable actions
    const setTourState = useLabStore(s => s.setTourState);
    const setTourHighlight = useLabStore(s => s.setTourHighlight);
    const resetLab = useLabStore(s => s.resetLab);
    const addInstrument = useLabStore(s => s.addInstrument);
    const addConnection = useLabStore(s => s.addConnection);
    const updateInstrument = useLabStore(s => s.updateInstrument);
    const setDeflection = useLabStore(s => s.setDeflection);
    const setCurrentL = useLabStore(s => s.setCurrentL);
    const updateInstrumentValue = useLabStore(s => s.updateInstrumentValue);
    const toggleStaticMode = useLabStore(s => s.toggleStaticMode);
    const setTourLanguage = useLabStore(s => s.setTourLanguage);
    const toggleVoice = useLabStore(s => s.toggleVoice);
    const setScreen = useLabStore(s => s.setScreen);
    const setLanguage = useLabStore(s => s.setLanguage);

    // Selectors for state
    const tourState = useLabStore(s => s.tourState);
    const { isActive, stepIndex, isPaused } = tourState;
    const language = useLabStore(s => s.language);
    const voiceEnabled = useLabStore(s => s.voiceEnabled);
    const isStaticMode = useLabStore(state => state.isStaticMode);
    
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [hasFinishedNarration, setHasFinishedNarration] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isSpawningRef = useRef(false);
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

    // Handle click outside language picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
        };

        if (isLangOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLangOpen]);

    const handleTogglePlay = useCallback(() => {
        const { isPaused, stepIndex } = useLabStore.getState().tourState;
        
        if (!isPaused) {
            setTourState({ isPaused: true });
        } else {
            // If narration finished and not on last step, advance
            if (hasFinishedNarration && stepIndex < TOUR_STEPS.length - 1) {
                setTourState({ stepIndex: stepIndex + 1, isPaused: false });
            } else {
                setTourState({ isPaused: false });
            }
        }
    }, [isPaused, stepIndex, hasFinishedNarration, setTourState]);

    // Handle Space key to toggle pause/resume
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault(); // Prevent scrolling
                handleTogglePlay();
            }
        };

        if (isActive) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, handleTogglePlay]);

    const speak = useCallback((text: string) => {
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
        
        // Use a small timeout to let cancel() take full effect
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
                utterance.pitch = 0.9; // Adjusted for clear male tone
                utterance.onend = () => {
                    if (useLabStore.getState().tourState.isActive) {
                        setHasFinishedNarration(true);
                        setTourState({ isPaused: true });
                    }
                };
                window.speechSynthesis.speak(utterance);
                
                if (useLabStore.getState().tourState.isPaused) {
                    window.speechSynthesis.pause();
                }
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
                        audio.onended = () => {
                            if (useLabStore.getState().tourState.isActive) {
                                setHasFinishedNarration(true);
                                setTourState({ isPaused: true });
                            }
                        };
                        if (!useLabStore.getState().tourState.isPaused) {
                            await audio.play();
                        }
                    } catch (e) {}
                };
                playAudio();
            }
        }, 100);
    }, [voiceEnabled, language, setTourState]);

    const stopTour = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        isSpawningRef.current = false;
        setTourState({ isActive: false, stepIndex: 0, isPaused: false });
        setScreen('FRONT');
        resetLab();
    }, [setTourState, resetLab, setScreen]);

    const spawnSequential = useCallback(async () => {
        if (isSpawningRef.current) return;
        isSpawningRef.current = true;
        
        try {
            resetLab();
            await new Promise(r => setTimeout(r, 100));

            // Just spawn the first instrument for now
            await spawnInstrument(0);
        } finally {
            isSpawningRef.current = false;
        }
    }, [resetLab]);

    const animateSpawn = useCallback((id: string, startX: number, endX: number, y: number, z: number, duration: number) => {
        return new Promise<void>((resolve) => {
            let startTime = Date.now();
            let elapsedBeforePause = 0;

            const frame = () => {
                const { isPaused, isActive } = useLabStore.getState().tourState;
                if (!isActive) return resolve();
                
                if (isPaused) {
                    startTime = Date.now() - elapsedBeforePause;
                    requestAnimationFrame(frame);
                    return;
                }

                const now = Date.now();
                const progress = Math.min(1, (now - startTime) / duration);
                elapsedBeforePause = now - startTime;

                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const currentX = startX + (endX - startX) * eased;
                updateInstrument(id, { position: [currentX, y, z] });
                
                if (progress < 1) requestAnimationFrame(frame);
                else resolve();
            };
            requestAnimationFrame(frame);
        });
    }, [updateInstrument]);

    const spawnInstrument = useCallback(async (index: number) => {
        if (index >= TOUR_INSTRUMENTS.length) return;
        const inst = TOUR_INSTRUMENTS[index];
        const terminals = getTerminalsForType(inst.type, inst.id);
        const startX = -8;
        addInstrument(inst.type, inst.name, terminals, inst.id, [startX, inst.pos[1], inst.pos[2]]);
        if (inst.type !== 'jockey') updateInstrument(inst.id, { isFixed: true });
        await animateSpawn(inst.id, startX, inst.pos[0], inst.pos[1], inst.pos[2], 1200);
    }, [addInstrument, updateInstrument, animateSpawn]);

    const spawnRemaining = useCallback(async (fromIndex: number) => {
        for (let i = fromIndex; i < TOUR_INSTRUMENTS.length; i++) {
            if (!useLabStore.getState().tourState.isActive) break;
            const inst = TOUR_INSTRUMENTS[i];
            if (useLabStore.getState().placedInstruments.some(p => p.id === inst.id)) continue;
            
            await spawnInstrument(i);
            await new Promise(r => setTimeout(r, 200));
        }
    }, [spawnInstrument]);

    const animateJockey = useCallback((startX: number, endX: number, duration: number) => {
        let startTime = Date.now();
        let elapsedBeforePause = 0;

        const frame = () => {
            const { isPaused, isActive } = useLabStore.getState().tourState;
            if (!isActive) return;

            if (isPaused) {
                startTime = Date.now() - elapsedBeforePause;
                requestAnimationFrame(frame);
                return;
            }

            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            elapsedBeforePause = now - startTime;

            const currentX = startX + (endX - startX) * progress;
            const mbZ = useLabStore.getState().placedInstruments.find(i => i.type === 'meter_bridge')?.position[2] || 0.8;
            updateInstrument('tour_jok', { position: [currentX, 2.15, mbZ + 0.35] });
            if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }, [updateInstrument]);

    const runStepAction = useCallback((index: number) => {
        const step = TOUR_STEPS[index];
        setTourHighlight(step.highlights);

        if (index < 6) {
            spawnInstrument(index);
        } else if (index === 6) {
            spawnRemaining(0);
        } else if (index === 7) {
            spawnRemaining(0);
            setDeflection(0);
            setCurrentL(-1);
        } else {
            switch (index) {
                case 10: // Slide - AUTO UNLOCK
                    if (useLabStore.getState().isStaticMode) {
                        toggleStaticMode();
                    }
                    animateJockey(-0.6, 0.4, 3000); 
                    break;
                case 9: // Connections
                    TOUR_CONNECTIONS.forEach((conn, i) => {
                        setTimeout(() => addConnection(conn.from, conn.to), i * 1500);
                    });
                    break;
                case 11: // Null Point
                    updateInstrumentValue('tour_key', 1);
                    setDeflection(0);
                    break;
            }
        }
    }, [spawnInstrument, spawnRemaining, addConnection, setTourHighlight, setDeflection, setCurrentL, updateInstrumentValue, toggleStaticMode, animateJockey]);

    // Manual navigation logic - removed timer
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    useEffect(() => {
        if (isActive) {
            setHasFinishedNarration(false);
            runStepAction(stepIndex);
            const textKey = STEP_KEYS[stepIndex];
            speak(TOUR_CONTENT[language][textKey]);
        }
        
        // CLEANUP: Prevent overlap when switching suddenly
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, [isActive, stepIndex, language, runStepAction, speak]);

    // Handle Pause/Resume Audio
    useEffect(() => {
        if (isActive) {
            if (isPaused) {
                if (window.speechSynthesis) window.speechSynthesis.pause();
                if (audioRef.current) audioRef.current.pause();
            } else {
                if (window.speechSynthesis) window.speechSynthesis.resume();
                if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
                    audioRef.current.play().catch(e => console.warn("Resume failed:", e));
                }
            }
        }
    }, [isActive, isPaused]);

    if (!isActive) return null;

    const currentStep = TOUR_STEPS[stepIndex];
    const textKey = STEP_KEYS[stepIndex];
    const currentText = TOUR_CONTENT[language][textKey];

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-end pb-36">
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />

            {/* Compact Captions */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                key={`${stepIndex}-${language}`}
                className="max-w-2xl text-center px-6 py-4 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 pointer-events-auto"
            >
                <p className="text-sm font-medium text-white tracking-wide leading-tight">
                    {currentText}
                </p>
                {isPaused && stepIndex < TOUR_STEPS.length - 1 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleTogglePlay}
                        className="mt-4 px-6 py-2 bg-[#2bb3a1] text-black font-black rounded-xl hover:bg-[#259b8a] transition-all flex items-center gap-2 mx-auto group shadow-[0_0_20px_rgba(43,179,161,0.3)]"
                    >
                        NEXT STEP
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                )}
                {stepIndex === 10 && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mt-1 text-[#2bb3a1] font-bold text-[10px] tracking-widest uppercase"
                    >
                        {TOUR_CONTENT[language].unlockHint}
                    </motion.p>
                )}
                {stepIndex === TOUR_STEPS.length - 1 && isPaused && (
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => {
                                stopTour();
                                initWorkoutInstruments();
                                useLabStore.getState().setScreen('WORKOUT');
                                useLabStore.getState().setWorkoutState({ isActive: true, stepIndex: 1 });
                            }}
                            className="px-6 py-2 bg-purple-500 text-white font-bold rounded-full hover:bg-purple-600 transition-all flex items-center gap-2"
                        >
                            WORKOUT NOW
                        </motion.button>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => {
                                stopTour();
                                useLabStore.getState().setScreen('PRACTICE');
                            }}
                            className="px-6 py-2 bg-[#2bb3a1] text-black font-bold rounded-full hover:bg-[#259b8a] transition-all flex items-center gap-2"
                        >
                            <FlaskConical className="w-4 h-4" />
                            PRACTICE NOW
                        </motion.button>
                    </div>
                )}
            </motion.div>

            {/* Clean Mini Controls */}
            <div className="mt-14 flex items-center gap-4 pointer-events-auto bg-black/60 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                {/* Language Picker Dropdown */}
                <div className="relative" ref={langRef}>
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                            isLangOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Languages className="w-4 h-4" />
                        <span className="text-xs font-bold w-6">{language.toUpperCase()}</span>
                    </button>

                    <AnimatePresence>
                        {isLangOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full mb-3 left-0 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 p-2 min-w-[140px] shadow-2xl overflow-hidden"
                            >
                                <div className="space-y-1">
                                    {[
                                        { id: 'en', name: 'English' },
                                        { id: 'hi', name: 'Hindi (हिंदी)' },
                                        { id: 'te', name: 'Telugu (తెలుగు)' },
                                        { id: 'mr', name: 'Marathi (मराठी)' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.id}
                                            onClick={() => {
                                                setLanguage(lang.id as any);
                                                setIsLangOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                                language === lang.id 
                                                ? 'bg-[#2bb3a1] text-black' 
                                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {lang.name}
                                            {language === lang.id && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-4 w-[1px] bg-white/10 mx-1" />

                <button
                    onClick={() => setTourState({ stepIndex: Math.max(0, stepIndex - 1) })}
                    disabled={stepIndex === 0}
                    className="p-1.5 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                    onClick={handleTogglePlay}
                    className="p-2 text-[#2bb3a1] hover:scale-110 transition-all bg-white/5 rounded-full"
                    title={isPaused ? "Resume Tour" : "Pause Tour"}
                >
                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                </button>

                <button
                    onClick={() => {
                        if (stepIndex < TOUR_STEPS.length - 1) {
                            setTourState({ stepIndex: stepIndex + 1, isPaused: false });
                        }
                    }}
                    disabled={stepIndex === TOUR_STEPS.length - 1}
                    className="p-1.5 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                <div className="h-6 w-[1px] bg-white/10 mx-2" />

                <button
                    onClick={() => toggleVoice()}
                    className={`p-1.5 transition-all ${voiceEnabled ? 'text-[#2bb3a1]' : 'text-white/30'}`}
                    title={voiceEnabled ? "Mute Voice" : "Unmute Voice"}
                >
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <div className="flex gap-1">
                    {TOUR_STEPS.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all ${i === stepIndex ? 'w-4 bg-[#2bb3a1]' : 'w-1 bg-white/20'}`} />
                    ))}
                </div>

                <button 
                    onClick={stopTour}
                    className="p-1.5 text-white/30 hover:text-red-500 transition-all ml-4"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// Helper to define terminals for each type
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


