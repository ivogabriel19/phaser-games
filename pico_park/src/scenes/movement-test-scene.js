import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { config } from '../config.js';

const FLOOR_HEIGHT = 20;
const PLATFORM_HEIGHT = 20;
const GOAL_WIDTH = 40;
const GOAL_HEIGHT = 70;
const GOAL_X_MARGIN = 100; // no dejar que la meta caiga pegada a los bordes
const GOAL_MIN_MOVE_DISTANCE = 150; // asegura que el reposicionamiento se note

// Datos de cada jugador para las instrucciones en pantalla: el color acá
// tiene que coincidir con el nombre del sprite (orange/blue/green) para que
// el alumno pueda asociar de un vistazo "este texto = ese personaje".
const PLAYER_CONFIGS = [
  { label: 'Jugador 1 (naranja)', color: '#ff8c00', left: 'A', right: 'D', jump: 'W' },
  { label: 'Jugador 2 (azul)', color: '#3399ff', left: '←', right: '→', jump: '↑' },
  { label: 'Jugador 3 (verde)', color: '#33cc33', left: 'J', right: 'L', jump: 'I' },
];

export default class MovementTestScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MOVEMENT_TEST });
  }

  preload() {
    const floorGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    floorGraphics.fillStyle(0xb5651e);
    floorGraphics.fillRect(0, 0, config.width, FLOOR_HEIGHT);
    floorGraphics.generateTexture('floorTexture', config.width, FLOOR_HEIGHT);

    const platformWidth = config.width / 4;
    const platformGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    platformGraphics.fillStyle(0x8d99ae);
    platformGraphics.fillRect(0, 0, platformWidth, PLATFORM_HEIGHT);
    platformGraphics.generateTexture('platformTexture', platformWidth, PLATFORM_HEIGHT);

    const goalGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    goalGraphics.fillStyle(0xffd700);
    goalGraphics.fillRect(0, 0, GOAL_WIDTH, GOAL_HEIGHT);
    goalGraphics.generateTexture('goalTexture', GOAL_WIDTH, GOAL_HEIGHT);
  }

  create() {
    this.moveSpeed = 250;
    this.jumpSpeed = -800;
    this.maxJumps = 3; // triple salto
    this.jumpCount1 = 0;
    this.jumpCount2 = 0;
    this.jumpCount3 = 0;
    this.playersAtGoal = new Set();

    this.floor = this.physics.add.staticImage(config.width / 2, config.height - 10, 'floorTexture')
      .setOrigin(0.5, 0.5)
      .refreshBody();

    this.platform = this.createMiddlePlatform();

    this.player1 = this.physics.add.sprite(100, config.height - 200, 'orange_guy')
      .setOrigin(0.5, 0.5)
      .setScale(2);

    this.player2 = this.physics.add.sprite(200, config.height - 200, 'blue_guy')
      .setOrigin(0.5, 0.5)
      .setScale(2);

    this.player3 = this.physics.add.sprite(30, config.height - 200, 'green_guy')
      .setOrigin(0.5, 0.5)
      .setScale(2);

    this.players = [this.player1, this.player2, this.player3];
    this.players.forEach((player) => {
      player.setCollideWorldBounds(true);
      this.physics.add.collider(player, this.floor);
      this.physics.add.collider(player, this.platform);
    });
    // Colliders entre jugadores: son los que permiten que uno se pare
    // arriba de otro, algo clave para alcanzar la meta.
    this.physics.add.collider(this.player1, this.player2);
    this.physics.add.collider(this.player2, this.player3);
    this.physics.add.collider(this.player3, this.player1);

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

    this.anims.create({
      key: 'green_guy-idle',
      frames: this.anims.generateFrameNumbers('green_guy', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.player1.anims.play('orange_guy-idle');
    this.player2.anims.play('blue_guy-idle');
    this.player3.anims.play('green_guy-idle');

    // Capturar teclas WASD
    this.keys = this.input.keyboard.addKeys({
      jump1: Phaser.Input.Keyboard.KeyCodes.W,
      left1: Phaser.Input.Keyboard.KeyCodes.A,
      right1: Phaser.Input.Keyboard.KeyCodes.D,
      jump2: Phaser.Input.Keyboard.KeyCodes.UP,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jump3: Phaser.Input.Keyboard.KeyCodes.I,
      left3: Phaser.Input.Keyboard.KeyCodes.J,
      right3: Phaser.Input.Keyboard.KeyCodes.L
    });

    this.goal = this.createGoal();
    this.createControlsHint();
  }

  // Altura teórica de encadenar `numJumps` saltos presionando cada uno cerca
  // del punto más alto del anterior (cada salto suma casi una singleJumpHeight
  // completa). `marginRatio` recorta ese máximo teórico para que sea
  // alcanzable sin exigir un timing perfecto.
  getChainedJumpHeight(numJumps, marginRatio = 0.8) {
    const gravity = this.physics.world.gravity.y;
    const singleJumpHeight = (this.jumpSpeed * this.jumpSpeed) / (2 * gravity);
    return singleJumpHeight * numJumps * marginRatio;
  }

  // Plataforma central ubicada a la altura de un doble salto: alcanzable
  // encadenando dos saltos, pero imposible con uno solo.
  createMiddlePlatform() {
    const groundY = this.floor.body.top;
    const heightAboveGround = this.getChainedJumpHeight(2);

    const platformTop = groundY - heightAboveGround;
    const platformCenterY = platformTop + PLATFORM_HEIGHT / 2;

    return this.physics.add.staticImage(config.width / 2, platformCenterY, 'platformTexture')
      .setOrigin(0.5, 0.5)
      .refreshBody();
  }

  // Crea la meta y engancha el overlap con cada jugador. La Y queda fija
  // (ver getGoalY()); sólo la X cambia cada vez que se alcanza, en
  // relocateGoal().
  createGoal() {
    this.goalY = this.getGoalY();
    const goalX = config.width / 2;

    const goal = this.physics.add.staticImage(goalX, this.goalY, 'goalTexture')
      .setOrigin(0.5, 0.5)
      .refreshBody();

    this.goalLabel = this.add.text(goalX, this.goalY - GOAL_HEIGHT / 2 - 16, 'META', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.players.forEach((player) => {
      this.physics.add.overlap(player, goal, () => this.onPlayerReachGoal(player));
    });

    return goal;
  }

  // Altura de la meta: arriba de la plataforma central, a la altura que
  // alcanza un triple salto hecho por un jugador parado sobre otro (que a
  // su vez está parado en la plataforma).
  getGoalY() {
    const platformTop = this.platform.body.top;
    const tripleJumpHeight = this.getChainedJumpHeight(3);
    const stackedPlayerHeight = this.player1.displayHeight;

    return platformTop - stackedPlayerHeight - tripleJumpHeight + GOAL_HEIGHT / 2;
  }

  onPlayerReachGoal(player) {
    this.playersAtGoal.add(player);
    if (this.playersAtGoal.size === this.players.length) {
      this.playersAtGoal.clear();
      this.showGoalReachedMessage();
      this.relocateGoal();
    }
  }

  // Cada vez que los 3 jugadores la alcanzan, la meta reaparece a la misma
  // altura pero en una X distinta, para seguir practicando el mismo truco
  // (pararse uno arriba de otro y saltar) en otro punto del nivel.
  relocateGoal() {
    const previousX = this.goal.x;
    let newX;
    do {
      newX = Phaser.Math.Between(GOAL_X_MARGIN, config.width - GOAL_X_MARGIN);
    } while (Math.abs(newX - previousX) < GOAL_MIN_MOVE_DISTANCE);

    this.goal.setPosition(newX, this.goalY).refreshBody();
    this.goalLabel.setX(newX);
  }

  showGoalReachedMessage() {
    const message = this.add.text(config.width / 2, config.height / 2, '¡Meta alcanzada!', {
      fontFamily: 'Arial',
      fontSize: '56px',
      color: '#ffffff',
      backgroundColor: '#2f2f4a',
      padding: { x: 32, y: 20 }
    }).setOrigin(0.5).setDepth(10);

    this.time.delayedCall(1200, () => message.destroy());
  }

  createControlsHint() {
    PLAYER_CONFIGS.forEach((player, index) => {
      this.add.text(
        20,
        16 + index * 28,
        `${player.label} — mover: ${player.left}/${player.right}  saltar: ${player.jump}`,
        {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: player.color,
        }
      );
    });
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

    if (this.keys.left3.isDown) {
      this.player3.setVelocityX(-this.moveSpeed);
      this.player3.setFlipX(true);
    } else if (this.keys.right3.isDown) {
      this.player3.setVelocityX(this.moveSpeed);
      this.player3.setFlipX(false);
    } else {
      this.player3.setVelocityX(0);
    }

    // Salto (solo si está en el suelo)
    const onGround1 = this.player1.body.touching.down;
    const onGround2 = this.player2.body.touching.down;
    const onGround3 = this.player3.body.touching.down;

    // Resetear al tocar el suelo
    if (onGround1) {
      this.jumpCount1 = 0;
    }
    if (onGround2) {
      this.jumpCount2 = 0;
    }
    if (onGround3) {
      this.jumpCount3 = 0;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump1) && this.jumpCount1 < this.maxJumps) {
      this.player1.setVelocityY(this.jumpSpeed);
      this.jumpCount1++;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump2) && this.jumpCount2 < this.maxJumps) {
      this.player2.setVelocityY(this.jumpSpeed);
      this.jumpCount2++;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump3) && this.jumpCount3 < this.maxJumps) {
      this.player3.setVelocityY(this.jumpSpeed);
      this.jumpCount3++;
    }
  }

}
