/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { FarmScene } from './game/scenes/FarmScene';
import { gameEvents, EVENTS } from './game/events/eventBus';
import { 
  PlayerStats, 
  UpgradesState, 
  CropType, 
  ToolType, 
  NPCEvent, 
  WeatherType 
} from './types/game';

import { TopBar } from './components/HUD/TopBar';
import { ToolDock } from './components/HUD/ToolDock';
import { ComboOverlay } from './components/HUD/ComboOverlay';
import { QuestBanner } from './components/Events/QuestBanner';
import { NPCEventModal } from './components/Events/NPCEventModal';
import { GameMasterInspector } from './components/Events/GameMasterInspector';
import { ShopModal } from './components/Shop/ShopModal';
import { CodexModal } from './components/Shop/CodexModal';

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // Synchronized Game State
  const [stats, setStats] = useState<PlayerStats>({
    coins: 150,
    score: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalHarvested: 0,
    highestCombo: 0,
    questsCompleted: 0,
  });

  const [upgrades, setUpgrades] = useState<UpgradesState>({
    scytheRadius: 1,
    waterPower: 1,
    fertilizerChance: 0.35,
    farmSize: 6,
    sprinklerDrone: false,
  });

  const [selectedTool, setSelectedTool] = useState<ToolType>('scythe');
  const [selectedSeed, setSelectedSeed] = useState<CropType>('wheat');
  const [unlockedCrops, setUnlockedCrops] = useState<CropType[]>(['wheat', 'carrot']);
  const [weather, setWeather] = useState<WeatherType>('sunny');

  // Fever state
  const [feverCharge, setFeverCharge] = useState<number>(0);
  const [isFeverActive, setIsFeverActive] = useState<boolean>(false);
  const [feverTimeRemaining, setFeverTimeRemaining] = useState<number>(0);

  // Modals & Panels
  const [activeNPCEvent, setActiveNPCEvent] = useState<NPCEvent | null>(null);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showCodex, setShowCodex] = useState<boolean>(false);
  const [showGameMaster, setShowGameMaster] = useState<boolean>(false);

  // Initialize Phaser Game instance
  useEffect(() => {
    if (!gameContainerRef.current) return;
    if (phaserGameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1c1917',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      scene: [BootScene, FarmScene],
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Listen to events from Phaser
    const unsubStats = gameEvents.on(EVENTS.STATS_UPDATED, (data: any) => {
      if (data.stats) setStats(data.stats);
      if (data.upgrades) setUpgrades(data.upgrades);
      if (data.unlockedCrops) setUnlockedCrops(data.unlockedCrops);
      if (data.selectedTool) setSelectedTool(data.selectedTool);
      if (data.selectedSeed) setSelectedSeed(data.selectedSeed);
      if (data.activeWeather) setWeather(data.activeWeather);
    });

    const unsubFever = gameEvents.on(EVENTS.FEVER_STATE_CHANGED, (data: any) => {
      setFeverCharge(data.charge);
      setIsFeverActive(data.isActive);
      setFeverTimeRemaining(data.remaining || 0);
    });

    const unsubNPC = gameEvents.on(EVENTS.NPC_EVENT_TRIGGERED, (evt: NPCEvent) => {
      setActiveNPCEvent(evt);
    });

    return () => {
      unsubStats();
      unsubFever();
      unsubNPC();
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* Phaser Canvas Container */}
      <div 
        id="phaser-container" 
        ref={gameContainerRef} 
        className="absolute inset-0 z-0 touch-none cursor-crosshair"
      />

      {/* Weather ambience overlay if special */}
      {isFeverActive && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-amber-500/10 border-4 border-amber-400/30 fever-glow" />
      )}

      {/* Top HUD */}
      <TopBar
        stats={stats}
        feverCharge={feverCharge}
        isFeverActive={isFeverActive}
        feverTimeRemaining={feverTimeRemaining}
        onOpenShop={() => setShowShop(true)}
        onOpenCodex={() => setShowCodex(true)}
        onOpenGameMaster={() => setShowGameMaster(true)}
      />

      {/* Active Quest Status Banner */}
      <QuestBanner />

      {/* Combo Floating Badge */}
      <ComboOverlay />

      {/* Bottom Tool Dock */}
      <ToolDock
        selectedTool={selectedTool}
        selectedSeed={selectedSeed}
        unlockedCrops={unlockedCrops}
        playerCoins={stats.coins}
      />

      {/* NPC Dialogue / Mission Acceptance Modal */}
      <NPCEventModal
        event={activeNPCEvent}
        onClose={() => setActiveNPCEvent(null)}
      />

      {/* Shop & Upgrades Modal */}
      {showShop && (
        <ShopModal
          stats={stats}
          upgrades={upgrades}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* Codex & Lore Modal */}
      {showCodex && (
        <CodexModal
          unlockedCrops={unlockedCrops}
          onClose={() => setShowCodex(false)}
        />
      )}

      {/* Procedural Game Master & JSON Inspector */}
      {showGameMaster && (
        <GameMasterInspector
          stats={stats}
          unlockedCrops={unlockedCrops}
          onClose={() => setShowGameMaster(false)}
        />
      )}
    </div>
  );
}
