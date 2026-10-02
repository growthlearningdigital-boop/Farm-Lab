import React, { useState } from 'react';
import { NPCEvent, PlayerStats, CropType } from '../../types/game';
import { ProceduralGameMasterEngine, generateAIGameMasterEvent } from '../../game/events/npcEvents';
import { gameEvents, EVENTS } from '../../game/events/eventBus';
import { X, Cpu, Sparkles, Play, Code, RefreshCw } from 'lucide-react';

interface GameMasterInspectorProps {
  stats: PlayerStats;
  unlockedCrops: CropType[];
  onClose: () => void;
}

export const GameMasterInspector: React.FC<GameMasterInspectorProps> = ({
  stats,
  unlockedCrops,
  onClose,
}) => {
  const [engine] = useState(() => new ProceduralGameMasterEngine());
  const [currentEventJson, setCurrentEventJson] = useState<string>(() => {
    const initial = engine.generateEvent(stats, unlockedCrops);
    return JSON.stringify(initial, null, 2);
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate local procedural JSON event
  const handleGenerateProcedural = () => {
    setErrorMessage(null);
    const event = engine.generateEvent(stats, unlockedCrops);
    setCurrentEventJson(JSON.stringify(event, null, 2));
  };

  // Generate via Gemini AI Game Master
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setErrorMessage(null);
    try {
      const event = await generateAIGameMasterEvent(stats, unlockedCrops);
      setCurrentEventJson(JSON.stringify(event, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setErrorMessage(`Erreur IA : ${msg}. Repli procédural actif.`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Dispatch JSON to Phaser game engine
  const handleInjectIntoGame = () => {
    try {
      setErrorMessage(null);
      const parsed = JSON.parse(currentEventJson) as NPCEvent;
      if (!parsed.npcName || !parsed.questType || !parsed.requirements) {
        throw new Error('Le JSON doit comporter au moins npcName, questType et requirements.');
      }
      gameEvents.emit(EVENTS.FORCE_TRIGGER_EVENT, parsed);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Format JSON invalide';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-purple-500/50 rounded-2xl p-5 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/60 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-purple-300">
                Game Master Procédural & Moteur d’Événements JSON
              </h2>
              <p className="text-xs text-stone-400">
                Génération dynamique d’objectifs PNJ sans temps mort passive
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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 my-3">
          <button
            onClick={handleGenerateProcedural}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Générer Procédural</span>
          </button>

          <button
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isGeneratingAI ? 'Génération IA...' : 'Invoquer IA Gemini'}</span>
          </button>

          <div className="ml-auto">
            <button
              onClick={handleInjectIntoGame}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Injecter dans le Jeu</span>
            </button>
          </div>
        </div>

        {/* Error notice if any */}
        {errorMessage && (
          <div className="mb-2 p-2 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* JSON Editor / Preview Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono mb-1">
            <span className="flex items-center gap-1">
              <Code className="w-3.5 h-3.5" /> Payload JSON (Modifiable en direct) :
            </span>
            <span className="text-purple-400">Schema NPCEvent v1.0</span>
          </div>

          <textarea
            value={currentEventJson}
            onChange={(e) => setCurrentEventJson(e.target.value)}
            className="w-full flex-1 bg-stone-950 border border-stone-800 rounded-xl p-3 font-mono text-xs text-amber-300 focus:outline-none focus:border-purple-500/80 resize-none selection:bg-purple-900"
            rows={14}
            spellCheck={false}
          />
        </div>

        {/* Footer Documentation */}
        <div className="mt-3 pt-2 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <span>
            💡 Les événements s’adaptent au niveau actuel (Nv.{stats.level}) et aux combos records du joueur.
          </span>
          <span className="font-mono text-stone-500">Phaser 3 + Vite</span>
        </div>
      </div>
    </div>
  );
};
