import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface AlcoholPhaseProps {
  onComplete: (precision: number) => void;
}

export default function AlcoholPhase({ onComplete }: AlcoholPhaseProps) {
  const [pouring, setPouring] = useState(false);
  const [fillLevel, setFillLevel] = useState(0); // 0 to 100
  const [completed, setCompleted] = useState(false);
  
  // Adjusted Difficulty
  const TARGET_MIN = 60; 
  const TARGET_MAX = 90; 
  const FILL_RATE = 0.4; 
  
  const requestRef = useRef<number>(0);

  const startPour = () => {
    if (completed) return;
    setPouring(true);
  };

  const stopPour = () => {
    if (completed || !pouring) return;
    setPouring(false);
    setCompleted(true);
    
    // Calculate score
    let score = 0;
    if (fillLevel >= TARGET_MIN && fillLevel <= TARGET_MAX) {
      score = 100; // Perfect
    } else {
      const dist = Math.min(Math.abs(fillLevel - TARGET_MIN), Math.abs(fillLevel - TARGET_MAX));
      score = Math.max(0, 100 - (dist * 4));
    }

    setTimeout(() => {
        onComplete(score);
    }, 1500);
  };

  const animate = () => {
    if (pouring && fillLevel < 105) {
      setFillLevel(prev => prev + FILL_RATE);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (pouring) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [pouring]); 

  // Interaction handlers - ATTACHED TO WINDOW for Release
  useEffect(() => {
      const handleGlobalUp = () => {
          if (pouring) stopPour();
      };
      
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchend', handleGlobalUp);
      return () => {
          window.removeEventListener('mouseup', handleGlobalUp);
          window.removeEventListener('touchend', handleGlobalUp);
      };
  }, [pouring, completed]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); 
      startPour();
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none animate-fade-in">
        
        {/* Progress Bar with Target Zone - Floating Top */}
        <div className="absolute -top-16 w-64 h-6 bg-stone-800/80 rounded-full overflow-hidden border border-stone-600 backdrop-blur-sm">
            {/* Target Zone */}
            <div 
                className="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-500 transition-all"
                style={{ left: `${TARGET_MIN}%`, width: `${TARGET_MAX - TARGET_MIN}%` }}
            >
            </div>
            {/* Fill Bar */}
            <div 
                className={`h-full transition-all duration-75 ease-linear ${fillLevel > TARGET_MAX ? 'bg-red-500' : 'bg-blue-400'}`}
                style={{ width: `${Math.min(100, fillLevel)}%` }}
            ></div>
        </div>

        {/* Bowl visualization (Top Down / Angled) */}
        <div className="relative w-[320px] h-[320px] flex items-center justify-center">
            {/* Bowl Body */}
            <div className="w-64 h-64 bg-stone-100 rounded-full border-8 border-stone-300 relative overflow-hidden shadow-2xl">
                {/* Tofu Cubes inside */}
                <div className="absolute inset-0 p-8 flex flex-wrap gap-2 justify-center items-center opacity-90">
                     {Array.from({length: 9}).map((_, i) => (
                         <div key={i} className="w-12 h-12 bg-white border border-stone-200 rounded-sm transform rotate-12 shadow-sm"></div>
                     ))}
                </div>

                {/* Liquid Level Overlay */}
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-blue-500/30 transition-all duration-100 ease-linear border-t-2 border-blue-400/50 backdrop-blur-[2px]"
                    style={{ height: `${fillLevel}%` }}
                >
                    {pouring && <div className="absolute inset-0 animate-pulse bg-blue-300/10"></div>}
                </div>
            </div>
            
            {/* Bottle Graphic (Interactive) */}
            <div 
                className={`absolute -right-20 -top-24 w-40 h-80 transition-transform duration-300 origin-bottom-right cursor-pointer touch-none
                    ${pouring ? 'rotate-[-45deg] translate-y-10 scale-95' : 'rotate-0 hover:scale-105 active:scale-95'}
                `}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                // Removed local mouseUp/End, handled by global effect
            >
                {/* Instruction Float */}
                {!pouring && !completed && (
                    <div className="absolute -top-10 left-0 right-0 text-center animate-bounce">
                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            Hold to Pour
                        </div>
                    </div>
                )}

                {/* Simple Bottle CSS Art */}
                <div className="w-24 h-56 bg-emerald-800/90 rounded-b-xl rounded-t-lg border-2 border-emerald-600 backdrop-blur-md mx-auto relative overflow-hidden shadow-2xl">
                    <div className="absolute bottom-0 w-full h-full bg-emerald-900/50"></div>
                    <div className="absolute top-10 left-0 right-0 h-12 bg-emerald-100/20 rotate-12"></div>
                    {/* Label */}
                    <div className="absolute top-24 left-2 right-2 h-20 bg-stone-200 rounded-sm flex items-center justify-center border border-stone-300">
                        <span className="font-serif text-emerald-900 font-bold text-xl writing-vertical">Spirit</span>
                    </div>
                </div>
                <div className="w-10 h-16 bg-emerald-900 mx-auto -mt-1 relative z-10 border-x border-emerald-700"></div>
                
                {/* Stream */}
                {pouring && (
                    <div className="absolute -left-10 top-[260px] w-[300px] h-4 bg-blue-300/60 rounded-full blur-sm rotate-[-45deg] pointer-events-none"></div>
                )}
            </div>
        </div>

        {/* Status Text (Replacing Bottom Button) */}
        <div className="absolute bottom-[-60px]">
            {completed ? (
                 <div className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-lg animate-pop-in
                    ${fillLevel >= TARGET_MIN && fillLevel <= TARGET_MAX ? 'bg-green-500 text-white' : 'bg-stone-500 text-white'}`}>
                    {fillLevel >= TARGET_MIN && fillLevel <= TARGET_MAX ? <Check size={20}/> : null}
                    {fillLevel >= TARGET_MIN && fillLevel <= TARGET_MAX ? 'Perfect Amount' : 'Done'}
                 </div>
            ) : (
                 <div className="text-stone-400 text-sm font-medium animate-pulse">
                     Keep pouring until the bar hits green
                 </div>
            )}
        </div>
    </div>
  );
}