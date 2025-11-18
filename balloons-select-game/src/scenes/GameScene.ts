import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {}

  create() {
    console.log("GameScene started");
  }
}
