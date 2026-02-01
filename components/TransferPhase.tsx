import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GRID_SIZE, TofuBlock } from '../types';
import { ArrowDown, Trash2 } from 'lucide-react';

interface TransferPhaseProps {
  currentIntegrity: number;
  onComplete: (integrity: number) => void;
}

// Spatula Cursor for Transfer
const TransferSpatulaCursor = ({ x, y, holding }: { x: number, y: number, holding: boolean }) => {
  return createPortal(
    <div 
        className="fixed pointer-events-none z-[9999] transition-transform duration-150 ease-out"
        style={{ 
            left: x, 
            top: y,
            transform: `translate(-50%, 0%) rotate(${holding ? -5 : 0}deg) scale(${holding ? 1.05 : 1})`,
            transformOrigin: '50% 0%'
        }}
    >
        <svg width="100" height="140" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            <path d="M50 80 L 50 130" stroke="#78350f" strokeWidth="10" strokeLinecap="round" />
            <path d="M50 40 L 50 80" stroke="#d6d3d1" strokeWidth="6" />
            <path d="M20 0 L 80 0 L 85 40 C 85 55, 15 55, 15 40 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" />
            <path d="M20 0 L 80 0" stroke="#cbd5e1" strokeWidth="4" />
        </svg>

        {/* VISUAL: The Block currently being Dragged (Sitting on the blade) */}
        {holding && (
            <div 
                className="absolute z-[100] w-12 h-12 bg-stone-100 rounded-sm shadow-xl mold-texture border border-stone-200"
                style={{ 
                    left: '50%',
                    top: '20px',
                    transform: 'translate(-50%, 0)'
                }}
            ></div>
        )}
    </div>,
    document.body
  );
};

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

  // Handle Dragging Initialization
  const handlePointerDown = (id: number, e: React.PointerEvent) => {
    e.preventDefault(); 
    if (navigator.vibrate) navigator.vibrate(20);
    setCursorPos({ x: e.clientX, y: e.clientY });
    setDraggingId(id);
  };

  // Global Drag Logic
  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalUp = (e: PointerEvent) => {
        if (draggingId === null) return;

        // Check collision with Bowl
        let success = false;
        if (bowlRef.current) {
            const bowlRect = bowlRef.current.getBoundingClientRect();
            // Adjust collision check to be near the bowl
            const hitX = e.clientX >= bowlRect.left && e.clientX <= bowlRect.right;
            const hitY = e.clientY >= (bowlRect.top - 80) && e.clientY <= bowlRect.bottom;
            
            if (hitX && hitY) {
                success = true;
            }
        }

        if (success) {
            setBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, state: 'in_bowl' } : b));
            if (navigator.vibrate) navigator.vibrate([30, 30]);
        } else {
            setBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, state: 'damaged' } : b)); 
            setDroppedCount(prev => prev + 1);
            if (navigator.vibrate) navigator.vibrate(100);
        }

        setProcessedCount(prev => prev + 1);
        setDraggingId(null);
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);

    return () => {
        window.removeEventListener('pointermove', handleGlobalMove);
        window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [draggingId]); 


  useEffect(() => {
    if (processedCount === blocks.length) {
      setTimeout(() => {
        const penalty = droppedCount * 15;
        onComplete(Math.max(0, currentIntegrity - penalty));
      }, 1000);
    }
  }, [processedCount, droppedCount, blocks.length, currentIntegrity, onComplete]);

  return (
    <div className="w-full h-full flex items-center justify-center relative cursor-none">
        
        <TransferSpatulaCursor x={cursorPos.x} y={cursorPos.y} holding={draggingId !== null} />

        {/* TOP: The Board (Source) */}
        <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] flex items-center justify-center">
            {/* Board Container */}
            <div className="relative aspect-square w-full max-w-[280px] bg-stone-900/10 rounded-lg touch-none select-none">
                {blocks.map(block => {
                    const sizePercent = 100 / GRID_SIZE;
                    const GAP_SIZE = 4;

                    let marginTop = 0;
                    let marginLeft = 0;
                    let marginRight = 0;
                    let marginBottom = 0;

                    if (block.row > 0) marginTop = GAP_SIZE;
                    if (block.row < GRID_SIZE - 1) marginBottom = GAP_SIZE;
                    if (block.col > 0) marginLeft = GAP_SIZE;
                    if (block.col < GRID_SIZE - 1) marginRight = GAP_SIZE;
                    
                    const style = {
                        top: `${block.row * sizePercent}%`,
                        left: `${block.col * sizePercent}%`,
                        width: `${sizePercent}%`,
                        height: `${sizePercent}%`,
                        paddingTop: `${marginTop}%`,
                        paddingBottom: `${marginBottom}%`,
                        paddingLeft: `${marginLeft}%`,
                        paddingRight: `${marginRight}%`
                    };

                    // If this block is being dragged, show placeholder slot
                    if (block.id === draggingId || block.state !== 'fresh') {
                         return <div key={block.id} style={style} className="absolute"><div className="w-full h-full bg-stone-900/5 rounded-sm"></div></div>;
                    }

                    return (
                    <div
                        key={block.id}
                        onPointerDown={(e) => handlePointerDown(block.id, e)}
                        className="absolute z-10 hover:scale-105 transition-transform touch-none"
                        style={style}
                    >
                        <div className="w-full h-full bg-stone-100 rounded-sm shadow-md mold-texture border border-stone-200 cursor-none">
                             <div className="absolute inset-[-2px] border-2 border-white/60 blur-[1px] rounded-sm"></div>
                        </div>
                    </div>
                    );
                })}
            </div>
            
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                 <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 animate-bounce">
                    向下拖拽 <ArrowDown size={14} />
                 </div>
            </div>
        </div>

        {/* BOTTOM: The Bowl (Target) */}
        <div ref={bowlRef} className="absolute top-[500px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] group">
             <div className={`absolute inset-0 bg-green-500/20 rounded-full blur-xl transition-opacity ${draggingId !== null ? 'opacity-100' : 'opacity-0'}`}></div>

            <div className="absolute bottom-0 left-0 right-0 h-40 bg-amber-800 rounded-b-full border-4 border-amber-900 shadow-2xl overflow-hidden">
                 <div className="w-full h-full opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
            </div>
            
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

            {blocks.filter(b => b.state === 'damaged').map((b) => (
                 <div key={b.id} className="absolute -bottom-20 left-10 w-10 h-10 bg-stone-200 opacity-0 animate-ping rounded-sm"></div>
            ))}

            <div className="absolute top-[140px] left-0 right-0 h-6 bg-amber-900/30 rounded-[50%] z-20 border-t border-white/10"></div>
            
            {droppedCount > 0 && (
                <div className="absolute -bottom-10 right-0 text-red-500 font-bold flex items-center gap-1 animate-bounce">
                    <Trash2 size={16}/> {droppedCount} 掉了！
                </div>
            )}
        </div>

    </div>
  );
}