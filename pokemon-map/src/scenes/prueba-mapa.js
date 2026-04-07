import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { config } from '../config.js';

export default class MapaScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MAPA });
  }

  preload() {
    // Cargar el tileset y el mapa
    this.load.image('tiles', 'assets/tile-set.png');
    this.load.tilemapTiledJSON('map', 'assets/mapa2.json');
  }

  create() {
    // Cargar el mapa
    const map = this.make.tilemap({ key: 'map' });

    // Vincular el tileset del JSON con la imagen cargada
    const tileset = map.addTilesetImage('tileSet', 'tiles');

    // Crear capa (layer) de tiles
    const groundLayer = map.createLayer('ground&path', tileset, 0, 0);
    const obstaclesLayer = map.createLayer('obstacles', tileset, 0, 0);
  }

  update() {
  }
}

