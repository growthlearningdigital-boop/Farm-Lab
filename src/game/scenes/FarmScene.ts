import Phaser from 'phaser';
import confetti from 'canvas-confetti';
import { 
  CropType, 
  TileData, 
  ToolType, 
  PlayerStats, 
  UpgradesState, 
  ActiveQuest, 
  WeatherType 
} from '../../types/game';
import { 
  ISO_TILE_WIDTH, 
  ISO_TILE_HEIGHT, 
  CROPS_CATALOG, 
  getComboMultiplier, 
  FEVER_DURATION_SECONDS, 
  FEVER_CHARGE_PER_CROP, 
  FEVER_CHARGE_BONUS_MONOCULTURE 
} from '../constants';
import { gridToScreen, screenToGrid } from '../math/isometric';
import { soundManager } from '../audio/synthAudio';
import { gameEvents, EVENTS } from '../events/eventBus';
import { ProceduralGameMasterEngine } from '../events/npcEvents';

interface VisualTile {
  data: TileData;
  baseSprite: Phaser.GameObjects.Sprite;
  cropSprite: Phaser.GameObjects.Sprite;
  pestSprite: Phaser.GameObjects.Sprite;
  hoverGlow: Phaser.GameObjects.Sprite;
  chainGlow: Phaser.GameObjects.Sprite;
  screenPos: { x: number; y: number };
}

export class FarmScene extends Phaser.Scene {
  // Grid parameters
  private gridSize: number = 6;
  private tiles: VisualTile[][] = [];
  private originX: number = 0;
  private originY: number = 0;

  // Player state
  private stats: PlayerStats = {
    coins: 150,
    score: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalHarvested: 0,
    highestCombo: 0,
    questsCompleted: 0,
  };

  private upgrades: UpgradesState = {
    scytheRadius: 1,
    waterPower: 1,
    fertilizerChance: 0.35,
    farmSize: 6,
    sprinklerDrone: false,
  };

  private selectedTool: ToolType = 'scythe';
  private selectedSeed: CropType = 'wheat';
  private unlockedCrops: CropType[] = ['wheat', 'carrot'];

  // Chain Swipe combo state
  private isDragging: boolean = false;
  private activeChain: VisualTile[] = [];
  private chainLineGraphics!: Phaser.GameObjects.Graphics;

  // Fever Mode
  private feverCharge: number = 0; // 0 to 100
  private isFeverActive: boolean = false;
  private feverTimer: number = 0;

  // Quests & Procedural Game Master
  private activeQuest: ActiveQuest | null = null;
  private gmEngine = new ProceduralGameMasterEngine();
  private nextEventCountdown: number = 25; // seconds until next NPC visit
  private activeWeather: WeatherType = 'sunny';

  // Event bus unsubscribers
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super({ key: 'FarmScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1c1917');
    this.chainLineGraphics = this.add.graphics();
    this.chainLineGraphics.setDepth(999);

    this.recalculateOrigin();
    this.createFarmGrid();
    this.setupInputHandlers();
    this.setupEventBus();

    // Initial sync to React
    this.broadcastStats();

    // Initial batch: plant starting crops so player can immediately swipe!
    this.seedInitialFarm();

    // Resize listener
    this.scale.on('resize', this.handleResize, this);
  }

