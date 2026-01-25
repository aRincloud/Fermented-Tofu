import React, { useState, useEffect, useRef } from 'react';
import { Flame, Check, Smartphone, MoveDown } from 'lucide-react';

interface SeasoningPhaseProps {
  onComplete: (balance: number) => void;
}

type Ingredient = 'chili' | 'pepper' | 'salt';

// Small Spoon Cursor for Seasoning
const SeasoningSpoonCursor = ({ x, y, holdingType }: { x: number, y: number, holdingType: Ingredient | null }) => {
    let color = "#e7e5e4"; // default
    if (holdingType === 'chili') color = "#dc2626";
    if (holdingType === 'pepper') color = "#b45309";
    if (holdingType === 'salt') color = "#ffffff";

    return (
        <div 
            className="fixed pointer-events-none z-[100] transition-transform duration-75 ease-out"
            style={{ 
            left: x, 
            top: y,
            transform: `translate(-50%, -50%) rotate(${holdingType ? 0 : -20}deg)`
            }}
        >
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <path d="M70 20 C 85 20, 95 35, 90 50 C 85 65, 65 70, 55 60 C 50 55, 55 45, 60 40 L 20 80" stroke="#78716c" strokeWidth="6" strokeLinecap="round" />
                <ellipse cx="75" cy="40" rx="15" ry="20" fill={color} stroke="#78716c" strokeWidth="2" transform="rotate(45 75 40)" />
            </svg>
        </div>
    );
};

