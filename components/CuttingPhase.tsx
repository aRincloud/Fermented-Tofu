import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GRID_SIZE, TofuBlock, Connection } from '../types';
import { Move } from 'lucide-react';

interface CuttingPhaseProps {
  onComplete: (integrity: number) => void;
}

// Spatula Cursor
const SpatulaCursor = ({ x, y, isVertical, isCutting }: { x: number, y: number, isVertical: boolean, isCutting: boolean }) => {
  return createPortal(
    <div 
        className="fixed pointer-events-none z-[9999] transition-transform duration-100 ease-out"
        style={{ 
            left: x, 
            top: y,
            transform: `translate(-50%, 0%) rotate(${isVertical ? 90 : 0}deg) scale(${isCutting ? 0.9 : 1})`,
            transformOrigin: '50% 0%'
        }}
    >
        <svg width="100" height="140" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
            <path d="M50 80 L 50 130" stroke="#78350f" strokeWidth="10" strokeLinecap="round" />
            <path d="M50 40 L 50 80" stroke="#d6d3d1" strokeWidth="6" />
            <path d="M20 0 L 80 0 L 85 40 C 85 55, 15 55, 15 40 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" />
            <path d="M20 0 L 80 0" stroke="#cbd5e1" strokeWidth="4" />
            <path d="M30 10 L 70 10" stroke="#fff" strokeWidth="2" opacity="0.4" />
        </svg>
    </div>,
    document.body
  );
};

