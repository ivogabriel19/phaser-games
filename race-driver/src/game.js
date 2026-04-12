// Phaser llega como global desde el CDN — no hay import de 'phaser'
import { gameConfig } from './config/gameConfig.js';
import roadScene from './scenes/roadScene.js';

export function launchGame() {
  new Phaser.Game({ ...gameConfig, scene: [roadScene] });
}
