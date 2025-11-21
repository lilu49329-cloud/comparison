import Phaser from 'phaser';

export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    preload() {
        // Banner chúc mừng (có chữ sẵn)
        this.load.image('banner_congrat', 'assets/images/banner_congrat.png');

        // Nút chơi lại
        this.load.image('btn_reset', 'assets/images/btn_reset.png');

        // Nút thoát
        this.load.image('btn_exit', 'assets/images/btn_exit.png');

        // Âm thanh click
        this.load.audio('sfx_click', 'assets/audio/sfx_click.wav');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // ==== Banner ảnh chúc mừng ====
        const banner = this.add
            .image(w / 2, h / 2 - 100, 'banner_congrat') // banner_congrat là key của ảnh
            .setOrigin(0.5)
            .setDisplaySize(w * 1, h * 1); // scale theo màn hình

        // ==== Các nút ngang dưới banner ====
        const btnScale = Math.min(w, h) / 1280; // tỉ lệ nút
        const spacing = 250 * btnScale; // khoảng cách giữa 2 nút

        // Nút Chơi lại
        const replayBtn = this.add
            .image(w / 2 - spacing, h / 2 + h * 0.2, 'btn_reset')
            .setOrigin(0.5)
            .setScale(btnScale)
            .setInteractive({ useHandCursor: true });

        replayBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.scene.start('GameScene', { level: 0 });
        });

        // Nút Thoát
        const exitBtn = this.add
            .image(w / 2 + spacing, h / 2 + h * 0.2, 'btn_exit')
            .setOrigin(0.5)
            .setScale(btnScale)
            .setInteractive({ useHandCursor: true });

        exitBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.scene.start('MenuScene');
        });

        // ==== Optional: hover effect ====
        [replayBtn, exitBtn].forEach((btn) => {
            btn.on('pointerover', () => btn.setScale(btnScale * 1.1));
            btn.on('pointerout', () => btn.setScale(btnScale));
        });
    }
}
