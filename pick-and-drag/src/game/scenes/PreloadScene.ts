    import Phaser from 'phaser';
    import type { LessonPackage } from '../types/lesson';
    import AudioManager from '../../audio/AudioManager';

    const DEFAULT_LESSON_ID = 'size_basic_01';
    const MAX_QUESTIONS = 5;

    export class PreloadScene extends Phaser.Scene {
    private lessonData!: LessonPackage;

    constructor() {
        super('PreloadScene');
    }

    preload() {
        // ===== UI =====
        this.load.image('icon', 'assets/ui/icon.png');

        this.load.image('panel_bg', 'assets/ui/panel_bg.png');
        this.load.image('panel_bg_correct', 'assets/ui/panel_bg_ok.png');
        this.load.image('panel_bg_wrong', 'assets/ui/panel_bg_wrong.png');
        this.load.image('panel_bg_1', 'assets/ui/panel_bg_1.png');
        this.load.image('panel_bg_1_correct', 'assets/ui/panel_bg_1_ok.png');
        this.load.image('panel_bg_1_wrong', 'assets/ui/panel_bg_1_wrong.png');

        this.load.image('question_bar', 'assets/ui/question_bar.png');
        this.load.image('char', 'assets/characters/char.png');

        this.load.image('banner_congrat', 'assets/ui/banner_congrat.png');
        this.load.image('btn_reset', 'assets/ui/btn_reset.png');
        this.load.image('btn_exit', 'assets/ui/btn_exit.png');
        this.load.image('btn_next', 'assets/ui/btn_next.png');

        // ===== HINT =====
        this.load.image('hint_board', 'assets/hint/board.png');
        this.load.image('hint_board_wood', 'assets/hint/board-wood.png');
        this.load.image('hint_pencil_short', 'assets/hint/pencil-short.png');
        this.load.image('hint_pencil_long', 'assets/hint/pencil-long.png');
        this.load.image('hint_train_short', 'assets/hint/train-short.png');
        this.load.image('hint_train_long', 'assets/hint/train-long.png');
        this.load.image('hint_hand', 'assets/hint/hand.png');

        // ===== JSON =====
        this.load.json('size_hint', 'hints/size_hint.json');

        if (this.cache.json.exists('lessonData')) {
        this.cache.json.remove('lessonData');
        }
        this.load.json('lessonData', `lessons/${DEFAULT_LESSON_ID}.json`);

        // ===== AUDIO FILE (CHỈ LOAD – KHÔNG PLAY) =====
        this.load.audio('bgm_main', 'audio/sfx/bgm_main.mp3');
    }

    async create() {
        const rawLesson = this.cache.json.get('lessonData') as LessonPackage;

        // 1️⃣ chỉ giữ câu 2 lựa chọn (fallback nếu không có)
        let items = rawLesson.items.filter((it) => it.options.length === 2);
        if (items.length === 0) items = rawLesson.items.slice();

        // 2️⃣ shuffle + cắt số câu
        items = Phaser.Utils.Array.Shuffle(items.slice()).slice(0, MAX_QUESTIONS);

        // 3️⃣ shuffle options trong từng câu
        const randomizedItems = items.map((item) => ({
        ...item,
        options:
            item.options.length === 2
            ? Phaser.Utils.Array.Shuffle(item.options.slice())
            : item.options,
        }));

        const lessonForPlay: LessonPackage = {
        ...rawLesson,
        items: randomizedItems,
        };

        try {
        // 4️⃣ load toàn bộ audio Howler (voice, sfx…) – CHỈ LOAD
        await AudioManager.loadAll();

        // 5️⃣ load ảnh động theo lesson
        await this.preloadDynamicAssets(lessonForPlay);

        // ❗❗ TUYỆT ĐỐI KHÔNG PLAY ÂM THANH Ở ĐÂY ❗❗
        this.lessonData = lessonForPlay;

        // 6️⃣ sang LessonScene
        this.scene.start('LessonScene', { lesson: this.lessonData });
        } catch (e) {
        console.error('PreloadScene error:', e);
        this.scene.start('LessonScene', { lesson: lessonForPlay });
        }
    }

    // ===== LOAD ẢNH ĐỘNG THEO LESSON =====
    private preloadDynamicAssets(lesson: LessonPackage) {
        lesson.items.forEach((item: any) => {
        if (item.promptImage && !this.textures.exists(item.promptImage)) {
            this.load.image(item.promptImage, item.promptImage);
        }
        item.options.forEach((opt: any) => {
            if (opt.image && !this.textures.exists(opt.image)) {
            this.load.image(opt.image, opt.image);
            }
        });
        });

        const rawHint = this.cache.json.get('size_hint') as any;
        if (rawHint?.items) {
        rawHint.items.forEach((it: any) => {
            if (it.promptImage && !this.textures.exists(it.promptImage)) {
            this.load.image(it.promptImage, it.promptImage);
            }
        });
        }

        if (this.load.totalToLoad === 0) return Promise.resolve();

        return new Promise<void>((resolve) => {
        this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
        this.load.start();
        });
    }
    }
