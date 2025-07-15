import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  init(){
    console.log("GameScene initialized");
  }

  preload() {
  }

  create() {
  }

  update() {
    
  }

}