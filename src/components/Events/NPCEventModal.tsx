import React from 'react';
import { NPCEvent } from '../../types/game';
import { gameEvents } from '../../game/events/eventBus';
import { Coins, Trophy, Zap, Clock, X, Sparkles } from 'lucide-react';
import { soundManager } from '../../game/audio/synthAudio';

interface NPCEventModalProps {
  event: NPCEvent | null;
  onClose: () => void;
}

export const NPCEventModal: React.FC<NPCEventModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const handleChoice = (choiceId: string, isAccept?: boolean) => {
    soundManager.playCoinJingle();
    if (isAccept) {
      // If negotiate, add bonus coins!
      if (choiceId === 'negotiate') {
        event.rewards.coins = Math.round(event.rewards.coins * 1.3);
      }
      gameEvents.emit('quest:accept', event);
    }
    onClose();
  };

  const personalityColor = {
    greedy: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
    mystic: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
    cheerful: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
    grumpy: 'border-red-500/50 bg-red-950/20 text-red-300',
    alchemist: 'border-sky-500/50 bg-sky-950/20 text-sky-300',
    royalty: 'border-yellow-500/50 bg-yellow-950/20 text-yellow-300',
  }[event.personality] || 'border-stone-700 bg-stone-900 text-stone-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl text-stone-100 overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* NPC Profile Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-stone-800 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
            {event.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-amber-400">
                {event.npcName}
              </h2>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${personalityColor}`}>
                {event.personality}
              </span>
            </div>
            <p className="text-xs text-stone-400">{event.npcTitle}</p>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 mb-4 text-stone-200 text-sm leading-relaxed relative">
          <p className="italic">« {event.dialogue} »</p>
        </div>

        {/* Contract Requirements & Rewards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Requirements */}
          <div className="bg-stone-800/60 border border-stone-700/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
              Objectif Arcade
            </span>
            <div className="space-y-1 text-xs">
              {event.questType === 'harvest_combo' && (
                <div className="text-amber-300 font-semibold">
                  🌾 Enchaîner un combo de <span className="font-mono text-base font-bold">{event.requirements.comboMin}</span> récoltes
                </div>
              )}
              {event.questType === 'deliver_crop' && (
                <div className="text-amber-300 font-semibold">
                  📦 Récolter <span className="font-mono text-base font-bold">{event.requirements.amount}x</span> {event.requirements.cropType}
                </div>
              )}
              {event.questType === 'speed_challenge' && (
                <div className="text-amber-300 font-semibold">
                  ⚡ Vitesse : Récolter <span className="font-mono text-base font-bold">{event.requirements.amount}x</span> cultures
                </div>
              )}
              {event.questType === 'golden_harvest' && (
                <div className="text-yellow-300 font-semibold">
                  ✨ Récolter <span className="font-mono text-base font-bold">{event.requirements.amount}x</span> cultures dorées
                </div>
              )}
              {event.questType === 'fever_trigger' && (
                <div className="text-red-400 font-semibold">
                  🔥 Déclencher le Mode Frénésie
                </div>
              )}

              {event.requirements.timeLimitSeconds && (
                <div className="flex items-center gap-1 text-[11px] text-stone-400 pt-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Limite : {event.requirements.timeLimitSeconds}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-stone-800/60 border border-stone-700/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
              Récompenses
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
                <Coins className="w-3.5 h-3.5" />
                <span>+{event.rewards.coins} Pièces</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-300 font-mono">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <span>+{event.rewards.score} Pts</span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-400 font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>+{event.rewards.xp} XP</span>
              </div>
              {event.rewards.buff && (
                <div className="text-[11px] text-emerald-400 font-medium pt-1 truncate">
                  🎁 {event.rewards.buff.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Choices */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {event.choices.map((choice) => {
            const isAccept = choice.isAccept;
            const isNegotiate = choice.id === 'negotiate';

            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id, choice.isAccept)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isNegotiate
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md'
                    : isAccept
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-md'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                }`}
              >
                {isAccept && <Sparkles className="w-3.5 h-3.5" />}
                <span>{choice.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
