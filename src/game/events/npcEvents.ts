import { NPCEvent, QuestType, CropType, NPCPersonality, PlayerStats } from '../../types/game';
import { CROPS_CATALOG } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * Archétypes PNJ prédéfinis pour le Game Master procédural
 */
export const NPC_ROSTER = [
  {
    name: 'Barnabé le Marchand',
    title: 'Négociant Itinérant de la Guilde d’Or',
    avatar: '🎩',
    personality: 'greedy' as NPCPersonality,
    phrases: [
      'Mes caravanes partent pour la capitale dans une minute ! J’ai besoin de volume !',
      'Le temps, c’est de l’or, fermier ! Un gros combo ou mes bourses iront ailleurs !',
      'Si tu m’alignes une récolte d’élite, je te promets une commission royale.',
    ],
  },
  {
    name: 'Dame Chouquette',
    title: 'Cheffe Étoilée de la Taverne du Soleil',
    avatar: '👩‍🍳',
    personality: 'cheerful' as NPCPersonality,
    phrases: [
      'Le banquet ducal commence tout de suite et ma marmite est vide ! Au travail !',
      'Une tarte magique nécessite les baies les plus fraîches cueillies d’un seul geste !',
      'Montre-moi tes talents de coupeur à la faux, la fête n’attend pas !',
    ],
  },
  {
    name: 'Maître Sylvestre',
    title: 'Archimiste Végétal de la Forêt Émeraude',
    avatar: '🧙‍♂️',
    personality: 'mystic' as NPCPersonality,
    phrases: [
      'Les flux telluriques s’alignent. Déclenche une Frénésie pour décupler l’éther !',
      'J’ai besoin de récoltes imprégnées d’énergie cinétique pure pour ma potion astrale.',
      'Une récolte enchaînée sans interruption condensera l’essence dorée du sol.',
    ],
  },
  {
    name: 'Chambellan Boros',
    title: 'Intendant Rigide de la Cour Impériale',
    avatar: '🧐',
    personality: 'grumpy' as NPCPersonality,
    phrases: [
      'Sa Majesté n’accepte que la perfection géométrique. Montrez-moi une vraie chaîne !',
      'Votre rythme agricole est-il à la hauteur du protocole impérial ? Prouvez-le.',
      'Le rapport de trésorerie exige une démonstration d’efficacité absolue.',
    ],
  },
  {
    name: 'Léonard l’Inventeur',
    title: 'Pionnier des Mécanismes Hydriques',
    avatar: '🛠️',
    personality: 'alchemist' as NPCPersonality,
    phrases: [
      'Mes drones d’arrosage ont besoin de biocarburant ultra-rapide pour calibrer leurs hélices !',
      'Faisons un test de vélocité de récolte ! Glisse ta faux aussi vite que l’éclair !',
      'Eurêka ! La synergie des plantes permet une réaction d’accélération thermique !',
    ],
  },
];

/**
 * Moteur Procédural Local : Génère des événements PNJ équilibrés et dynamiques
 * sans aucun temps mort, directement orientés combos arcade.
 */
export class ProceduralGameMasterEngine {
  private eventCounter = 1;

  public generateEvent(stats: PlayerStats, unlockedCrops: CropType[]): NPCEvent {
    const npcTemplate = NPC_ROSTER[Math.floor(Math.random() * NPC_ROSTER.length)];
    const id = `evt_${Date.now()}_${this.eventCounter++}`;

    const questTypes: QuestType[] = ['harvest_combo', 'deliver_crop', 'speed_challenge'];
    if (stats.level >= 2) questTypes.push('fever_trigger');
    if (stats.level >= 3) questTypes.push('golden_harvest');

    const chosenQuestType = questTypes[Math.floor(Math.random() * questTypes.length)];
    const chosenCrop = unlockedCrops[Math.floor(Math.random() * unlockedCrops.length)];
    const cropDef = CROPS_CATALOG[chosenCrop];

    let dialogue = npcTemplate.phrases[Math.floor(Math.random() * npcTemplate.phrases.length)];
    let req: NPCEvent['requirements'] = {};
    let rewards: NPCEvent['rewards'] = {
      coins: 100,
      score: 500,
      xp: 40,
      reputation: 1,
    };

    switch (chosenQuestType) {
      case 'harvest_combo': {
        const comboTarget = Math.min(4 + Math.floor(stats.level * 1.5), 14);
        req = {
          comboMin: comboTarget,
          timeLimitSeconds: 40,
        };
        dialogue = `« ${dialogue} Réalise un combo continu d'au moins ${comboTarget} récoltes d'un seul trait ! »`;
        rewards.coins = Math.round(comboTarget * 35 * (1 + stats.level * 0.2));
        rewards.score = comboTarget * 180;
        rewards.buff = {
          type: 'combo_booster',
          name: 'Afflux Cinétique (+50% Combo)',
          durationSeconds: 25,
          description: 'Multiplicateurs de combo augmentés de 50% !',
        };
        break;
      }

      case 'deliver_crop': {
        const amount = Math.min(6 + stats.level * 3, 30);
        req = {
          cropType: chosenCrop,
          amount: amount,
          timeLimitSeconds: 45,
        };
        dialogue = `« Urgent ! J’ai absolument besoin de ${amount}x ${cropDef.emoji} ${cropDef.name} fraîchement récoltés ! »`;
        rewards.coins = Math.round(amount * cropDef.baseValue * 2.2);
        rewards.score = amount * 120;
        rewards.xp = Math.round(amount * cropDef.xpGain * 1.5);
        rewards.buff = {
          type: 'instant_grow',
          name: 'Bénédiction de Flora',
          durationSeconds: 20,
          description: 'Les cultures poussent deux fois plus vite !',
        };
        break;
      }

      case 'speed_challenge': {
        const targetAmount = 12 + stats.level * 2;
        const timeLimit = 25;
        req = {
          amount: targetAmount,
          timeLimitSeconds: timeLimit,
        };
        dialogue = `« Épreuve de vitesse extrême ! Récolte ${targetAmount} cultures quelconques en moins de ${timeLimit} secondes ! »`;
        rewards.coins = Math.round(targetAmount * 30);
        rewards.score = targetAmount * 150;
        rewards.buff = {
          type: 'gold_frenzy',
          name: 'Ruée vers l’Or',
          durationSeconds: 20,
          description: '+30% de chances de faire pousser des cultures dorées !',
        };
        break;
      }

      case 'fever_trigger': {
        req = {
          timeLimitSeconds: 35,
        };
        dialogue = `« L'ambiance est trop calme ! Remplis la jauge et déclenche le Mode Frénésie pour embraser la plaine ! »`;
        rewards.coins = 250 + stats.level * 50;
        rewards.score = 2500;
        rewards.buff = {
          type: 'double_xp',
          name: 'Éveil Magistral',
          durationSeconds: 30,
          description: 'Double XP sur toutes les récoltes !',
        };
        break;
      }

      case 'golden_harvest': {
        req = {
          amount: 2,
          timeLimitSeconds: 45,
        };
        dialogue = `« Les légendes parlent de pousses alchimiques dorées. Récolte 2 cultures dorées pour mon laboratoire ! »`;
        rewards.coins = 400 + stats.level * 80;
        rewards.score = 3000;
        break;
      }
    }

    return {
      id,
      npcName: npcTemplate.name,
      npcTitle: npcTemplate.title,
      avatar: npcTemplate.avatar,
      personality: npcTemplate.personality,
      dialogue,
      questType: chosenQuestType,
      requirements: req,
      rewards,
      choices: [
        {
          id: 'accept',
          text: 'Défi accepté ! En route !',
          response: 'Parfait ! Montrez-moi ce que vous avez dans le ventre !',
          isAccept: true,
        },
        {
          id: 'negotiate',
          text: 'Et si on doublait la mise ?',
          response: 'Haha, j’aime votre audace ! Accordé si vous terminez dans les temps !',
          isAccept: true,
        },
        {
          id: 'decline',
          text: 'Pas le temps, mes champs m’attendent.',
          response: 'Quel dommage... Une opportunité manquée.',
          isAccept: false,
        },
      ],
      expiresInSeconds: 60,
    };
  }
}

