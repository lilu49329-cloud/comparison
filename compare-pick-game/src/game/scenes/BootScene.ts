import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Đi thẳng vào màn chọn bài
        this.scene.start('LessonSelectScene');
    }
}
