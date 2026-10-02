import Phaser from 'phaser';
import { generateProceduralTextures } from '../textures/textureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Generate all procedural 2.5D isometric tiles, crops, pests and particles
    generateProceduralTextures(this.textures);

    // Launch main gameplay scene
    this.scene.start('FarmScene');
  }
}
