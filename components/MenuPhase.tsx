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
    <div className="w-full max-w-md mx-auto p-6 text-center space-y-8 animate-fade-in relative z-50">
      <div className="space-y-2 drop-shadow-lg">
        <h1 className="text-6xl font-bold text-white tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">霉豆腐</h1>
        <h2 className="text-xl text-amber-200 font-serif italic drop-shadow-md">Fermented Tofu Master</h2>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs mx-auto pt-8">
        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-red-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:bg-red-500 hover:shadow-red-500/60 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 border-2 border-red-400"
        >
          <Play size={24} className="fill-current" />
          <span className="text-lg">Start Making</span>
        </button>
        
        <button
          onClick={() => setShowLeaderboard(true)}
          className="px-8 py-3 bg-white/20 backdrop-blur text-white font-bold rounded-full shadow-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2 border border-white/30"
        >
          <Trophy size={18} className="text-amber-300" />
          <span>Leaderboard</span>
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-float bg-white text-stone-800">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-lg text-amber-900 flex items-center gap-2">
                <Trophy size={20} className="fill-amber-500 text-amber-600"/> Top Makers
              </h3>
              <button onClick={() => setShowLeaderboard(false)} className="p-1 hover:bg-stone-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
              {leaders.length === 0 ? (
                <div className="p-8 text-stone-400 italic">No records yet. Be the first!</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 sticky top-0">
                    <tr>
                      <th className="p-3 font-medium">Rank</th>
                      <th className="p-3 font-medium">Chef</th>
                      <th className="p-3 font-medium text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {leaders.map((entry, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-3 font-bold text-stone-400 w-12">#{i + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-stone-800">{entry.name}</div>
                          <div className="text-xs text-stone-400">{new Date(entry.date).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700 text-lg">{entry.score}</td>
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