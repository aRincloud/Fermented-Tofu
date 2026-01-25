import React, { useState } from 'react';
import { Archive } from 'lucide-react';

interface BottlingPhaseProps {
  onComplete: () => void;
}

export default function BottlingPhase({ onComplete }: BottlingPhaseProps) {
  const [filled, setFilled] = useState(false);
  const [sealed, setSealed] = useState(false);

  const handleFill = () => {
    if (filled) return;
    setFilled(true);
  };

  const handleSeal = () => {
    if (!filled || sealed) return;
    setSealed(true);
    setTimeout(onComplete, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative animate-fade-in">
         {/* Jar Assembly */}
         <div className="relative w-48 h-64 flex flex-col items-center justify-end">
            
            {/* Lid (Clickable for Seal) */}
            <button 
                onClick={handleSeal}
                disabled={!filled || sealed}
                className={`absolute -top-16 w-36 h-14 bg-red-700 rounded-sm shadow-xl z-30 transition-all duration-700 ease-in-out border-b-4 border-red-900 outline-none
                    ${sealed ? 'translate-y-[85px]' : filled ? 'translate-y-0 animate-bounce cursor-pointer' : 'translate-y-[-200px] opacity-0'}
                `}
            >
                <div className="w-full h-full flex items-center justify-center relative">
                    <div className="w-24 h-1 bg-red-500/30"></div>
                     {/* Sticker on Lid */}
                    <div className="absolute w-8 h-8 bg-yellow-400 rounded-full right-2 top-2 opacity-50"></div>
                </div>
            </button>

            {/* Glass Jar Body */}
            <div 
                onClick={handleFill}
                className={`relative w-48 h-64 bg-white/10 border-4 border-stone-400 rounded-2xl backdrop-blur-sm overflow-hidden z-20 cursor-pointer transition-shadow shadow-2xl
                    ${!filled ? 'hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''}
                `}
            >
                {/* Reflections */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none z-30"></div>
                <div className="absolute top-4 right-4 w-4 h-32 bg-white/20 rounded-full blur-sm z-30"></div>
                
                {/* Contents */}
                <div className={`absolute bottom-0 left-0 right-0 bg-[#8B0000] transition-all duration-1000 ease-out ${filled ? 'h-[90%]' : 'h-0'}`}>
                    <div className="w-full h-full opacity-60 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    
                    {/* Floating chunks details */}
                    {filled && (
                        <>
                            <div className="absolute top-8 left-6 w-10 h-10 bg-white/10 rounded rotate-12 backdrop-blur-md"></div>
                            <div className="absolute top-20 right-8 w-8 h-8 bg-white/10 rounded -rotate-6 backdrop-blur-md"></div>
                            <div className="absolute bottom-10 left-12 w-12 h-12 bg-white/10 rounded rotate-45 backdrop-blur-md"></div>
                        </>
                    )}
                </div>
            </div>
         </div>

         {/* Instructions */}
         <div className="absolute -bottom-12 w-full text-center">
             {!filled && (
                 <div className="inline-block bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur font-bold animate-pulse">
                     Tap jar to fill
                 </div>
             )}
             {filled && !sealed && (
                 <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
                     Tap lid to seal!
                 </div>
             )}
             {sealed && (
                <div className="inline-flex items-center gap-2 text-green-400 font-bold bg-green-900/80 px-4 py-2 rounded-full border border-green-500">
                    <Archive size={18} /> Sealed & Ready
                </div>
             )}
         </div>
    </div>
  );
}