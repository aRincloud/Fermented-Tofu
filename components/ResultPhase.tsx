import React, { useState, useEffect } from 'react';
import { GameScore, LeaderboardEntry, STORAGE_KEY } from '../types';
import { RotateCcw, Save, Star, Trophy } from 'lucide-react';

interface ResultPhaseProps {
  score: GameScore;
  onRestart: () => void;
}

export default function ResultPhase({ score, onRestart }: ResultPhaseProps) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);

  // Calculate average total
  const finalScore = Math.round((score.integrity + score.alcoholPrecision + score.flavorBalance) / 3);
  
  const getRating = (s: number) => {
    if (s >= 90) return { label: 'Grandmaster Chef', stars: 3, color: 'text-yellow-500' };
    if (s >= 70) return { label: 'Tofu Artisan', stars: 2, color: 'text-stone-600' };
    return { label: 'Beginner Maker', stars: 1, color: 'text-stone-400' };
  };

  const rating = getRating(finalScore);

  // Check if it's a high score on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const leaders: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
    
    // Top 10 or nothing yet
    if (leaders.length < 10 || finalScore > leaders[leaders.length - 1].score) {
      setIsHighScore(true);
    }
  }, [finalScore]);

  const handleSave = () => {
    if (!name.trim() || saved) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const leaders: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
    
    const newEntry: LeaderboardEntry = {
      name: name.trim(),
      score: finalScore,
      date: new Date().toISOString(),
      titles: [rating.label]
    };

    const updated = [...leaders, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
  };

  return (
    <div className="h-full flex flex-col bg-stone-900 text-white items-center justify-center p-6 space-y-6 animate-fade-in overflow-y-auto">
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-3xl font-bold font-serif text-amber-400">Batch Complete</h2>
        <div className="flex items-center justify-center gap-1">
          {[...Array(3)].map((_, i) => (
             <Star 
                key={i} 
                className={`${i < rating.stars ? 'fill-yellow-400 text-yellow-400' : 'text-stone-700'} transition-all delay-300`} 
                size={32} 
             />
          ))}
        </div>
        <p className={`text-xl font-medium ${rating.color}`}>{rating.label}</p>
      </div>

      <div className="w-full max-w-xs bg-stone-800 rounded-2xl p-6 space-y-4 shadow-xl border border-stone-700">
          <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">Cut Precision</span>
              <span className="font-mono font-bold">{Math.round(score.integrity)}%</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">Spirit Pour</span>
              <span className="font-mono font-bold">{Math.round(score.alcoholPrecision)}%</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">Seasoning</span>
              <span className="font-mono font-bold">{Math.round(score.flavorBalance)}%</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-xl">
              <span className="text-amber-500 font-bold">Total</span>
              <span className="font-mono font-bold text-white text-3xl">{finalScore}</span>
          </div>
      </div>

      {isHighScore && !saved && (
        <div className="w-full max-w-xs bg-amber-100 rounded-xl p-4 animate-float text-stone-900">
           <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
             <Trophy size={18} /> New High Score!
           </div>
           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="Enter your name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               maxLength={10}
               className="flex-1 px-3 py-2 rounded border border-amber-300 focus:outline-none focus:border-amber-500"
             />
             <button 
               onClick={handleSave}
               disabled={!name.trim()}
               className="bg-amber-600 text-white px-4 rounded font-bold disabled:opacity-50"
             >
               Save
             </button>
           </div>
        </div>
      )}

      {saved && (
        <div className="text-green-400 flex items-center gap-2 font-bold bg-green-900/30 px-4 py-2 rounded-full">
           <Save size={16} /> Saved to Leaderboard
        </div>
      )}

      <div className="flex gap-4 w-full max-w-xs pb-6">
        <button 
            onClick={onRestart}
            className="flex-1 py-3 bg-white text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
        >
            <RotateCcw size={18} /> Again
        </button>
      </div>
    </div>
  );
}