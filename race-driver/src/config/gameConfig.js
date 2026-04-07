export const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: document.body,
    scene: [roadScene],
    physics: {
      default: 'arcade'
    }
  };