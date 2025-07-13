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
    //this.load.image("","");
    this.load.image("tiles","assets/main-tiles.png");
    this.load.tilemapTiledJSON("map", "assets/mapa1_json.tmj");
  }

  create() {
    const map = this.add.tilemap("map");
    const tiles = map.addTilesetImage("main-tiles", "tiles");
    const ground = map.createLayer("ground&path", tiles);
    const obstacles = map.createLayer("obstacles", tiles);
  
    this.playerArray = map.createFromObjects("player", {gid: 7, key: "archer"});
    this.player = this.playerArray[0];

    const playerAnim = this.anims.create({
      key: "archerAnim",
      frames: [
        { key: "archer", frame: 0 },
        { key: "archer", frame: 1 },
        { key: "archer", frame: 2 },
        { key: "archer", frame: 3 }
      ],
      frameRate: 10,
      repeat: -1
    });

    //this.player.play("archerAnim");
  }

  update() {

  }

}