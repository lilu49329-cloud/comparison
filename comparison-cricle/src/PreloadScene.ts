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
    this.load.image('cake', 'assets/char/cake.png');
    this.load.image('ball1', 'assets/char/ball1.png');
    this.load.image('ball2', 'assets/char/ball2.png');
    this.load.image('cake_plus', 'assets/char/cake_plus.png');
    this.load.image('ball2_plus_1', 'assets/char/ball2_plus_1.png');
    this.load.image('ball2_plus_2', 'assets/char/ball2_plus_2.png');

    // --- ASSETS FOR GAMEPLAY ---

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
    // ---icon---
    this.load.image('icon1', 'assets/icon/icon1.png');
    this.load.image('icon2', 'assets/icon/icon2.png');
    this.load.image('icon3', 'assets/icon/icon3.png');
    this.load.image('icon4', 'assets/icon/icon4.png');
    this.load.image('ball2_plus_043', 'assets/char/ball2_plus_043.png');
    this.load.image('ball2_plus_042', 'assets/char/ball2_plus_042.png');
    this.load.image('ball2_plus_034', 'assets/char/ball2_plus_034.png');
    this.load.image('ball2_plus_024', 'assets/char/ball2_plus_024.png');
    this.load.image('ball2_plus_032', 'assets/char/ball2_plus_032.png');
    this.load.image('ball2_plus_023', 'assets/char/ball2_plus_023.png');
    this.load.image('ball2_plus_04', 'assets/char/ball2_plus_04.png');
    this.load.image('ball2_plus_03', 'assets/char/ball2_plus_03.png');
    this.load.image('ball2_plus_02', 'assets/char/ball2_plus_02.png');
    this.load.image('char', 'assets/char/char.png');

    // --- BANNER TEXT (IMAGE) FOR GAME SCENE ---
    this.load.image('q_less_ball', 'assets/text/text-less-ball.png');
    this.load.image('q_less_cake', 'assets/text/text-less-cake.png');
    this.load.image('q_more_ball', 'assets/text/text-more-ball.png');
    this.load.image('q_more_cake', 'assets/text/text-more-cake.png');
    this.load.image('q_add_ball', 'assets/text/text-add-ball.png');
    this.load.image('q_add_cake', 'assets/text/text-add-cake.png');
  }


   create() {
    // ================== BGM (GIỮ NGUYÊN) ==================
    try {
      AudioManager.play('bgm_main');
    } catch {}

    // Start game scene
    this.scene.start('GameScene');
  }
}
