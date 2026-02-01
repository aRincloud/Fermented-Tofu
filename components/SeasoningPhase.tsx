import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, MoveDown, MousePointer2, Smartphone } from 'lucide-react';

interface SeasoningPhaseProps {
  onComplete: (balance: number) => void;
}

type Ingredient = 'salt' | 'ginger' | 'huajiao' | 'chili_mild' | 'chili_med' | 'chili_hot';

const INGREDIENTS: { id: Ingredient; label: string; color: string; iconColor: string }[] = [
    { id: 'salt', label: 'Salt', color: '#ffffff', iconColor: '#d6d3d1' },
    { id: 'ginger', label: 'Ginger', color: '#fde047', iconColor: '#eab308' },
    { id: 'huajiao', label: 'Sichuan P.', color: '#57534e', iconColor: '#292524' },
    { id: 'chili_mild', label: 'Mild Chili', color: '#fca5a5', iconColor: '#ef4444' },
    { id: 'chili_med', label: 'Med Chili', color: '#dc2626', iconColor: '#991b1b' },
    { id: 'chili_hot', label: 'Hot Chili', color: '#7f1d1d', iconColor: '#450a0a' },
];

const SeasoningSpoonCursor = ({ x, y, holdingType }: { x: number, y: number, holdingType: Ingredient | null }) => {
    let color = "#e7e5e4"; 
    const ing = INGREDIENTS.find(i => i.id === holdingType);
    if (ing) color = ing.iconColor;

    return createPortal(
        <div 
            className="fixed pointer-events-none z-[9999] transition-transform duration-75 ease-out"
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
        </div>,
        document.body
    );
};

