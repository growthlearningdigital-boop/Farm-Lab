import React, { useState } from 'react';
import { CROPS_CATALOG } from '../../game/constants';
import { NPC_ROSTER } from '../../game/events/npcEvents';
import { X, BookOpen, Sparkles, Users } from 'lucide-react';
import { CropType } from '../../types/game';

interface CodexModalProps {
  unlockedCrops: CropType[];
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ unlockedCrops, onClose }) => {
  const [activeTab, setActiveTab] = useState<'crops' | 'npcs'>('crops');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-amber-400">
                Codex de la Ferme & Lore PNJ
              </h2>
              <p className="text-xs text-stone-400">
                Guide des synergies végétales, des combos et des personnalités du Game Master
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 my-3">
          <button
            onClick={() => setActiveTab('crops')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'crops'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cultures ({Object.keys(CROPS_CATALOG).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('npcs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'npcs'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personnages PNJ ({NPC_ROSTER.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'crops' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(CROPS_CATALOG).map((crop) => {
                const isUnlocked = unlockedCrops.includes(crop.id);

                return (
                  <div
                    key={crop.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isUnlocked
                        ? 'bg-stone-800/70 border-stone-700/80'
                        : 'bg-stone-900/40 border-stone-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl filter drop-shadow">{crop.emoji}</span>
                        <div>
                          <h3 className="text-sm font-bold text-stone-100 font-display">
                            {crop.name}
                          </h3>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {isUnlocked ? `Débloqué (Nv. ${crop.unlockedAtLevel})` : `Requis Nv. ${crop.unlockedAtLevel}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-amber-400">
                          {crop.baseValue} 🪙
                        </div>
                        <div className="text-[10px] text-sky-400 font-mono">
                          +{crop.xpGain} XP
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed mb-2">
                      {crop.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-2 border-t border-stone-700/50">
                      <span>Vitesse : {(crop.growDurationMs / 1000).toFixed(1)}s</span>
                      <span>Coût : {crop.seedCost > 0 ? `${crop.seedCost}🪙` : 'Gratuit'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'npcs' && (
            <div className="space-y-3">
              {NPC_ROSTER.map((npc) => (
                <div
                  key={npc.name}
                  className="p-3.5 rounded-xl border border-stone-800 bg-stone-850/60 flex items-start gap-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-2xl shrink-0">
                    {npc.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-amber-400 font-display">
                        {npc.name}
                      </h3>
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                        {npc.personality}
                      </span>
                    </div>
                    <div className="text-xs text-stone-300 font-medium mb-1.5">
                      {npc.title}
                    </div>
                    <div className="text-xs text-stone-400 italic">
                      « {npc.phrases[0]} »
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="mt-3 pt-2 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <span>✨ Astuce Synergie : Enchaîner 3+ légumes identiques donne un bonus monoculture de +50% !</span>
        </div>
      </div>
    </div>
  );
};
