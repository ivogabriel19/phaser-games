import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  init(){
    console.log("PreloadScene initialized");
  }

  preload() {
  }

  create() {
  }

  update() {
    
  }

}