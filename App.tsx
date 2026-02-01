import React, { useState, useMemo, useEffect } from 'react';
import { GamePhase, GameScore } from './types';
import MenuPhase from './components/MenuPhase';
import CuttingPhase from './components/CuttingPhase';
import TransferPhase from './components/TransferPhase';
import AlcoholPhase from './components/AlcoholPhase';
import SeasoningPhase from './components/SeasoningPhase';
import BottlingPhase from './components/BottlingPhase';
import ResultPhase from './components/ResultPhase';
import { Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [score, setScore] = useState<GameScore>({
    integrity: 100,
    alcoholPrecision: 0,
    flavorBalance: 0,
    total: 0
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Responsive State
  const [baseScale, setBaseScale] = useState(1);
  const [isPortrait, setIsPortrait] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < window.innerHeight : false
  );

  // Responsive scaling
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isVert = w < h;
      setIsPortrait(isVert);

      // World Logic: 1200x600 fixed world.
      if (isVert) {
          // Mobile Portrait: Scale to fit ~580px of world width
          const visibleWorldWidth = 580; 
          setBaseScale(w / visibleWorldWidth);
      } else {
          // Desktop / Landscape
          const scaleH = h / 700;
          const scaleW = w / 1200;
          setBaseScale(Math.min(scaleH, scaleW) * 0.95);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = () => {
    setScore({ integrity: 100, alcoholPrecision: 0, flavorBalance: 0, total: 0 });
    setPhase('CUTTING');
  };

  const updateScore = (key: keyof GameScore, value: number) => {
    setScore(prev => ({ ...prev, [key]: value }));
  };

  // Camera Logic
  // CRITICAL: World Center is X=600.
  // We use absolute positioning to lock World X=600 to Screen Center.
  // So:
  // To center Board (X=200): Translate = 600 - 200 = 400.
  // To center Bowl (X=700): Translate = 600 - 700 = -100.
  const cameraTransform = useMemo(() => {
    switch (phase) {
      case 'MENU':
        return 'translate(0px, 0px)';
      
      case 'CUTTING':
        return `translate(400px, 0px)`; 
      
      case 'TRANSFER':
        // Vertical Layout: Center on Zone 2 (X=700)
        return `translate(-100px, 0px)`;
      
      case 'ALCOHOL':
        return `translate(-100px, 0px)`;
      
      case 'SEASONING':
        return `translate(-100px, 0px)`;
      
      case 'BOTTLING':
        return `translate(-100px, 0px)`;
      
      case 'RESULT':
        return 'translate(0px, 0px)';
      default:
        return 'translate(0px, 0px)';
    }
  }, [phase]);

  const getStepText = () => {
    switch(phase) {
        case 'CUTTING': return 'Step 1: Cut';
        case 'TRANSFER': return 'Step 2: Transfer';
        case 'ALCOHOL': return 'Step 3: Spirit';
        case 'SEASONING': return 'Step 4: Season';
        case 'BOTTLING': return 'Step 5: Jar';
        default: return '';
    }
  }

  return (
    <div className="h-[100dvh] w-full bg-stone-900 overflow-hidden relative font-sans touch-none select-none">
      
      {/* 1. HUD / UI Layer */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none p-4 flex flex-col items-center safe-area-inset-top">
         <div className="w-full max-w-4xl flex justify-between items-start pointer-events-auto">
            {phase !== 'MENU' && phase !== 'RESULT' && (
                <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl p-2 flex gap-3 border-2 border-stone-200 animate-slide-down origin-top-left transition-transform scale-90 md:scale-100 origin-top-left">
                    <div className="text-center px-1">
                        <div className="text-[10px] text-stone-500 font-bold uppercase">Integrity</div>
                        <div className={`text-lg font-mono font-bold ${score.integrity < 80 ? 'text-red-500' : 'text-green-600'}`}>
                            {Math.round(score.integrity)}%
                        </div>
                    </div>
                    {phase !== 'CUTTING' && phase !== 'TRANSFER' && (
                        <>
                            <div className="w-px bg-stone-200"></div>
                            <div className="text-center px-1">
                                <div className="text-[10px] text-stone-500 font-bold uppercase">Spirit</div>
                                <div className="text-lg font-mono font-bold text-blue-600">
                                    {score.alcoholPrecision > 0 ? Math.round(score.alcoholPrecision) + '%' : '-'}
                                </div>
                            </div>
                        </>
                    )}
                     {phase === 'BOTTLING' && (
                        <>
                             <div className="w-px bg-stone-200"></div>
                            <div className="text-center px-1">
                                <div className="text-[10px] text-stone-500 font-bold uppercase">Flavor</div>
                                <div className="text-lg font-mono font-bold text-amber-600">
                                    {score.flavorBalance > 0 ? Math.round(score.flavorBalance) + '%' : '-'}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {phase !== 'MENU' && phase !== 'RESULT' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1 rounded-full text-xs font-medium backdrop-blur-sm whitespace-nowrap z-40 shadow-sm pointer-events-none">
                    {getStepText()}
                </div>
            )}

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="ml-auto p-3 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors active:scale-95 scale-90 md:scale-100"
            >
              {soundEnabled ? <Volume2 size={24} className="text-stone-700" /> : <VolumeX size={24} className="text-stone-400" />}
            </button>
         </div>
      </div>

      {/* 2. Responsive Wrapper - NOW ABSOLUTELY CENTERED */}
      <div 
        className="absolute top-1/2 left-1/2 transition-transform duration-300 ease-out will-change-transform origin-center"
        style={{ 
            width: '1200px', 
            height: '600px',
            // Combine scale with absolute centering translate
            transform: `translate(-50%, -50%) scale(${baseScale})` 
        }}
      >
        {/* 3. The World */}
        <div 
            className="w-full h-full relative transition-transform duration-700 ease-in-out will-change-transform"
            style={{ transform: cameraTransform }}
        >
            <div className="absolute inset-[-100%] bg-[#5c4033] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] brightness-75"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none"></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
                
                {/* ZONE 1: Cutting Board (Center X: 200) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] flex items-center justify-center">
                    <div className="absolute inset-4 bg-stone-300 rounded-sm shadow-2xl rotate-1 border-b-8 border-stone-400"></div>
                    {phase === 'CUTTING' && (
                        <div className="absolute inset-0 z-10">
                            <CuttingPhase onComplete={(val) => { updateScore('integrity', val); setPhase('TRANSFER'); }} />
                        </div>
                    )}
                </div>

                {/* ZONE 2: Bowl (Center X: 700) */}
                <div className="absolute left-[500px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] flex items-center justify-center">
                    <div className="absolute bottom-10 w-64 h-12 bg-black/40 blur-xl rounded-[50%]"></div>
                    
                    {phase === 'TRANSFER' && (
                        // Ghost Board relative to Bowl
                        <div className="absolute inset-[-200px] z-20">
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

                {/* ZONE 3: Props */}
                <div className="absolute right-20 top-1/2 -translate-y-1/2">
                    <div className="w-24 h-64 bg-stone-900/40 blur-sm rounded-full absolute -right-20 scale-90"></div>
                </div>

            </div>

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
    </div>
  );
}