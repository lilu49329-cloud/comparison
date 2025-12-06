import Phaser from "phaser";

// Các URL gốc cho nút UI – dùng chung cho preload và HTML button
export const BUTTON_ASSET_URLS = {
  replay_svg: "assets/button/replay.png",
  next_svg: "assets/button/next.png",
};

// Chỉ load những asset cần cho màn intro
export function preloadIntroAssets(scene: Phaser.Scene): void {
  // AUDIO: chỉ cần nhạc nền + voice_intro
  scene.load.audio("voice_intro", "assets/audio/voice_intro.ogg");
  scene.load.audio("bgm_main", "assets/audio/bgm_main.ogg");

  // BG intro
  scene.load.image("intro_bg_1", "assets/intro/bge1.webp");
  scene.load.image("intro_bg_2", "assets/intro/bge2.webp");
  scene.load.image("intro_bg_3", "assets/intro/bge3.webp");

  // CHARACTER & TITLE intro – rất quan trọng
  scene.load.image("intro_char_1", "assets/intro/char1.webp");
  scene.load.image("intro_char_2", "assets/intro/char_intro2.webp");
  scene.load.image("intro_title", "assets/intro/title.webp");

  // Nút start
  scene.load.image("btn_start", "assets/button/btn_start.webp");
}


// Load toàn bộ asset dùng trong game (GameScene + EndGameScene)
export function preloadGameAssets(scene: Phaser.Scene): void {
  // --- AUDIO ---
  scene.load.audio("voice_intro", "assets/audio/voice_intro.ogg");
  scene.load.audio("voice_complete", "assets/audio/complete.ogg");
  scene.load.audio("voice_need_finish", "assets/audio/voice_need_finish.ogg");
  scene.load.audio("sfx_correct", "assets/audio/sfx_correct.ogg");
  scene.load.audio("sfx_wrong", "assets/audio/sfx_wrong.ogg");
  scene.load.audio("bgm_main", "assets/audio/bgm_main.ogg");
  scene.load.audio("voice_end", "assets/audio/voice_end.ogg");
  scene.load.audio("voice_rotate", "assets/audio/xoay.ogg");
  scene.load.audio("correct", "assets/audio/correct.ogg");
  scene.load.audio("wrong", "assets/audio/error.ogg");
  scene.load.audio("complete", "assets/audio/vic_sound.ogg");
  scene.load.audio("fireworks", "assets/audio/fireworks.ogg");
  scene.load.audio("applause", "assets/audio/applause.ogg");
  scene.load.audio("sfx_click", "assets/audio/click.ogg");

  // --- BACKGROUND ---
  scene.load.image("bg1", "assets/bg/bg1.webp");
  scene.load.image("bg2", "assets/bg/bg2.webp");
  scene.load.image("bg3", "assets/bg/bg3.webp");

  // --- CHARACTERS ---
  scene.load.image("char", "assets/char/char.webp");
  // dùng lại cho OverlayScene nếu quay lại intro
  scene.load.image("intro_char_1", "assets/intro/char1.webp");
  scene.load.image("intro_title", "assets/intro/title.webp");

  // --- BUTTONS ---
  scene.load.image("btn_start", "assets/button/btn_start.webp");
  scene.load.image("replay_endgame", "assets/button/replay_endgame.webp");
  scene.load.image("replay_svg", BUTTON_ASSET_URLS.replay_svg);
  scene.load.image("next_svg", BUTTON_ASSET_URLS.next_svg);
  scene.load.image("exit_endgame", "assets/button/exit.webp");

  // --- CARDS ---
  scene.load.image("card", "assets/card/card.webp");
  scene.load.image("card2", "assets/card/card2.webp");
  scene.load.image("card_yellow", "assets/card/card_yellow.webp");
  scene.load.image("card_yellow2", "assets/card/card_yellow2.webp");
  scene.load.image("card_glow", "assets/card/card_glow.webp");
  scene.load.image("line_glow", "assets/card/line_glow.webp");
  scene.load.image("board", "assets/card/board.webp");

  // --- ICONS ---
  scene.load.image("spoon", "assets/icon/spoon.webp");
  scene.load.image("bowl", "assets/icon/bowl.webp");
  scene.load.image("lamp", "assets/icon/lamp.webp");
  scene.load.image("clock", "assets/icon/clock.webp");
  scene.load.image("hand", "assets/icon/hand.webp");
;

      // --- BG END ---
      scene.load.image("banner_congrat", "assets/bg_end/banner_congrat.webp");
      scene.load.image("btn_exit", "assets/bg_end/btn_exit.webp");
      scene.load.image("btn_reset", "assets/bg_end/btn_reset.webp");
      scene.load.image("icon_end", "assets/bg_end/icon.webp");
      scene.load.image("ic_1", "assets/bg_end/ic_1.webp");
      scene.load.image("ic_2", "assets/bg_end/ic_2.webp");
      scene.load.image("ic_3", "assets/bg_end/ic_3.webp");
      scene.load.image("ic_4", "assets/bg_end/ic_4.webp");
      scene.load.image("ic_6", "assets/bg_end/ic_6.webp");
      scene.load.image("ic_7", "assets/bg_end/ic_7.webp");
      scene.load.image("ic_8", "assets/bg_end/ic_8.webp");
}

// Giữ hàm cũ cho tương thích, nếu đâu đó vẫn gọi preloadAssets
export function preloadAssets(scene: Phaser.Scene): void {
  preloadGameAssets(scene);
}
