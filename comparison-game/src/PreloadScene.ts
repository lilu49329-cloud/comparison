import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // --- BACKGROUND ---
        this.load.image('bg1', 'assets/bg/bg1.png');
        this.load.image('bg2', 'assets/bg/bg2.png');
        this.load.image('bg3', 'assets/bg/bg3.png');
        this.load.image('bg4', 'assets/bg/bg4.png');
        this.load.image('bg5', 'assets/bg/bg5.png');
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

        // Audio
        this.load.audio('bgm_main', 'assets/audio/bgm_main.mp3');
        this.load.audio('sfx_click', 'assets/audio/click.mp3');
        this.load.audio('sfx_correct', 'assets/audio/correct.mp3');
        this.load.audio('sfx_wrong', 'assets/audio/wrong.mp3');
        this.load.audio('voice_need_finish', 'assets/audio/finish.mp3');
        this.load.audio('voice_complete', 'assets/audio/complete.mp3');
        // voice hướng dẫn kéo cho bóng / hoa
        this.load.audio('drag_balloon', 'assets/audio/keo_bong.mp3');
        this.load.audio('drag_flower', 'assets/audio/keo_hoa.mp3');
        // voice đọc câu hỏi banner (mỗi kiểu một file)
        this.load.audio('q_balloon_more', 'assets/audio/more_b.mp3');
        this.load.audio('q_balloon_less', 'assets/audio/less_b.mp3');
        this.load.audio('q_flower_more', 'assets/audio/more_f.mp3');
        this.load.audio('q_flower_less', 'assets/audio/less_f.mp3');
        this.load.audio('voice_end', 'assets/audio/voice_end.mp3');
        this.load.audio('voice_rotate', 'assets/audio/xoay.mp3');
        //voice end
        this.load.audio('complete', 'assets/audio/vic_sound.mp3');
        this.load.audio('fireworks', 'assets/audio/fireworks.mp3');
        this.load.audio('applause', 'assets/audio/applause.mp3');
        this.load.audio('click', 'assets/audio/click.mp3');
        this.load.audio('correct_1', 'assets/audio/correct_answer_1.mp3');
        this.load.audio('correct_2', 'assets/audio/correct_answer_2.mp3');
        this.load.audio('correct_3', 'assets/audio/correct_answer_3.mp3');
        this.load.audio('correct_4', 'assets/audio/correct_answer_4.mp3');
    
        //bg_end
        // --- BG END ---
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
