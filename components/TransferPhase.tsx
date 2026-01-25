import React, { useState, useEffect, useRef } from 'react';
import { GRID_SIZE, TofuBlock } from '../types';
import { ArrowRight, Trash2 } from 'lucide-react';

interface TransferPhaseProps {
  currentIntegrity: number;
  onComplete: (integrity: number) => void;
}

// Spoon Cursor for Transfer (Same as Cutting for consistency, maybe slight angle change)
const TransferSpoonCursor = ({ x, y, holding }: { x: number, y: number, holding: boolean }) => (
  <div 
    className="fixed pointer-events-none z-[100] transition-transform duration-75 ease-out"
    style={{ 
      left: x, 
      top: y,
      transform: `translate(-50%, -50%) rotate(${holding ? -30 : -45}deg) scale(${holding ? 1.1 : 1})`
    }}
  >
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
      <path d="M70 10 C 90 10, 100 30, 90 50 C 80 70, 50 80, 40 60 C 35 50, 40 40, 50 30 L 10 90" stroke="#a8a29e" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="65" cy="35" rx="25" ry="35" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" transform="rotate(45 65 35)" />
    </svg>
  </div>
);

export default function TransferPhase({ currentIntegrity, onComplete }: TransferPhaseProps) {
  const [blocks, setBlocks] = useState<TofuBlock[]>(() => {
    const b: TofuBlock[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        b.push({ id: r * GRID_SIZE + c, row: r, col: c, state: 'fresh', x: 0, y: 0 });
      }
    }
    return b;
  });

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [droppedCount, setDroppedCount] = useState(0);
  
  const bowlRef = useRef<HTMLDivElement>(null);

  // Handle Dragging
  const handlePointerDown = (id: number) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as any).clientY;
    setCursorPos({ x: clientX, y: clientY });
  };

  const handlePointerUp = () => {
    if (draggingId === null) return;

    // Check collision with Bowl
    let success = false;
    if (bowlRef.current) {
        const bowlRect = bowlRef.current.getBoundingClientRect();
        // Allow a generous hit area slightly above the bowl too
        const hitX = cursorPos.x >= bowlRect.left && cursorPos.x <= bowlRect.right;
        const hitY = cursorPos.y >= (bowlRect.top - 50) && cursorPos.y <= bowlRect.bottom;
        
        if (hitX && hitY) {
            success = true;
        }
    }

    if (success) {
        // Success: Into the bowl
        setBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, state: 'in_bowl' } : b));
        if (navigator.vibrate) navigator.vibrate([30, 30]);
    } else {
        // Fail: Dropped on table/floor
        setBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, state: 'damaged' } : b)); // mark damaged to hide or show broken
        setDroppedCount(prev => prev + 1);
        if (navigator.vibrate) navigator.vibrate(100);
    }

    setProcessedCount(prev => prev + 1);
    setDraggingId(null);
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
  }, [draggingId, cursorPos]);

  useEffect(() => {
    if (processedCount === blocks.length) {
      setTimeout(() => {
        // Deduct score for dropped blocks
        const penalty = droppedCount * 15;
        onComplete(Math.max(0, currentIntegrity - penalty));
      }, 1000);
    }
  }, [processedCount, droppedCount, blocks.length, currentIntegrity, onComplete]);

  return (
    <div className="w-full h-full flex items-center justify-center relative cursor-none">
        
        <TransferSpoonCursor x={cursorPos.x} y={cursorPos.y} holding={draggingId !== null} />

        {/* LEFT SIDE: The Board (Source) */}
        <div className="absolute left-[-500px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-[320px] flex flex-wrap content-start p-2">
                {blocks.map(block => {
                    // If this block is being dragged, show a ghost or hide it here
                    if (block.id === draggingId || block.state !== 'fresh') {
                         return <div key={block.id} className="w-1/3 h-1/3 p-2"><div className="w-full h-full bg-stone-900/10 rounded-sm"></div></div>;
                    }

                    return (
                    <div
                        key={block.id}
                        onMouseDown={() => handlePointerDown(block.id)}
                        onTouchStart={() => handlePointerDown(block.id)}
                        className="w-1/3 h-1/3 p-2 z-10 hover:scale-105 transition-transform"
                    >
                        <div className="w-full h-full bg-stone-100 rounded-sm shadow-md mold-texture border border-stone-200 cursor-none"></div>
                    </div>
                    );
                })}
            </div>
            
             {/* Instruction */}
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                 <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
                    Drag tofu with spoon <ArrowRight size={14} /> Drop in bowl
                 </div>
            </div>
        </div>

        {/* VISUAL: The Block currently being Dragged (Attached to cursor) */}
        {draggingId !== null && (
            <div 
                className="fixed pointer-events-none z-[90] w-16 h-16 bg-stone-100 rounded-sm shadow-xl mold-texture border border-stone-200"
                style={{ 
                    left: cursorPos.x, 
                    top: cursorPos.y,
                    transform: 'translate(-50%, -120%) rotate(15deg)' // Sit inside the spoon visual
                }}
            ></div>
        )}

        {/* CENTER SIDE: The Bowl (Target) */}
        <div ref={bowlRef} className="relative w-[300px] h-[300px] group">
             {/* Target Hint Glow */}
             <div className={`absolute inset-0 bg-green-500/20 rounded-full blur-xl transition-opacity ${draggingId !== null ? 'opacity-100' : 'opacity-0'}`}></div>

             {/* Bowl Back */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-amber-800 rounded-b-full border-4 border-amber-900 shadow-2xl overflow-hidden">
                 <div className="w-full h-full opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
            </div>
            
            {/* Piled Tofu (Success) */}
            <div className="absolute bottom-8 left-8 right-8 h-24 flex items-end justify-center flex-wrap-reverse content-end gap-1 px-4 pb-2 z-10">
                {blocks.filter(b => b.state === 'in_bowl').map((b, i) => (
                    <div 
                        key={b.id} 
                        className="w-10 h-10 bg-stone-100 rounded-sm border border-stone-300 shadow-sm mold-texture animate-float"
                        style={{ 
                            animationDelay: `${i * 0.1}s`, 
                            transform: `rotate(${Math.sin(i) * 15}deg) translateY(${Math.cos(i) * 5}px)`
                        }}
                    ></div>
                ))}
            </div>

            {/* Dropped Tofu (Failure Visuals - Fade out) */}
            {blocks.filter(b => b.state === 'damaged').map((b) => (
                 <div key={b.id} className="absolute -bottom-20 left-10 w-10 h-10 bg-stone-200 opacity-0 animate-ping rounded-sm"></div>
            ))}

            {/* Bowl Front (Lip) */}
            <div className="absolute top-[140px] left-0 right-0 h-6 bg-amber-900/30 rounded-[50%] z-20 border-t border-white/10"></div>
            
            {/* Missed Indicator */}
            {droppedCount > 0 && (
                <div className="absolute -bottom-10 right-0 text-red-500 font-bold flex items-center gap-1 animate-bounce">
                    <Trash2 size={16}/> {droppedCount} Missed!
                </div>
            )}
        </div>

    </div>
  );
}