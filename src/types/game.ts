export type CropType = 'wheat' | 'carrot' | 'strawberry' | 'pumpkin' | 'sunflower' | 'corn';

export type ToolType = 'scythe' | 'water' | 'seed' | 'fertilizer';

export type WeatherType = 'sunny' | 'rain' | 'rainbow' | 'solar_flare';

export interface CropDefinition {
  id: CropType;
  name: string;
  emoji: string;
  baseValue: number;
  growDurationMs: number; // Fast arcade growth (e.g. 2000-4000ms)
  unlockedAtLevel: number;
  color: string;
  seedCost: number;
  xpGain: number;
  description: string;
  synergyCrop?: CropType;
}

export type TileStatus = 'empty' | 'growing' | 'mature' | 'golden';

export interface TileData {
  gx: number;
  gy: number;
  status: TileStatus;
  crop?: CropType;
  growthProgress: number; // 0.0 to 1.0
  isWatered: boolean;
  hasPest: boolean;
  pestType?: 'mole' | 'rabbit';
  isGolden: boolean;
}

export interface PlayerStats {
  coins: number;
  score: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalHarvested: number;
  highestCombo: number;
  questsCompleted: number;
}

export interface ComboHarvestResult {
  chainLength: number;
  totalCoins: number;
  totalScore: number;
  totalXp: number;
  multiplier: number;
  isMonoculture: boolean;
  cropType?: CropType;
}

export interface UpgradesState {
  scytheRadius: number; // 1 = 1 tile, 2 = 3x3 sweep
  waterPower: number;   // 1 = instant growth + 30%, 2 = instant bloom
  fertilizerChance: number; // chance of turning crop into Golden (+400% value)
  farmSize: number;     // 6, 7, or 8 (grid size NxN)
  sprinklerDrone: boolean; // periodic auto water pulse
}

// Procedural NPC and Event definitions
export type NPCPersonality = 'greedy' | 'mystic' | 'cheerful' | 'grumpy' | 'alchemist' | 'royalty';

export type QuestType = 
  | 'harvest_combo' 
  | 'deliver_crop' 
  | 'fever_trigger' 
  | 'speed_challenge' 
  | 'golden_harvest';

export interface NPCRequirement {
  cropType?: CropType;
  amount?: number;
  comboMin?: number;
  timeLimitSeconds?: number;
}

export interface NPCBuff {
  type: 'combo_booster' | 'instant_grow' | 'gold_frenzy' | 'double_xp';
  name: string;
  durationSeconds: number;
  description: string;
}

export interface NPCReward {
  coins: number;
  score: number;
  xp: number;
  reputation: number;
  buff?: NPCBuff;
}

export interface NPCEventChoice {
  id: string;
  text: string;
  response: string;
  isAccept?: boolean;
}

export interface NPCEvent {
  id: string;
  npcName: string;
  npcTitle: string;
  avatar: string;
  personality: NPCPersonality;
  dialogue: string;
  questType: QuestType;
  requirements: NPCRequirement;
  rewards: NPCReward;
  choices: NPCEventChoice[];
  expiresInSeconds?: number;
}

export interface ActiveQuest {
  event: NPCEvent;
  currentProgress: number;
  targetProgress: number;
  timeRemaining?: number;
  startedAt: number;
}
