'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, ChevronRight, ChevronLeft, Volume2, VolumeX, FlaskConical, Languages, Check } from 'lucide-react';
import { useLabState } from '@/lib/chemistry/LabContext';
import { DEFAULT_APPARATUS_LAYOUT } from '@/lib/chemistry/apparatusLayout';

const TOUR_CONTENT: Record<string, Record<string, string>> = {
    en: {
        intro: "Welcome to the Virtual Chemistry Lab! Let's take a quick look at the tools you'll be using.",
        burner: "This is the Bunsen Burner. Use it to heat your test tubes for reactions.",
        rack: "This is the Test Tube Rack. It holds your test tubes securely while you work.",
        tubes: "These are Test Tubes. They are your primary vessels for mixing chemicals and observing reactions.",
        bottles: "These are Reagent Bottles. They contain various acids, bases, and salts for your experiments.",
        dropper: "This is the Dropper. Use it to add small, precise amounts of liquid chemicals to your test tubes.",
        spatula: "This is the Spatula. Use it to scoop and add solid salt samples to your test tubes.",
        sink: "This is the Lab Sink. Use it to dispose of chemicals and clean your test tubes.",
        cleanup: "Remember to clean up after each experiment to keep your workspace tidy! Happy experimenting!",
        unlockHint: "( Click and drag any tool to interact )",
        cl_intro: "Let's perform the Chloride Ion Test to detect chloride ions using Silver Nitrate.",
        cl_salt: "First, use the spatula to take a small amount of Sodium Chloride (NaCl) salt.",
        cl_add: "Add the salt into a clean test tube to prepare for the reaction.",
        cl_reagent: "Now, use the dropper to add a few drops of Silver Nitrate (AgNO3) reagent.",
        cl_result: "Observe the white precipitate forming. This confirms the presence of Chloride ions!"
    },
    hi: {
        intro: "वर्चुअल केमिस्ट्री लैब में आपका स्वागत है! आइए उन उपकरणों पर एक नज़र डालें जिनका आप उपयोग करेंगे।",
        burner: "यह बुन्सेन बर्नर है। प्रतिक्रियाओं के लिए अपनी टेस्ट ट्यूब को गर्म करने के लिए इसका उपयोग करें।",
        rack: "यह टेस्ट ट्यूब रैक है। यह काम करते समय आपकी टेस्ट ट्यूब को सुरक्षित रखता है।",
        tubes: "ये टेस्ट ट्यूब हैं। वे रसायनों को मिलाने और प्रतिक्रियाओं को देखने के लिए आपके प्राथमिक बर्तन हैं।",
        bottles: "ये रिएजेंट बोतलें हैं। वे आपके प्रयोगों के लिए विभिन्न एसिड, बेस और लवण रखते हैं।",
        dropper: "यह ड्रॉपर है। अपनी टेस्ट ट्यूब में तरल रसायनों की छोटी, सटीक मात्रा जोड़ने के लिए इसका उपयोग करें।",
        spatula: "यह स्पैटुला है। अपनी टेस्ट ट्यूब में ठोस नमक के नमूने लेने और जोड़ने के लिए इसका उपयोग करें।",
        sink: "यह लैब सिंक है। रसायनों के निपटान और अपनी टेस्ट ट्यूबों को साफ करने के लिए इसका उपयोग करें।",
        cleanup: "अपने कार्यक्षेत्र को साफ रखने के लिए प्रत्येक प्रयोग के बाद सफाई करना याद रखें! हैप्पी एक्सपेरिमेंटिंग!",
        unlockHint: "( बातचीत करने के लिए किसी भी उपकरण को क्लिक करें और खींचें )",
        cl_intro: "आइए सिल्वर नाइट्रेट का उपयोग करके क्लोराइड आयनों का पता लगाने के लिए क्लोराइड आयन परीक्षण करें।",
        cl_salt: "सबसे पहले, सोडियम क्लोराइड (NaCl) नमक की थोड़ी मात्रा लेने के लिए स्पैटुला का उपयोग करें।",
        cl_add: "प्रतिक्रिया की तैयारी के लिए नमक को एक साफ टेस्ट ट्यूब में डालें।",
        cl_reagent: "अब, सिल्वर नाइट्रेट (AgNO3) रिएजेंट की कुछ बूंदें डालने के लिए ड्रॉपर का उपयोग करें।",
        cl_result: "सफेद अवक्षेप बनते हुए देखें। यह क्लोराइड आयनों की उपस्थिति की पुष्टि करता है!"
    },
    mr: {
        intro: "व्हर्च्युअल केमिस्ट्री लॅबमध्ये आपले स्वागत आहे! आपण वापरणार असलेल्या साधनांकडे पटकन पाहूया.",
        burner: "हा बन्सन बर्नर आहे. प्रतिक्रियांसाठी टेस्ट ट्यूब गरम करण्यासाठी याचा वापर करा.",
        rack: "हा टेस्ट ट्यूब रॅक आहे. काम करताना तो टेस्ट ट्यूब सुरक्षित ठेवतो.",
        tubes: "हे टेस्ट ट्यूब आहेत. रसायने मिसळण्यासाठी आणि प्रतिक्रिया पाहण्यासाठी हे मुख्य भांडे आहेत.",
        bottles: "या रिएजेंट बाटल्या आहेत. त्यात विविध आम्ले, क्षार आणि लवण असतात.",
        dropper: "हा ड्रॉपर आहे. टेस्ट ट्यूबमध्ये थोड्या प्रमाणात द्रव रसायने टाकण्यासाठी वापरा.",
        spatula: "ही स्पॅटुला आहे. घन मीठ नముने घेऊन टेस्ट ट्यूबमध्ये टाकण्यासाठी वापरा.",
        sink: "हा लॅब सिंक आहे. रसायनांचे निपटारा आणि टेस्ट ट्यूब स्वच्छ करण्यासाठी वापरा.",
        cleanup: "प्रत्येक प्रयोगानंतर स्वच्छता ठेवायला विसरू नका! आनंदाने प्रयोग करा!",
        unlockHint: "( कोणतेही साधन क्लिक करून ड्रॅग करा )",
        cl_intro: "चला, सिल्वर नायट्रेट वापरून क्लोराईड आयन शोधण्यासाठी क्लोराईड आयन चाचणी करूया.",
        cl_salt: "प्रथम, सोडियम क्लोराईड (NaCl) मिठाचे थोडे प्रमाण घेण्यासाठी स्पॅटुला वापरा.",
        cl_add: "प्रतिक्रियेच्या तयारीसाठी मीठ एका स्वच्छ टेस्ट ट्यूबमध्ये टाका.",
        cl_reagent: "आता, सिल्वर नायट्रेट (AgNO3) रिएजेंटचे काही थेंब टाकण्यासाठी ड्रॉपर वापरा.",
        cl_result: "पांढरा अवक्षेप तयार होताना पहा. हे क्लोराईड आयनांच्या अस्तित्वाची पुष्टी करते!"
    },
    te: {
        intro: "వర్చువల్ కెమిస్ట్రీ ల్యాబ్కు స్వాగతం! మీరు ఉపయోగించే పరికరాలను ఒకసారి చూద్దాం.",
        burner: "ఇది బన్సెన్ బర్నర్. ప్రతిచర్యల కోసం టెస్ట్ ట్యూబ్లను వేడి చేయడానికి ఉపయోగించండి.",
        rack: "ఇది టెస్ట్ ట్యూబ్ రాక్. పని చేస్తున్నప్పుడు టెస్ట్ ట్యూబ్లను సురక్షితంగా ఉంచుతుంది.",
        tubes: "ఇవి టెస్ట్ ట్యూబ్లు. రసాయనాలను కలపడానికి మరియు ప్రతిచర్యలను గమనించడానికి ఉపయోగిస్తారు.",
        bottles: "ఇవి రియాజెంట్ బాటిళ్లు. వివిధ ఆమ్లాలు, క్షారాలు మరియు ఉప్పులు ఇందులో ఉంటాయి.",
        dropper: "ఇది డ్రాపర్. టెస్ట్ ట్యూబ్లలో చిన్న పరిమాణంలో ద్రవాన్ని వేయడానికి ఉపయోగించండి.",
        spatula: "ఇది స్పాటులా. ఘన ఉప్పు నమూనాలను తీసుకుని టెస్ట్ ట్యూబ్లో వేయడానికి ఉపయోగించండి.",
        sink: "ఇది ల్యాబ్ సింక్. రసాయనాలను పారవేయడానికి మరియు టెస్ట్ ట్యూబ్లను శుభ్రం చేయడానికి ఉపయోగించండి.",
        cleanup: "ప్రతి ప్రయోగం తర్వాత శుభ్రపరచడం మర్చిపోవద్దు! ఆనందంగా ప్రయోగాలు చేయండి!",
        unlockHint: "( పరికరాన్ని క్లిక్ చేసి డ్రాగ్ చేయండి )",
        cl_intro: "సిల్వర్ నైట్రేట్‌ను ఉపయోగించి క్లోరైడ్ అయాన్లను గుర్తించడానికి క్లోరైడ్ అయాన్ పరీక్షను చేద్దాం.",
        cl_salt: "మొదట, సోడియం క్లోరైడ్ (NaCl) ఉప్పును కొద్ది మొత్తంలో తీసుకోవడానికి స్పాటులాను ఉపయోగించండి.",
        cl_add: "ప్రతిచర్య కోసం సిద్ధం చేయడానికి ఉప్పును క్లీన్ టెస్ట్ ట్యూబ్‌లో వేయండి.",
        cl_reagent: "ఇప్పుడు, సిల్వర్ నైట్రేట్ (AgNO3) రియాజెంట్ కొన్ని చుక్కలను వేయడానికి డ్రాపర్‌ను ఉపయోగించండి.",
        cl_result: "తెల్లటి అవక్షేపం ఏర్పడటం గమనించండి. ఇది క్లోరైడ్ అయాన్ల ఉనికిని నిర్ధారిస్తుంది!"
    }
};

