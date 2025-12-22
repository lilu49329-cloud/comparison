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

    // ===== UI & Banner (CŨ) =====
    this.load.image('banner_question', 'assets/button/Rectangle 1.png');
    this.load.image('answer_correct', 'assets/button/V.png');
    this.load.image('answer_wrong', 'assets/button/X.png');
    this.load.image('btn_next', 'assets/button/next.png');
    this.load.image('answer_default', 'assets/button/Ellipse 17.png');
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

    // =========================================================
    // ✅ NEW: GAME "SNAIL / AQUARIUM"
    // =========================================================

    // --- Corner character (góc dưới-trái GameScene) ---
    // GameScene dùng key: corner_character
    this.load.image('corner_character', 'assets/char/char.png'); 

    // --- Pick X + result badges (UI mới GameScene) ---
    // GameScene dùng key: pick_x, result_correct, result_wrong
    this.load.image('pick_x', 'assets/button/X.png');                   
    this.load.image('result_correct', 'assets/button/image 86.png');   
    this.load.image('result_wrong', 'assets/button/image 77.png');       

    // --- BalanceScene corner char (góc dưới-trái BalanceScene) ---
    // BalanceScene dùng key: 'char'
    this.load.image('char', 'assets/char/char.png'); 

    // --- Text banner images trong BalanceScene (optional nhưng code có check exists) ---
    // BalanceScene dùng key: q_add_snail / q_add_aquarium
    this.load.image('q_add_snail', 'assets/text/add_snail.png');         
    this.load.image('q_add_aquarium', 'assets/text/add_fish.png');
    //---Text banner images trong GameScene (optional nhưng code có check exists) ---
    // GameScene dùng key: q_compare_snail / q_compare_aquarium
    this.load.image('q_more_chili', 'assets/text/x-chili.png'); 
    this.load.image('q_more_veg', 'assets/text/x-veg.png');
    this.load.image('q_more_flower', 'assets/text/x-flower.png');

    // --- Text banner images trong RemoveScene (màn phụ kéo thả bỏ bớt) ---
    this.load.image('q_remove_chili', 'assets/text/re-chili.png');
    this.load.image('q_remove_veg', 'assets/text/re-veg.png');


    
    // --- 3 nhân vật trái/phải cho GameScene stack (vd: so sánh số ớt/chậu hoa/rau củ) ---
    // GameScene stack texture dùng key: chili_left, chili_right, veg_left, veg_right, flower_left, flower_right
    this.load.image('chili_left', 'assets/char/chili_left.png');
    this.load.image('chili_right', 'assets/char/chili_right.png');
    this.load.image('veg_left', 'assets/char/veg_left.png');
    this.load.image('veg_right', 'assets/char/veg_right.png');
    this.load.image('flower_left', 'assets/char/image 27.png');
    this.load.image('flower_right', 'assets/char/image 18.png');

    this.load.image('chili', 'assets/icon/image 386.png');
    this.load.image('veg', 'assets/icon/image 387.png');

    // Basket frame: 2 loại khung (ớt / rau), trái-phải dùng chung 1 ảnh
    this.load.image('basket_chili', 'assets/char/image 359.png');
    this.load.image('basket_veg', 'assets/char/image 475.png');
    // Fallback (optional) nếu muốn dùng 1 key chung cho mọi loại
    this.load.image('basket', 'assets/char/image 359.png');
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
