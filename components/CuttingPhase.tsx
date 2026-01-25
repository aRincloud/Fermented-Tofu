import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GRID_SIZE, TofuBlock, Connection } from '../types';
import { Scissors, AlertCircle } from 'lucide-react';

interface CuttingPhaseProps {
  onComplete: (integrity: number) => void;
}

// Custom Spoon Cursor Component for this phase
const SpoonCursor = ({ x, y }: { x: number, y: number }) => (
  <div 
    className="fixed pointer-events-none z-[100] drop-shadow-xl transition-transform duration-75 ease-out"
    style={{ 
      left: x, 
      top: y,
      transform: 'translate(-50%, -50%) rotate(-45deg)' // Center the "bowl" of the spoon
    }}
  >
    {/* Simple SVG Spoon */}
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M70 10 C 90 10, 100 30, 90 50 C 80 70, 50 80, 40 60 C 35 50, 40 40, 50 30 L 10 90" stroke="#a8a29e" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="65" cy="35" rx="25" ry="35" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" transform="rotate(45 65 35)" />
    </svg>
  </div>
);

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
    // Horizontal
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
    // Vertical
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
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Helper to get touch/mouse coordinates relative to container
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

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    // Update global cursor position for the spoon
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    setCursorPos({ x: clientX, y: clientY });

    if (!isDragging.current || !containerRef.current) return;
    
    const { x, y } = getLocalPoint(e as any);
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    
    const blockSize = w / GRID_SIZE;
    const padding = 15; 
    const innerSize = blockSize - (padding * 2);
    
    // 1. Damage Logic (Touching the "Meat")
    setBlocks(prev => prev.map(block => {
        if (block.state !== 'fresh') return block;

        const bx = block.col * blockSize + padding;
        const by = block.row * blockSize + padding;
        
        // Simple AABB check
        if (x > bx && x < bx + innerSize && y > by && y < by + innerSize) {
            // Mistake made!
            if (navigator.vibrate) navigator.vibrate(50);
            return { ...block, state: 'damaged' };
        }
        return block;
    }));

    // 2. Cutting Logic (Severing connections)
    setConnections(prev => prev.map(conn => {
      if (conn.severed) return conn;

      let hit = false;
      const bA = blocks[conn.blockA];
      
      // Calculate center of connection
      if (conn.orientation === 'horizontal') {
        const cx = (bA.col + 1) * blockSize; 
        const cy = (bA.row + 0.5) * blockSize;
        // Hitbox for the "gap"
        if (Math.abs(x - cx) < 30 && Math.abs(y - cy) < 50) hit = true;
      } else {
        const cx = (bA.col + 0.5) * blockSize;
        const cy = (bA.row + 1) * blockSize;
        if (Math.abs(x - cx) < 50 && Math.abs(y - cy) < 30) hit = true;
      }

      if (hit && navigator.vibrate) navigator.vibrate(10);
      return hit ? { ...conn, severed: true } : conn;
    }));

  }, [blocks]);

  useEffect(() => {
    const stopDrag = () => { isDragging.current = false; };
    const startDrag = () => { isDragging.current = true; };
    
    window.addEventListener('mousedown', startDrag);
    window.addEventListener('touchstart', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('touchmove', handleMove as any);

    return () => {
        window.removeEventListener('mousedown', startDrag);
        window.removeEventListener('touchstart', startDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchend', stopDrag);
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
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allSevered, blocks, onComplete]);


  return (
    <div className="w-full h-full flex items-center justify-center relative animate-fade-in cursor-none">
      <SpoonCursor x={cursorPos.x} y={cursorPos.y} />

      {/* Board Container */}
      <div 
        ref={containerRef}
        className="relative aspect-square w-full max-w-[320px] bg-stone-900/10 rounded-lg touch-none select-none"
      >
        {/* Render Blocks */}
        {blocks.map(block => {
            const sizePercent = 100 / GRID_SIZE;
            
            // Determine margins based on severed connections to create "separation" effect
            let marginTop = 0;
            let marginLeft = 0;
            let marginRight = 0;
            let marginBottom = 0;
            const gapSize = 4; // Visual gap in percent

            // Check neighbor connections to determine spacing
            // Top
            if (block.row > 0) {
               const topConn = connections.find(c => c.orientation === 'vertical' && c.blockA === block.id - GRID_SIZE);
               if (topConn?.severed) marginTop = gapSize;
            }
            // Bottom
            if (block.row < GRID_SIZE - 1) {
                const botConn = connections.find(c => c.orientation === 'vertical' && c.blockA === block.id);
                if (botConn?.severed) marginBottom = gapSize;
            }
            // Left
            if (block.col > 0) {
                const leftConn = connections.find(c => c.orientation === 'horizontal' && c.blockA === block.id - 1);
                if (leftConn?.severed) marginLeft = gapSize;
            }
            // Right
            if (block.col < GRID_SIZE - 1) {
                const rightConn = connections.find(c => c.orientation === 'horizontal' && c.blockA === block.id);
                if (rightConn?.severed) marginRight = gapSize;
            }

            return (
              <div
                key={block.id}
                className="absolute transition-all duration-500 ease-out"
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
                   {/* 
                      Visual Trick: 
                      If connections are NOT severed, we render a "fluffy" extension 
                      that overlaps with neighbors to look like a single cloud.
                   */}
                   {(!marginTop && block.row > 0) && <div className="absolute -top-4 left-0 right-0 h-6 bg-stone-100 blur-sm z-10"></div>}
                   {(!marginBottom && block.row < GRID_SIZE - 1) && <div className="absolute -bottom-4 left-0 right-0 h-6 bg-stone-100 blur-sm z-10"></div>}
                   {(!marginLeft && block.col > 0) && <div className="absolute top-0 -left-4 bottom-0 w-6 bg-stone-100 blur-sm z-10"></div>}
                   {(!marginRight && block.col < GRID_SIZE - 1) && <div className="absolute top-0 -right-4 bottom-0 w-6 bg-stone-100 blur-sm z-10"></div>}

                   {/* Main Block Texture */}
                   <div className="absolute inset-0 mold-texture opacity-80 z-20"></div>
                   
                   {/* Fuzziness (Mycelium) */}
                   <div className="absolute inset-[-4px] border-4 border-white/60 blur-[2px] rounded-sm z-20"></div>

                   {block.state === 'damaged' && (
                      <div className="absolute inset-0 flex items-center justify-center text-red-500 opacity-50 z-30">
                          <AlertCircle size={24} />
                      </div>
                   )}
                </div>
              </div>
            )
        })}
      </div>
      
      {/* Floating Instruction */}
      <div className="absolute -bottom-16 w-full text-center pointer-events-none">
         <div className="inline-flex items-center gap-2 bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
            <Scissors size={14} /> Drag spoon to cut gaps
         </div>
      </div>
    </div>
  );
}