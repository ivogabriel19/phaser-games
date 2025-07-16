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

    this.player1.setCollideWorldBounds(true);
    this.physics.add.collider(this.player1, this.floor);


    this.anims.create({
      key: 'orange_guy-idle',
      frames: this.anims.generateFrameNumbers('orange_guy', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.player1.anims.play('orange_guy-idle');

    // Capturar teclas WASD
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Velocidad de movimiento
    this.moveSpeed = 250;
    this.jumpSpeed = -800;
  }

  update() {
    if (this.keys.left.isDown) {
      this.player1.setVelocityX(-this.moveSpeed);
      this.player1.setFlipX(true);
    } else if (this.keys.right.isDown) {
      this.player1.setVelocityX(this.moveSpeed);
      this.player1.setFlipX(false);
    } else {
      this.player1.setVelocityX(0);
    }

    // Salto (solo si está en el suelo)
    const onGround = this.player1.body.touching.down;

    //if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && onGround) {
    if (this.keys.jump.isDown && onGround) {
    this.player1.setVelocityY(this.jumpSpeed);
    }
  }

}