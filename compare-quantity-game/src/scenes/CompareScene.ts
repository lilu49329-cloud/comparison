import Phaser from 'phaser';

export class CompareScene extends Phaser.Scene {
    constructor() {
        super('CompareScene');
    }

    preload() {
        // TODO: Giai đoạn sau load bg, animals, ui, audio
    }

    create() {
        this.add.text(100, 100, 'Game so sánh số lượng', {
            fontSize: '32px',
            color: '#ffffff',
        });
    }
}
