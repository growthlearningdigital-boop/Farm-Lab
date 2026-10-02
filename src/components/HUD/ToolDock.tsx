import React, { useEffect } from 'react';
import { ToolType, CropType } from '../../types/game';
import { CROPS_CATALOG } from '../../game/constants';
import { gameEvents, EVENTS } from '../../game/events/eventBus';

interface ToolDockProps {
  selectedTool: ToolType;
  selectedSeed: CropType;
  unlockedCrops: CropType[];
  playerCoins: number;
}

export const ToolDock: React.FC<ToolDockProps> = ({
  selectedTool,
  selectedSeed,
  unlockedCrops,
  playerCoins,
}) => {
  const [showSeedPicker, setShowSeedPicker] = React.useState(false);

  // Keyboard shortcut support (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1' || e.key === '&') {
        selectTool('scythe');
      } else if (e.key === '2' || e.key === 'é') {
        selectTool('water');
      } else if (e.key === '3' || e.key === '"') {
        selectTool('seed');
      } else if (e.key === '4' || e.key === "'") {
        selectTool('fertilizer');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectTool = (tool: ToolType) => {
    gameEvents.emit(EVENTS.TOOL_SELECTED, tool);
    if (tool === 'seed') {
      setShowSeedPicker(true);
    } else {
      setShowSeedPicker(false);
    }
  };

  const selectSeed = (crop: CropType) => {
    gameEvents.emit(EVENTS.SEED_SELECTED, crop);
    setShowSeedPicker(false);
  };

  const toolsConfig = [
    {
      id: 'scythe' as ToolType,
      name: 'Faux Tranchante',
      icon: '🌾',
      shortcut: '1',
      desc: 'Glissez pour enchaîner des combos géants !',
      bgActive: 'bg-amber-600/30 border-amber-400 text-amber-300 shadow-amber-500/20',
    },
    {
      id: 'water' as ToolType,
      name: 'Arrosoir Cascade',
      icon: '💧',
      shortcut: '2',
      desc: 'Poussée instantanée & hydratation éclair',
      bgActive: 'bg-sky-600/30 border-sky-400 text-sky-300 shadow-sky-500/20',
    },
    {
      id: 'seed' as ToolType,
      name: 'Semeur Rapide',
      icon: CROPS_CATALOG[selectedSeed]?.emoji || '🌱',
      shortcut: '3',
      desc: `Semer : ${CROPS_CATALOG[selectedSeed]?.name}`,
      bgActive: 'bg-emerald-600/30 border-emerald-400 text-emerald-300 shadow-emerald-500/20',
    },
    {
      id: 'fertilizer' as ToolType,
      name: 'Engrais Doré',
      icon: '✨',
      shortcut: '4',
      desc: 'Mutation Alchimique Dorée (+400%) (20🪙)',
      bgActive: 'bg-yellow-600/30 border-yellow-400 text-yellow-200 shadow-yellow-500/20',
    },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto max-w-full px-2">
      {/* Seed Selector Popover when Seed tool is chosen */}
      {showSeedPicker && (
        <div className="bg-stone-900/95 border border-stone-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-full overflow-x-auto">
          <span className="text-xs font-bold text-stone-400 px-1 whitespace-nowrap">Semence :</span>
          {unlockedCrops.map((cropId) => {
            const crop = CROPS_CATALOG[cropId];
            const isSelected = selectedSeed === cropId;
            const canAfford = playerCoins >= crop.seedCost;

            return (
              <button
                key={cropId}
                onClick={() => selectSeed(cropId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 border-amber-300 font-bold shadow-md scale-105'
                    : canAfford
                    ? 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
                    : 'bg-stone-900 border-stone-800 text-stone-500 opacity-60'
                }`}
              >
                <span className="text-base">{crop.emoji}</span>
                <span>{crop.name}</span>
                <span className="text-[10px] opacity-80">
                  {crop.seedCost > 0 ? `(${crop.seedCost}🪙)` : '(Gratuit)'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Tool Dock */}
      <div className="bg-stone-900/90 border border-stone-800/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5 sm:gap-2">
        {toolsConfig.map((tool) => {
          const isActive = selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => selectTool(tool.id)}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? `${tool.bgActive} border-2 shadow-lg scale-105`
                  : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700/60 text-stone-300 hover:text-stone-100'
              }`}
            >
              <span className="text-xl sm:text-2xl filter drop-shadow">{tool.icon}</span>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold leading-tight font-display">{tool.name}</div>
                <div className="text-[10px] text-stone-400 line-clamp-1">{tool.desc}</div>
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-stone-950 border border-stone-700 text-stone-400 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {tool.shortcut}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
