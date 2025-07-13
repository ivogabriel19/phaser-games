import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { config } from '../config.js';


export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  init() {
    console.log("GameScene initialized");
  }

  preload() {
    this.load.image('banana', 'assets/banana.png');
    this.load.spritesheet(
      'player',
      'assets/Player.png',
      { frameWidth: 128, frameHeight: 128 }
    )
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xb5651e);
    g.fillRect(0, 0, config.width, 20);
    g.generateTexture('floorTexture', config.width, 20);
  }

  create() {
    this.keys = this.input.keyboard.createCursorKeys();

    //this.floor = this.add.rectangle(0, config.height, config.width, 20, 0xb5651e).setOrigin(0, 1);
    this.floor = this.physics.add.staticImage(config.width / 2, config.height - 10, 'floorTexture')
      .setOrigin(0.5, 0.5)
      .refreshBody();

    this.player = this.physics.add
      .sprite(128, config.height - 20, 'player')
      .setScale(2)
      .setOrigin(0.5, 1)
      .setGravityY(100);

    this.physics.add.collider(this.player, this.floor);

    const walkFrames = {
      key: 'walk',
      frames: this.anims.generateFrameNumbers(
        'player', { start: 0, end: 11 }),
      frameRate: 15,
      repeat: -1
    }
    this.anims.create(walkFrames);
    
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 2 }],
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers(
        'player', { start: 12, end: 22 }),
      frameRate: 4,
      repeat: 0
    });

    this.anims.create({
      key: 'crouch',
      frames: this.anims.generateFrameNumbers(
        'player', { start: 24, end: 26 }),
      frameRate: 4,
      repeat: 0
    });

    console.log("Frames disponibles:", this.textures.get('player').getFrameNames());

    /*this.anims.create({
      key: 'landing',
      frames: this.anims.generateFrameNumbers(
        'landing', { start: 0, end: 5 }),
      frameRate: 5,
      repeat: 0
    });
    */

    console.log("GameScene Created");
  }

  update() {
    if (this.keys.right.isDown) {
      this.player.x += 5;
      this.player.anims.play('walk', true);
      this.player.flipX = false;
    } else if (this.keys.left.isDown) {
      this.player.x -= 5;
      this.player.anims.play('walk', true);
      this.player.flipX = true;
    }
    else {
      this.player.anims.play('idle', true);
    }

    if (this.keys.space.isDown) {
      this.player.y -= 32;
      if (this.player.anims.currentAnim?.key !== 'jump') {
        this.player.anims.play('jump');
      }
    }

    if (this.keys.up.isDown) {
      console.log("Up key pressed");
    }

    if (this.keys.down.isDown) {
      if (this.player.anims.currentAnim?.key !== 'crouch') {
        this.player.anims.play('crouch');
      }
    }

  }

}