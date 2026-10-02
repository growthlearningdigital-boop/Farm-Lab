import { CropType, ToolType, WeatherType, NPCEvent, ActiveQuest, UpgradesState } from '../../types/game';

type EventListener<T = unknown> = (data: T) => void;

class GameEventBus {
  private listeners: Map<string, Set<EventListener<any>>> = new Map();

  public on<T = any>(event: string, callback: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.off(event, callback);
    };
  }

  public off<T = any>(event: string, callback: EventListener<T>) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = any>(event: string, data?: T) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }
}

export const gameEvents = new GameEventBus();

// Specific Event Names
export const EVENTS = {
  // Phaser -> React
  STATS_UPDATED: 'stats:updated',
  COMBO_PROGRESS: 'combo:progress', // during active drag
  COMBO_RELEASED: 'combo:released', // when chain finishes
  FEVER_STATE_CHANGED: 'fever:state',
  ACTIVE_QUEST_UPDATED: 'quest:updated',
  NPC_EVENT_TRIGGERED: 'npc:triggered',
  WEATHER_CHANGED: 'weather:changed',
  TILE_COUNT_UPDATED: 'tiles:count',
  
  // React -> Phaser
  TOOL_SELECTED: 'tool:select',
  SEED_SELECTED: 'seed:select',
  UPGRADE_APPLIED: 'upgrade:applied',
  FORCE_TRIGGER_EVENT: 'gm:force_event',
  INVOKE_AI_EVENT: 'gm:ai_event',
};
