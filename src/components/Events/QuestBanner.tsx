import React, { useEffect, useState } from 'react';
import { ActiveQuest } from '../../types/game';
import { gameEvents, EVENTS } from '../../game/events/eventBus';
import { Clock, CheckCircle2, Award } from 'lucide-react';

export const QuestBanner: React.FC = () => {
  const [quest, setQuest] = useState<ActiveQuest | null>(null);

  useEffect(() => {
    const unsub = gameEvents.on(EVENTS.ACTIVE_QUEST_UPDATED, (q: ActiveQuest | null) => {
      setQuest(q);
    });

    return () => unsub();
  }, []);

  if (!quest) return null;

  const percent = Math.min(100, Math.round((quest.currentProgress / quest.targetProgress) * 100));

  return (
    <div className="fixed top-16 left-3 sm:left-6 z-30 max-w-sm w-[calc(100vw-24px)] sm:w-80 pointer-events-auto">
      <div className="bg-stone-900/95 border border-amber-500/40 rounded-xl p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl filter drop-shadow">{quest.event.avatar}</span>
            <div>
              <div className="text-xs font-bold text-amber-400 font-display leading-tight">
                {quest.event.npcName}
              </div>
              <div className="text-[10px] text-stone-400">{quest.event.npcTitle}</div>
            </div>
          </div>

          {quest.timeRemaining !== undefined && (
            <div className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
              quest.timeRemaining <= 10 ? 'bg-red-950 text-red-400 animate-pulse border border-red-800' : 'bg-stone-800 text-amber-300'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{quest.timeRemaining}s</span>
            </div>
          )}
        </div>

        {/* Objective info */}
        <p className="text-[11px] text-stone-200 font-medium mb-2 line-clamp-2">
          {quest.event.dialogue}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-stone-400">
            <span>Progression</span>
            <span className="font-bold text-amber-300">
              {quest.currentProgress} / {quest.targetProgress}
            </span>
          </div>
          <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Reward preview */}
        <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
          <div className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
            <Award className="w-3 h-3" />
            <span>+{quest.event.rewards.coins}🪙</span>
            <span>+{quest.event.rewards.xp} XP</span>
          </div>
          {quest.event.rewards.buff && (
            <span className="text-sky-300 font-medium text-[9px] truncate max-w-[130px]">
              ⚡ {quest.event.rewards.buff.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
