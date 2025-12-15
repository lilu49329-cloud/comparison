import Phaser from 'phaser';
import { domBackgroundManager } from '../domBackground';
import { hideGameButtons } from '../../main';

export class LessonSelectScene extends Phaser.Scene {
    constructor() {
        super('LessonSelectScene');
    }

    create() {
        domBackgroundManager.setBackground();

        // Không còn popup chọn độ khó: vào thẳng PreloadScene
        this.time.delayedCall(100, () => {
            this.scene.start('PreloadScene');
        });

        hideGameButtons();
    }
}
