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
    this.load.image('q_less_snail', 'assets/text/X-snail.png'); 
    this.load.image('q_less_aquarium', 'assets/text/X-fish.png');

    
    // --- 2 nhân vật trái/phải cho GameScene stack + BalanceScene base ---
    // GameScene stack texture: snail1/snail2/aquarium1/aquarium2
    // BalanceScene base cũng dùng các key này
    this.load.image('snail1', 'assets/char/Group 1.png');         
    this.load.image('snail2', 'assets/char/image 8.png');         
    this.load.image('aquarium1', 'assets/char/Group 2.png');   
    this.load.image('aquarium2', 'assets/char/image 10.png');   

    this.load.image('snail_plus_1', 'assets/char/Frame 72.png'); 
    this.load.image('snail_plus_2', 'assets/char/Group 1.png'); 
    this.load.image('aquarium_plus_1', 'assets/char/3 fish.png'); 
    this.load.image('aquarium_plus_2', 'assets/char/Group 2.png'); 


    // --- Icon kéo trong BalanceScene ---
    // BalanceScene dùng icon2/icon3/icon4
    this.load.image('icon2', 'assets/icon/image 376.png'); 
    this.load.image('icon3', 'assets/icon/image 382.png'); 
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
