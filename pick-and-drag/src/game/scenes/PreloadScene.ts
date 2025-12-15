    import Phaser from 'phaser';
    import type { LessonPackage } from '../types/lesson';
    import AudioManager from '../../audio/AudioManager';

    const DEFAULT_LESSON_ID = 'size_basic_01';
    const MAX_QUESTIONS = 5;
    const FIRST_VOICE_FALLBACK_MS = 1400;

    declare global {
    interface Window {
        phaserBgm?: Phaser.Sound.BaseSound;
    }
    }

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

        // ===== BGM (PHASER) =====
        this.load.audio('bgm_main', 'audio/sfx/bgm_main.mp3');
    }

    async create() {
        const rawLesson = this.cache.json.get('lessonData') as LessonPackage;

        // 1️⃣ chỉ giữ câu 2 lựa chọn
        let items = rawLesson.items.filter((it) => it.options.length === 2);
        if (items.length === 0) items = rawLesson.items.slice();

        // 2️⃣ shuffle + cắt max
        items = Phaser.Utils.Array.Shuffle(items.slice()).slice(0, MAX_QUESTIONS);

        // 3️⃣ shuffle options
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
        // 4️⃣ load audio Howler + ảnh động
        await AudioManager.loadAll();
        await this.preloadDynamicAssets(lessonForPlay);

        // 5️⃣ PRELOAD VOICE CÂU 1 (QUAN TRỌNG)
        await this.preloadFirstPromptVoice(lessonForPlay);

        this.lessonData = lessonForPlay;

        // 6️⃣ vẽ LessonScene trước
        this.scene.start('LessonScene', { lesson: this.lessonData });

        // 7️⃣ voice câu 1 → xong mới bật BGM
        this.playFirstPromptThenBgm();
        } catch (e) {
        console.error('Preload error:', e);
        this.scene.start('LessonScene', { lesson: lessonForPlay });
        this.safeStartBgm();
        }
    }

    // ===== LOAD ẢNH ĐỘNG =====
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

    // ===== PRELOAD VOICE CÂU 1 =====
    private preloadFirstPromptVoice(lesson: LessonPackage): Promise<void> {
        const firstItem = lesson.items?.[0];
        const voice =
        firstItem?.promptAudio || lesson.defaultPromptAudio || null;

        if (!voice) return Promise.resolve();

        return new Promise<void>((resolve) => {
        const anyAM: any = AudioManager;

        if (anyAM.dynamicSounds?.[voice]) {
            resolve();
            return;
        }

        const howl = new (window as any).Howl({
            src: [voice],
            html5: true,
            preload: true,
            onload: () => resolve(),
            onloaderror: () => resolve(),
        });

        anyAM.dynamicSounds ??= {};
        anyAM.dynamicSounds[voice] = howl;
        });
    }

    // ===== VOICE → BGM =====
    private playFirstPromptThenBgm() {
        const firstItem = this.lessonData.items?.[0];
        const firstVoice =
        firstItem?.promptAudio || this.lessonData.defaultPromptAudio || null;

        if (!firstVoice) {
        this.safeStartBgm();
        return;
        }

        const handle: any = AudioManager.playOneShot(firstVoice, 1.0);

        if (handle && typeof handle.once === 'function') {
        handle.once('end', () => this.safeStartBgm());
        } else {
        this.time.delayedCall(FIRST_VOICE_FALLBACK_MS, () =>
            this.safeStartBgm()
        );
        }

        // unlock autoplay mobile
        this.input.once('pointerdown', () => {
        if (!window.phaserBgm || !window.phaserBgm.isPlaying) {
            this.safeStartBgm();
        }
        });
    }

    // ===== BGM (PHASER) =====
    private safeStartBgm() {
        if (window.phaserBgm && window.phaserBgm.isPlaying) return;

        const bgm = this.sound.add('bgm_main', {
        loop: true,
        volume: 0.4,
        });

        bgm.play();
        window.phaserBgm = bgm;
    }
    }
