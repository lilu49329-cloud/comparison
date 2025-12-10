import Phaser from 'phaser';
import AudioManager from './AudioManager';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // --- BACKGROUND ---
    this.load.image('bg1', 'assets/bg/bg1.jpg');
    this.load.image('bg2', 'assets/bg/bg2.jpg');
    this.load.image('bg3', 'assets/bg/bg3.jpg');
    this.load.image('bg4', 'assets/bg/bg4.jpg');
    this.load.image('bg5', 'assets/bg/bg5.jpg');
    // Characters
    this.load.image('balloon', 'assets/char/compressed_BALLON.png');
    this.load.image('girl_balloon', 'assets/char/compressed_GIRL 1 BALLON.png');
    this.load.image('boy_balloon', 'assets/char/compressed_BOY.png');
    this.load.image('girl_flower', 'assets/char/compressed_FLOWER 1.png');
    this.load.image('boy_flower', 'assets/char/compressed_FLOWER 2.png');
    this.load.image('flower', 'assets/char/flower.png');
    this.load.image('girl_balloon_plus', 'assets/char/ballon2.png');
    this.load.image('girl_flower_plus', 'assets/char/flower2.png');

    // UI & Banner
    this.load.image('banner_question', 'assets/button/Rectangle 1.png');
    this.load.image('answer_correct', 'assets/button/V.png');
    this.load.image('answer_wrong', 'assets/button/X.png');
    this.load.image('btn_next', 'assets/button/next.png');
    this.load.image('answer_default', 'assets/button/DRAW.png');
    this.load.image('btn_primary_pressed', 'assets/button/HTU.png');
    this.load.image('btn_replay', 'assets/button/replay.png');
    this.load.image('next_end', 'assets/button/next_end.png');

    // --- BG END ---
    this.load.image('banner_congrat', 'assets/bg_end/banner_congrat.png');
    this.load.image('btn_exit', 'assets/bg_end/btn_exit.png');
    this.load.image('btn_reset', 'assets/bg_end/btn_reset.png');
    this.load.image('icon_end', 'assets/bg_end/icon.png');
    this.load.image('ic_1', 'assets/bg_end/ic_1.png');
    this.load.image('ic_2', 'assets/bg_end/ic_2.png');
    this.load.image('ic_3', 'assets/bg_end/ic_3.png');
    this.load.image('ic_4', 'assets/bg_end/ic_4.png');
    this.load.image('ic_6', 'assets/bg_end/ic_6.png');
    this.load.image('ic_7', 'assets/bg_end/ic_7.png');
    this.load.image('ic_8', 'assets/bg_end/ic_8.png');
  }

  create() {
    // Gọi BGM trước, sau đó mới vào GameScene (question sẽ phát trong GameScene.startLevel)
    try {
      AudioManager.play('bgm_main');
    } catch {
      // nếu audio chưa load vẫn chuyển cảnh bình thường
    }
    this.scene.start('GameScene');
  }
}
