import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Archive, ArrowRight, Check, Trash2 } from 'lucide-react';

interface BottlingPhaseProps {
  onComplete: (score: number) => void;
}

// Draggable Seasoned Tofu Cursor
const DragSeasonedTofuCursor = ({ x, y }: { x: number, y: number }) => {
  return createPortal(
    <div 
        className="fixed pointer-events-none z-[9999]"
        style={{ left: x, top: y, transform: 'translate(-50%, -50%) rotate(10deg) scale(1.1)' }}
    >
         <div className="w-16 h-16 bg-white rounded-sm shadow-2xl border border-stone-200 overflow-hidden">
             {/* Base Texture */}
             <div className="absolute inset-0 mold-texture opacity-20"></div>
             {/* Red Seasoning Coat */}
             <div className="absolute inset-0 bg-red-700 mix-blend-multiply opacity-90"></div>
             {/* Powder Texture */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40"></div>
         </div>
    </div>,
    document.body
  );
};

// Draggable Lid Cursor
const DragLidCursor = ({ x, y }: { x: number, y: number }) => {
    return createPortal(
      <div 
          className="fixed pointer-events-none z-[9999]"
          style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      >
           <div className="w-36 h-12 bg-red-700 rounded-sm shadow-xl border-b-4 border-red-900 flex items-center justify-center">
                <div className="w-full h-1 bg-red-800/30 absolute top-1"></div>
           </div>
      </div>,
      document.body
    );
};

export default function BottlingPhase({ onComplete }: BottlingPhaseProps) {
  // Simulate previous phase state: 8 pieces scattered in the bowl
  const [bowlPieces, setBowlPieces] = useState<{id: number, x: number, y: number, r: number}[]>(() => 
    Array.from({length: 8}).map((_, i) => ({
      id: i,
      x: (Math.random() * 50) + 25, // 25-75% spread
      y: (Math.random() * 50) + 25,
      r: (Math.random() * 360)
    }))
  );

  const [jarContents, setJarContents] = useState<{id: number, x: number, y: number, r: number}[]>([]);
  const [droppedCount, setDroppedCount] = useState(0);

  const [isLidOn, setIsLidOn] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  // Dragging State
  const [draggingType, setDraggingType] = useState<'tofu' | 'lid' | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  
  // Also keep state for render updates (cursor visual)
  const [cursorVisual, setCursorVisual] = useState({ x: 0, y: 0 });
  
  const jarRef = useRef<HTMLDivElement>(null);
  const [isHoveringJar, setIsHoveringJar] = useState(false);

  const handlePointerDown = (type: 'tofu' | 'lid', e: React.PointerEvent, id?: number) => {
      e.preventDefault(); 

      if (isSealed) return;
      if (type === 'tofu' && id === undefined) return;
      if (type === 'lid' && bowlPieces.length > 0) return; // Cant close until empty
      if (type === 'lid' && isLidOn) return;

      setDraggingType(type);
      if (id !== undefined) setDraggingId(id);
      
      setCursorVisual({ x: e.clientX, y: e.clientY });
      
      if (navigator.vibrate) navigator.vibrate(10);
  };

  // Global Drag Logic
  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
        setCursorVisual({ x: e.clientX, y: e.clientY });
        
        // Hover Highlight
        if (draggingType && jarRef.current) {
            const rect = jarRef.current.getBoundingClientRect();
             // Broad hitbox including the neck area above
            const isHit = e.clientX > rect.left - 50 && e.clientX < rect.right + 50 && 
                          e.clientY > rect.top - 150 && e.clientY < rect.bottom + 50;
            setIsHoveringJar(isHit);
        }
    };

    const handleGlobalUp = (e: PointerEvent) => {
        if (!draggingType) return;
        
        let isHit = false;
        if (jarRef.current) {
            const rect = jarRef.current.getBoundingClientRect();
            // Generous Hitbox
            isHit = e.clientX > rect.left - 50 && e.clientX < rect.right + 50 && 
                    e.clientY > rect.top - 150 && e.clientY < rect.bottom + 50;
        }

        if (draggingType === 'tofu' && draggingId !== null) {
            if (isHit) {
                // Move from Bowl to Jar
                const piece = bowlPieces.find(p => p.id === draggingId);
                if (piece) {
                    setBowlPieces(prev => prev.filter(p => p.id !== draggingId));
                    setJarContents(prev => [...prev, {
                        id: piece.id,
                        x: (Math.random() * 60) + 20, // 20-80% horizontal
                        y: 90 - (prev.length * 10) - (Math.random() * 5), // Stack vertically
                        r: (Math.random() * 20) - 10 // Less rotation in jar
                    }]);
                    if (navigator.vibrate) navigator.vibrate(20);
                }
            } else {
                // Missed! Drop it.
                setBowlPieces(prev => prev.filter(p => p.id !== draggingId));
                setDroppedCount(prev => prev + 1);
                if (navigator.vibrate) navigator.vibrate([100]);
            }
        } else if (draggingType === 'lid') {
            if (isHit) {
                setIsLidOn(true);
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }
        
        // Reset
        setDraggingType(null);
        setDraggingId(null);
        setIsHoveringJar(false);
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);

    return () => {
        window.removeEventListener('pointermove', handleGlobalMove);
        window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [draggingType, draggingId, bowlPieces]); // Dependencies for closure state

  const handleSealClick = () => {
      if (!isLidOn || isSealed) return;
      setIsSealed(true);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      
      // Calculate Score
      // Each drop deducts 15 points
      const score = Math.max(0, 100 - (droppedCount * 15));
      setTimeout(() => onComplete(score), 1500);
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative animate-fade-in">
         
         {draggingType === 'tofu' && <DragSeasonedTofuCursor x={cursorVisual.x} y={cursorVisual.y} />}
         {draggingType === 'lid' && <DragLidCursor x={cursorVisual.x} y={cursorVisual.y} />}

         {/* LEFT: The Seasoning Bowl (Source) */}
         <div className="absolute left-[-100px] top-1/2 -translate-y-1/2 w-[340px] h-[340px]">
             {/* Bowl Visuals */}
             <div className="w-full h-full bg-stone-100 rounded-full border-8 border-stone-300 flex items-center justify-center overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-[#b91c1c] opacity-20"></div>
                
                {bowlPieces.map((p) => {
                    if (p.id === draggingId) return null;
                    return (
                        <div
                            key={p.id}
                            onPointerDown={(e) => handlePointerDown('tofu', e, p.id)}
                            className="absolute w-16 h-16 bg-white rounded-sm shadow-md border border-stone-100 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform touch-none"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                transform: `translate(-50%, -50%) rotate(${p.r}deg)`,
                                zIndex: 10
                            }}
                        >
                             <div className="absolute inset-0 mold-texture opacity-20"></div>
                             <div className="absolute inset-0 bg-red-700 mix-blend-multiply opacity-90"></div>
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40"></div>
                        </div>
                    );
                })}

                <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-br from-transparent to-black/20 rounded-full"></div>
             </div>
             
             {bowlPieces.length > 0 && (
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-stone-400 text-sm font-bold flex items-center gap-2 animate-bounce">
                     放入罐中 <ArrowRight />
                 </div>
             )}
         </div>


         {/* RIGHT: The Jar (Target) */}
         <div className="absolute right-[-50px] bottom-0 flex flex-col items-center justify-end h-[500px]">
            
            {/* Lid Source - Moved to left side of Jar */}
            {bowlPieces.length === 0 && !isLidOn && (
                <div 
                    className="absolute top-20 -left-20 w-36 h-12 bg-red-700 rounded-sm shadow-xl border-b-4 border-red-900 cursor-grab animate-pulse flex items-center justify-center touch-none"
                    onPointerDown={(e) => handlePointerDown('lid', e)}
                >
                     <div className="text-center text-[10px] text-white/50 font-bold tracking-widest">拖我</div>
                </div>
            )}

            {/* Jar Neck and Lid Area */}
            <div className="relative flex flex-col items-center">
                
                {/* Lid On Jar - Positioned perfectly over the neck */}
                <div 
                    onClick={handleSealClick}
                    className={`absolute z-30 w-36 h-12 bg-red-700 rounded-sm shadow-lg transition-all duration-300 ease-out border-b-4 border-red-900
                        ${isLidOn ? '-top-[44px] opacity-100' : '-top-[100px] opacity-0 pointer-events-none'}
                        ${isLidOn && !isSealed ? 'cursor-pointer animate-bounce' : ''}
                    `}
                >
                    {isSealed && <div className="absolute inset-0 flex items-center justify-center text-green-300"><Check /></div>}
                </div>

                {/* The Neck */}
                <div className="w-32 h-6 bg-stone-200/40 border-x-4 border-stone-400 backdrop-blur-sm z-10 relative shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-500/10 to-transparent"></div>
                </div>

                {/* Jar Body */}
                <div 
                    ref={jarRef}
                    className={`relative w-40 h-64 bg-white/10 border-4 border-t-0 rounded-b-2xl rounded-t-sm backdrop-blur-sm overflow-hidden z-20 shadow-2xl transition-colors duration-200
                    ${isHoveringJar ? 'border-green-400 bg-green-100/10' : 'border-stone-400'}
                    `}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none z-30"></div>
                    
                    {jarContents.map((item, i) => (
                        <div 
                            key={item.id}
                            className="absolute w-12 h-12 bg-white rounded-sm border border-stone-200 shadow-sm transition-all duration-300 ease-out animate-pop-in"
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                transform: `translate(-50%, -50%) rotate(${item.r}deg)`
                            }}
                        >
                            <div className="absolute inset-0 bg-red-700 mix-blend-multiply opacity-90"></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        </div>
                    ))}

                    <div 
                        className={`absolute bottom-0 left-0 right-0 bg-amber-600/30 transition-all duration-1000 ease-in-out ${isSealed ? 'h-full' : 'h-0'}`}
                    ></div>
                </div>
            </div>

            {/* Dropped Indicator */}
             {droppedCount > 0 && (
                <div className="absolute bottom-20 right-40 text-red-500 font-bold flex flex-col items-center animate-bounce">
                    <Trash2 size={24}/> 
                    <span className="text-xs">掉落 -{droppedCount * 15}</span>
                </div>
            )}

            {/* Instructions */}
            <div className="absolute -bottom-12 w-60 text-center">
                {bowlPieces.length > 0 && <span className="text-stone-400 text-sm">放入罐中 (小心掉落)</span>}
                {bowlPieces.length === 0 && !isLidOn && <span className="text-stone-200 font-bold animate-pulse">拖动盖子</span>}
                {isLidOn && !isSealed && <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold shadow-lg cursor-pointer">点击盖子密封！</span>}
                {isSealed && <span className="text-green-500 font-bold flex items-center justify-center gap-2"><Archive size={16}/> 完成！</span>}
            </div>
         </div>
    </div>
  );
}