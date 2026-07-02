import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { config } from '../config.js';
import { LEVELS } from './levels.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload() {
    this.load.spritesheet('orange_guy', 'assets/Sprite-0001.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('blue_guy', 'assets/Sprite-0002.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('green_guy', 'assets/Sprite-0003.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    this.add.text(config.width / 2, 160, 'Pico Park', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(config.width / 2, 230, 'Elegí un nivel para jugar', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#cccccc'
    }).setOrigin(0.5);

    this.createLevelSelector();
  }

  createLevelSelector() {
    const startY = 340;
    const spacing = 80;

    LEVELS.forEach((level, index) => {
      const label = this.add.text(config.width / 2, startY + index * spacing, level.title, {
        fontFamily: 'Arial',
        fontSize: '36px',
        color: '#ffffff',
        backgroundColor: '#2f2f4a',
        padding: { x: 24, y: 12 }
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      label.on('pointerover', () => label.setColor('#ffd166'));
      label.on('pointerout', () => label.setColor('#ffffff'));
      label.on('pointerdown', () => this.scene.start(level.sceneKey));
    });
  }
}
