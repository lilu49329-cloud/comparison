import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    /* =============================
     * GLOBAL ASSETS
     * ============================= */
    this.load.image('bg1', 'assets/bg/bg1.jpg');
    this.load.image('bg2', 'assets/bg/bg2.jpg');

    // ===== UI & Banner =====
    this.load.image('banner_question', 'assets/button/Rectangle 1.png');
    this.load.image('result_correct', 'assets/button/image 86.png');
    this.load.image('result_wrong', 'assets/button/image 77.png');
    this.load.image('btn_next', 'assets/button/next.png');
    this.load.image('btn_replay', 'assets/button/replay.png');
    this.load.image('answer_default', 'assets/button/Ellipse 17.png');
    this.load.image('btn_primary_pressed', 'assets/button/HTU.png');
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

    /* =============================
     * CHARACTER
     * ============================= */
    this.load.image('corner_character', 'assets/char/char.png');
    this.load.image('char', 'assets/char/char.png');

    /* =============================
     * ARRANGE WIDTH SCENE (ROAD / BRIDGE)
     * ============================= */

    // --- Arrow ---
    this.load.image('arrow', 'assets/char/Arrow 1.png');

    // --- ROAD ITEMS ---
    this.load.image('sort_road_1_top', 'assets/sort/image 737.png');
    this.load.image('sort_road_2_top', 'assets/sort/image 739.png');
    this.load.image('sort_road_3_top', 'assets/sort/image 741.png');

    this.load.image('sort_road_1_bottom', 'assets/sort/image 737.png');
    this.load.image('sort_road_2_bottom', 'assets/sort/image 739.png');
    this.load.image('sort_road_3_bottom', 'assets/sort/image 741.png');

    // --- BRIDGE ITEMS ---
    this.load.image('sort_bridge_1_top', 'assets/sort/image 731.png');
    this.load.image('sort_bridge_2_top', 'assets/sort/image 733.png');
    this.load.image('sort_bridge_3_top', 'assets/sort/image 735.png');

    this.load.image('sort_bridge_1_bottom', 'assets/sort/image 731.png');
    this.load.image('sort_bridge_2_bottom', 'assets/sort/image 733.png');
    this.load.image('sort_bridge_3_bottom', 'assets/sort/image 735.png');

    // --- Arrange-wide-narrow: hint text (optional, like Arrange-high-low) ---
    this.load.image('sort_hint_road', 'assets/text/s-road.png');
    this.load.image('sort_hint_bridge', 'assets/text/s-bridge.png');

    // --- BalanceScene banner prompt (optional) ---
    this.load.image('q_add_birdcage', 'assets/text/add-bird.png');
    // --- BalanceScene OP2 banner prompt (optional) ---
    this.load.image('q_add_birdcage_door', 'assets/text/add-bird2.png');

    this.load.image('birdcage_left', 'assets/icon/Group 388.png');
    this.load.image('birdcage_right', 'assets/icon/Group 389.png');
    this.load.image('icon1', 'assets/icon/Vector 12.png');
    this.load.image('icon2', 'assets/icon/Vector 13.png');
    this.load.image('icon3', 'assets/icon/Vector 14.png');

    // --- BalanceScene OP2: "cửa chuồng chim số 2 hẹp hơn số 1" (thêm bộ asset theo các path này) ---
    this.load.image('birdcage2_left', 'assets/icon/Group 420.png');
    this.load.image('birdcage2_right', 'assets/icon/Group 421.png');

    /* =============================
     * DEBUG: LOG lỗi khi asset thiếu
     * ============================= */
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: any) => {
      console.warn('[PreloadScene] Missing asset:', file.key, file.src || file.url);
    });
  }

  create() {
    // Chuyển vào GameScene hoặc ArrangeWidthScene
    this.scene.start('GameScene', { mode: 'ROAD', levelIndex: 0 });
  }
}
