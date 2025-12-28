
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Rocket, Database, AlertCircle } from 'lucide-react';
import Background from './components/Background';
import NexusView from './components/NexusView';
import ParagraphView from './components/ParagraphView';
import TextSelector from './components/TextSelector';
import SnakeCursor from './components/SnakeCursor';
import SessionComplete from './components/SessionComplete';
import FinalAssessment from './components/FinalAssessment';
import { generateLearningSession, generateWordImage } from './services/geminiService';
import { LearningSession, AppState } from './types';
import { playSound, startAmbiance } from './utils/sound';

const NeuralForgeLoader = () => (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="relative w-48 h-48">
            <motion.div className="absolute inset-0 border-[4px] border-neon-blue rounded-full border-t-transparent shadow-[0_0_40px_#00F0FF]" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute inset-6 border-[4px] border-neon-purple rounded-full border-b-transparent shadow-[0_0_40px_#BD00FF]" animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
            <div className="absolute inset-0 flex items-center justify-center"><Rocket className="text-white animate-bounce" size={40} /></div>
        </div>
        <h2 className="mt-16 text-white font-mono text-sm uppercase tracking-[1em] font-black animate-pulse">Forging Your Path...</h2>
    </motion.div>
);

const ProgressHUD: React.FC<{ progress: number; moodColor: string }> = ({ progress, moodColor }) => {
    const railPath = "M 4 996 L 996 996 L 996 4 L 4 4 L 4 996";
    
    return (
        <div className="absolute inset-0 z-[100] pointer-events-none p-0 overflow-visible">
            {/* Persistent Lightning Rail */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                <defs>
                    <filter id="lightningFractal" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="4" result="noise">
                            <animate attributeName="seed" values="1;100" dur="1s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
                    </filter>
                    <linearGradient id="electricGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={moodColor} />
                        <stop offset="40%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor={moodColor} />
                    </linearGradient>
                </defs>
                <path d={railPath} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.02" />
                <motion.path 
                    d={railPath} 
                    fill="none" 
                    stroke="url(#electricGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    filter="url(#lightningFractal)"
                    className="opacity-90"
                />
            </svg>

            {/* Neural Interface Indicators */}
            <div className="absolute top-10 left-12 flex items-center gap-4 opacity-30">
                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                <span className="font-mono text-[7px] tracking-[1.2em] uppercase text-white font-bold">NEURAL_SYNC_ACTIVE</span>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<'TOPIC' | 'TEXT' | 'FORGE'>('TOPIC');
  const [inputValue, setInputValue] = useState(''); 
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [wordDirection, setWordDirection] = useState(0); 
  const [images, setImages] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session && session.words[currentWordIndex]) {
        document.documentElement.style.setProperty('--mood-color', session.words[currentWordIndex].moodColor);
    }
  }, [currentWordIndex, session]);

  const initiateFlow = async (text: string, manualWords: string[] = []) => {
      startAmbiance();
      setError(null);
      try {
          if (mode === 'FORGE') {
              const parsedData = JSON.parse(text) as LearningSession;
              setAppState(AppState.GENERATING);
              setSession(parsedData);
              setImages({}); 
              setCurrentWordIndex(0);
              setCurrentPage(0);
              parsedData.words.forEach((word, idx) => {
                  if (word.imageUrl) setImages(p => ({ ...p, [idx]: word.imageUrl! }));
                  else generateWordImage(word.visualPrompt).then(img => img && setImages(p => ({ ...p, [idx]: img })));
              });
              setAppState(AppState.PARAGRAPH_PREVIEW);
              playSound('success');
              return;
          }
          setAppState(AppState.GENERATING);
          setSession(null);
          setImages({}); 
          setCurrentWordIndex(0);
          setCurrentPage(0);
          const result = await generateLearningSession(text, mode, manualWords);
          setSession(result);
          result.words.forEach((word, idx) => {
              generateWordImage(word.visualPrompt).then(img => img && setImages(p => ({ ...p, [idx]: img })));
          });
          setAppState(AppState.PARAGRAPH_PREVIEW);
          playSound('success');
      } catch (err) {
          setError(mode === 'FORGE' ? "JSON error." : "Connection lost.");
          setAppState(AppState.IDLE);
      }
  };

  const handleNextWord = () => {
      if (!session) return;
      if (currentWordIndex < session.words.length - 1) {
          setWordDirection(1);
          setCurrentWordIndex(prev => prev + 1);
          setCurrentPage(0);
      } else {
          setAppState(AppState.PARAGRAPH_REVIEW);
          playSound('success');
      }
  };

  const handlePrevWord = () => {
      if (currentWordIndex > 0) {
          setWordDirection(-1);
          setCurrentWordIndex(prev => prev - 1);
          setCurrentPage(6); 
      } else {
          setAppState(AppState.PARAGRAPH_PREVIEW);
      }
  };

  const focusShiftVariants = {
    enter: (direction: number) => ({ filter: 'blur(40px) saturate(0.2)', scale: 1.1, opacity: 0 }),
    center: { filter: 'blur(0px) saturate(1)', scale: 1, opacity: 1 },
    exit: (direction: number) => ({ filter: 'blur(40px) saturate(0.2)', scale: 0.9, opacity: 0 })
  };

  const totalSteps = session ? session.words.length * 7 : 1;
  const currentGlobalStep = (currentWordIndex * 7) + currentPage;
  const globalProgress = (currentGlobalStep + 1) / totalSteps;

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-white bg-[#010103]">
      <style>{`input, textarea { font-size: 16px; }`}</style>
      <SnakeCursor />
      <Background />
      <AnimatePresence mode="wait">
        {appState === AppState.IDLE && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 text-center">
            <h1 className="text-8xl md:text-[12rem] font-black text-white tracking-tighter uppercase mb-6 drop-shadow-3xl">LEXICON <span className="text-neon-gold">PRIME</span></h1>
            <p className="font-mono text-neon-blue text-xs md:text-sm tracking-[0.8em] uppercase font-bold opacity-50 mb-16">Elevate Your Expression</p>
            <div className="flex gap-4 mb-16 p-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                {['TOPIC', 'TEXT', 'FORGE'].map((m) => (
                    <button key={m} onClick={() => { setMode(m as any); setError(null); }} className={`px-10 py-4 rounded-full text-[10px] font-black tracking-widest transition-all ${mode === m ? 'bg-white text-black shadow-3xl' : 'text-gray-500 hover:text-white'}`}>
                      {m === 'TOPIC' ? 'Topic Mode' : m === 'TEXT' ? 'Analyze Text' : 'Data Forge'}
                    </button>
                ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(inputValue.trim()) mode === 'TEXT' ? setAppState(AppState.TEXT_SELECTION) : initiateFlow(inputValue); }} className="w-full max-w-3xl flex flex-col items-center gap-8">
                <div className="w-full relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-[3rem] opacity-20 blur-2xl group-focus-within:opacity-40 transition duration-700" />
                    {mode === 'TOPIC' ? (
                        <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="What do you want to master?" className="relative w-full bg-black/80 border border-white/20 rounded-full px-12 py-8 text-3xl font-black text-center text-white focus:outline-none focus:border-white transition-all backdrop-blur-3xl uppercase tracking-widest" />
                    ) : (
                        <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={mode === 'TEXT' ? "Paste your text here..." : "Paste raw JSON here..."} rows={6} className="relative w-full bg-black/80 border border-white/20 rounded-[3rem] px-12 py-10 text-xl font-serif text-center text-white focus:outline-none focus:border-white transition-all backdrop-blur-3xl" />
                    )}
                </div>
                {error && <div className="text-red-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
                <button type="submit" className="group h-24 px-20 bg-white text-black rounded-full font-black tracking-widest flex items-center gap-6 hover:scale-110 active:scale-95 transition-all shadow-4xl">
                    {mode === 'TEXT' ? 'Begin Journey' : 'Explore Subject'} <BrainCircuit size={32} />
                </button>
            </form>
          </motion.div>
        )}
        {appState === AppState.TEXT_SELECTION && <motion.div key="selector" className="absolute inset-0 z-30"><TextSelector initialText={inputValue} onBack={() => setAppState(AppState.IDLE)} onAnalyze={initiateFlow} /></motion.div>}
        {appState === AppState.GENERATING && <NeuralForgeLoader />}
        {appState === AppState.PARAGRAPH_PREVIEW && session && <ParagraphView text={session.fullText} targetWords={session.words} mode="PREVIEW" onContinue={() => setAppState(AppState.LEARNING_SEQUENCE)} />}
        {appState === AppState.LEARNING_SEQUENCE && session && (
             <div className="absolute inset-0 z-30 overflow-hidden perspective-[1000px]">
                 <ProgressHUD progress={globalProgress} moodColor={session.words[currentWordIndex].moodColor} />
                 <AnimatePresence custom={wordDirection} mode="wait">
                    <motion.div 
                      key={currentWordIndex} 
                      custom={wordDirection}
                      variants={focusShiftVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.25 } }} 
                      className="absolute inset-0 origin-center"
                    >
                        <NexusView 
                          data={session.words[currentWordIndex]} 
                          imageUrl={images[currentWordIndex] || null} 
                          onNextWord={handleNextWord} 
                          onPrevWord={handlePrevWord} 
                          isLastWord={currentWordIndex === session.words.length - 1} 
                          isFirstWord={currentWordIndex === 0} 
                          totalWords={session.words.length} 
                          currentWordIndex={currentWordIndex}
                          page={currentPage}
                          setPage={(p) => setCurrentPage(p)}
                        />
                    </motion.div>
                 </AnimatePresence>
             </div>
        )}
        {appState === AppState.PARAGRAPH_REVIEW && session && <ParagraphView text={session.fullText} targetWords={session.words} mode="REVIEW" onContinue={() => setAppState(AppState.FINAL_ASSESSMENT)} />}
        {appState === AppState.FINAL_ASSESSMENT && session && <FinalAssessment session={session} onComplete={() => setAppState(AppState.SESSION_COMPLETE)} />}
        {appState === AppState.SESSION_COMPLETE && <SessionComplete onReplay={() => { setCurrentWordIndex(0); setCurrentPage(0); setAppState(AppState.LEARNING_SEQUENCE); }} onNewSession={() => { setAppState(AppState.IDLE); setInputValue(''); }} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
