import React, { useState, useEffect } from 'react';
import { Play, Trophy, X } from 'lucide-react';
import { LeaderboardEntry, STORAGE_KEY } from '../types';

interface MenuPhaseProps {
  onStart: () => void;
}

const MenuPhase: React.FC<MenuPhaseProps> = ({ onStart }) => {
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

  return (
    <div className="w-full max-w-md mx-auto p-6 text-center space-y-10 animate-fade-in relative z-50 flex flex-col items-center">
      <div className="space-y-4 drop-shadow-lg">
        <h1 className="text-7xl font-bold text-white tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">霉豆腐</h1>
        <h2 className="text-2xl text-amber-200 font-serif italic drop-shadow-md tracking-wide">Fermented Tofu Master</h2>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-[280px] pt-4">
        <button
          onClick={onStart}
          className="group relative w-full py-5 bg-red-600 text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:bg-red-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-red-800"
        >
          <Play size={32} className="fill-current" />
          <span className="text-xl tracking-wider">START GAME</span>
        </button>
        
        <button
          onClick={() => setShowLeaderboard(true)}
          className="w-full py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl shadow-lg hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20"
        >
          <Trophy size={24} className="text-amber-300" />
          <span className="text-lg">Leaderboard</span>
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-float bg-white text-stone-800 border-4 border-amber-100">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-xl text-amber-900 flex items-center gap-2">
                <Trophy size={24} className="fill-amber-500 text-amber-600"/> Top Makers
              </h3>
              <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-stone-200 rounded-full active:scale-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
              {leaders.length === 0 ? (
                <div className="p-10 text-stone-400 italic text-center text-lg">No records yet.<br/>Be the first!</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 font-medium">Rank</th>
                      <th className="p-4 font-medium">Chef</th>
                      <th className="p-4 font-medium text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {leaders.map((entry, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-4 font-bold text-stone-400 w-12 text-lg">#{i + 1}</td>
                        <td className="p-4">
                          <div className="font-bold text-stone-800 text-base">{entry.name}</div>
                          <div className="text-xs text-stone-400">{new Date(entry.date).toLocaleDateString()}</div>
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