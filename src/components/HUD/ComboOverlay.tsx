import React, { useEffect, useState } from 'react';
import { gameEvents, EVENTS } from '../../game/events/eventBus';
import { CropType } from '../../types/game';
import { CROPS_CATALOG } from '../../game/constants';
import { Flame, Sparkles } from 'lucide-react';

interface ComboState {
  chainLength: number;
  multiplier: number;
  title: string;
  cropType?: CropType;
}

export const ComboOverlay: React.FC = () => {
  const [activeCombo, setActiveCombo] = useState<ComboState | null>(null);

  useEffect(() => {
    const unsubProgress = gameEvents.on(EVENTS.COMBO_PROGRESS, (data: ComboState) => {
      setActiveCombo(data);
    });

    const unsubRelease = gameEvents.on(EVENTS.COMBO_RELEASED, () => {
      setActiveCombo(null);
    });

    return () => {
      unsubProgress();
      unsubRelease();
    };
  }, []);

  if (!activeCombo || activeCombo.chainLength < 2) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
        <span className="text-[12px] text-stone-400/90 font-medium px-3 py-1 bg-stone-900/60 backdrop-blur-sm rounded-full border border-stone-800">
          🌾 Glissez la souris ou le doigt pour récolter en chaîne !
        </span>
      </div>
    );
  }

  const crop = activeCombo.cropType ? CROPS_CATALOG[activeCombo.cropType] : null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center animate-bounce">
      <div className="bg-gradient-to-r from-amber-600/90 via-yellow-500/95 to-amber-600/90 text-stone-950 px-5 py-2 rounded-2xl shadow-2xl border-2 border-yellow-200 backdrop-blur-md flex items-center gap-3">
        <Flame className="w-6 h-6 text-red-600 animate-pulse" />
        <div className="text-center">
          <div className="text-sm font-black uppercase tracking-wider font-display text-stone-950 flex items-center gap-1.5 justify-center">
            {crop && <span>{crop.emoji}</span>}
            <span>{activeCombo.title}</span>
            <Sparkles className="w-4 h-4 text-yellow-900" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight leading-none text-stone-950">
            COMBO x{activeCombo.chainLength}{' '}
            <span className="text-sm font-extrabold bg-stone-950/20 px-1.5 py-0.5 rounded ml-1">
              (x{activeCombo.multiplier.toFixed(1)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
