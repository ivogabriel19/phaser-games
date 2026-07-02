import Phaser from './lib/phaser.js';
import { SCENE_KEYS } from "./scenes/scene-keys.js";
import { config } from './config.js';

const game = new Phaser.Game(config);

game.scene.start(SCENE_KEYS.PRELOAD);