export default function SeasoningPhase({ onComplete }: SeasoningPhaseProps) {
  const [added, setAdded] = useState<Record<Ingredient, number>>({ chili: 0, pepper: 0, salt: 0 });
  const [mixedPercent, setMixedPercent] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [draggingSpice, setDraggingSpice] = useState<Ingredient | null>(null);
  
  const bowlRef = useRef<HTMLDivElement>(null);

  // Motion Logic
  const requestMotionPermission = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') setPermissionGranted(true);
      } catch (e) { console.error(e); }
    } else {
      setPermissionGranted(true);
    }
  };

  const handleManualShake = () => {
    if (mixedPercent >= 100) return;
    updateMix(5);
    setShakeIntensity(50);
    setTimeout(() => setShakeIntensity(0), 100);
  };

  const updateMix = (amount: number) => {
     setMixedPercent(prev => Math.min(100, prev + amount));
     if (navigator.vibrate) navigator.vibrate(50);
  };

  // Sensor Listener
  useEffect(() => {
    if (!permissionGranted) return;
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    const threshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (mixedPercent >= 100) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const { x, y, z } = acc;
      if (x === null || y === null || z === null) return;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
        if (delta > threshold) {
           updateMix(2);
           setShakeIntensity(Math.min(100, delta * 2));
           const timer = setTimeout(() => setShakeIntensity(0), 200);
           return () => clearTimeout(timer);
        }
      }
      lastX = x; lastY = y; lastZ = z;
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted, mixedPercent]);

  // Completion Check
  useEffect(() => {
      if (mixedPercent >= 100) {
          setTimeout(() => {
              let score = 100;
              if (added.chili === 0 || added.pepper === 0 || added.salt === 0) score -= 30;
              if (added.salt > 3) score -= 20; 
              onComplete(Math.max(0, score));
          }, 1500);
      }
  }, [mixedPercent, added, onComplete]);


  // Drag Logic
  const handlePointerDown = (type: Ingredient) => {
      if (mixedPercent > 0) return; // Can't add after mixing starts
      setDraggingSpice(type);
      if (navigator.vibrate) navigator.vibrate(10);
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as any).clientY;
    setCursorPos({ x: clientX, y: clientY });
  };

  const handlePointerUp = () => {
      if (draggingSpice && bowlRef.current) {
         const bowlRect = bowlRef.current.getBoundingClientRect();
         // Simple hit detection
         if (cursorPos.x >= bowlRect.left && cursorPos.x <= bowlRect.right && 
             cursorPos.y >= bowlRect.top && cursorPos.y <= bowlRect.bottom) {
             
             setAdded(prev => ({ ...prev, [draggingSpice]: prev[draggingSpice] + 1 }));
             if (navigator.vibrate) navigator.vibrate(20);
         }
      }
      setDraggingSpice(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove as any);
    window.addEventListener('touchmove', handlePointerMove as any);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
        window.removeEventListener('mousemove', handlePointerMove as any);
        window.removeEventListener('touchmove', handlePointerMove as any);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchend', handlePointerUp);
    }
  }, [draggingSpice, cursorPos]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative animate-fade-in cursor-none">
      <SeasoningSpoonCursor x={cursorPos.x} y={cursorPos.y} holdingType={draggingSpice} />

      {/* Ingredient Shelf (Moved to TOP) */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 bg-stone-800/80 backdrop-blur rounded-b-xl p-4 flex gap-8 z-50 border-x border-b border-stone-600 shadow-xl">
            {/* Chili */}
            <div 
                className="flex flex-col items-center gap-1 group"
                onMouseDown={() => handlePointerDown('chili')}
                onTouchStart={() => handlePointerDown('chili')}
            >
                <div className="w-16 h-16 bg-stone-700 rounded-full border-4 border-stone-600 relative flex items-center justify-center overflow-hidden cursor-none hover:scale-105 transition-transform">
                     <div className="absolute inset-2 bg-red-600 rounded-full opacity-90 mold-texture"></div>
                     <Flame size={20} className="relative z-10 text-red-200" />
                </div>
                <span className="text-xs text-stone-300 font-bold uppercase">Chili</span>
                <span className="text-[10px] text-stone-500">x{added.chili}</span>
            </div>

            {/* Pepper */}
             <div 
                className="flex flex-col items-center gap-1 group"
                onMouseDown={() => handlePointerDown('pepper')}
                onTouchStart={() => handlePointerDown('pepper')}
            >
                <div className="w-16 h-16 bg-stone-700 rounded-full border-4 border-stone-600 relative flex items-center justify-center overflow-hidden cursor-none hover:scale-105 transition-transform">
                     <div className="absolute inset-2 bg-amber-800 rounded-full opacity-90 mold-texture"></div>
                     <div className="w-2 h-2 bg-black rounded-full relative z-10 shadow-[4px_4px_0_black,-4px_4px_0_black]"></div>
                </div>
                <span className="text-xs text-stone-300 font-bold uppercase">Pepper</span>
                <span className="text-[10px] text-stone-500">x{added.pepper}</span>
            </div>

            {/* Salt */}
             <div 
                className="flex flex-col items-center gap-1 group"
                onMouseDown={() => handlePointerDown('salt')}
                onTouchStart={() => handlePointerDown('salt')}
            >
                <div className="w-16 h-16 bg-stone-700 rounded-full border-4 border-stone-600 relative flex items-center justify-center overflow-hidden cursor-none hover:scale-105 transition-transform">
                     <div className="absolute inset-2 bg-white rounded-full opacity-90 mold-texture"></div>
                     <div className="grid grid-cols-3 gap-0.5 relative z-10">
                         {[...Array(9)].map((_,i) => <div key={i} className="w-1 h-1 bg-stone-300 rounded-full"></div>)}
                     </div>
                </div>
                <span className="text-xs text-stone-300 font-bold uppercase">Salt</span>
                <span className="text-[10px] text-stone-500">x{added.salt}</span>
            </div>
      </div>
      
      {/* Instruction */}
      {added.chili + added.pepper + added.salt === 0 && (
          <div className="absolute top-[20px] left-1/2 -translate-x-1/2 text-white/50 text-sm animate-bounce flex items-center gap-2">
              <MoveDown size={16}/> Drag spices to bowl
          </div>
      )}

      {/* Bowl View */}
      <div 
        ref={bowlRef}
        className={`relative w-[340px] h-[340px] transition-transform duration-100 ease-linear mt-20`}
        style={{ 
            transform: `rotate(${Math.sin(Date.now()) * (shakeIntensity / 5)}deg) translate(${Math.random() * shakeIntensity * 0.5}px, ${Math.random() * shakeIntensity * 0.5}px)` 
        }}
    >
        <div className="w-full h-full bg-stone-100 rounded-full border-8 border-stone-300 flex items-center justify-center overflow-hidden shadow-2xl relative">
            {/* Base Tofu */}
            <div className="absolute inset-8 bg-stone-200/50 rounded-full"></div>

            {/* Unmixed Layers - Visualizing the piles */}
            {mixedPercent < 80 && (
                <>
                    {added.chili > 0 && <div className="absolute inset-0 bg-red-600 mix-blend-multiply opacity-40 transition-opacity" style={{ opacity: Math.min(0.8, added.chili * 0.1) }}></div>}
                    {added.pepper > 0 && <div className="absolute inset-0 bg-amber-700 mix-blend-multiply opacity-40 transition-opacity" style={{ opacity: Math.min(0.8, added.pepper * 0.1) }}></div>}
                    {added.salt > 0 && <div className="absolute inset-0 bg-white mix-blend-overlay opacity-30 transition-opacity" style={{ opacity: Math.min(0.6, added.salt * 0.1) }}></div>}
                </>
            )}
            
            {/* Mixing Simulation */}
            <div 
                className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-0 transition-opacity duration-300" 
                style={{ opacity: mixedPercent > 0 ? 0.5 : 0 }}
            ></div>

            {/* Final Mixed Coat */}
            <div 
                className="absolute inset-0 bg-gradient-to-br from-red-700 to-amber-800 mix-blend-color transition-all duration-300" 
                style={{ 
                    opacity: mixedPercent / 100,
                    transform: `scale(${1 + (shakeIntensity/200)})` 
                }}
            ></div>
        </div>
        
        {/* Shake Hint */}
        {mixedPercent < 10 && (added.chili + added.pepper + added.salt > 0) && (
            <div className="absolute -right-8 top-0 animate-pulse text-white drop-shadow-md">
                <Smartphone className="animate-wiggle" size={32}/>
            </div>
        )}
    </div>

      {/* Shake Controls (Bottom) */}
      <div className="absolute -bottom-16 w-full max-w-[300px]">
         {mixedPercent >= 100 && (
             <div className="bg-green-500 text-white font-bold py-3 rounded-xl text-center shadow-lg animate-bounce">
                 <Check className="inline mr-2"/> Seasoning Complete!
             </div>
         )}
         
         <div className="mt-2 text-center">
            {!permissionGranted && mixedPercent < 100 && (
                 <button onClick={requestMotionPermission} className="text-xs text-stone-300 underline">
                    Enable Motion to Shake
                </button>
            )}
            {permissionGranted && mixedPercent < 100 && (
                <button onClick={handleManualShake} className="text-xs text-stone-400">Tap to shake manually</button>
            )}
         </div>
      </div>
    </div>
  );
}