import React, { useState, useEffect, useRef } from 'react';
import { Droplets, Check } from 'lucide-react';

interface AlcoholPhaseProps {
  onComplete: (precision: number) => void;
}

export default function AlcoholPhase({ onComplete }: AlcoholPhaseProps) {
  const [pouring, setPouring] = useState(false);
  const [fillLevel, setFillLevel] = useState(0); // 0 to 100
  const [completed, setCompleted] = useState(false);
  
  const TARGET_MIN = 70;
  const TARGET_MAX = 85;
  const FILL_RATE = 0.8; 
  
  const requestRef = useRef<number>(0);

  const startPour = () => {
    if (completed) return;
    setPouring(true);
  };

  const stopPour = () => {
    if (completed) return;
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

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none animate-fade-in">
        
        {/* Progress Bar with Target Zone - Floating Top */}
        <div className="absolute -top-16 w-64 h-6 bg-stone-800/80 rounded-full overflow-hidden border border-stone-600 backdrop-blur-sm">
            {/* Target Zone */}
            <div 
                className="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-500"
                style={{ left: `${TARGET_MIN}%`, width: `${TARGET_MAX - TARGET_MIN}%` }}
            >
                {/* <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-green-400">Target</span> */}
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
            
            {/* Bottle Graphic (Right side) */}
            <div 
                className={`absolute -right-16 -top-16 w-32 h-64 bg-stone-800/10 transition-transform duration-300 origin-bottom-right
                    ${pouring ? 'rotate-[-45deg] translate-y-10' : 'rotate-0'}
                `}
            >
                {/* Simple Bottle CSS Art */}
                <div className="w-20 h-48 bg-emerald-800/80 rounded-b-xl rounded-t-lg border-2 border-emerald-600 backdrop-blur-md mx-auto relative overflow-hidden">
                    <div className="absolute bottom-0 w-full h-full bg-emerald-900/50"></div>
                    <div className="absolute top-10 left-0 right-0 h-12 bg-emerald-100/20 rotate-12"></div>
                </div>
                <div className="w-8 h-16 bg-emerald-900 mx-auto -mt-1 relative z-10"></div>
                
                {/* Stream */}
                {pouring && (
                    <div className="absolute -left-10 top-[200px] w-[200px] h-4 bg-blue-300/60 rounded-full blur-sm rotate-[-45deg]"></div>
                )}
            </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-[-80px]">
            <button
                className={`
                    w-20 h-20 rounded-full border-4 shadow-xl transition-all active:scale-95 flex items-center justify-center
                    ${completed 
                        ? (fillLevel >= TARGET_MIN && fillLevel <= TARGET_MAX ? 'bg-green-500 border-green-600' : 'bg-stone-500 border-stone-600') 
                        : 'bg-blue-600 border-blue-400 hover:bg-blue-500 animate-pulse'
                    }
                `}
                onMouseDown={startPour}
                onMouseUp={stopPour}
                onTouchStart={startPour}
                onTouchEnd={stopPour}
                disabled={completed}
            >
                {completed ? (fillLevel >= TARGET_MIN && fillLevel <= TARGET_MAX ? <Check className="text-white" size={32}/> : <div className="text-white font-bold">Done</div>) : <Droplets className="text-white" size={32} />}
            </button>
            <div className="mt-2 text-center text-sm font-bold text-stone-300 bg-black/40 rounded-full px-2">Hold to Pour</div>
        </div>
    </div>
  );
}