export default function CuttingPhase({ onComplete }: CuttingPhaseProps) {
  const [blocks, setBlocks] = useState<TofuBlock[]>(() => {
    const b: TofuBlock[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        b.push({ id: r * GRID_SIZE + c, row: r, col: c, state: 'fresh', x: 0, y: 0 });
      }
    }
    return b;
  });

  const [connections, setConnections] = useState<Connection[]>(() => {
    const c: Connection[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let col = 0; col < GRID_SIZE - 1; col++) {
        c.push({
          id: `h-${r}-${col}`,
          blockA: r * GRID_SIZE + col,
          blockB: r * GRID_SIZE + col + 1,
          orientation: 'horizontal', 
          severed: false
        });
      }
    }
    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        c.push({
          id: `v-${r}-${col}`,
          blockA: r * GRID_SIZE + col,
          blockB: (r + 1) * GRID_SIZE + col,
          orientation: 'vertical',
          severed: false
        });
      }
    }
    return c;
  });

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isVertical, setIsVertical] = useState(false); 
  const [isCutting, setIsCutting] = useState(false); 
  
  // Track previous position for direction calculation
  const lastPosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getLocalPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      // Capture start position to prevent jumpy rotation on initial click
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as any).clientY;
      lastPosRef.current = { x: clientX, y: clientY };
      setIsCutting(true);
  };
  
  const handleEnd = () => setIsCutting(false);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    setCursorPos({ x: clientX, y: clientY }); 

    // Auto-Rotation Logic
    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    const threshold = 3; // Minimum movement to trigger rotation change

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        if (Math.abs(dy) > Math.abs(dx)) {
            setIsVertical(true);
        } else {
            setIsVertical(false);
        }
        lastPosRef.current = { x: clientX, y: clientY };
    }

    if (!containerRef.current || !isCutting) return;

    const { x, y } = getLocalPoint(e as any);
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const blockSize = w / GRID_SIZE;
    
    setConnections(prev => prev.map(conn => {
      if (conn.severed) return conn;

      let hit = false;
      const bA = blocks[conn.blockA];
      
      // Hit detection logic adjusted for knife orientation
      if (!isVertical && conn.orientation === 'vertical') {
        const cx = (bA.col + 0.5) * blockSize;
        const cy = (bA.row + 1) * blockSize;
        if (Math.abs(x - cx) < 25 && Math.abs(y - cy) < 15) hit = true;
      } 
      else if (isVertical && conn.orientation === 'horizontal') {
        const cx = (bA.col + 1) * blockSize; 
        const cy = (bA.row + 0.5) * blockSize;
        if (Math.abs(x - cx) < 15 && Math.abs(y - cy) < 25) hit = true;
      }

      if (hit && navigator.vibrate) navigator.vibrate(10);
      return hit ? { ...conn, severed: true } : conn;
    }));

  }, [blocks, isVertical, isCutting]);

  useEffect(() => {
    // Attach to window to catch moves outside component
    window.addEventListener('mousedown', handleStart as any);
    window.addEventListener('touchstart', handleStart as any);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('touchmove', handleMove as any);

    return () => {
        window.removeEventListener('mousedown', handleStart as any);
        window.removeEventListener('touchstart', handleStart as any);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('mousemove', handleMove as any);
        window.removeEventListener('touchmove', handleMove as any);
    }
  }, [handleMove]);

  const allSevered = connections.every(c => c.severed);

  useEffect(() => {
    if (allSevered) {
      const timer = setTimeout(() => {
        const damageCount = blocks.filter(b => b.state === 'damaged').length;
        onComplete(Math.max(0, 100 - damageCount * 15));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allSevered, blocks, onComplete]);


  return (
    <div className="w-full h-full flex items-center justify-center relative animate-fade-in cursor-none">
      <SpatulaCursor x={cursorPos.x} y={cursorPos.y} isVertical={isVertical} isCutting={isCutting} />

      {/* Board Container */}
      <div 
        ref={containerRef}
        className="relative aspect-square w-full max-w-[320px] bg-stone-900/10 rounded-lg touch-none select-none"
      >
        {blocks.map(block => {
            const sizePercent = 100 / GRID_SIZE;
            const GAP_SIZE = 4;
            let marginTop = 0, marginLeft = 0, marginRight = 0, marginBottom = 0;

            if (block.row > 0) {
               const topConn = connections.find(c => c.orientation === 'vertical' && c.blockA === block.id - GRID_SIZE);
               if (topConn?.severed) marginTop = GAP_SIZE;
            }
            if (block.row < GRID_SIZE - 1) {
                const botConn = connections.find(c => c.orientation === 'vertical' && c.blockA === block.id);
                if (botConn?.severed) marginBottom = GAP_SIZE;
            }
            if (block.col > 0) {
                const leftConn = connections.find(c => c.orientation === 'horizontal' && c.blockA === block.id - 1);
                if (leftConn?.severed) marginLeft = GAP_SIZE;
            }
            if (block.col < GRID_SIZE - 1) {
                const rightConn = connections.find(c => c.orientation === 'horizontal' && c.blockA === block.id);
                if (rightConn?.severed) marginRight = GAP_SIZE;
            }

            return (
              <div
                key={block.id}
                className="absolute transition-all duration-300 ease-out"
                style={{
                  top: `${block.row * sizePercent}%`,
                  left: `${block.col * sizePercent}%`,
                  width: `${sizePercent}%`,
                  height: `${sizePercent}%`,
                  paddingTop: `${marginTop}%`,
                  paddingBottom: `${marginBottom}%`,
                  paddingLeft: `${marginLeft}%`,
                  paddingRight: `${marginRight}%`
                }}
              >
                <div className={`w-full h-full relative group overflow-visible transition-colors
                  ${block.state === 'damaged' ? 'bg-red-200' : 'bg-stone-100'}
                  shadow-sm
                `}>
                   {(!marginTop && block.row > 0) && <div className="absolute -top-4 left-0 right-0 h-6 bg-stone-100 blur-sm z-10"></div>}
                   {(!marginBottom && block.row < GRID_SIZE - 1) && <div className="absolute -bottom-4 left-0 right-0 h-6 bg-stone-100 blur-sm z-10"></div>}
                   {(!marginLeft && block.col > 0) && <div className="absolute top-0 -left-4 bottom-0 w-6 bg-stone-100 blur-sm z-10"></div>}
                   {(!marginRight && block.col < GRID_SIZE - 1) && <div className="absolute top-0 -right-4 bottom-0 w-6 bg-stone-100 blur-sm z-10"></div>}

                   <div className="absolute inset-0 mold-texture opacity-80 z-20"></div>
                   <div className="absolute inset-[-4px] border-4 border-white/60 blur-[2px] rounded-sm z-20"></div>
                </div>
              </div>
            )
        })}
      </div>

      {/* Instructions */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-40">
         <div className="bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 text-white text-sm animate-pulse whitespace-nowrap">
             <Move size={16} />
             <span>Swipe to cut • Auto-rotates</span>
         </div>
      </div>
    </div>
  );
}