  private recalculateOrigin() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.originX = width / 2;
    // Position diamond nicely centered with room for HUD
    this.originY = height * 0.28;
  }

  private handleResize() {
    this.recalculateOrigin();
    this.repositionGrid();
  }

  private createFarmGrid() {
    // Clear old tiles if any
    for (const row of this.tiles) {
      for (const t of row) {
        t.baseSprite.destroy();
        t.cropSprite.destroy();
        t.pestSprite.destroy();
        t.hoverGlow.destroy();
        t.chainGlow.destroy();
      }
    }
    this.tiles = [];

    for (let gx = 0; gx < this.gridSize; gx++) {
      this.tiles[gx] = [];
      for (let gy = 0; gy < this.gridSize; gy++) {
        const pos = gridToScreen(gx, gy, this.originX, this.originY);
        const depth = (gx + gy) * 10;

        // Base tile
        const baseSprite = this.add.sprite(pos.x, pos.y, 'tile_soil');
        baseSprite.setOrigin(0.5, 0);
        baseSprite.setDepth(depth);

        // Hover indicator
        const hoverGlow = this.add.sprite(pos.x, pos.y, 'tile_hover');
        hoverGlow.setOrigin(0.5, 0);
        hoverGlow.setDepth(depth + 1);
        hoverGlow.setVisible(false);

        // Chain selection indicator
        const chainGlow = this.add.sprite(pos.x, pos.y, 'tile_chain_selected');
        chainGlow.setOrigin(0.5, 0);
        chainGlow.setDepth(depth + 2);
        chainGlow.setVisible(false);

        // Crop sprite (offset slightly upward in isometric 2.5D space)
        const cropSprite = this.add.sprite(pos.x, pos.y - 8, 'crop_sprout');
        cropSprite.setOrigin(0.5, 0.85);
        cropSprite.setDepth(depth + 5);
        cropSprite.setVisible(false);

        // Pest sprite (mole/rabbit)
        const pestSprite = this.add.sprite(pos.x, pos.y - 12, 'pest_mole');
        pestSprite.setOrigin(0.5, 0.8);
        pestSprite.setDepth(depth + 8);
        pestSprite.setVisible(false);

        const data: TileData = {
          gx,
          gy,
          status: 'empty',
          growthProgress: 0,
          isWatered: false,
          hasPest: false,
          isGolden: false,
        };

        this.tiles[gx][gy] = {
          data,
          baseSprite,
          cropSprite,
          pestSprite,
          hoverGlow,
          chainGlow,
          screenPos: pos,
        };
      }
    }
  }

  private repositionGrid() {
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const pos = gridToScreen(gx, gy, this.originX, this.originY);
        const t = this.tiles[gx]?.[gy];
        if (t) {
          t.screenPos = pos;
          t.baseSprite.setPosition(pos.x, pos.y);
          t.hoverGlow.setPosition(pos.x, pos.y);
          t.chainGlow.setPosition(pos.x, pos.y);
          t.cropSprite.setPosition(pos.x, pos.y - 8);
          t.pestSprite.setPosition(pos.x, pos.y - 12);
        }
      }
    }
  }

  /**
   * Pre-populate the farm so that the user immediately has mature crops to swipe and chain!
   */
  private seedInitialFarm() {
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const tile = this.tiles[gx][gy];
        // Plant mostly wheat and carrots already mature or half-grown
        const cropType: CropType = (gx + gy) % 3 === 0 ? 'carrot' : 'wheat';
        this.plantCrop(tile, cropType);
        // Instant mature for immediate arcade gratification!
        tile.data.growthProgress = 1.0;
        tile.data.status = 'mature';
        this.updateTileVisuals(tile);
      }
    }
  }

  private setupInputHandlers() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      const coord = screenToGrid(pointer.x, pointer.y, this.originX, this.originY, this.gridSize);
      if (coord) {
        this.interactWithTile(this.tiles[coord.gx][coord.gy], true);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const coord = screenToGrid(pointer.x, pointer.y, this.originX, this.originY, this.gridSize);

      // Update hover visual
      for (let gx = 0; gx < this.gridSize; gx++) {
        for (let gy = 0; gy < this.gridSize; gy++) {
          const t = this.tiles[gx][gy];
          t.hoverGlow.setVisible(coord !== null && coord.gx === gx && coord.gy === gy && !t.chainGlow.visible);
        }
      }

      if (this.isDragging && coord) {
        const tile = this.tiles[coord.gx][coord.gy];
        this.interactWithTile(tile, false);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.finishHarvestChain();
    });

    // Right-click or extra escape to cancel drag
    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
      this.finishHarvestChain();
    });
  }

  /**
   * Immediate arcade action logic based on the currently selected tool
   */
  private interactWithTile(tile: VisualTile, isFirstClick: boolean) {
    const data = tile.data;

    // 0. Whack Pest if one exists on the tile!
    if (data.hasPest) {
      this.whackPest(tile);
      return;
    }

    switch (this.selectedTool) {
      case 'scythe': {
        // Scythe: Combos by dragging through mature or golden crops!
        if (data.status === 'mature' || data.status === 'golden') {
          // If already in active chain, ignore
          if (this.activeChain.includes(tile)) return;

          // Add to active chain
          this.activeChain.push(tile);
          tile.chainGlow.setVisible(true);

          // Audio: ascending pitch with each chain step
          soundManager.playComboStep(this.activeChain.length);

          // Floating mini combo marker
          this.showFloatingText(
            tile.screenPos.x,
            tile.screenPos.y - 20,
            `x${this.activeChain.length}`,
            '#f59e0b',
            16
          );

          // Emit progress to React HUD
          const mult = getComboMultiplier(this.activeChain.length);
          gameEvents.emit(EVENTS.COMBO_PROGRESS, {
            chainLength: this.activeChain.length,
            multiplier: mult.mult,
            title: mult.title,
            cropType: tile.data.crop,
          });

          // Draw the glowing connector lines
          this.renderChainBeam();
        }
        break;
      }

      case 'water': {
        // Instant Hydration: Waters the tile and provides immediate growth burst!
        if (!data.isWatered || data.status === 'growing') {
          data.isWatered = true;
          // Arcade instant progression: boost progress by 50% or instant bloom!
          const boost = this.upgrades.waterPower >= 2 ? 1.0 : 0.6;
          data.growthProgress = Math.min(1.0, data.growthProgress + boost);

          if (data.growthProgress >= 1.0 && data.crop) {
            data.status = data.isGolden ? 'golden' : 'mature';
          }

          soundManager.playWaterSwoosh();
          this.spawnWaterParticles(tile.screenPos.x, tile.screenPos.y + 12);
          this.updateTileVisuals(tile);

          // Small pulse tween
          this.tweens.add({
            targets: tile.cropSprite,
            scaleY: 1.25,
            scaleX: 1.15,
            duration: 120,
            yoyo: true,
          });
        }
        break;
      }

      case 'seed': {
        // Rapid Planting: sow seed immediately on empty plots as player drags across!
        if (data.status === 'empty') {
          const cropDef = CROPS_CATALOG[this.selectedSeed];
          if (this.stats.coins >= cropDef.seedCost || this.isFeverActive) {
            if (!this.isFeverActive && cropDef.seedCost > 0) {
              this.stats.coins -= cropDef.seedCost;
              this.broadcastStats();
            }

            this.plantCrop(tile, this.selectedSeed);
            soundManager.playSeedPlant();
            this.updateTileVisuals(tile);

            // Pop tween
            tile.cropSprite.setScale(0.2);
            this.tweens.add({
              targets: tile.cropSprite,
              scale: 1.0,
              duration: 160,
              ease: 'Back.easeOut',
            });
          } else if (isFirstClick) {
            this.showFloatingText(
              tile.screenPos.x,
              tile.screenPos.y - 15,
              'Pas assez de pièces !',
              '#ef4444',
              14
            );
          }
        }
        break;
      }

      case 'fertilizer': {
        // Alchemical Fertilizer: Can turn growing or mature crops into Golden crops!
        if ((data.status === 'growing' || data.status === 'mature') && !data.isGolden) {
          const cost = 20;
          if (this.stats.coins >= cost) {
            this.stats.coins -= cost;
            this.broadcastStats();

            soundManager.playFertilizerChime();
            const lucky = Math.random() < this.upgrades.fertilizerChance;
            if (lucky || this.isFeverActive) {
              data.isGolden = true;
              if (data.status === 'mature') data.status = 'golden';
              this.showFloatingText(
                tile.screenPos.x,
                tile.screenPos.y - 25,
                '✨ DORÉ (+400%) !',
                '#facc15',
                18
              );
              this.spawnSparkleParticles(tile.screenPos.x, tile.screenPos.y);
            } else {
              // Even if not golden, gives instant maturity!
              data.growthProgress = 1.0;
              data.status = 'mature';
              this.showFloatingText(
                tile.screenPos.x,
                tile.screenPos.y - 15,
                'Pousse Instantanée !',
                '#38bdf8',
                14
              );
            }
            this.updateTileVisuals(tile);
          } else if (isFirstClick) {
            this.showFloatingText(
              tile.screenPos.x,
              tile.screenPos.y - 15,
              '20 pièces requises',
              '#ef4444',
              14
            );
          }
        }
        break;
      }
    }
  }

  /**
   * Finalize the drag harvest combo chain
   */
  private finishHarvestChain() {
    this.chainLineGraphics.clear();

    const chainLength = this.activeChain.length;
    if (chainLength === 0) return;

    const firstCrop = this.activeChain[0].data.crop;
    let isMonoculture = true;
    let rawCoins = 0;
    let rawScore = 0;
    let rawXp = 0;

    // Check monoculture and calculate harvest values
    for (const tile of this.activeChain) {
      const crop = tile.data.crop || 'wheat';
      if (crop !== firstCrop) {
        isMonoculture = false;
      }
      const def = CROPS_CATALOG[crop];
      let tileValue = def.baseValue;
      if (tile.data.isGolden) {
        tileValue *= 5; // Golden multiplier!
      }
      rawCoins += tileValue;
      rawScore += tileValue * 15;
      rawXp += def.xpGain;
    }

    const { mult, title } = getComboMultiplier(chainLength);
    let finalMultiplier = mult;

    // Monoculture synergy bonus: +50%
    if (isMonoculture && chainLength >= 3) {
      finalMultiplier *= 1.5;
    }

    // Fever Mode bonus: 2x multiplier
    if (this.isFeverActive) {
      finalMultiplier *= 2.0;
    }

    const earnedCoins = Math.round(rawCoins * finalMultiplier);
    const earnedScore = Math.round(rawScore * finalMultiplier);
    const earnedXp = Math.round(rawXp * (this.isFeverActive ? 2 : 1));

    // Update stats
    this.stats.coins += earnedCoins;
    this.stats.score += earnedScore;
    this.stats.totalHarvested += chainLength;
    if (chainLength > this.stats.highestCombo) {
      this.stats.highestCombo = chainLength;
    }
    this.addXp(earnedXp);

    // Audio reward
    soundManager.playHarvestBurst(chainLength);

    // Fever Gauge filling
    let feverChargeGain = chainLength * FEVER_CHARGE_PER_CROP;
    if (isMonoculture && chainLength >= 3) {
      feverChargeGain += FEVER_CHARGE_BONUS_MONOCULTURE;
    }
    this.addFeverCharge(feverChargeGain);

    // Visual burst on each tile harvested & reset tile to empty
    for (const tile of this.activeChain) {
      tile.chainGlow.setVisible(false);
      this.spawnSparkleParticles(tile.screenPos.x, tile.screenPos.y);

      // Reset tile
      const harvestedCrop = tile.data.crop;
      const wasGolden = tile.data.isGolden;

      tile.data.status = 'empty';
      tile.data.crop = undefined;
      tile.data.growthProgress = 0;
      tile.data.isWatered = false;
      tile.data.isGolden = false;
      this.updateTileVisuals(tile);

      // Quest tracking
      this.trackQuestProgress(harvestedCrop, wasGolden, chainLength);

      // In Fever mode: instant re-sprout of random high value seeds!
      if (this.isFeverActive) {
        this.time.delayedCall(150, () => {
          this.plantCrop(tile, this.selectedSeed);
          tile.data.growthProgress = 1.0;
          tile.data.status = Math.random() < 0.35 ? 'golden' : 'mature';
          this.updateTileVisuals(tile);
        });
      }
    }

    // Big Arcade Floating Banner above the center of the harvest
    const midTile = this.activeChain[Math.floor(chainLength / 2)];
    const midPos = midTile ? midTile.screenPos : { x: this.scale.width / 2, y: this.scale.height / 2 };

    const comboLabel = isMonoculture && chainLength >= 3 
      ? `💎 SYNERGIE x${chainLength}! +${earnedCoins}🪙`
      : `${title} x${chainLength}! +${earnedCoins}🪙`;

    this.showFloatingText(midPos.x, midPos.y - 40, comboLabel, '#fbbf24', 22);

    // Confetti if nice chain!
    if (chainLength >= 6) {
      confetti({
        particleCount: Math.min(25 + chainLength * 6, 120),
        spread: 60,
        origin: { x: midPos.x / this.scale.width, y: midPos.y / this.scale.height },
      });
    }

    // Clear active chain
    this.activeChain = [];

    // Notify React
    gameEvents.emit(EVENTS.COMBO_RELEASED, {
      chainLength,
      earnedCoins,
      earnedScore,
      earnedXp,
      multiplier: finalMultiplier,
    });
    this.broadcastStats();
  }

  /**
   * Draw continuous glowing energy beam connecting chained tiles
   */
  private renderChainBeam() {
    this.chainLineGraphics.clear();
    if (this.activeChain.length < 2) return;

    // Glowing thick outline
    this.chainLineGraphics.lineStyle(6, 0xf59e0b, 0.4);
    this.chainLineGraphics.beginPath();
    this.chainLineGraphics.moveTo(this.activeChain[0].screenPos.x, this.activeChain[0].screenPos.y + 10);

    for (let i = 1; i < this.activeChain.length; i++) {
      this.chainLineGraphics.lineTo(this.activeChain[i].screenPos.x, this.activeChain[i].screenPos.y + 10);
    }
    this.chainLineGraphics.strokePath();

    // Bright core inner beam
    this.chainLineGraphics.lineStyle(3, 0xffffff, 0.9);
    this.chainLineGraphics.beginPath();
    this.chainLineGraphics.moveTo(this.activeChain[0].screenPos.x, this.activeChain[0].screenPos.y + 10);

    for (let i = 1; i < this.activeChain.length; i++) {
      this.chainLineGraphics.lineTo(this.activeChain[i].screenPos.x, this.activeChain[i].screenPos.y + 10);
    }
    this.chainLineGraphics.strokePath();
  }

  /**
   * Plant a crop in a tile
   */
  private plantCrop(tile: VisualTile, crop: CropType) {
    tile.data.crop = crop;
    tile.data.status = 'growing';
    tile.data.growthProgress = 0.05;
    tile.data.isGolden = false;
  }

  /**
   * Whack a pest (mole / rabbit) popping up on the farm
   */
  private whackPest(tile: VisualTile) {
    tile.data.hasPest = false;
    tile.pestSprite.setVisible(false);

    soundManager.playPestWhack();

    // Reward for whacking pest
    const bonusCoins = 40 + this.stats.level * 15;
    this.stats.coins += bonusCoins;
    this.broadcastStats();

    this.showFloatingText(
      tile.screenPos.x,
      tile.screenPos.y - 30,
      `💥 BONK! +${bonusCoins}🪙`,
      '#f43f5e',
      20
    );

    this.spawnSparkleParticles(tile.screenPos.x, tile.screenPos.y);
  }

  /**
   * Update visual sprites according to tile status
   */
  private updateTileVisuals(tile: VisualTile) {
    const data = tile.data;

    // 1. Base tile texture
    if (data.isGolden) {
      tile.baseSprite.setTexture('tile_golden');
    } else if (data.isWatered) {
      tile.baseSprite.setTexture('tile_watered');
    } else {
      tile.baseSprite.setTexture('tile_soil');
    }

    // 2. Crop sprite
    if (data.status === 'empty' || !data.crop) {
      tile.cropSprite.setVisible(false);
    } else {
      tile.cropSprite.setVisible(true);

      if (data.growthProgress < 0.6) {
        tile.cropSprite.setTexture('crop_sprout');
        tile.cropSprite.setScale(0.7 + data.growthProgress * 0.5);
      } else {
        tile.cropSprite.setTexture(`crop_${data.crop}`);
        tile.cropSprite.setScale(1.0);
      }

      // Golden tint / effect
      if (data.isGolden) {
        tile.cropSprite.setTint(0xffea00);
      } else {
        tile.cropSprite.clearTint();
      }
    }

    // 3. Pest
    tile.pestSprite.setVisible(data.hasPest);
  }

  /**
   * Add XP & handle level progression
   */
  private addXp(amount: number) {
    this.stats.xp += amount;
    while (this.stats.xp >= this.stats.xpToNextLevel) {
      this.stats.xp -= this.stats.xpToNextLevel;
      this.stats.level += 1;
      this.stats.xpToNextLevel = Math.round(this.stats.xpToNextLevel * 1.5);

      // Level up bonuses
      this.checkUnlocksForLevel(this.stats.level);

      this.showFloatingText(
        this.scale.width / 2,
        this.scale.height * 0.35,
        `⭐ NIVEAU ${this.stats.level} ATTEINT !`,
        '#38bdf8',
        28
      );
      confetti({ particleCount: 80, spread: 70 });
    }
  }

  private checkUnlocksForLevel(lvl: number) {
    for (const [key, cropDef] of Object.entries(CROPS_CATALOG)) {
      const type = key as CropType;
      if (cropDef.unlockedAtLevel <= lvl && !this.unlockedCrops.includes(type)) {
        this.unlockedCrops.push(type);
        this.showFloatingText(
          this.scale.width / 2,
          this.scale.height * 0.45,
          `🌱 NOUVELLE CULTURE DÉBLOQUÉE: ${cropDef.emoji} ${cropDef.name}!`,
          '#4ade80',
          20
        );
      }
    }
  }

  /**
   * Fever Gauge management
   */
  private addFeverCharge(amount: number) {
    if (this.isFeverActive) return;

    this.feverCharge = Math.min(100, this.feverCharge + amount);
    if (this.feverCharge >= 100) {
      this.triggerFeverMode();
    }
    gameEvents.emit(EVENTS.FEVER_STATE_CHANGED, {
      charge: this.feverCharge,
      isActive: this.isFeverActive,
      remaining: this.feverTimer,
    });
  }

  private triggerFeverMode() {
    this.isFeverActive = true;
    this.feverCharge = 100;
    this.feverTimer = FEVER_DURATION_SECONDS;

    soundManager.playFeverFanfare();
    confetti({ particleCount: 150, spread: 100 });

    this.showFloatingText(
      this.scale.width / 2,
      this.scale.height * 0.3,
      '🔥 MODE FRÉNÉSIE ACTIVÉ (12s) ! 🔥',
      '#ef4444',
      32
    );

    // Turn all current crops into mature crops instantly!
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const t = this.tiles[gx][gy];
        if (t.data.status === 'empty') {
          this.plantCrop(t, this.selectedSeed);
        }
        t.data.growthProgress = 1.0;
        t.data.status = Math.random() < 0.4 ? 'golden' : 'mature';
        this.updateTileVisuals(t);
      }
    }

    gameEvents.emit(EVENTS.FEVER_STATE_CHANGED, {
      charge: 100,
      isActive: true,
      remaining: this.feverTimer,
    });
  }

  /**
   * Main game loop update
   */
  update(time: number, delta: number) {
    const dtSeconds = delta / 1000;

    // 1. Natural fast growth progression (Arcade snappy, non-blocking!)
    // Note: Crops grow in a few seconds, even faster if watered or in Fever!
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const t = this.tiles[gx][gy];
        if (t.data.status === 'growing' && t.data.crop) {
          const cropDef = CROPS_CATALOG[t.data.crop];
          let speedFactor = 1.0;
          if (t.data.isWatered) speedFactor *= 2.2;
          if (this.isFeverActive) speedFactor *= 4.0;
          if (this.activeWeather === 'rain') speedFactor *= 2.0;

          const progressDelta = (delta / cropDef.growDurationMs) * speedFactor;
          t.data.growthProgress += progressDelta;

          if (t.data.growthProgress >= 1.0) {
            t.data.growthProgress = 1.0;
            t.data.status = t.data.isGolden ? 'golden' : 'mature';
            // Subtle bounce on maturity
            this.tweens.add({
              targets: t.cropSprite,
              scaleY: 1.2,
              duration: 100,
              yoyo: true,
            });
          }
          this.updateTileVisuals(t);
        }
      }
    }

    // 2. Fever Mode timer countdown
    if (this.isFeverActive) {
      this.feverTimer -= dtSeconds;
      if (this.feverTimer <= 0) {
        this.isFeverActive = false;
        this.feverCharge = 0;
        this.feverTimer = 0;
        this.showFloatingText(
          this.scale.width / 2,
          this.scale.height * 0.35,
          'Fin de la Frénésie',
          '#f59e0b',
          20
        );
      }
      gameEvents.emit(EVENTS.FEVER_STATE_CHANGED, {
        charge: this.feverCharge,
        isActive: this.isFeverActive,
        remaining: Math.ceil(this.feverTimer),
      });
    }

    // 3. Procedural Event Timer & Game Master ticks
    this.nextEventCountdown -= dtSeconds;
    if (this.nextEventCountdown <= 0) {
      this.nextEventCountdown = 30 + Math.random() * 20;
      this.triggerProceduralEvent();
    }

    // 4. Random Pest Spawn (Mole / Rabbit)
    if (Math.random() < 0.003) {
      this.spawnRandomPest();
    }

    // 5. Sprinkler Drone upgrade pulse
    if (this.upgrades.sprinklerDrone && Math.random() < 0.015) {
      this.triggerSprinklerDronePulse();
    }

    // 6. Active Quest countdown
    if (this.activeQuest && this.activeQuest.event.requirements.timeLimitSeconds) {
      const elapsed = (Date.now() - this.activeQuest.startedAt) / 1000;
      const remaining = Math.max(0, this.activeQuest.event.requirements.timeLimitSeconds - elapsed);
      this.activeQuest.timeRemaining = Math.ceil(remaining);

      if (remaining <= 0) {
        // Quest timed out!
        this.showFloatingText(
          this.scale.width / 2,
          this.scale.height * 0.4,
          '⌛ Temps écoulé pour la mission PNJ !',
          '#ef4444',
          20
        );
        this.activeQuest = null;
        gameEvents.emit(EVENTS.ACTIVE_QUEST_UPDATED, null);
      } else {
        gameEvents.emit(EVENTS.ACTIVE_QUEST_UPDATED, this.activeQuest);
      }
    }
  }

  private triggerProceduralEvent() {
    if (this.activeQuest) return; // Wait until current quest completes

    const event = this.gmEngine.generateEvent(this.stats, this.unlockedCrops);
    gameEvents.emit(EVENTS.NPC_EVENT_TRIGGERED, event);
  }

  private spawnRandomPest() {
    const emptyTiles: VisualTile[] = [];
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const t = this.tiles[gx][gy];
        if (!t.data.hasPest) {
          emptyTiles.push(t);
        }
      }
    }

    if (emptyTiles.length > 0) {
      const luckyTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
      luckyTile.data.hasPest = true;
      luckyTile.pestSprite.setVisible(true);

      // Cute pop animation
      luckyTile.pestSprite.setScale(0.2);
      this.tweens.add({
        targets: luckyTile.pestSprite,
        scale: 1.0,
        duration: 250,
        ease: 'Back.easeOut',
      });
    }
  }

  private triggerSprinklerDronePulse() {
    // Water a random 2x2 cluster
    const rx = Math.floor(Math.random() * (this.gridSize - 1));
    const ry = Math.floor(Math.random() * (this.gridSize - 1));

    for (let dx = 0; dx <= 1; dx++) {
      for (let dy = 0; dy <= 1; dy++) {
        const t = this.tiles[rx + dx]?.[ry + dy];
        if (t) {
          t.data.isWatered = true;
          t.data.growthProgress = Math.min(1.0, t.data.growthProgress + 0.4);
          this.updateTileVisuals(t);
        }
      }
    }
    soundManager.playWaterSwoosh();
  }

  /**
   * Track quest progress when harvesting
   */
  private trackQuestProgress(cropType?: CropType, isGolden?: boolean, comboLength?: number) {
    if (!this.activeQuest) return;

    const req = this.activeQuest.event.requirements;
    const type = this.activeQuest.event.questType;

    let progressed = false;

    if (type === 'harvest_combo' && comboLength && req.comboMin) {
      if (comboLength >= req.comboMin) {
        this.activeQuest.currentProgress = req.comboMin;
        progressed = true;
      }
    } else if (type === 'deliver_crop' && req.cropType && req.amount) {
      if (cropType === req.cropType) {
        this.activeQuest.currentProgress += 1;
        progressed = true;
      }
    } else if (type === 'speed_challenge' && req.amount) {
      this.activeQuest.currentProgress += 1;
      progressed = true;
    } else if (type === 'golden_harvest' && isGolden && req.amount) {
      this.activeQuest.currentProgress += 1;
      progressed = true;
    }

    if (progressed) {
      gameEvents.emit(EVENTS.ACTIVE_QUEST_UPDATED, this.activeQuest);

      if (this.activeQuest.currentProgress >= this.activeQuest.targetProgress) {
        this.completeActiveQuest();
      }
    }
  }

  private completeActiveQuest() {
    if (!this.activeQuest) return;

    const rewards = this.activeQuest.event.rewards;
    this.stats.coins += rewards.coins;
    this.stats.score += rewards.score;
    this.stats.questsCompleted += 1;
    this.addXp(rewards.xp);

    soundManager.playLevelUp();
    confetti({ particleCount: 120, spread: 80 });

    this.showFloatingText(
      this.scale.width / 2,
      this.scale.height * 0.35,
      `🎉 MISSION PNJ RÉUSSIE ! +${rewards.coins}🪙`,
      '#4ade80',
      24
    );

    // Apply buff if any
    if (rewards.buff) {
      this.showFloatingText(
        this.scale.width / 2,
        this.scale.height * 0.45,
        `⚡ BUFF ACTIF: ${rewards.buff.name}`,
        '#facc15',
        18
      );
    }

    this.activeQuest = null;
    gameEvents.emit(EVENTS.ACTIVE_QUEST_UPDATED, null);
    this.broadcastStats();
  }

  /**
   * Floating Arcade Text (Numbers and Combo Banners)
   */
  private showFloatingText(
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    fontSize: number = 16
  ) {
    const txt = this.add.text(x, y, text, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: `${fontSize}px`,
      color: color,
      stroke: '#000000',
      strokeThickness: 3.5,
    });
    txt.setOrigin(0.5, 0.5);
    txt.setDepth(1000);

    this.tweens.add({
      targets: txt,
      y: y - 45,
      alpha: 0,
      scale: 1.1,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        txt.destroy();
      },
    });
  }

  private spawnSparkleParticles(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const p = this.add.sprite(
        x + (Math.random() - 0.5) * 30,
        y + (Math.random() - 0.5) * 20,
        'particle_sparkle'
      );
      p.setDepth(900);
      p.setScale(0.8 + Math.random() * 0.6);

      this.tweens.add({
        targets: p,
        y: p.y - 25 - Math.random() * 20,
        alpha: 0,
        scale: 0.1,
        duration: 600,
        onComplete: () => p.destroy(),
      });
    }
  }

  private spawnWaterParticles(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.sprite(
        x + (Math.random() - 0.5) * 25,
        y + (Math.random() - 0.5) * 15,
        'particle_water'
      );
      p.setDepth(900);
      p.setScale(0.8);

      this.tweens.add({
        targets: p,
        y: p.y - 15,
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  private broadcastStats() {
    gameEvents.emit(EVENTS.STATS_UPDATED, {
      stats: { ...this.stats },
      upgrades: { ...this.upgrades },
      unlockedCrops: [...this.unlockedCrops],
      selectedTool: this.selectedTool,
      selectedSeed: this.selectedSeed,
      gridSize: this.gridSize,
      activeWeather: this.activeWeather,
    });
  }

  private setupEventBus() {
    // Tool selected from React HUD
    this.unsubscribers.push(
      gameEvents.on(EVENTS.TOOL_SELECTED, (tool: ToolType) => {
        this.selectedTool = tool;
        this.broadcastStats();
      })
    );

    // Seed selected from React HUD
    this.unsubscribers.push(
      gameEvents.on(EVENTS.SEED_SELECTED, (seed: CropType) => {
        this.selectedSeed = seed;
        this.broadcastStats();
      })
    );

    // Upgrade applied from shop
    this.unsubscribers.push(
      gameEvents.on(EVENTS.UPGRADE_APPLIED, (newUpgrades: UpgradesState) => {
        const oldSize = this.gridSize;
        this.upgrades = { ...newUpgrades };
        this.gridSize = this.upgrades.farmSize;

        if (this.gridSize !== oldSize) {
          this.createFarmGrid();
          this.seedInitialFarm();
        }
        this.broadcastStats();
      })
    );

    // Force trigger event from Game Master inspector
    this.unsubscribers.push(
      gameEvents.on(EVENTS.FORCE_TRIGGER_EVENT, (customEvent) => {
        if (customEvent) {
          gameEvents.emit(EVENTS.NPC_EVENT_TRIGGERED, customEvent);
        } else {
          this.triggerProceduralEvent();
        }
      })
    );

    // When an event choice is accepted in UI
    this.unsubscribers.push(
      gameEvents.on('quest:accept', (evt) => {
        let target = 1;
        if (evt.questType === 'harvest_combo') target = evt.requirements.comboMin || 5;
        if (evt.questType === 'deliver_crop') target = evt.requirements.amount || 10;
        if (evt.questType === 'speed_challenge') target = evt.requirements.amount || 15;
        if (evt.questType === 'golden_harvest') target = evt.requirements.amount || 2;
        if (evt.questType === 'fever_trigger') target = 1;

        this.activeQuest = {
          event: evt,
          currentProgress: 0,
          targetProgress: target,
          timeRemaining: evt.requirements.timeLimitSeconds,
          startedAt: Date.now(),
        };

        gameEvents.emit(EVENTS.ACTIVE_QUEST_UPDATED, this.activeQuest);
      })
    );
  }

  shutdown() {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
  }
}
