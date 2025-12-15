// src/game/scenes/PreloadScene.ts
import Phaser from 'phaser';
import type { LessonPackage } from '../types/lesson';
import AudioManager from '../../audio/AudioManager';

const DEFAULT_LESSON_ID = 'size_basic_01';

export class PreloadScene extends Phaser.Scene {
    private lessonData!: LessonPackage;

    constructor() {
        super('PreloadScene');
    }

    preload() {
        // === UI CHUNG ===
        this.load.image('icon', 'assets/ui/icon.png');

        // Panel nền câu hỏi & câu trả lời
        this.load.image('panel_bg', 'assets/ui/panel_bg.png');
        this.load.image('panel_bg_correct', 'assets/ui/panel_bg_ok.png');
        this.load.image('panel_bg_wrong', 'assets/ui/panel_bg_wrong.png');
        this.load.image('panel_bg_1', 'assets/ui/panel_bg_1.png');
        this.load.image('panel_bg_1_correct', 'assets/ui/panel_bg_1_ok.png');
        this.load.image('panel_bg_1_wrong', 'assets/ui/panel_bg_1_wrong.png');

        // Thanh câu hỏi (khung câu hỏi)
        this.load.image('question_bar', 'assets/ui/question_bar.png');

        this.load.image('char', 'assets/characters/char.png');

        // === UI KẾT THÚC BÀI HỌC ===
        this.load.image('banner_congrat', 'assets/ui/banner_congrat.png');
        this.load.image('btn_reset', 'assets/ui/btn_reset.png');
        this.load.image('btn_exit', 'assets/ui/btn_exit.png');
        this.load.image('btn_next', 'assets/ui/btn_next.png');

        // === ASSET MÀN PHỤ HINT ===
        this.load.image('hint_board', 'assets/hint/board.png');
        this.load.image('hint_board_wood', 'assets/hint/board-wood.png');
        this.load.image('hint_pencil_short', 'assets/hint/pencil-short.png');
        this.load.image('hint_pencil_long', 'assets/hint/pencil-long.png');
        this.load.image('hint_train_short', 'assets/hint/train-short.png');
        this.load.image('hint_train_long', 'assets/hint/train-long.png');
        this.load.image('hint_hand', 'assets/hint/hand.png');

        // === JSON HINT ===
        this.load.json('size_hint', 'hints/size_hint.json');

        // === JSON BÀI HỌC ===
        // XÓA JSON CŨ TRƯỚC
        if (this.cache.json.exists('lessonData')) {
            this.cache.json.remove('lessonData');
        }
        this.load.json('lessonData', `lessons/${DEFAULT_LESSON_ID}.json`);
    }

    create() {
        const rawLesson = this.cache.json.get('lessonData') as LessonPackage;

        // 1) Chỉ giữ các câu có 2 lựa chọn (to / nhỏ), bỏ các câu có 3–4 khung vừa
        let filteredItems = rawLesson.items.filter(
            (item) => item.options.length === 2
        );

        // nếu vì lý do gì đó không còn câu nào, fallback dùng toàn bộ
        if (filteredItems.length === 0) {
            filteredItems = rawLesson.items.slice();
        }

        // 2) Random và giới hạn tối đa 5 câu
        const MAX_QUESTIONS = 5;

        if (filteredItems.length > MAX_QUESTIONS) {
            // copy ra mảng mới để không đụng mảng gốc
            const shuffled = Phaser.Utils.Array.Shuffle(filteredItems.slice());
            filteredItems = shuffled.slice(0, MAX_QUESTIONS);
        } else {
            // nếu muốn vẫn random thứ tự khi <= 5
            filteredItems = Phaser.Utils.Array.Shuffle(filteredItems.slice());
        }

        // 3) Random vị trí 2 khung to/nhỏ trong từng câu
        const randomizedItems = filteredItems.map((item) => {
            if (item.options.length === 2) {
                const shuffledOptions = Phaser.Utils.Array.Shuffle(
                    item.options.slice()
                );
                return {
                    ...item,
                    options: shuffledOptions,
                };
            }
            return item;
        });

        // 4) Tạo lessonForPlay SAU KHI đã lọc + random + cắt + đảo vị trí 2 khung
        const lessonForPlay: LessonPackage = {
            ...rawLesson,
            items: randomizedItems,
        };

        // 5) preload asset cho đúng bộ câu đã chọn + load toàn bộ audio Howler
        Promise.all([
            AudioManager.loadAll(),
            this.preloadLessonAssets(lessonForPlay),
        ]).then(() => {
            this.lessonData = lessonForPlay;

            if (!AudioManager.isPlaying('bgm_main')) {
                AudioManager.play('bgm_main');
            }

            this.scene.start('LessonScene', {
                lesson: this.lessonData,
            });
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
