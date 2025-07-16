import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  init(){
    console.log("PreloadScene initialized");
  }

  preload() {
    this.load.spritesheet('orange_guy', 'assets/Sprite-0001.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    this.player1 = this.add.sprite(100, 100, 'orange_guy')
                  .setOrigin(0.5, 0.5)
                  .setScale(2);

    this.anims.create({
      key: 'orange_guy-idle',
      frames: this.anims.generateFrameNumbers('orange_guy', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.player1.anims.play('orange_guy-idle');

  }

  update() {
  }

}