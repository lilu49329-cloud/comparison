import * as Phaser from "phaser";

export default class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
  }

  preload() {
    // Load ảnh background
    this.load.image("background", "/assets/background/background.png");
  }

  create() {
    const { width, height } = this.scale;

    // Tạo TileSprite để map chạy vô tận
    this.bg = this.add
      .tileSprite(0, 0, width, height, "background")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setScale(1);

    // Tốc độ cuộn nền
    this.scrollSpeed = 0.8;

    // Thêm hướng dẫn hoặc placeholder
    const label = this.add.text(
      width / 2,
      height * 0.1,
      "🐸 Hãy Thu Thập Những Chiếc Lá Sen Đặc Biệt Nào",
      {
        fontFamily: "Rum Raisin, sans-serif",
        fontSize: "32px",
        color: "#1a4d00",
      }
    );
    label.setOrigin(0.5);
  }

  update() {
    // Cuộn background vô tận
    this.bg.tilePositionX += this.scrollSpeed;
  }
}
