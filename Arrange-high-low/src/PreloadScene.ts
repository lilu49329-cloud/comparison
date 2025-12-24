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

    // --- Arrange-high-low: arrow ---
    this.load.image('sort_arrow', 'assets/char/Arrow 1.png');

    // --- Arrange-high-low: hint text (optional) ---
    // If you have hint images, put them in `public/assets/text/` and update these paths.
    this.load.image('sort_hint_book', 'assets/text/x-book.png');
    this.load.image('sort_hint_animal', 'assets/text/x-animal.png');
    this.load.image('sort_hint_boy', 'assets/text/x-boy.png');
    this.load.image('sort_hint_tree', 'assets/text/x-tree.png');
    this.load.image('sort_hint_building', 'assets/text/x-build.png');

    // --- Arrange-high-low: 5 cases x 3 variants (top/bottom images) ---
    // If you add your real PNGs, just replace these paths.
    // Naming convention: assets/sort/<theme>_<1|2|3>_<top|bottom>.png
    this.load.image('sort_book_1_top', 'assets/sort/image 412.png');
    this.load.image('sort_book_2_top', 'assets/sort/image 411.png');
    this.load.image('sort_book_3_top', 'assets/sort/image 409.png');
    this.load.image('sort_animal_1_top', 'assets/sort/image 455.png');
    this.load.image('sort_animal_2_top', 'assets/sort/image 454.png');
    this.load.image('sort_animal_3_top', 'assets/sort/image 453.png');
    this.load.image('sort_boy_1_top', 'assets/sort/image 437.png');
    this.load.image('sort_boy_2_top', 'assets/sort/image 436.png');
    this.load.image('sort_boy_3_top', 'assets/sort/image 435.png');
    this.load.image('sort_tree_1_top', 'assets/sort/image 12.png');
    this.load.image('sort_tree_2_top', 'assets/sort/image 11.png');
    this.load.image('sort_tree_3_top', 'assets/sort/image 13.png');
    this.load.image('sort_building_1_top', 'assets/sort/image 390.png');
    this.load.image('sort_building_2_top', 'assets/sort/image 389.png');
    this.load.image('sort_building_3_top', 'assets/sort/image 388.png');

    this.load.image('sort_book_1_bottom', 'assets/sort/image 412.png');
    this.load.image('sort_book_2_bottom', 'assets/sort/image 411.png');
    this.load.image('sort_book_3_bottom', 'assets/sort/image 409.png');
    this.load.image('sort_animal_1_bottom', 'assets/sort/image 455.png');
    this.load.image('sort_animal_2_bottom', 'assets/sort/image 454.png');
    this.load.image('sort_animal_3_bottom', 'assets/sort/image 453.png');
    this.load.image('sort_boy_1_bottom', 'assets/sort/image 437.png');
    this.load.image('sort_boy_2_bottom', 'assets/sort/image 436.png');
    this.load.image('sort_boy_3_bottom', 'assets/sort/image 435.png');
    this.load.image('sort_tree_1_bottom', 'assets/sort/image 12.png');
    this.load.image('sort_tree_2_bottom', 'assets/sort/image 11.png');
    this.load.image('sort_tree_3_bottom', 'assets/sort/image 13.png');
    this.load.image('sort_building_1_bottom', 'assets/sort/image 390.png');
    this.load.image('sort_building_2_bottom', 'assets/sort/image 389.png');
    this.load.image('sort_building_3_bottom', 'assets/sort/image 388.png');
  }

  create() {
    // Quick validation: helps spot missing real images (open DevTools console).
    try {
      const themes = ['book', 'animal', 'boy', 'tree', 'building'] as const;
      const variants = [1, 2, 3] as const;
      const positions = ['top', 'bottom'] as const;
      const missing: string[] = [];

      for (const theme of themes) {
        for (const variant of variants) {
          for (const pos of positions) {
            const key = `sort_${theme}_${variant}_${pos}`;
            if (!this.textures.exists(key)) missing.push(key);
          }
        }
      }

      if (missing.length) console.warn('[Arrange-high-low] Missing sort textures:', missing);
    } catch {}

    // Gọi BGM trước, sau đó mới vào GameScene (question sẽ phát trong GameScene.startLevel)
    try {
      AudioManager.play('bgm_main');
    } catch {
      // nếu audio chưa load vẫn chuyển cảnh bình thường
    }
    this.scene.start('GameScene');
  }
}
