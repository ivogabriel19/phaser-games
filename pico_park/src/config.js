import PreloadScene from './scenes/preload-scene.js';
import MovementTestScene from './scenes/movement-test-scene.js';

export const config = {
  parent: 'game-container',
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: '#424262',
  scene: [PreloadScene, MovementTestScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 3000 },
      debug: false
    }
  }
}