const STEP_KEYS = [
    "intro", "burner", "rack", "tubes", "bottles", "dropper", "spatula", "sink", "cleanup",
    "cl_intro", "cl_salt", "cl_add", "cl_reagent", "cl_result"
];

const TOUR_STEPS = [
    { title: "Welcome", highlights: [] },
    { title: "Bunsen Burner", highlights: ["burner"] },
    { title: "Test Tube Rack", highlights: ["testTubeRack"] },
    { title: "Test Tubes", highlights: ["tt1", "tt2", "tt3", "tt4", "tt5", "tt6"] },
    { title: "Reagent Bottles", highlights: ["bot_HCl", "bot_H2SO4", "bot_AgNO3", "bot_NH4OH", "bot_NaOH"] },
    { title: "Dropper", highlights: ["dropper"] },
    { title: "Spatula", highlights: ["spatula"] },
    { title: "Lab Sink", highlights: ["sink"] },
    { title: "Cleanup", highlights: ["sink"] },
    { title: "Chloride Test", highlights: [] },
    { title: "Take Salt", highlights: ["spatula", "salt_Cl"] },
    { title: "Prepare Sample", highlights: ["tt1"] },
    { title: "Add Reagent", highlights: ["dropper", "bot_AgNO3"] },
    { title: "Observation", highlights: ["tt1"] },
];

