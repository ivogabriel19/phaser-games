import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { config } from '../config.js';


export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  init() {
    console.log("PreloadScene initialized");
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

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xb5651e);
    g.fillRect(0, 0, config.width, 20);
    g.generateTexture('floorTexture', config.width, 20);
  }

  create() {

    this.floor = this.physics.add.staticImage(config.width / 2, config.height - 10, 'floorTexture')
      .setOrigin(0.5, 0.5)
      .refreshBody();

    this.player1 = this.physics.add.sprite(100, config.height - 200, 'orange_guy')
      .setOrigin(0.5, 0.5)
      .setScale(2);

    this.player2 = this.physics.add.sprite(200, config.height - 200, 'blue_guy')
      .setOrigin(0.5, 0.5)
      .setScale(2);

    this.player1.setCollideWorldBounds(true);
    this.player2.setCollideWorldBounds(true);
    this.physics.add.collider(this.player1, this.floor);
    this.physics.add.collider(this.player2, this.floor);
    this.physics.add.collider(this.player1, this.player2);

    this.anims.create({
      key: 'orange_guy-idle',
      frames: this.anims.generateFrameNumbers('orange_guy', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'blue_guy-idle',
      frames: this.anims.generateFrameNumbers('blue_guy', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.player1.anims.play('orange_guy-idle');
    this.player2.anims.play('blue_guy-idle');

    // Capturar teclas WASD
    this.keys = this.input.keyboard.addKeys({
      jump1: Phaser.Input.Keyboard.KeyCodes.W,
      left1: Phaser.Input.Keyboard.KeyCodes.A,
      right1: Phaser.Input.Keyboard.KeyCodes.D,
      jump2: Phaser.Input.Keyboard.KeyCodes.UP,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });

    this.moveSpeed = 250;
    this.jumpSpeed = -800;
    this.jumpCount1 = 0;
    this.jumpCount2 = 0;
    this.maxJumps = 3; // Número máximo de saltos permitidos
  }

  update() {
    if (this.keys.left1.isDown) {
      this.player1.setVelocityX(-this.moveSpeed);
      this.player1.setFlipX(true);
    } else if (this.keys.right1.isDown) {
      this.player1.setVelocityX(this.moveSpeed);
      this.player1.setFlipX(false);
    } else {
      this.player1.setVelocityX(0);
    }
    if (this.keys.left2.isDown) {
      this.player2.setVelocityX(-this.moveSpeed);
      this.player2.setFlipX(true);
    } else if (this.keys.right2.isDown) {
      this.player2.setVelocityX(this.moveSpeed);
      this.player2.setFlipX(false);
    } else {
      this.player2.setVelocityX(0);
    }

    // Salto (solo si está en el suelo)
    const onGround1 = this.player1.body.touching.down;
    const onGround2 = this.player2.body.touching.down;

    // Resetear al tocar el suelo
    if (onGround1) {
      this.jumpCount1 = 0; 
    }
    if (onGround2) {
      this.jumpCount2 = 0;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump1) && this.jumpCount1 < this.maxJumps) {
      this.player1.setVelocityY(this.jumpSpeed);
      this.jumpCount1++;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump2) && this.jumpCount2 < this.maxJumps) {
      this.player2.setVelocityY(this.jumpSpeed);
      this.jumpCount2++;
    }
  }

}