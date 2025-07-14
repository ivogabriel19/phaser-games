import Phaser from './lib/phaser.js';
import { SCENE_KEYS } from "../src/scenes/scene-keys.js";
import { config } from './config.js';
import PreloadScene from './scenes/preload-scene.js';
import GameScene from './scenes/game-scene.js';
import MapaScene from './scenes/prueba-mapa.js';

const game = new Phaser.Game(config);

game.scene.add(SCENE_KEYS.MAPA, MapaScene);
game.scene.start(SCENE_KEYS.MAPA);