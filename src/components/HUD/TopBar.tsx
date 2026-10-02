import React from 'react';
import { PlayerStats } from '../../types/game';
import { 
  Coins, 
  Trophy, 
  Sparkles, 
  Flame, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  BookOpen, 
  Cpu
} from 'lucide-react';
import { soundManager } from '../../game/audio/synthAudio';

interface TopBarProps {
  stats: PlayerStats;
  feverCharge: number;
  isFeverActive: boolean;
  feverTimeRemaining: number;
  onOpenShop: () => void;
  onOpenCodex: () => void;
  onOpenGameMaster: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  stats,
  feverCharge,
  isFeverActive,
  feverTimeRemaining,
  onOpenShop,
  onOpenCodex,
  onOpenGameMaster,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-2.5 bg-stone-900/85 backdrop-blur-md border-b border-stone-800 text-stone-100 flex flex-wrap items-center justify-between gap-3 shadow-lg pointer-events-auto">
      {/* Brand & Level */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl filter drop-shadow">🌾</span>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight font-display text-amber-400 leading-none">
              AgriArcade
            </h1>
            <p className="text-[11px] text-stone-400 font-medium">Harvest Rush</p>
          </div>
        </div>

        {/* Level badge & XP Bar */}
        <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700/80 px-2.5 py-1 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-xs font-black">NV.{stats.level}</span>
          </div>
          <div className="w-16 sm:w-24 h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 hidden md:inline font-mono">
            {stats.xp}/{stats.xpToNextLevel}
          </span>
        </div>
      </div>

      {/* Center: Currency & Score */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Coins */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg text-amber-300">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-bold font-mono text-sm sm:text-base tracking-tight">
            {stats.coins.toLocaleString('fr-FR')}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 bg-stone-800/90 border border-stone-700/80 px-3 py-1 rounded-lg text-stone-200">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold font-mono text-xs sm:text-sm">
            {stats.score.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-400">PTS</span>
          </span>
        </div>

        {/* Fever Gauge */}
        <div className="hidden lg:flex items-center gap-2 bg-stone-950/80 border border-stone-800 px-3 py-1 rounded-lg">
          <Flame className={`w-4 h-4 ${isFeverActive ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
          <div className="w-24 h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800 relative">
            <div
              className={`h-full transition-all duration-200 ${
                isFeverActive
                  ? 'bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-400'
              }`}
              style={{ width: `${feverCharge}%` }}
            />
          </div>
          <span className="text-[11px] font-bold font-mono text-amber-400 w-12 text-right">
            {isFeverActive ? `${feverTimeRemaining}s 🔥` : `${Math.round(feverCharge)}%`}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Game Master Panel */}
        <button
          onClick={onOpenGameMaster}
          className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/60 hover:border-purple-500 text-purple-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          title="Game Master Procédural & Événements JSON"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Game Master</span>
        </button>

        {/* Shop */}
        <button
          onClick={onOpenShop}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          title="Boutique d'améliorations"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Boutique</span>
        </button>

        {/* Codex */}
        <button
          onClick={onOpenCodex}
          className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-stone-100 rounded-lg transition-colors cursor-pointer"
          title="Codex des Cultures et PNJ"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleSound}
          className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-stone-100 rounded-lg transition-colors cursor-pointer"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>
    </header>
  );
};
