import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Backgrounds
        this.load.image('bg_game', 'assets/bg/bg2.webp');
        this.load.image('bg_end', 'assets/icon/bge.webp');
        this.load.image('icon', 'assets/icon/icon1.webp');

        // Characters
        this.load.image('balloon', 'assets/char/compressed_BALLON.webp');
        this.load.image('girl_balloon', 'assets/char/compressed_GIRL 1 BALLON.webp');
        this.load.image('boy_balloon', 'assets/char/compressed_BOY.webp');
        this.load.image('girl_flower', 'assets/char/compressed_FLOWER 1.webp');
        this.load.image('boy_flower', 'assets/char/compressed_FLOWER 2.webp');
        this.load.image('flower', 'assets/char/flower.webp');
        this.load.image('girl_balloon_plus', 'assets/char/ballon2.webp');
        this.load.image('girl_flower_plus', 'assets/char/flower2.webp');

        // UI & Banner
        this.load.image('banner_question', 'assets/button/Rectangle 1.webp');
        this.load.image('answer_correct', 'assets/button/V.webp');
        this.load.image('answer_wrong', 'assets/button/X.webp');
        this.load.image('btn_next', 'assets/button/next.webp');
        this.load.image('answer_default', 'assets/button/DRAW.webp');
        this.load.image('btn_primary_pressed', 'assets/button/HTU.webp');
        this.load.image('btn_replay', 'assets/button/replay.webp');
        this.load.image('next_end', 'assets/button/next_end.webp');

        // Audio
        this.load.audio('bgm_main', 'assets/audio/bgm_main.ogg');
        this.load.audio('sfx_click', 'assets/audio/click.ogg');
        this.load.audio('sfx_correct', 'assets/audio/correct.ogg');
        this.load.audio('sfx_wrong', 'assets/audio/wrong.ogg');
        this.load.audio('voice_need_finish', 'assets/audio/finish.ogg');
        this.load.audio('voice_complete', 'assets/audio/complete.ogg');
        // voice hướng dẫn kéo cho bóng / hoa
        this.load.audio('drag_balloon', 'assets/audio/keo_bong.ogg');
        this.load.audio('drag_flower', 'assets/audio/keo_hoa.ogg');
        // voice đọc câu hỏi banner (mỗi kiểu một file)
        this.load.audio('q_balloon_more', 'assets/audio/more_b.ogg');
        this.load.audio('q_balloon_less', 'assets/audio/less_b.ogg');
        this.load.audio('q_flower_more', 'assets/audio/more_f.ogg');
        this.load.audio('q_flower_less', 'assets/audio/less_f.ogg');
        this.load.audio('voice_end', 'assets/audio/voice_end.ogg');

        this.load.audio('voice_rotate', 'assets/audio/xoay.ogg');
        //voice end
        this.load.audio('complete', 'assets/audio/vic_sound.ogg');
        this.load.audio('fireworks', 'assets/audio/fireworks.ogg');
        this.load.audio('applause', 'assets/audio/applause.ogg');
        this.load.audio('click', 'assets/audio/click.ogg');
        this.load.audio('correct_1', 'assets/audio/correct_answer_1.ogg');
        this.load.audio('correct_2', 'assets/audio/correct_answer_2.ogg');
        this.load.audio('correct_3', 'assets/audio/correct_answer_3.ogg');
        this.load.audio('correct_4', 'assets/audio/correct_answer_4.ogg');
    
        //bg_end
        // --- BG END ---
        this.load.image("banner_congrat", "assets/bg_end/banner_congrat.webp");
        this.load.image("btn_exit", "assets/bg_end/btn_exit.webp");
        this.load.image("btn_reset", "assets/bg_end/btn_reset.webp");
        this.load.image("icon_end", "assets/bg_end/icon.webp");
        this.load.image("ic_1", "assets/bg_end/ic_1.webp");
        this.load.image("ic_2", "assets/bg_end/ic_2.webp");
        this.load.image("ic_3", "assets/bg_end/ic_3.webp");
        this.load.image("ic_4", "assets/bg_end/ic_4.webp");
        this.load.image("ic_6", "assets/bg_end/ic_6.webp");
        this.load.image("ic_7", "assets/bg_end/ic_7.webp");
        this.load.image("ic_8", "assets/bg_end/ic_8.webp");
    }

    create() {
    // BGM nền dùng chung cho mọi scene
    let bgm = this.sound.get('bgm_main');
    if (!bgm) {
    bgm = this.sound.add('bgm_main', { loop: true, volume: 0.4 });
    }
    bgm.play();
    this.scene.start('GameScene');
    }

}
