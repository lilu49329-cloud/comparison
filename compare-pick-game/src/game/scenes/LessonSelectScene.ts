import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { LessonConcept } from '../types/lesson';
import { domBackgroundManager } from '../domBackground';

type LessonOption = {
    lessonId: string;
    concept: LessonConcept;
    title: string;
    subtitle: string;
};

const LESSON_OPTIONS: LessonOption[] = [
    {
        lessonId: 'height_basic_01',
        concept: 'HEIGHT',
        title: 'Cao / Thấp',
        subtitle: 'So sánh chiều cao',
    },
    {
        lessonId: 'size_basic_01',
        concept: 'SIZE',
        title: 'To / Nhỏ / Bằng nhau',
        subtitle: 'So sánh kích thước',
    },
    {
        lessonId: 'length_basic_01',
        concept: 'LENGTH',
        title: 'Dài / Ngắn',
        subtitle: 'So sánh độ dài',
    },
    {
        lessonId: 'width_basic_01',
        concept: 'WIDTH',
        title: 'Rộng / Hẹp',
        subtitle: 'So sánh độ rộng',
    },
];

export class LessonSelectScene extends Phaser.Scene {
    constructor() {
        super('LessonSelectScene');
    }

    preload() {
        // panel & icon cần dùng trong menu
        if (!this.textures.exists('panel_bg')) {
            this.load.image('panel_bg', 'assets/ui/panel_bg.webp');
        }

        if (!this.textures.exists('speaker-icon')) {
            this.load.image('speaker-icon', 'assets/ui/speaker.png');
        }
    }

    create() {
        domBackgroundManager.setBackgroundByKey('DEFAULT');
        // Tiêu đề
        this.add
            .text(GAME_WIDTH / 2, 80, 'Chọn bài so sánh', {
                fontSize: '32px',
                color: '#000',
            })
            .setOrigin(0.5);

        this.add
            .text(
                GAME_WIDTH / 2,
                120,
                'Con muốn luyện Cao/Thấp, To/Nhỏ, Dài/Ngắn hay Rộng/Hẹp?',
                {
                    fontSize: '18px',
                    color: '#555',
                    align: 'center',
                    wordWrap: { width: GAME_WIDTH - 120 },
                }
            )
            .setOrigin(0.5);

        this.renderLessonOptions();
    }

    private renderLessonOptions() {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2 + 20;

        const colSpacing = 260;
        const rowSpacing = 180;

        // 4 ô: 2x2
        const positions = [
            { x: centerX - colSpacing / 2, y: centerY - rowSpacing / 2 },
            { x: centerX + colSpacing / 2, y: centerY - rowSpacing / 2 },
            { x: centerX - colSpacing / 2, y: centerY + rowSpacing / 2 },
            { x: centerX + colSpacing / 2, y: centerY + rowSpacing / 2 },
        ];

        LESSON_OPTIONS.forEach((opt, idx) => {
            const pos = positions[idx] ?? positions[positions.length - 1];

            // Panel nền
            const panel = this.add
                .image(pos.x, pos.y, 'panel_bg')
                .setOrigin(0.5)
                .setDisplaySize(260, 180);

            // Vùng click to hơn tí cho dễ bấm
            panel.setInteractive({ useHandCursor: true });

            // Text tiêu đề
            const titleText = this.add
                .text(pos.x, pos.y - 25, opt.title, {
                    fontSize: '22px',
                    color: '#000',
                })
                .setOrigin(0.5);

            // Text mô tả
            const subText = this.add
                .text(pos.x, pos.y + 20, opt.subtitle, {
                    fontSize: '16px',
                    color: '#555',
                })
                .setOrigin(0.5);

            // Click: start PreloadScene với lessonId
            panel.on('pointerdown', () => {
                this.startLesson(opt.lessonId);
            });
        });
    }

    private startLesson(lessonId: string) {
        this.scene.start('PreloadScene', { lessonId });
    }
}
