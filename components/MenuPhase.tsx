import React, { useState, useEffect } from 'react';
import { Play, Trophy, X, Gauge } from 'lucide-react';
import { LeaderboardEntry, STORAGE_KEY, Difficulty } from '../types';

interface MenuPhaseProps {
  onStart: () => void;
  currentDifficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
}

const MenuPhase: React.FC<MenuPhaseProps> = ({ onStart, currentDifficulty, onSelectDifficulty }) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (showLeaderboard) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLeaders(JSON.parse(stored).sort((a: any, b: any) => b.score - a.score).slice(0, 10));
      }
    }
  }, [showLeaderboard]);

  const diffColors = {
      EASY: 'bg-green-500 hover:bg-green-400',
      MEDIUM: 'bg-yellow-500 hover:bg-yellow-400',
      HARD: 'bg-red-600 hover:bg-red-500'
  };

  const diffLabels = {
      EASY: '简单',
      MEDIUM: '中等',
      HARD: '困难'
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 text-center space-y-6 animate-fade-in relative z-50 flex flex-col items-center">
      <div className="space-y-4 drop-shadow-lg mb-4">
        <h1 className="text-7xl font-bold text-white tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">霉豆腐</h1>
        <h2 className="text-2xl text-amber-200 font-serif italic drop-shadow-md tracking-wide">Fermented Tofu Master</h2>
      </div>

      {/* Difficulty Selector */}
      <div className="bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-white/10 w-full max-w-[280px]">
          <div className="flex items-center justify-center gap-2 mb-2 text-stone-300 text-xs font-bold uppercase tracking-widest">
              <Gauge size={14} /> 选择难度
          </div>
          <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => onSelectDifficulty(d)}
                    className={`py-2 px-1 rounded-lg text-sm font-bold transition-all ${
                        currentDifficulty === d 
                        ? `${diffColors[d]} text-white shadow-lg scale-105` 
                        : 'bg-white/10 text-stone-400 hover:bg-white/20'
                    }`}
                  >
                      {diffLabels[d]}
                  </button>
              ))}
          </div>
          <div className="mt-2 text-[10px] text-stone-400 min-h-[1.5em]">
              {currentDifficulty === 'EASY' && "3x3 豆腐 • 宽松倒酒判定"}
              {currentDifficulty === 'MEDIUM' && "4x4 豆腐 • 更多切块"}
              {currentDifficulty === 'HARD' && "5x5 豆腐 • 极限挑战"}
          </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[280px]">
        <button
          onClick={onStart}
          className="group relative w-full py-5 bg-stone-100 text-stone-900 font-bold rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-stone-300"
        >
          <Play size={32} className="fill-current text-red-600" />
          <span className="text-xl tracking-wider">开始制作</span>
        </button>
        
        <button
          onClick={() => setShowLeaderboard(true)}
          className="w-full py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl shadow-lg hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20"
        >
          <Trophy size={24} className="text-amber-300" />
          <span className="text-lg">排行榜</span>
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-float bg-white text-stone-800 border-4 border-amber-100">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-xl text-amber-900 flex items-center gap-2">
                <Trophy size={24} className="fill-amber-500 text-amber-600"/> 排行榜
              </h3>
              <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-stone-200 rounded-full active:scale-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
              {leaders.length === 0 ? (
                <div className="p-10 text-stone-400 italic text-center text-lg">暂无记录。<br/>快来创造第一名！</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 font-medium">排名</th>
                      <th className="p-4 font-medium">大厨</th>
                      <th className="p-4 font-medium text-right">评分</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {leaders.map((entry, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-4 font-bold text-stone-400 w-12 text-lg">#{i + 1}</td>
                        <td className="p-4">
                          <div className="font-bold text-stone-800 text-base">{entry.name}</div>
                          <div className="flex items-center gap-2 text-xs text-stone-400">
                              <span>{new Date(entry.date).toLocaleDateString()}</span>
                              {entry.titles && entry.titles[0] && (
                                  <span className="bg-amber-100 text-amber-800 px-1.5 rounded-sm">{entry.titles[0]}</span>
                              )}
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-amber-700 text-xl">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
      )}
    </div>
  );
};

export default MenuPhase;