import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import roadScene from './scenes/roadScene';

export function launchGame() {
  const game = new Phaser.Game(gameConfig);

  game.scene.add('roadScene', roadScene);
  game.scene.start('roadScene');
}