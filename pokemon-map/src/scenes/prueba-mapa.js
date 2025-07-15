import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { config } from '../config.js';

export default class MapaScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MAPA });
  }

  preload() {
    console.log("Cargando escena de mapa...");
    // Cargar el tileset y el mapa
    this.load.image('tiles', 'assets/tile-set.png');
    this.load.tilemapTiledJSON('map', 'assets/mapa2.json');

    this.load.spritesheet('archer', 'assets/Archer/Idle.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('archer-walk', 'assets/Archer/Walk.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('archer-shot', 'assets/Archer/Shot_1.png', {
      frameWidth: 128,
      frameHeight: 128
    });

  }

  create() {
    this.keys = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: 'archer-idle',
      frames: this.anims.generateFrameNumbers('archer', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'archer-walk',
      frames: this.anims.generateFrameNumbers('archer-walk', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'archer-shot',
      frames: this.anims.generateFrameNumbers('archer-shot', { start: 0, end: 5 }),
      frameRate: 12,
      repeat: 0 // solo una vez
    });


    // Cargar el mapa
    const map = this.make.tilemap({ key: 'map' });

    // Vincular el tileset del JSON con la imagen cargada
    const tileset = map.addTilesetImage('tileSet', 'tiles');

    // Crear capa (layer) de tiles
    const groundLayer = map.createLayer('ground&path', tileset, 0, 0);
    const obstaclesLayer = map.createLayer('obstacles', tileset, 0, 0);

    // Si el mapa tiene colisiones definidas:
    //groundLayer.setCollisionByProperty({ collides: true });

    // Agregar un jugador de prueba
    this.player = this.physics.add.sprite(320, 130, 'archer');
    this.player.setScale(0.5);
    this.player.anims.play('archer-idle', true);
    this.player.setSize(64, 80); // ajustá según tamaño real del cuerpo del personaje
    this.player.setOffset(32, 48); // ajustá si el sprite tiene espacio alrededor
    this.player.setCollideWorldBounds(true); // Evitar que el jugador salga del mundo 

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    obstaclesLayer.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, obstaclesLayer);

  }

  update() {
    const speed = 200;
    const keys = this.keys;
    const player = this.player;

    const movingX = keys.left.isDown || keys.right.isDown;
    const movingY = keys.up.isDown || keys.down.isDown;
    const moving = movingX || movingY;

    // Si está disparando, no se mueve
    if (player.anims.currentAnim?.key === 'archer-shot' && player.anims.isPlaying) {
      player.setVelocity(0);
      return;
    }

    // Movimiento con físicas
    let vx = 0;
    let vy = 0;

    if (keys.right.isDown) {
      vx = speed;
      player.flipX = false;
    } else if (keys.left.isDown) {
      vx = -speed;
      player.flipX = true;
    }

    if (keys.up.isDown) vy = -speed;
    if (keys.down.isDown) vy = speed;

    player.setVelocity(vx, vy);

    // Disparo
    if (Phaser.Input.Keyboard.JustDown(keys.space)) {
      player.anims.play('archer-shot', true);
      player.setVelocity(0); // Que no se mueva mientras dispara
      return;
    }

    // Animación
    if (moving) {
      if (player.anims.currentAnim?.key !== 'archer-walk') {
        player.anims.play('archer-walk', true);
      }
    } else {
      if (player.anims.currentAnim?.key !== 'archer-idle') {
        player.anims.play('archer-idle', true);
      }
    }
  }



}

