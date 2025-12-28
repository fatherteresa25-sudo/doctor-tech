
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform, useMotionTemplate } from 'framer-motion';
import { WordData } from '../types';
import { Compass, Activity, Target, ShieldCheck } from 'lucide-react';
import { playSound } from '../utils/sound';

interface NexusViewProps {
  data: WordData;
  imageUrl: string | null;
  onNextWord: () => void;
  onPrevWord: () => void;
  page: number;
  setPage: (page: number, direction: number) => void;
}

const NexusView: React.FC<NexusViewProps> = ({ data, imageUrl, onNextWord, onPrevWord, page, setPage }) => {
  const lockInput = useRef(false);

  // Perspective Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mouseXSpring = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-7, 7]);
  const cardTransform = useMotionTemplate`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const paginate = (dir: number) => {
    if (lockInput.current) return;
    const next = page + dir;
    if (next >= 0 && next < 7) {
      playSound('transition');
      setPage(next, dir);
      lockInput.current = true;
      setTimeout(() => lockInput.current = false, 400);
    } else if (dir > 0) onNextWord();
    else onPrevWord();
  };

  const getFontClass = () => {
    if (data.fontVibe === 'SERIF') return 'font-serif italic tracking-tight';
    if (data.fontVibe === 'MONO') return 'font-mono tracking-widest uppercase';
    return 'font-sans tracking-tighter uppercase font-black';
  };

  const MoodGlow = (baseOpacity = 0.4) => {
    const intensity = data.glowIntensity ?? 1;
    const spread = data.glowSpread ?? 120;
    return (
      <motion.div 
        className="absolute inset-0 z-[-1] pointer-events-none blur-[100px]"
        style={{ 
            background: `radial-gradient(circle at center, ${data.moodColor}88 0%, transparent 70%)`,
            filter: `blur(${spread}px)`,
            opacity: baseOpacity * intensity
        }}
        animate={{ opacity: [(baseOpacity * intensity) * 0.4, baseOpacity * intensity, (baseOpacity * intensity) * 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8 overflow-hidden select-none"
         onClick={(e) => {
           const x = e.clientX;
           if (x < window.innerWidth * 0.15) onPrevWord();
           else if (x > window.innerWidth * 0.85) onNextWord();
           else if (x < window.innerWidth / 2) paginate(-1);
           else paginate(1);
         }}>
      
      <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center pointer-events-none px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 1.05 }}
            className="w-full h-full max-h-[88vh] flex flex-col items-center justify-center text-center gap-4 pointer-events-auto overflow-hidden relative"
          >
            {/* PAGE 0: HERO WORD (Hard Locked Height) */}
            {page === 0 && (
              <div className="w-full flex-1 flex flex-col items-center justify-between space-y-4 overflow-hidden py-4">
                <motion.div style={{ transform: cardTransform }} className="relative w-full flex-1 min-h-0 flex flex-col items-center justify-center py-6">
                  {MoodGlow(0.6)}
                  <div className="max-w-[95%] mx-auto">
                    <h1 className={`${getFontClass()} text-[clamp(2rem,12vw,7.5rem)] leading-[0.8] text-white drop-shadow-4xl break-all uppercase px-4`}>
                      {data.word}
                    </h1>
                  </div>
                  <p className="mt-4 font-mono text-[clamp(7px,2vw,10px)] tracking-[0.7em] text-white/40 uppercase font-black">
                    {data.phonetic}
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-4xl mx-auto shrink-0 mb-4 px-2">
                    {[
                        { label: 'Definition', text: data.definition, icon: Activity },
                        { label: 'Origin', text: data.origin, icon: Compass }
                    ].map((item, i) => (
                        <div key={i} className="p-4 md:p-6 rounded-[2rem] bg-white/[0.04] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
                            <div className="flex items-center gap-2 justify-center mb-2 opacity-30 text-[8px] font-mono tracking-widest uppercase font-bold group-hover:opacity-100 transition-opacity">
                                <item.icon size={10} /> {item.label}
                            </div>
                            <div className="max-h-[60px] overflow-y-auto neural-scroll">
                                <p className="text-sm md:text-lg font-light text-white/90 leading-tight break-words">{item.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            )}

            {/* PAGE 1: VISUAL SYNTHESIS */}
            {page === 1 && (
               <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl space-y-6 overflow-hidden p-4">
                  <div className="flex-1 w-full max-h-[50%] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-5xl relative bg-black/40 shrink-0">
                      {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" alt="Visual" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
                  </div>
                  <div className="flex-1 w-full overflow-y-auto neural-scroll px-4 flex items-center justify-center">
                    <p className="text-xl md:text-4xl font-serif italic text-white/95 leading-tight">
                      "{data.sarcasticDefinition}"
                    </p>
                  </div>
               </div>
            )}

            {/* CONTEXT PAGES (2-5) Locked Vertical Center + Internal Scroll */}
            {(page >= 2 && page <= 5) && (
                <motion.div 
                    style={{ border: `1px solid ${data.moodColor}33` }}
                    className="w-full h-full max-h-[82vh] p-6 md:p-12 rounded-[3.5rem] bg-white/[0.01] backdrop-blur-4xl relative overflow-hidden flex flex-col justify-center"
                >
                    {MoodGlow(0.2)}
                    <div className="shrink-0 mb-6">
                      <span className="inline-block px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono tracking-[0.4em] text-white/50 uppercase font-black" style={{ color: data.moodColor }}>
                          {page < 4 ? data.nativeContexts[page-2]?.label : 'PRACTICAL_LOGIC'}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center overflow-hidden w-full">
                      {/* MAIN SENTENCE RESERVOIR */}
                      <div className="flex-1 overflow-y-auto neural-scroll w-full flex items-center justify-center px-4 max-h-[50%] mb-8">
                         <h3 className="text-[clamp(1.2rem,6vw,4rem)] font-black text-white tracking-tighter leading-[1] uppercase break-words">
                             {page < 4 ? `"${data.nativeContexts[page-2]?.description}"` : `"${data.nativeContexts[page-4]?.sentence}"`}
                         </h3>
                      </div>
                      
                      {/* SIGNIFICANCE RESERVOIR */}
                      <div className="shrink-0 pt-6 border-t border-white/5 overflow-y-auto neural-scroll pr-2 max-h-[30%] text-left">
                          <p className="text-sm md:text-xl font-serif italic text-gray-400 font-light leading-relaxed">
                              {page < 4 ? data.nativeContexts[page-2]?.significance : data.nativeContexts[page-4]?.significance}
                          </p>
                      </div>
                    </div>
                </motion.div>
            )}

            {/* PAGE 6: POLARITIES */}
            {page === 6 && (
                <div className="w-full h-full max-h-[85vh] flex flex-col items-center justify-center gap-4 md:gap-6 p-2 overflow-hidden">
                    <div className="w-full max-w-4xl p-6 md:p-10 rounded-[3rem] border border-white/10 bg-white/[0.03] relative overflow-hidden group flex flex-col items-center justify-center flex-1 min-h-0">
                        {MoodGlow(0.3)}
                        <div className="text-[9px] font-mono tracking-widest text-white/30 mb-2 uppercase flex items-center gap-2"><Target size={12}/> SYNONYM</div>
                        <div className="w-full overflow-y-auto neural-scroll flex flex-col items-center justify-center px-4">
                            <h2 className="text-[clamp(1.5rem,8vw,6rem)] font-black text-white tracking-tighter uppercase leading-none break-all mb-2">{data.synonyms[0]?.word}</h2>
                            <p className="text-gray-400 text-sm md:text-xl font-serif italic">"{data.synonyms[0]?.definition}"</p>
                        </div>
                    </div>

                    <div className="w-full max-w-4xl p-6 md:p-10 rounded-[3rem] border border-white/10 bg-black/40 relative overflow-hidden group flex flex-col items-center justify-center flex-1 min-h-0">
                        <div className="text-[9px] font-mono tracking-widest text-white/30 mb-2 uppercase flex items-center gap-2"><ShieldCheck size={12}/> ANTONYM</div>
                        <div className="w-full overflow-y-auto neural-scroll flex flex-col items-center justify-center px-4">
                            <h2 className="text-[clamp(1.5rem,8vw,6rem)] font-black text-neon-pink tracking-tighter uppercase leading-none break-all mb-2">{data.antonyms[0]?.word}</h2>
                            <p className="text-gray-500 text-sm md:text-xl font-serif italic">"{data.antonyms[0]?.definition}"</p>
                        </div>
                    </div>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NexusView;
