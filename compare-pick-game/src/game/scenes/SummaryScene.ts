import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class SummaryScene extends Phaser.Scene {
    private lessonId!: string;
    private score!: number;
    private total!: number;

    constructor() {
        super('SummaryScene');
    }

    init(data: { lessonId: string; score: number; total: number }) {
        this.lessonId = data.lessonId;
        this.score = data.score;
        this.total = data.total;
    }

    create() {
        // Title
        this.add
            .text(GAME_WIDTH / 2, 200, `Hoàn thành bài học`, {
                fontSize: '30px',
                color: '#000',
                align: 'center',
            })
            .setOrigin(0.5);

        // Result
        this.add
            .text(
                GAME_WIDTH / 2,
                260,
                `Con đã trả lời đúng ${this.score}/${this.total} câu`,
                {
                    fontSize: '24px',
                    color: '#2E7D32',
                }
            )
            .setOrigin(0.5);

        // Replay button
        const btn = this.add
            .rectangle(GAME_WIDTH / 2, 340, 220, 55, 0x42a5f5, 1)
            .setInteractive({ useHandCursor: true });

        const btnText = this.add
            .text(GAME_WIDTH / 2, 340, 'Chơi lại', {
                fontSize: '22px',
                color: '#fff',
            })
            .setOrigin(0.5);

        btn.on('pointerdown', () => {
            this.scene.start('BootScene');
        });
    }
}
