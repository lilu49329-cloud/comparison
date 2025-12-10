
// Đặt biến thời gian bắt đầu preload (dùng cho đo tổng thời gian load)
if (typeof window !== 'undefined') {
    (window as any).__preloadStartTime = performance.now();
}

import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {

        // ƯU TIÊN: Preload asset quan trọng cho màn đầu
        const tImg0 = performance.now();
        // --- BACKGROUND & CHARACTERS QUAN TRỌNG ---
        this.load.image('bg1', 'assets/bg/bg1.jpg');
        this.load.image('balloon', 'assets/char/compressed_BALLON.png');
        this.load.image('girl_balloon', 'assets/char/compressed_GIRL 1 BALLON.png');
        this.load.image('boy_balloon', 'assets/char/compressed_BOY.png');
        this.load.image('girl_flower', 'assets/char/compressed_FLOWER 1.png');
        this.load.image('boy_flower', 'assets/char/compressed_FLOWER 2.png');
        this.load.image('flower', 'assets/char/flower.png');
        // UI & Banner quan trọng
        this.load.image('banner_question', 'assets/button/Rectangle 1.png');
        this.load.image('answer_correct', 'assets/button/V.png');
        this.load.image('answer_wrong', 'assets/button/X.png');
        this.load.image('btn_next', 'assets/button/next.png');
        this.load.image('answer_default', 'assets/button/DRAW.png');
        this.load.image('btn_primary_pressed', 'assets/button/HTU.png');
        this.load.image('btn_replay', 'assets/button/replay.png');
        // --- END ASSET QUAN TRỌNG ---
        const tImg1 = performance.now();
        // Preload asset phụ (không ảnh hưởng gameplay đầu):
        this.load.image('bg2', 'assets/bg/bg2.jpg');
        this.load.image('bg3', 'assets/bg/bg3.jpg');
        this.load.image('bg4', 'assets/bg/bg4.jpg');
        this.load.image('bg5', 'assets/bg/bg5.jpg');
        this.load.image('girl_balloon_plus', 'assets/char/ballon2.png');
        this.load.image('girl_flower_plus', 'assets/char/flower2.png');
        this.load.image('next_end', 'assets/button/next_end.png');
        //bg_end
        this.load.image("banner_congrat", "assets/bg_end/banner_congrat.png");
        this.load.image("btn_exit", "assets/bg_end/btn_exit.png");
        this.load.image("btn_reset", "assets/bg_end/btn_reset.png");
        this.load.image("icon_end", "assets/bg_end/icon.png");
        this.load.image("ic_1", "assets/bg_end/ic_1.png");
        this.load.image("ic_2", "assets/bg_end/ic_2.png");
        this.load.image("ic_3", "assets/bg_end/ic_3.png");
        this.load.image("ic_4", "assets/bg_end/ic_4.png");
        this.load.image("ic_6", "assets/bg_end/ic_6.png");
        this.load.image("ic_7", "assets/bg_end/ic_7.png");
        this.load.image("ic_8", "assets/bg_end/ic_8.png");
        const tImg2 = performance.now();
        console.log(`[PreloadScene] Thời gian gọi load IMAGE (ưu tiên): ${(tImg1-tImg0).toFixed(0)}ms, (tất cả): ${(tImg2-tImg0).toFixed(0)}ms`);

        // AUDIO: Ưu tiên preload âm thanh gameplay đầu
        const tAudio0 = performance.now();
        this.load.audio('bgm_main', 'assets/audio/bgm_main.mp3');
        this.load.audio('sfx-correct', 'assets/audio/correct.mp3');
        this.load.audio('sfx-wrong', 'assets/audio/wrong.mp3');
        this.load.audio('sfx-click', 'assets/audio/click.mp3');
        this.load.audio('voice-rotate', 'assets/audio/xoay.mp3');
        this.load.audio('correct_answer_1', 'assets/audio/correct_answer_1.mp3');
        this.load.audio('correct_answer_2', 'assets/audio/correct_answer_2.mp3');
        this.load.audio('correct_answer_3', 'assets/audio/correct_answer_3.mp3');
        this.load.audio('correct_answer_4', 'assets/audio/correct_answer_4.mp3');
        this.load.audio('q_balloon_more', 'assets/audio/more_b.mp3');
        this.load.audio('q_balloon_less', 'assets/audio/less_b.mp3');
        this.load.audio('q_flower_more', 'assets/audio/more_f.mp3');
        this.load.audio('q_flower_less', 'assets/audio/less_f.mp3');
        this.load.audio('drag_balloon', 'assets/audio/keo_bong.mp3');
        this.load.audio('drag_flower', 'assets/audio/keo_hoa.mp3');
        const tAudio1 = performance.now();
        // Preload audio phụ (hiệu ứng kết thúc, applause...)
        this.load.audio('voice_need_finish', 'assets/audio/finish.mp3');
        this.load.audio('voice_complete', 'assets/audio/complete.mp3');
        this.load.audio('voice_end', 'assets/audio/voice_end.mp3');
        this.load.audio('complete', 'assets/audio/vic_sound.mp3');
        this.load.audio('fireworks', 'assets/audio/fireworks.mp3');
        this.load.audio('applause', 'assets/audio/applause.mp3');
        const tAudio2 = performance.now();
        console.log(`[PreloadScene] Thời gian gọi load AUDIO (ưu tiên): ${(tAudio1-tAudio0).toFixed(0)}ms, (tất cả): ${(tAudio2-tAudio0).toFixed(0)}ms`);

        // GỢI Ý: Nếu muốn tối ưu sâu hơn, hãy chỉ preload các asset quan trọng cho màn đầu tiên,
        // các asset phụ (ví dụ: bg_end, fireworks, applause, ...) có thể load sau khi vào game (lazy load).
        // Ngoài ra, hãy kiểm tra lại kích thước file trong assets/audio, assets/bg, nén lại nếu cần.
    }

    create() {
        // Đo thời gian load thực tế (từ khi bắt đầu preload đến khi create)
        if (typeof window !== 'undefined' && (window as any).__preloadStartTime) {
            const tNow = performance.now();
            console.log(`[PreloadScene] Tổng thời gian preload (preload->create): ${(tNow - (window as any).__preloadStartTime).toFixed(0)}ms`);
        }
        // BGM nền dùng chung cho mọi scene
        let bgm = this.sound.get('bgm_main');
        if (!bgm) {
            bgm = this.sound.add('bgm_main', { loop: true, volume: 0.4 });
        }
        bgm.play();
        this.scene.start('GameScene');
    }

}
