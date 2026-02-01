export type GamePhase = 
  | 'MENU' 
  | 'CUTTING' 
  | 'TRANSFER' 
  | 'ALCOHOL' 
  | 'SEASONING' 
  | 'BOTTLING' 
  | 'RESULT';

export interface TofuBlock {
  id: number;
  row: number;
  col: number;
  state: 'fresh' | 'damaged' | 'in_bowl';
  x: number; // For drag visual
  y: number; // For drag visual
}

export interface Connection {
  id: string;
  blockA: number;
  blockB: number;
  orientation: 'horizontal' | 'vertical';
  severed: boolean;
}

export interface GameScore {
  integrity: number; // Tofu condition (starts 100)
  alcoholPrecision: number; // 0-100
  flavorBalance: number; // 0-100
  bottlingScore: number; // 0-100
  flavorTitle: string; // e.g. "微麻中辣"
  total: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  titles: string[]; // e.g., ["Precise Cutter", "Master Shaker"]
}

export const GRID_SIZE = 3;
export const STORAGE_KEY = 'meidoufu_leaderboard';