import Phaser from "phaser";

export default class NextScene extends Phaser.Scene {
  constructor() {
    super("NextScene");
  }

  create() {
    this.add.text(100, 100, "Next Scene!", {
      fontSize: "48px",
      color: "#fff",
    });
  }
}
