import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../constants';
import { CropType } from '../../types/game';

/**
 * Procedural texture generator using HTML5 Canvas.
 * Generates crisp 2.5D isometric tiles, crops, pests and particle graphics directly into Phaser's TextureManager.
 */
export function generateProceduralTextures(textures: Phaser.Textures.TextureManager) {
  const w = ISO_TILE_WIDTH;
  const h = ISO_TILE_HEIGHT;
  const tileDepth = 14;

  // 1. Base Soil Tile
  createCanvasTexture(textures, 'tile_soil', w, h + tileDepth, (ctx) => {
    // Top isometric diamond
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fillStyle = '#654321';
    ctx.fill();

    // Furrow stripes on top
    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.35);
    ctx.lineTo(w * 0.7, h * 0.65);
    ctx.moveTo(w * 0.45, h * 0.22);
    ctx.lineTo(w * 0.8, h * 0.5);
    ctx.moveTo(w * 0.2, h * 0.5);
    ctx.lineTo(w * 0.55, h * 0.78);
    ctx.stroke();

    // Top border outline
    ctx.strokeStyle = '#3d2511';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left isometric vertical side
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(w / 2, h + tileDepth);
    ctx.lineTo(0, h / 2 + tileDepth);
    ctx.closePath();
    ctx.fillStyle = '#3a200e';
    ctx.fill();

    // Right isometric vertical side
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w, h / 2 + tileDepth);
    ctx.lineTo(w / 2, h + tileDepth);
    ctx.closePath();
    ctx.fillStyle = '#2a1608';
    ctx.fill();
  });

  // 2. Watered Soil Tile
  createCanvasTexture(textures, 'tile_watered', w, h + tileDepth, (ctx) => {
    // Top isometric diamond
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fillStyle = '#334155'; // moist wet dark blue-slate
    ctx.fill();

    // Moist gleam
    ctx.fillStyle = '#0284c7';
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Water gleam accents
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w * 0.4, h * 0.4, 4, 2);
    ctx.fillRect(w * 0.6, h * 0.3, 3, 2);
    ctx.fillRect(w * 0.3, h * 0.6, 3, 2);

    // Left side
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(w / 2, h + tileDepth);
    ctx.lineTo(0, h / 2 + tileDepth);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Right side
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w, h / 2 + tileDepth);
    ctx.lineTo(w / 2, h + tileDepth);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  });

  // 3. Golden Soil Tile (Fever or Alchemical)
  createCanvasTexture(textures, 'tile_golden', w, h + tileDepth, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#eab308');
    grad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sides
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(w / 2, h + tileDepth);
    ctx.lineTo(0, h / 2 + tileDepth);
    ctx.closePath();
    ctx.fillStyle = '#a16207';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w, h / 2 + tileDepth);
    ctx.lineTo(w / 2, h + tileDepth);
    ctx.closePath();
    ctx.fillStyle = '#713f12';
    ctx.fill();
  });

  // 4. Hover Highlight Tile
  createCanvasTexture(textures, 'tile_hover', w, h, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(w / 2, 2);
    ctx.lineTo(w - 2, h / 2);
    ctx.lineTo(w / 2, h - 2);
    ctx.lineTo(2, h / 2);
    ctx.closePath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fill();
  });

  // 5. Chain Selection Highlight Tile (during drag combos)
  createCanvasTexture(textures, 'tile_chain_selected', w, h, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(w / 2, 2);
    ctx.lineTo(w - 2, h / 2);
    ctx.lineTo(w / 2, h - 2);
    ctx.lineTo(2, h / 2);
    ctx.closePath();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.fill();
  });

  // 6. Generic Sprout (Young crop stage)
  createCanvasTexture(textures, 'crop_sprout', 40, 40, (ctx) => {
    // Little green dual leaves
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(20, 36);
    ctx.lineTo(20, 24);
    ctx.stroke();

    // Leaf 1
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(14, 20, 6, 4, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Leaf 2
    ctx.beginPath();
    ctx.ellipse(26, 20, 6, 4, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 7. Crop: Blé d'Or (Wheat)
  createCropTexture(textures, 'crop_wheat', (ctx) => {
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(24, 46);
    ctx.quadraticCurveTo(22, 25, 26, 8);
    ctx.stroke();

    // Golden grain kernels
    const grains = [
      { x: 22, y: 12 }, { x: 28, y: 14 },
      { x: 20, y: 18 }, { x: 27, y: 20 },
      { x: 21, y: 26 }, { x: 26, y: 28 },
    ];
    grains.forEach((g) => {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, 4, 2.5, Math.PI / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  });

  // 8. Crop: Carotte Ruby (Carrot)
  createCropTexture(textures, 'crop_carrot', (ctx) => {
    // Green feathery leafy top
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 22); ctx.lineTo(16, 6);
    ctx.moveTo(24, 22); ctx.lineTo(24, 4);
    ctx.moveTo(24, 22); ctx.lineTo(32, 7);
    ctx.stroke();

    // Plump orange cone
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(17, 24);
    ctx.lineTo(31, 24);
    ctx.lineTo(24, 46);
    ctx.closePath();
    ctx.fill();

    // Carrot highlight ridges
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(19, 29); ctx.lineTo(28, 29);
    ctx.moveTo(21, 35); ctx.lineTo(26, 35);
    ctx.stroke();
  });

  // 9. Crop: Fraise Électrique (Strawberry)
  createCropTexture(textures, 'crop_strawberry', (ctx) => {
    // Crown leaves
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(24, 18); ctx.lineTo(16, 12);
    ctx.lineTo(24, 14); ctx.lineTo(32, 12);
    ctx.closePath();
    ctx.fill();

    // Heart berry
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(24, 18);
    ctx.bezierCurveTo(12, 18, 12, 34, 24, 44);
    ctx.bezierCurveTo(36, 34, 36, 18, 24, 18);
    ctx.fill();

    // Electric cyan glowing seeds
    ctx.fillStyle = '#67e8f9';
    [
      { x: 20, y: 24 }, { x: 27, y: 25 },
      { x: 23, y: 30 }, { x: 19, y: 34 },
      { x: 28, y: 33 }, { x: 24, y: 38 }
    ].forEach((s) => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
  });

  // 10. Crop: Citrouille Royale (Pumpkin)
  createCropTexture(textures, 'crop_pumpkin', (ctx) => {
    // Green curly stem
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, 20);
    ctx.quadraticCurveTo(24, 10, 30, 8);
    ctx.stroke();

    // Pumpkin body ribs
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(24, 30, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center lighter rib
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(24, 30, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little royal crown
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(18, 17);
    ctx.lineTo(21, 14);
    ctx.lineTo(24, 17);
    ctx.lineTo(27, 14);
    ctx.lineTo(30, 17);
    ctx.lineTo(29, 20);
    ctx.lineTo(19, 20);
    ctx.closePath();
    ctx.fill();
  });

  // 11. Crop: Tournesol Solaire (Sunflower)
  createCropTexture(textures, 'crop_sunflower', (ctx) => {
    // Stalk
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, 46);
    ctx.lineTo(24, 22);
    ctx.stroke();

    // Yellow petals
    ctx.fillStyle = '#facc15';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const px = 24 + Math.cos(a) * 11;
      const py = 20 + Math.sin(a) * 11;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brown seed center
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(24, 20, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 12. Crop: Maïs Flamboyant (Corn)
  createCropTexture(textures, 'crop_corn', (ctx) => {
    // Tall green leaves
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(24, 46); ctx.lineTo(16, 28);
    ctx.moveTo(24, 46); ctx.lineTo(32, 26);
    ctx.stroke();

    // Golden Cob
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(20, 12, 8, 24, 4);
    ctx.fill();

    // Silk crown
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(22, 12); ctx.lineTo(20, 4);
    ctx.moveTo(24, 12); ctx.lineTo(25, 3);
    ctx.moveTo(26, 12); ctx.lineTo(28, 5);
    ctx.stroke();
  });

  // 13. Pest: Mole (Taupe malicieuse)
  createCanvasTexture(textures, 'pest_mole', 44, 44, (ctx) => {
    // Dirt mound
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(22, 36, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mole head
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.ellipse(22, 24, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute pink snout
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(22, 26, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(17, 18, 3, 3);
    ctx.fillRect(24, 18, 3, 3);

    // Miner hat / lamp
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(22, 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 13, 2, 2);
  });

  // 14. Sparkle Particle
  createCanvasTexture(textures, 'particle_sparkle', 16, 16, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(8, 8, 16, 8);
    ctx.quadraticCurveTo(8, 8, 8, 16);
    ctx.quadraticCurveTo(8, 8, 0, 8);
    ctx.quadraticCurveTo(8, 8, 8, 0);
    ctx.fill();
  });

  // 15. Coin Particle
  createCanvasTexture(textures, 'particle_coin', 20, 20, (ctx) => {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(10, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#a16207';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 10, 10);
  });

  // 16. Water Droplet Particle
  createCanvasTexture(textures, 'particle_water', 16, 16, (ctx) => {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.quadraticCurveTo(13, 10, 8, 14);
    ctx.quadraticCurveTo(3, 10, 8, 2);
    ctx.fill();
  });
}

function createCropTexture(
  textures: Phaser.Textures.TextureManager,
  name: string,
  drawCrop: (ctx: CanvasRenderingContext2D) => void
) {
  createCanvasTexture(textures, name, 48, 52, (ctx) => {
    // Subtle shadow at base
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(24, 46, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    drawCrop(ctx);
  });
}

function createCanvasTexture(
  textures: Phaser.Textures.TextureManager,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
) {
  if (textures.exists(key)) {
    textures.remove(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
    textures.addCanvas(key, canvas);
  }
}
