import React from 'react';
import { PlayerStats, UpgradesState } from '../../types/game';
import { gameEvents, EVENTS } from '../../game/events/eventBus';
import { soundManager } from '../../game/audio/synthAudio';
import { X, ShoppingBag, Maximize2, Droplets, Sparkles, Bot, Check } from 'lucide-react';

interface ShopModalProps {
  stats: PlayerStats;
  upgrades: UpgradesState;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ stats, upgrades, onClose }) => {
  const buyUpgrade = (key: keyof UpgradesState, cost: number, newValue: any) => {
    if (stats.coins < cost) {
      soundManager.playPestWhack();
      return;
    }

    stats.coins -= cost;
    const updated = { ...upgrades, [key]: newValue };
    soundManager.playCoinJingle();
    gameEvents.emit(EVENTS.UPGRADE_APPLIED, updated);
  };

  const shopItems = [
    {
      id: 'expand_7',
      title: 'Expansion du Domaine (7x7)',
      description: 'Agrandit votre champ à 49 parcelles isométriques pour des chaînes encore plus folles.',
      icon: <Maximize2 className="w-5 h-5 text-amber-400" />,
      cost: 500,
      isOwned: upgrades.farmSize >= 7,
      canBuy: stats.coins >= 500 && upgrades.farmSize < 7,
      action: () => buyUpgrade('farmSize', 500, 7),
    },
    {
      id: 'expand_8',
      title: 'Super Domaine Impérial (8x8)',
      description: 'La taille maximale ! 64 parcelles permettant des combos de 20+ récoltes.',
      icon: <Maximize2 className="w-5 h-5 text-yellow-400" />,
      cost: 1500,
      isOwned: upgrades.farmSize >= 8,
      canBuy: stats.coins >= 1500 && upgrades.farmSize === 7,
      action: () => buyUpgrade('farmSize', 1500, 8),
    },
    {
      id: 'water_torrent',
      title: 'Arrosoir Torrentiel',
      description: 'L’arrosage par glissement fait éclore immédiatement les cultures à 100% de maturité.',
      icon: <Droplets className="w-5 h-5 text-sky-400" />,
      cost: 400,
      isOwned: upgrades.waterPower >= 2,
      canBuy: stats.coins >= 400 && upgrades.waterPower < 2,
      action: () => buyUpgrade('waterPower', 400, 2),
    },
    {
      id: 'gold_catalyst',
      title: 'Catalyseur Alchimique',
      description: 'L’engrais a 65% de chances (au lieu de 35%) de transmuter les cultures en or massif (+400% valeur).',
      icon: <Sparkles className="w-5 h-5 text-yellow-300" />,
      cost: 650,
      isOwned: upgrades.fertilizerChance >= 0.65,
      canBuy: stats.coins >= 650 && upgrades.fertilizerChance < 0.65,
      action: () => buyUpgrade('fertilizerChance', 650, 0.65),
    },
    {
      id: 'drone_sprinkler',
      title: 'Drone Arroseur Autonome',
      description: 'Un automate plane au-dessus de vos parcelles et les hydrate régulièrement en pleine action.',
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
      cost: 950,
      isOwned: upgrades.sprinklerDrone,
      canBuy: stats.coins >= 950 && !upgrades.sprinklerDrone,
      action: () => buyUpgrade('sprinklerDrone', 950, true),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-amber-400">
                Atelier des Améliorations
              </h2>
              <p className="text-xs text-stone-400">
                Optimisez la vitesse, la taille du champ et vos outils d’arcade
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

        {/* List of items */}
        <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1">
          {shopItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                item.isOwned
                  ? 'bg-stone-900/60 border-emerald-900/40 text-stone-400'
                  : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/80 text-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-700/60 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-100 font-display">
                    {item.title}
                  </div>
                  <div className="text-xs text-stone-400 leading-relaxed mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              <div>
                {item.isOwned ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                    <Check className="w-3.5 h-3.5" />
                    <span>Acquis</span>
                  </div>
                ) : (
                  <button
                    onClick={item.action}
                    disabled={!item.canBuy}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      item.canBuy
                        ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md font-extrabold'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    {item.cost} 🪙
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>
            Solde actuel : <strong className="text-amber-400 font-mono">{stats.coins.toLocaleString('fr-FR')} 🪙</strong>
          </span>
          <span className="text-[11px] text-stone-500">Effets immédiats sans redémarrage</span>
        </div>
      </div>
    </div>
  );
};
