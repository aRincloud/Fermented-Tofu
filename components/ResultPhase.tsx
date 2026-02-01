import React, { useState, useEffect } from 'react';
import { GameScore, LeaderboardEntry, STORAGE_KEY } from '../types';
import { RotateCcw, Save, Star, Trophy, Flame } from 'lucide-react';

interface ResultPhaseProps {
  score: GameScore;
  onRestart: () => void;
}

export default function ResultPhase({ score, onRestart }: ResultPhaseProps) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);

  // Calculate average total (weighted equally 4 parts)
  const finalScore = Math.round(
      (score.integrity + score.alcoholPrecision + score.flavorBalance + score.bottlingScore) / 4
  );
  
  const getRating = (s: number) => {
    if (s >= 90) return { label: '一代宗师', stars: 3, color: 'text-yellow-500' };
    if (s >= 75) return { label: '霉豆腐手艺人', stars: 2, color: 'text-stone-600' };
    return { label: '新手学徒', stars: 1, color: 'text-stone-400' };
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
      titles: [rating.label],
      difficulty: score.difficulty
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
        <h2 className="text-3xl font-bold font-serif text-amber-400">制作完成</h2>
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
        
        {/* Flavor Badge */}
        {score.flavorTitle && (
            <div className="mt-2 inline-flex items-center gap-2 bg-red-900/50 border border-red-500/30 px-4 py-1 rounded-full text-red-200 animate-pulse">
                <Flame size={16} className="text-red-400" />
                <span className="font-bold text-sm tracking-wider">{score.flavorTitle}</span>
            </div>
        )}
      </div>

      <div className="w-full max-w-xs bg-stone-800 rounded-2xl p-6 space-y-3 shadow-xl border border-stone-700 text-sm">
          <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">切割完整度</span>
              <span className={`font-mono font-bold ${score.integrity < 80 ? 'text-red-400' : 'text-white'}`}>{Math.round(score.integrity)}%</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">注酒精准度</span>
              <span className={`font-mono font-bold ${score.alcoholPrecision < 80 ? 'text-red-400' : 'text-white'}`}>{Math.round(score.alcoholPrecision)}%</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">佐料配比分</span>
              <span className={`font-mono font-bold ${score.flavorBalance < 80 ? 'text-red-400' : 'text-white'}`}>{Math.round(score.flavorBalance)}%</span>
          </div>
           <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="text-stone-400">装瓶损耗分</span>
              <span className={`font-mono font-bold ${score.bottlingScore < 80 ? 'text-red-400' : 'text-white'}`}>{Math.round(score.bottlingScore)}%</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-xl">
              <span className="text-amber-500 font-bold">最终得分</span>
              <span className="font-mono font-bold text-white text-3xl">{finalScore}</span>
          </div>
      </div>

      {isHighScore && !saved && (
        <div className="w-full max-w-xs bg-amber-100 rounded-xl p-4 animate-float text-stone-900">
           <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
             <Trophy size={18} /> 新纪录!
           </div>
           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="输入你的名字"
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
               保存
             </button>
           </div>
        </div>
      )}

      {saved && (
        <div className="text-green-400 flex items-center gap-2 font-bold bg-green-900/30 px-4 py-2 rounded-full">
           <Save size={16} /> 已保存到排行榜
        </div>
      )}

      <div className="flex gap-4 w-full max-w-xs pb-6">
        <button 
            onClick={onRestart}
            className="flex-1 py-3 bg-white text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
        >
            <RotateCcw size={18} /> 再来一次
        </button>
      </div>
    </div>
  );
}