import React, { useState, useMemo } from 'react';
import { GamePhase, GameScore } from './types';
import MenuPhase from './components/MenuPhase';
import CuttingPhase from './components/CuttingPhase';
import TransferPhase from './components/TransferPhase';
import AlcoholPhase from './components/AlcoholPhase';
import SeasoningPhase from './components/SeasoningPhase';
import BottlingPhase from './components/BottlingPhase';
import ResultPhase from './components/ResultPhase';
import { Volume2, VolumeX, Star } from 'lucide-react';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [score, setScore] = useState<GameScore>({
    integrity: 100,
    alcoholPrecision: 0,
    flavorBalance: 0,
    total: 0
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Global reset
  const resetGame = () => {
    setScore({
      integrity: 100,
      alcoholPrecision: 0,
      flavorBalance: 0,
      total: 0
    });
    setPhase('CUTTING');
  };

  const updateScore = (key: keyof GameScore, value: number) => {
    setScore(prev => ({ ...prev, [key]: value }));
  };

  // Camera Logic: Calculate Transform based on Phase
  const cameraTransform = useMemo(() => {
    // The world is wider than the screen. We move the world to simulate camera movement.
    // Positive X translate moves the view to the Left. Negative X moves to the Right.
    switch (phase) {
      case 'MENU':
        return 'scale(1) translate(0%, 0%)';
      case 'CUTTING':
        // Focus on the Left (Board)
        return 'scale(1.3) translate(25%, 5%)';
      case 'TRANSFER':
        // Show Board and Bowl (Mid-Left)
        return 'scale(1.0) translate(10%, 0%)';
      case 'ALCOHOL':
        // Focus on Bowl (Center)
        return 'scale(1.3) translate(-15%, 5%)';
      case 'SEASONING':
        // Focus on Bowl (Center)
        return 'scale(1.3) translate(-15%, 5%)';
      case 'BOTTLING':
        // Focus on Jar (Center/Right)
        return 'scale(1.3) translate(-15%, 5%)';
      case 'RESULT':
        return 'scale(1) translate(0%, 0%)';
      default:
        return 'scale(1) translate(0%, 0%)';
    }
  }, [phase]);

  // Determine current step text
  const getStepText = () => {
    switch(phase) {
        case 'CUTTING': return 'Step 1: Cut Mycelium';
        case 'TRANSFER': return 'Step 2: Transfer to Bowl';
        case 'ALCOHOL': return 'Step 3: Add Spirit';
        case 'SEASONING': return 'Step 4: Season & Shake';
        case 'BOTTLING': return 'Step 5: Seal Jar';
        default: return '';
    }
  }

  return (
    <div className="h-screen w-screen bg-stone-900 overflow-hidden relative font-sans touch-none">
      
      {/* 1. HUD / UI Layer (Fixed on top) */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none p-4 flex flex-col items-center">
         {/* Top Bar */}
         <div className="w-full max-w-4xl flex justify-between items-start pointer-events-auto">
            {/* Scoreboard */}
            {phase !== 'MENU' && phase !== 'RESULT' && (
                <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl p-3 flex gap-6 border-2 border-stone-200 animate-slide-down">
                    <div className="text-center">
                        <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Integrity</div>
                        <div className={`text-xl font-mono font-bold ${score.integrity < 80 ? 'text-red-500' : 'text-green-600'}`}>
                            {Math.round(score.integrity)}%
                        </div>
                    </div>
                    {phase !== 'CUTTING' && phase !== 'TRANSFER' && (
                        <>
                            <div className="w-px bg-stone-200"></div>
                            <div className="text-center">
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Spirit</div>
                                <div className="text-xl font-mono font-bold text-blue-600">
                                    {score.alcoholPrecision > 0 ? Math.round(score.alcoholPrecision) + '%' : '-'}
                                </div>
                            </div>
                        </>
                    )}
                     {phase === 'BOTTLING' && (
                        <>
                             <div className="w-px bg-stone-200"></div>
                            <div className="text-center">
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Flavor</div>
                                <div className="text-xl font-mono font-bold text-amber-600">
                                    {score.flavorBalance > 0 ? Math.round(score.flavorBalance) + '%' : '-'}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Step Indicator */}
            {phase !== 'MENU' && phase !== 'RESULT' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm whitespace-nowrap">
                    {getStepText()}
                </div>
            )}

            {/* Audio Toggle */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="ml-auto p-3 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors"
            >
              {soundEnabled ? <Volume2 size={24} className="text-stone-700" /> : <VolumeX size={24} className="text-stone-400" />}
            </button>
         </div>
      </div>

      {/* 2. The World (Camera Viewport) */}
      <div 
        className="w-full h-full relative transition-transform duration-1000 ease-in-out will-change-transform"
        style={{ transform: cameraTransform }}
      >
        {/* The Scene Background (Wood Table) */}
        <div className="absolute inset-[-100%] bg-[#5c4033] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] brightness-75"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none"></div>

        {/* The Operational Area (Grid System for Components) */}
        {/* We use a wide layout: Left (Board), Center (Bowl), Right (Props) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] flex items-center justify-center">
            
            {/* --- ZONE 1: LEFT (Cutting Board) --- */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] flex items-center justify-center">
                {/* Board Graphic (Always visible if needed, or part of components) */}
                <div className="absolute inset-4 bg-stone-300 rounded-sm shadow-2xl rotate-1 border-b-8 border-stone-400"></div>
                
                {phase === 'CUTTING' && (
                    <div className="absolute inset-0 z-10">
                        <CuttingPhase onComplete={(val) => { updateScore('integrity', val); setPhase('TRANSFER'); }} />
                    </div>
                )}
                {/* Transfer Phase re-renders the blocks here */}
                {phase === 'TRANSFER' && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                       {/* The Board part of transfer phase is handled inside TransferPhase component visually */}
                    </div>
                )}
            </div>

            {/* --- ZONE 2: CENTER (The Bowl) --- */}
            <div className="absolute left-[500px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] flex items-center justify-center">
                 {/* Shadow for bowl */}
                 <div className="absolute bottom-10 w-64 h-12 bg-black/40 blur-xl rounded-[50%]"></div>
                 
                 {phase === 'TRANSFER' && (
                    <div className="absolute inset-[-200px] z-20">
                         {/* Transfer needs access to both Left and Center, so we give it a wider container or position it carefully */}
                         <TransferPhase 
                            currentIntegrity={score.integrity}
                            onComplete={(val) => { updateScore('integrity', val); setPhase('ALCOHOL'); }} 
                         />
                    </div>
                 )}

                 {phase === 'ALCOHOL' && (
                    <div className="absolute inset-0 z-20">
                        <AlcoholPhase onComplete={(val) => { updateScore('alcoholPrecision', val); setPhase('SEASONING'); }} />
                    </div>
                 )}

                 {phase === 'SEASONING' && (
                    <div className="absolute inset-0 z-20">
                        <SeasoningPhase onComplete={(val) => { updateScore('flavorBalance', val); setPhase('BOTTLING'); }} />
                    </div>
                 )}

                 {phase === 'BOTTLING' && (
                    <div className="absolute inset-0 z-20">
                         <BottlingPhase onComplete={() => setPhase('RESULT')} />
                    </div>
                 )}
            </div>

             {/* --- ZONE 3: PROPS (Right side) --- */}
             <div className="absolute right-20 top-1/2 -translate-y-1/2">
                {/* Just decorative elements that might shift in/out */}
                <div className="w-24 h-64 bg-stone-900/40 blur-sm rounded-full absolute -right-20 scale-90"></div>
             </div>

        </div>

        {/* --- OVERLAYS --- */}
        {phase === 'MENU' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <MenuPhase onStart={resetGame} />
            </div>
        )}

        {phase === 'RESULT' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <ResultPhase score={score} onRestart={() => setPhase('MENU')} />
            </div>
        )}

      </div>
    </div>
  );
}