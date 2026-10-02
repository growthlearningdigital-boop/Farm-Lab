import { CropDefinition, CropType } from '../types/game';

export const ISO_TILE_WIDTH = 76;
export const ISO_TILE_HEIGHT = 38;

export const CROPS_CATALOG: Record<CropType, CropDefinition> = {
  wheat: {
    id: 'wheat',
    name: "Blé d'Or",
    emoji: '🌾',
    baseValue: 12,
    growDurationMs: 1800,
    unlockedAtLevel: 1,
    color: '#FBBF24', // Amber/gold
    seedCost: 0, // Free starter
    xpGain: 5,
    description: 'Pousse à toute vitesse. Idéal pour amorcer de longs combos.',
  },
  carrot: {
    id: 'carrot',
    name: 'Carotte Ruby',
    emoji: '🥕',
    baseValue: 26,
    growDurationMs: 2400,
    unlockedAtLevel: 2,
    color: '#F97316', // Orange
    seedCost: 5,
    xpGain: 12,
    description: 'Riche en vitamines et très prisée des marchands ambulants.',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Fraise Électrique',
    emoji: '🍓',
    baseValue: 55,
    growDurationMs: 3000,
    unlockedAtLevel: 3,
    color: '#EF4444', // Red
    seedCost: 15,
    xpGain: 25,
    description: 'Crée des étincelles lors de la récolte. Remplit la jauge de Frénésie plus vite.',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Citrouille Royale',
    emoji: '🎃',
    baseValue: 120,
    growDurationMs: 3800,
    unlockedAtLevel: 4,
    color: '#EA580C', // Deep amber
    seedCost: 35,
    xpGain: 50,
    description: 'Une courge dense et précieuse, parfaite pour les banquets de la noblesse.',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Tournesol Solaire',
    emoji: '🌻',
    baseValue: 220,
    growDurationMs: 4400,
    unlockedAtLevel: 5,
    color: '#EAB308', // Bright yellow
    seedCost: 75,
    xpGain: 90,
    description: 'Attire la pluie dorée et démultiplie la valeur des récoltes adjacentes.',
  },
  corn: {
    id: 'corn',
    name: 'Maïs Flamboyant',
    emoji: '🌽',
    baseValue: 400,
    growDurationMs: 5000,
    unlockedAtLevel: 6,
    color: '#84CC16', // Lime yellow
    seedCost: 150,
    xpGain: 160,
    description: 'Le joyau suprême des fermiers d’arcade. Explosion de pièces garantie.',
  },
};

export const COMBO_MULTIPLIERS = [
  { minChain: 1, mult: 1.0, title: 'Harvest' },
  { minChain: 3, mult: 1.5, title: 'Nice Chain!' },
  { minChain: 5, mult: 2.0, title: 'Great Combo!' },
  { minChain: 8, mult: 3.0, title: 'Super Rush!' },
  { minChain: 12, mult: 4.5, title: 'Mega Chain!!' },
  { minChain: 16, mult: 6.0, title: 'INSANE FEVER HARVEST!!!' },
];

export function getComboMultiplier(chainLength: number): { mult: number; title: string } {
  let result = COMBO_MULTIPLIERS[0];
  for (const step of COMBO_MULTIPLIERS) {
    if (chainLength >= step.minChain) {
      result = step;
    }
  }
  return result;
}

export const FEVER_DURATION_SECONDS = 12;
export const FEVER_CHARGE_PER_CROP = 4.5;
export const FEVER_CHARGE_BONUS_MONOCULTURE = 10;