export default function SeasoningPhase({ onComplete }: SeasoningPhaseProps) {
  const [added, setAdded] = useState<Record<Ingredient, number>>({ 
      salt: 0, ginger: 0, huajiao: 0, chili_mild: 0, chili_med: 0, chili_hot: 0 
  });
  const [coatingLevel, setCoatingLevel] = useState(0); 
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // Use Refs for cursor tracking to avoid stale closures in listeners
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const [cursorVisual, setCursorVisual] = useState({ x: -100, y: -100 });
  
  const [draggingSpice, setDraggingSpice] = useState<Ingredient | null>(null);
  
  // PC Shake (Mouse Drag) State
  const [isShakingMouse, setIsShakingMouse] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  const bowlRef = useRef<HTMLDivElement>(null);
  const [isHoveringBowl, setIsHoveringBowl] = useState(false);
  const lastProgressTime = useRef(0);

  // Generate visuals for Tofu blocks inside bowl
  const tofuVisuals = useRef(Array.from({length: 8}).map((_, i) => ({
      x: (Math.random() * 80) + 10,
      y: (Math.random() * 80) + 10,
      r: (Math.random() * 30) - 15,
      scale: 0.8 + Math.random() * 0.4
  })));

  // Motion Logic (Mobile)
  const requestMotionPermission = async () => {
    // Check if DeviceMotionEvent is defined and has requestPermission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
            setPermissionGranted(true);
        } else {
            alert('Permission denied. Shake feature requires motion access.');
        }
      } catch (e) { 
          console.error(e);
          // Fallback for some non-standard implementations
          setPermissionGranted(true);
      }
    } else {
      // Non-iOS devices typically don't need explicit permission for this
      setPermissionGranted(true);
    }
  };

  const updateMix = (amount: number, intensity: number) => {
     setShakeIntensity(intensity);
     
     // Throttling progress updates slightly to prevent instant finish
     const now = Date.now();
     if (now - lastProgressTime.current > 100) {
        setCoatingLevel(prev => Math.min(100, prev + amount));
        if (amount > 0 && navigator.vibrate) navigator.vibrate(40);
        lastProgressTime.current = now;
     }
     
     // Decay intensity visual quicker
     setTimeout(() => setShakeIntensity(prev => Math.max(0, prev - (intensity * 0.5))), 100);
  };

  useEffect(() => {
    // Auto-enable for devices that don't require permission (Android/Desktop)
    // iOS 13+ has requestPermission function, others don't.
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission !== 'function') {
        setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;
    
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    // Lowered threshold for easier shaking
    const threshold = 8; 

    const handleMotion = (event: DeviceMotionEvent) => {
      if (coatingLevel >= 100) return;
      
      // Use acceleration including gravity for broader compatibility
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const { x, y, z } = acc;
      if (x === null || y === null || z === null) return;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
        
        if (delta > threshold) {
           // Map heavy shake (delta ~20) to good progress
           const progress = Math.min(5, delta * 0.2); 
           updateMix(progress, Math.min(50, delta * 2));
        }
      }
      lastX = x; lastY = y; lastZ = z;
    };
    
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted, coatingLevel]);

  useEffect(() => {
      if (coatingLevel >= 100) {
          setTimeout(() => {
              let score = 100;
              const variety = Object.values(added).filter(v => v > 0).length;
              if (variety < 3) score -= 30; 
              if (added.salt > 4) score -= 20; 
              if (added.salt === 0) score -= 40; 
              
              onComplete(Math.max(0, score));
          }, 1500);
      }
  }, [coatingLevel, added, onComplete]);


  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, type?: Ingredient) => {
      if (type) {
          if (coatingLevel > 0) return; 
          setDraggingSpice(type);
          if (navigator.vibrate) navigator.vibrate(10);
      } else {
          setIsShakingMouse(true);
          const cx = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
          const cy = 'touches' in e ? e.touches[0].clientY : (e as any).clientY;
          lastMousePos.current = { x: cx, y: cy };
      }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as any).clientY;
    
    // Update Ref (Logic)
    cursorPosRef.current = { x: clientX, y: clientY };
    // Update State (Visual)
    setCursorVisual({ x: clientX, y: clientY });

    // Highlight Bowl if dragging spice
    if (draggingSpice && bowlRef.current) {
        const bowlRect = bowlRef.current.getBoundingClientRect();
        const hit = clientX >= bowlRect.left && clientX <= bowlRect.right && 
                    clientY >= bowlRect.top && clientY <= bowlRect.bottom;
        setIsHoveringBowl(hit);
    }

    if (isShakingMouse && coatingLevel < 100) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) { 
            // Mouse shake logic
            updateMix(dist * 0.1, Math.min(100, dist * 2));
            lastMousePos.current = { x: clientX, y: clientY };
        }
    }
  };

  const handlePointerUp = () => {
      // Use Ref for latest position
      const { x, y } = cursorPosRef.current;

      if (draggingSpice && bowlRef.current) {
         const bowlRect = bowlRef.current.getBoundingClientRect();
         if (x >= bowlRect.left && x <= bowlRect.right && 
             y >= bowlRect.top && y <= bowlRect.bottom) {
             
             setAdded(prev => ({ ...prev, [draggingSpice]: prev[draggingSpice] + 1 }));
             if (navigator.vibrate) navigator.vibrate(20);
         }
      }
      setDraggingSpice(null);
      setIsShakingMouse(false);
      setIsHoveringBowl(false);
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
  }, [draggingSpice, isShakingMouse, coatingLevel]);

  const totalAdded = Object.values(added).reduce((a, b) => a + b, 0);

  // Get Primary Spice Color for the powder visual
  const getPowderColor = () => {
     let r=0, g=0, b=0, count=0;
     
     // Weighted average for RGB would be complex, let's do a simplified dominant tint
     // Check what's most abundant
     let maxKey: Ingredient | null = null;
     let maxVal = 0;
     
     Object.entries(added).forEach(([key, val]) => {
         if (val > maxVal) {
             maxVal = val;
             maxKey = key as Ingredient;
         }
     });

     if (!maxKey) return '#e7e5e4'; // Neutral
     const dom = INGREDIENTS.find(i => i.id === maxKey);
     return dom ? dom.iconColor : '#b91c1c';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative animate-fade-in cursor-none">
      <SeasoningSpoonCursor x={cursorVisual.x} y={cursorVisual.y} holdingType={draggingSpice} />

      {/* Ingredient Shelf */}
      <div className="absolute top-[-100px] left-0 right-0 h-32 flex justify-center items-start z-50 pointer-events-none">
          <div className="bg-stone-800/90 backdrop-blur rounded-2xl p-2 md:p-4 border-x border-b border-stone-600 shadow-xl pointer-events-auto max-w-[90vw] overflow-x-auto touch-pan-x">
             <div className="flex gap-4 min-w-max px-2">
                {INGREDIENTS.map((ing) => (
                    <div 
                        key={ing.id}
                        className="flex flex-col items-center gap-1 group select-none"
                        onMouseDown={(e) => handlePointerDown(e, ing.id)}
                        onTouchStart={(e) => handlePointerDown(e, ing.id)}
                    >
                        <div 
                            className="w-14 h-14 md:w-16 md:h-16 bg-stone-700 rounded-full border-4 border-stone-600 relative flex items-center justify-center overflow-hidden cursor-none active:scale-95 transition-transform"
                        >
                            <div className="absolute inset-2 rounded-full opacity-90 mold-texture" style={{ backgroundColor: ing.color }}></div>
                            <div className="relative z-10 font-bold text-white/50 text-[10px] md:text-xs drop-shadow-md">
                                {added[ing.id] > 0 ? `x${added[ing.id]}` : ''}
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs text-stone-300 font-bold uppercase">{ing.label}</span>
                    </div>
                ))}
             </div>
          </div>
      </div>
      
      {/* Coating Progress Bar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-4 bg-stone-700 rounded-full overflow-hidden border border-stone-500">
          <div className="w-full h-full bg-red-600 transition-all duration-300" style={{ width: `${coatingLevel}%` }}></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80">COATING</div>
      </div>

      {/* Instruction */}
      {totalAdded === 0 && (
          <div className="absolute top-[20px] left-1/2 -translate-x-1/2 text-white/50 text-sm animate-bounce flex items-center gap-2 whitespace-nowrap">
              <MoveDown size={16}/> Drag spices to bowl
          </div>
      )}

      {/* Bowl View */}
      <div 
        ref={bowlRef}
        onMouseDown={(e) => handlePointerDown(e)}
        onTouchStart={(e) => handlePointerDown(e)}
        className={`relative w-[340px] h-[340px] transition-transform duration-75 ease-linear mt-20 cursor-grab active:cursor-grabbing`}
        style={{ 
            transform: `rotate(${Math.sin(Date.now()) * (shakeIntensity / 5)}deg) translate(${Math.random() * shakeIntensity * 0.5}px, ${Math.random() * shakeIntensity * 0.5}px)` 
        }}
    >
        <div className={`w-full h-full bg-stone-100 rounded-full border-8 transition-colors flex items-center justify-center overflow-hidden shadow-2xl relative
            ${isHoveringBowl ? 'border-green-400' : 'border-stone-300'}
        `}>
            
            {/* 1. Base Liquid/Powder Layer (The Clump) */}
            <div 
                className="absolute inset-0 transition-all duration-300"
                style={{ 
                    backgroundColor: getPowderColor(),
                    opacity: totalAdded > 0 ? (1 - (coatingLevel / 100)) * 0.6 : 0 
                }}
            ></div>
            
            {/* 2. Loose Powder visual center (The Pile) */}
            {totalAdded > 0 && (
                <div 
                    className="absolute inset-20 rounded-full blur-xl transition-all duration-300"
                    style={{
                        backgroundColor: getPowderColor(),
                        opacity: (1 - (coatingLevel / 100)) * 0.8,
                        transform: `scale(${1 - (coatingLevel/150)})`
                    }}
                ></div>
            )}

            {/* 3. Tofu Cubes */}
            <div className="absolute inset-0 z-10">
                {tofuVisuals.current.map((t, i) => (
                    <div
                        key={i}
                        className="absolute w-16 h-16 bg-white rounded-sm shadow-md transition-all duration-100 border border-stone-100"
                        style={{
                            left: `${t.x}%`,
                            top: `${t.y}%`,
                            transform: `translate(-50%, -50%) rotate(${t.r + (shakeIntensity * (i%2===0?1:-1))}deg) scale(${t.scale})`,
                        }}
                    >
                         {/* Mold Texture */}
                         <div className="absolute inset-0 mold-texture opacity-20"></div>
                         
                         {/* Coating Overlay (Color changes based on coatingLevel) */}
                         <div 
                            className="absolute inset-0 bg-red-700 mix-blend-multiply transition-opacity duration-300"
                            style={{ opacity: coatingLevel / 100 }}
                         ></div>
                         
                         {/* Texture overlay for powder look */}
                         <div 
                            className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-0 transition-opacity"
                            style={{ opacity: coatingLevel > 20 ? 0.3 : 0 }}
                         ></div>
                    </div>
                ))}
            </div>
            
            {/* Shadows/Lighting Overlay */}
            <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-br from-transparent to-black/20 rounded-full"></div>
        </div>
        
        {/* Shake Hint */}
        {coatingLevel < 10 && totalAdded > 0 && (
            <div className="absolute -right-16 top-0 animate-pulse text-white drop-shadow-md flex flex-col items-center">
                <MousePointer2 className="animate-wiggle mb-2" size={32}/>
                <span className="text-xs font-bold bg-black/50 px-2 py-1 rounded">Hold & Shake!</span>
            </div>
        )}
    </div>

      {/* Shake Controls (Bottom) */}
      <div className="absolute -bottom-16 w-full max-w-[300px]">
         {coatingLevel >= 100 && (
             <div className="bg-green-500 text-white font-bold py-3 rounded-xl text-center shadow-lg animate-bounce">
                 <Check className="inline mr-2"/> Seasoning Complete!
             </div>
         )}
         
         <div className="mt-2 text-center flex flex-col items-center">
            {!permissionGranted && coatingLevel < 100 && (
                 <button 
                    onClick={requestMotionPermission} 
                    className="flex items-center gap-2 bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95"
                 >
                    <Smartphone size={16} /> Enable Phone Shake
                </button>
            )}
         </div>
      </div>
    </div>
  );
}