/**
 * Passerelle d'intégration IA : Génère un événement dynamique via Gemini API si configuré.
 */
export async function generateAIGameMasterEvent(
  stats: PlayerStats,
  unlockedCrops: CropType[]
): Promise<NPCEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.info('GEMINI_API_KEY non détectée; utilisation du Game Master procédural instantané.');
    const localGM = new ProceduralGameMasterEngine();
    return localGM.generateEvent(stats, unlockedCrops);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const unlockedCropDetails = unlockedCrops
      .map((c) => `${CROPS_CATALOG[c].name} (${c}, valeur: ${CROPS_CATALOG[c].baseValue})`)
      .join(', ');

    const prompt = `Génère un événement d'arcade agricole immersif au format JSON strict pour un jeu de ferme isométrique rapide.
Contexte du joueur:
- Niveau: ${stats.level}
- Pièces: ${stats.coins}
- Plus long combo: ${stats.highestCombo}
- Légumes débloqués: ${unlockedCropDetails}

Instructions de conception:
- L'événement doit être énergique, direct et sans attente passive (repose sur le swipe combo, la vitesse ou la frénésie).
- Ton PNJ doit avoir un titre amusant, une personnalité marquée (marchand pressé, alchimiste exalté, noble exigeant, cuisinier paniqué).
- Fournis un dialogue court et savoureux en français.
- Type de quête parmi: 'harvest_combo', 'deliver_crop', 'speed_challenge', 'fever_trigger'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            npcName: { type: Type.STRING },
            npcTitle: { type: Type.STRING },
            avatar: { type: Type.STRING },
            personality: { 
              type: Type.STRING, 
              enum: ['greedy', 'mystic', 'cheerful', 'grumpy', 'alchemist', 'royalty'] 
            },
            dialogue: { type: Type.STRING },
            questType: { 
              type: Type.STRING, 
              enum: ['harvest_combo', 'deliver_crop', 'speed_challenge', 'fever_trigger'] 
            },
            requirements: {
              type: Type.OBJECT,
              properties: {
                cropType: { type: Type.STRING },
                amount: { type: Type.INTEGER },
                comboMin: { type: Type.INTEGER },
                timeLimitSeconds: { type: Type.INTEGER },
              },
            },
            rewards: {
              type: Type.OBJECT,
              properties: {
                coins: { type: Type.INTEGER },
                score: { type: Type.INTEGER },
                xp: { type: Type.INTEGER },
                reputation: { type: Type.INTEGER },
              },
              required: ['coins', 'score', 'xp', 'reputation'],
            },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  response: { type: Type.STRING },
                  isAccept: { type: Type.BOOLEAN },
                },
                required: ['id', 'text', 'response'],
              },
            },
          },
          required: [
            'npcName',
            'npcTitle',
            'avatar',
            'personality',
            'dialogue',
            'questType',
            'requirements',
            'rewards',
            'choices',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}') as NPCEvent;
    parsed.id = `ai_evt_${Date.now()}`;
    parsed.expiresInSeconds = 60;
    return parsed;
  } catch (error) {
    console.warn('Erreur lors de l’appel Gemini pour le Game Master, repli procédural:', error);
    const localGM = new ProceduralGameMasterEngine();
    return localGM.generateEvent(stats, unlockedCrops);
  }
}
