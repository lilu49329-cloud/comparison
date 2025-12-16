    import Phaser from 'phaser';
    import type { LessonPackage } from '../types/lesson';
    import AudioManager from '../../audio/AudioManager';

    // ✅ danh sách lesson json có sẵn trong /public/lessons/
    const LESSON_IDS = [
    'size_basic_01',
    // 'size_basic_02',
    // 'size_basic_03',
    ];

    const MAX_QUESTIONS = 5;

    declare global {
    interface Window {
        __lessonPool?: string[];
        __currentLessonId?: string;
        __currentLesson?: any;

        __currentLessonJsonKey?: string;

        __howlerLoaded?: boolean;       // ✅ AudioManager.loadAll chỉ chạy 1 lần
        __resetInProgress?: boolean;    // ✅ main set
        __resetQueue?: number;          // ✅ main set
        __requestReset?: () => void;    // ✅ main set
    }
    }

    export class PreloadScene extends Phaser.Scene {
    private lessonData!: LessonPackage;

    constructor() {
        super('PreloadScene');
    }

    preload() {
        // ===== UI (load 1 lần, Phaser tự cache theo key) =====
        if (!this.textures.exists('icon')) this.load.image('icon', 'assets/ui/icon.png');

        if (!this.textures.exists('panel_bg')) this.load.image('panel_bg', 'assets/ui/panel_bg.png');
        if (!this.textures.exists('panel_bg_correct')) this.load.image('panel_bg_correct', 'assets/ui/panel_bg_ok.png');
        if (!this.textures.exists('panel_bg_wrong')) this.load.image('panel_bg_wrong', 'assets/ui/panel_bg_wrong.png');
        if (!this.textures.exists('panel_bg_1')) this.load.image('panel_bg_1', 'assets/ui/panel_bg_1.png');
        if (!this.textures.exists('panel_bg_1_correct')) this.load.image('panel_bg_1_correct', 'assets/ui/panel_bg_1_ok.png');
        if (!this.textures.exists('panel_bg_1_wrong')) this.load.image('panel_bg_1_wrong', 'assets/ui/panel_bg_1_wrong.png');

        if (!this.textures.exists('question_bar')) this.load.image('question_bar', 'assets/ui/question_bar.png');
        if (!this.textures.exists('char')) this.load.image('char', 'assets/characters/char.png');

        if (!this.textures.exists('banner_congrat')) this.load.image('banner_congrat', 'assets/ui/banner_congrat.png');
        if (!this.textures.exists('btn_reset')) this.load.image('btn_reset', 'assets/ui/btn_reset.png');
        if (!this.textures.exists('btn_exit')) this.load.image('btn_exit', 'assets/ui/btn_exit.png');
        if (!this.textures.exists('btn_next')) this.load.image('btn_next', 'assets/ui/btn_next.png');

        // ===== HINT (load 1 lần) =====
        if (!this.textures.exists('hint_board')) this.load.image('hint_board', 'assets/hint/board.png');
        if (!this.textures.exists('hint_board_wood')) this.load.image('hint_board_wood', 'assets/hint/board-wood.png');
        if (!this.textures.exists('hint_pencil_short')) this.load.image('hint_pencil_short', 'assets/hint/pencil-short.png');
        if (!this.textures.exists('hint_pencil_long')) this.load.image('hint_pencil_long', 'assets/hint/pencil-long.png');
        if (!this.textures.exists('hint_train_short')) this.load.image('hint_train_short', 'assets/hint/train-short.png');
        if (!this.textures.exists('hint_train_long')) this.load.image('hint_train_long', 'assets/hint/train-long.png');
        if (!this.textures.exists('hint_hand')) this.load.image('hint_hand', 'assets/hint/hand.png');

        // ===== JSON HINT (load 1 lần) =====
        if (!this.cache.json.exists('size_hint')) {
        this.load.json('size_hint', 'hints/size_hint.json');
        }

        // ✅ set pool (để debug / dùng chỗ khác)
        (window as any).__lessonPool = LESSON_IDS.slice();

        // ✅ chọn lessonId random (tránh trùng lesson vừa chơi nếu có thể)
        const prevId = (window as any).__currentLessonId as string | undefined;

        let picked = LESSON_IDS[Math.floor(Math.random() * LESSON_IDS.length)];
        if (LESSON_IDS.length > 1 && prevId) {
        for (let i = 0; i < 10; i++) {
            if (picked !== prevId) break;
            picked = LESSON_IDS[Math.floor(Math.random() * LESSON_IDS.length)];
        }
        }

        (window as any).__currentLessonId = picked;

        // ✅ cache JSON theo key riêng từng lesson -> không cần remove/reload
        const jsonKey = `lesson_${picked}`;
        (window as any).__currentLessonJsonKey = jsonKey;

        if (!this.cache.json.exists(jsonKey)) {
        this.load.json(jsonKey, `lessons/${picked}.json`);
        }

        // ===== AUDIO FILE (Phaser) (load 1 lần) =====
        // NOTE: cache.audio.exists may not exist in some Phaser builds; fallback: just load, Phaser will ignore duplicates by key
        try {
        // @ts-ignore
        if (!(this.cache as any).audio?.exists?.('bgm_main')) {
            this.load.audio('bgm_main', 'audio/sfx/bgm_main.mp3');
        }
        } catch {
        // fallback: safe to call load.audio again; Phaser usually keeps last/ignores duplicates by key
        this.load.audio('bgm_main', 'audio/sfx/bgm_main.mp3');
        }
    }

    async create() {
        const jsonKey = (window as any).__currentLessonJsonKey as string;
        const rawLesson = this.cache.json.get(jsonKey) as LessonPackage;

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

        (window as any).__currentLesson = lessonForPlay;

        try {
        // ✅ Howler load 1 lần cho cả runtime
        if (!(window as any).__howlerLoaded) {
            await AudioManager.loadAll();
            (window as any).__howlerLoaded = true;
        }

        // ✅ load dynamic assets theo lesson (chỉ những cái chưa có)
        await this.preloadDynamicAssets(lessonForPlay);

        this.lessonData = lessonForPlay;
        this.scene.start('LessonScene', { lesson: this.lessonData });
        } catch (e) {
        console.error('PreloadScene error:', e);
        this.scene.start('LessonScene', { lesson: lessonForPlay });
        } finally {
        // ✅ nhả reset lock + chạy tiếp queue nếu user spam
        (window as any).__resetInProgress = false;

        const q = (window as any).__resetQueue ?? 0;
        if (q > 0) {
            (window as any).__resetQueue = q - 1;
            (window as any).__requestReset?.();
        }
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