export default function GuidedTour() {
    const { 
        state, 
        setTourState, 
        setLanguage, 
        toggleVoice, 
        resetLab,
        setApparatusPosition,
        pickSalt,
        addSalt,
        pickDropper,
        dropOneFromDropper,
        emptyDropper,
        attachHolder,
        openBottle,
        setApparatusRotation
    } = useLabState();
    const { tourState, language, voiceEnabled } = state;
    const { isActive, stepIndex, isPaused } = tourState;
    
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [hasFinishedNarration, setHasFinishedNarration] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSpeakIdRef = useRef(0);
    const stateRef = useRef(state);
    const lastPerformedStepRef = useRef<number>(-1);
    const isActionRunningRef = useRef(false);

    // Keep stateRef updated
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

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
        if (isLangOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLangOpen]);

    const handleTogglePlay = useCallback(() => {
        if (!isPaused) {
            setTourState({ isPaused: true });
        } else {
            if (hasFinishedNarration && stepIndex < TOUR_STEPS.length - 1) {
                setTourState({ stepIndex: stepIndex + 1, isPaused: false });
            } else {
                setTourState({ isPaused: false });
            }
        }
    }, [isPaused, stepIndex, hasFinishedNarration, setTourState]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                handleTogglePlay();
            }
        };
        if (isActive) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, handleTogglePlay]);

    const speak = useCallback((text: string) => {
        if (!voiceEnabled) return;
        const speakId = ++currentSpeakIdRef.current;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
        if (!window.speechSynthesis) return;

        setTimeout(() => {
            if (speakId !== currentSpeakIdRef.current) return;
            const voices = window.speechSynthesis.getVoices();
            
            // Map language to locale
            const localeMap: Record<string, string> = {
                'hi': 'hi-IN',
                'en': 'en-IN',
                'mr': 'mr-IN',
                'te': 'te-IN'
            };
            const targetLang = localeMap[language] || 'en-IN';
            
            // Try to find the best voice for the language
            let langVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(targetLang));
            if (langVoices.length === 0) langVoices = voices.filter(v => v.lang.startsWith(targetLang.split('-')[0]));
            
            let selectedVoice = langVoices.find(v => v.name.toLowerCase().includes('google')) || langVoices[0];
            
            // Cross-language fallback: Marathi uses Devnagari, so Hindi voices can read it well
            if (!selectedVoice && language === 'mr') {
                const hiVoices = voices.filter(v => v.lang.startsWith('hi'));
                selectedVoice = hiVoices.find(v => v.name.toLowerCase().includes('google')) || hiVoices[0];
            }

            // Final fallback: any Indian voice for Indian languages if specific one is missing
            if (!selectedVoice && ['hi', 'mr', 'te'].includes(language)) {
                const inVoices = voices.filter(v => v.lang.includes('-IN'));
                selectedVoice = inVoices.find(v => v.name.toLowerCase().includes('google')) || inVoices[0];
            }

            const utterance = new SpeechSynthesisUtterance(text);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            } else {
                utterance.lang = targetLang;
            }

            utterance.onend = () => {
                setHasFinishedNarration(true);
                // Removed mandatory pause - will auto-advance if not paused by user
            };
            window.speechSynthesis.speak(utterance);
            if (isPaused) window.speechSynthesis.pause();
        }, 100);
    }, [voiceEnabled, language, isPaused, setTourState]);

    // Real-time Action Sequencer
    const performAction = useCallback(async (stepKey: string) => {
        if (isActionRunningRef.current) return;
        isActionRunningRef.current = true;

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        const moveSmooth = async (id: string, pos: [number, number, number]) => {
            setApparatusPosition(id, pos);
            await delay(1200);
        };

        const tilt = async (id: string, angle: number) => {
            setApparatusRotation(id, [0, 0, angle]);
            await delay(600);
        };
        
        try {
            const { testTubes, apparatus } = stateRef.current;
            const tt1 = testTubes.find(t => t.id === 'tt1');
            if (!tt1) return;

            const spatulaHome = DEFAULT_APPARATUS_LAYOUT["spatula"].position;
            const dropperHome = DEFAULT_APPARATUS_LAYOUT["dropper"].position;
            const bottleHome = DEFAULT_APPARATUS_LAYOUT["bot_AgNO3"].position;

            const salt = apparatus["salt_Cl"];
            const bottle = apparatus["bot_AgNO3"];

            switch (stepKey) {
                case "cl_intro":
                    // 1. Pick tube using holder
                    await moveSmooth("holder", [1.7, 1.15, 0]);
                    attachHolder("tt1");
                    await delay(900);
                    // 2. Bring to workbench
                    await moveSmooth("holder", [0.2, 1.05, -0.2]);
                    attachHolder(null); // Release onto bench
                    await delay(500);
                    // 3. Return holder
                    await moveSmooth("holder", [1.3, 0.8, -0.8]);
                    break;

                case 'cl_salt':
                    // 1. Spatula moves to salt
                    if (salt) {
                        await moveSmooth("spatula", [salt.position[0] - 0.1, salt.position[1] + 0.15, salt.position[2]]);
                        await delay(500);
                        // 2. Scoop
                        pickSalt('Cl');
                        await delay(900);
                    }
                    break;
                    
                case 'cl_add':
                    // 1. Spatula to tube mouth
                    await moveSmooth("spatula", [tt1.position[0], tt1.position[1] + 0.35, tt1.position[2]]);
                    // 2. Tilt & Drop
                    await tilt("spatula", -0.9);
                    addSalt('tt1', 'Cl');
                    await delay(1000);
                    // 3. Reset & Return
                    await tilt("spatula", 0);
                    await moveSmooth("spatula", spatulaHome);
                    break;
                    
                case 'cl_reagent':
                    // 1. Bring bottle forward
                    await moveSmooth("bot_AgNO3", [0.45, 1.1, -0.25]);
                    await delay(800);
                    openBottle("AgNO3"); // Open cap
                    await delay(500);

                    // 2. Suction with dropper
                    if (bottle) {
                        await moveSmooth("dropper", [0.45, 1.45, -0.25]); // Drop into bottle
                        pickDropper('AgNO3');
                        await delay(1000);

                        // 3. Move dropper to tube mouth
                        await moveSmooth("dropper", [tt1.position[0], tt1.position[1] + 0.45, tt1.position[2]]);
                        
                        // 4. Tilt & Drop reagent
                        await tilt("dropper", -0.5);
                        dropOneFromDropper('tt1');
                        await delay(500);
                        dropOneFromDropper('tt1');
                        await delay(500);
                        dropOneFromDropper('tt1');
                        await delay(1200);
                        
                        // 5. Reset & Cleanup
                        await tilt("dropper", 0);
                        await moveSmooth("dropper", dropperHome);
                        emptyDropper();
                        openBottle(null); // Close bottle
                        await moveSmooth("bot_AgNO3", bottleHome);
                    }
                    break;
            }
        } finally {
            isActionRunningRef.current = false;
        }
    }, [
        setApparatusPosition,
        setApparatusRotation,
        pickSalt, 
        addSalt, 
        pickDropper, 
        dropOneFromDropper, 
        emptyDropper,
        attachHolder,
        openBottle
    ]);

    const stopTour = useCallback(() => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setTourState({ isActive: false, stepIndex: 0, isPaused: false, highlightedIds: [] });
    }, [setTourState]);

    useEffect(() => {
        if (isActive && lastPerformedStepRef.current !== stepIndex) {
            lastPerformedStepRef.current = stepIndex;
            setHasFinishedNarration(false);
            const step = TOUR_STEPS[stepIndex];
            setTourState({ highlightedIds: step.highlights });
            const textKey = STEP_KEYS[stepIndex];
            speak(TOUR_CONTENT[language]?.[textKey] || TOUR_CONTENT['en'][textKey]);
            
            // Trigger real-time action if applicable
            performAction(textKey);
        }
    }, [isActive, stepIndex, language, speak, setTourState, performAction]);

    useEffect(() => {
        if (isActive) {
            if (isPaused) {
                if (window.speechSynthesis) window.speechSynthesis.pause();
            } else {
                if (window.speechSynthesis) window.speechSynthesis.resume();
            }
        }
    }, [isActive, isPaused]);

    // Auto-advance logic
    useEffect(() => {
        if (isActive && !isPaused && hasFinishedNarration && !isActionRunningRef.current) {
            const timer = setTimeout(() => {
                if (stepIndex < TOUR_STEPS.length - 1) {
                    setTourState({ stepIndex: stepIndex + 1 });
                } else {
                    setTourState({ isPaused: true }); // Pause at the very end
                }
            }, 1000); // 1 second gap between steps
            return () => clearTimeout(timer);
        }
    }, [isActive, isPaused, hasFinishedNarration, stepIndex, setTourState]);

    if (!isActive) return null;

    const currentText = TOUR_CONTENT[language]?.[STEP_KEYS[stepIndex]] || TOUR_CONTENT['en'][STEP_KEYS[stepIndex]];

    return (
        <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-end pb-32">
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

            {/* Captions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                key={`${stepIndex}-${language}`}
                className="max-w-2xl text-center px-8 py-6 bg-black/60 backdrop-blur-xl rounded-[2rem] border border-white/20 pointer-events-auto shadow-2xl"
            >
                <p className="text-lg font-medium text-white tracking-wide leading-relaxed">
                    {currentText}
                </p>
                {isPaused && stepIndex < TOUR_STEPS.length - 1 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setTourState({ stepIndex: stepIndex + 1, isPaused: false })}
                        className="mt-6 px-8 py-3 bg-[#2F8D46] text-white font-bold rounded-2xl hover:bg-[#34ceba] transition-all flex items-center gap-2 mx-auto group shadow-[0_0_30px_rgba(47,141,70,0.4)]"
                    >
                        NEXT STEP
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                )}
                {stepIndex === TOUR_STEPS.length - 1 && isPaused && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={stopTour}
                        className="mt-6 px-8 py-3 bg-[#2F8D46] text-white font-bold rounded-2xl hover:bg-[#34ceba] transition-all flex items-center gap-2 mx-auto group shadow-[0_0_30px_rgba(47,141,70,0.4)]"
                    >
                        FINISH TOUR
                        <Check className="w-5 h-5" />
                    </motion.button>
                )}
            </motion.div>

            {/* Controls */}
            <div className="mt-8 flex items-center gap-6 pointer-events-auto bg-black/80 backdrop-blur-2xl px-8 py-3 rounded-full border border-white/10 shadow-2xl">
                {/* Language Picker */}
                <div className="relative" ref={langRef}>
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
                            isLangOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Languages className="w-4 h-4" />
                        <span className="text-sm font-bold w-6">{language.toUpperCase()}</span>
                    </button>

                    <AnimatePresence>
                        {isLangOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full mb-4 left-0 bg-black/90 backdrop-blur-3xl rounded-3xl border border-white/10 p-3 min-w-[160px] shadow-2xl"
                            >
                                <div className="space-y-1">
                                    {[
                                        { id: 'en', name: 'English' },
                                        { id: 'hi', name: 'Hindi (हिंदी)' },
                                        { id: 'mr', name: 'Marathi (मराठी)' },
                                        { id: 'te', name: 'Telugu (తెలుగు)' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.id}
                                            onClick={() => {
                                                setLanguage(lang.id as any);
                                                setIsLangOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                language === lang.id 
                                                ? 'bg-[#2F8D46] text-white' 
                                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {lang.name}
                                            {language === lang.id && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-6 w-[1px] bg-white/10" />

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTourState({ stepIndex: Math.max(0, stepIndex - 1), isPaused: false })}
                        disabled={stepIndex === 0}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <button
                        onClick={handleTogglePlay}
                        className="p-3 text-[#2F8D46] hover:scale-110 transition-all bg-white/5 rounded-full"
                    >
                        {isPaused ? <Play className="w-8 h-8 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
                    </button>

                    <button
                        onClick={() => setTourState({ stepIndex: Math.min(TOUR_STEPS.length - 1, stepIndex + 1), isPaused: false })}
                        disabled={stepIndex === TOUR_STEPS.length - 1}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="h-6 w-[1px] bg-white/10" />

                <button
                    onClick={() => toggleVoice()}
                    className={`p-2 transition-all ${voiceEnabled ? 'text-[#2F8D46]' : 'text-white/30'}`}
                >
                    {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>

                <div className="flex gap-1.5 px-2">
                    {TOUR_STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIndex ? 'w-6 bg-[#2F8D46]' : 'w-1.5 bg-white/20'}`} />
                    ))}
                </div>

                <button 
                    onClick={stopTour}
                    className="p-2 text-white/30 hover:text-red-500 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
