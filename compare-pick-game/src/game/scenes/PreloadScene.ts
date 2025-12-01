// src/game/scenes/PreloadScene.ts
import Phaser from 'phaser';
import type { LessonPackage } from '../types/lesson';

type PreloadData = {
    lessonId: string;
};

export class PreloadScene extends Phaser.Scene {
    private lessonId!: string;
    private lessonData!: LessonPackage;

    constructor() {
        super('PreloadScene');
    }

    init(data: PreloadData) {
        this.lessonId = data.lessonId;
    }

    preload() {
        // === UI CHUNG ===
        this.load.image('speaker-icon', 'assets/ui/speaker.png');

        // Panel như trong CompareScene
        this.load.image('panel_bg', 'assets/ui/panel_bg.webp');
        this.load.image('panel_bg_correct', 'assets/ui/panel_bg_ok.webp');
        this.load.image('panel_bg_wrong', 'assets/ui/panel_bg_wrong.webp');

        // Thanh câu hỏi (khung câu hỏi)
        this.load.image('question_bar', 'assets/ui/question_bar.webp');
        // nếu bạn đã có question_more/question_less thì có thể dùng lại key đó

        this.load.image('boy', 'assets/characters/boy.webp');

        // === JSON BÀI HỌC ===
        this.load.json('lessonData', `lessons/${this.lessonId}.json`);
    }

    create() {
        this.lessonData = this.cache.json.get('lessonData') as LessonPackage;
        this.preloadLessonAssets(this.lessonData).then(() => {
            this.scene.start('LessonScene', { lesson: this.lessonData });
        });
    }

    private async preloadLessonAssets(lesson: LessonPackage) {
        // preload hình trong lesson
        lesson.items.forEach((item) => {
            item.options.forEach((opt) => {
                if (!this.textures.exists(opt.image)) {
                    this.load.image(opt.image, opt.image);
                }
            });

            if (item.promptAudio) {
                this.load.audio(item.promptAudio, item.promptAudio);
            }
        });

        if (lesson.defaultPromptAudio) {
            this.load.audio(
                lesson.defaultPromptAudio,
                lesson.defaultPromptAudio
            );
        }

        return new Promise<void>((resolve) => {
            this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
            this.load.start();
        });
    }
}
