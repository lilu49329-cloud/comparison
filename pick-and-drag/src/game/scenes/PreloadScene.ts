    // src/game/scenes/PreloadScene.ts
    import Phaser from 'phaser';
    import type { LessonPackage } from '../types/lesson';
    import AudioManager from '../../audio/AudioManager';

    const DEFAULT_LESSON_ID = 'size_basic_01';
    const MAX_QUESTIONS = 5;

    // fallback delay nếu không có hook onend cho voice
    const FIRST_VOICE_FALLBACK_MS = 1400;

    export class PreloadScene extends Phaser.Scene {
    private lessonData!: LessonPackage;

    constructor() {
        super('PreloadScene');
    }

    preload() {
        // === UI CHUNG ===
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
        if (this.cache.json.exists('lessonData')) {
        this.cache.json.remove('lessonData');
        }
        this.load.json('lessonData', `lessons/${DEFAULT_LESSON_ID}.json`);
    }

    create() {
        const rawLesson = this.cache.json.get('lessonData') as LessonPackage;

        // 1) chỉ giữ câu 2 lựa chọn
        let filteredItems = rawLesson.items.filter((it) => it.options.length === 2);
        if (filteredItems.length === 0) filteredItems = rawLesson.items.slice();

        // 2) shuffle + cắt max 5
        filteredItems = Phaser.Utils.Array.Shuffle(filteredItems.slice()).slice(
        0,
        MAX_QUESTIONS
        );

        // 3) shuffle options trong từng câu (2 lựa chọn)
        const randomizedItems = filteredItems.map((item) => ({
        ...item,
        options:
            item.options.length === 2
            ? Phaser.Utils.Array.Shuffle(item.options.slice())
            : item.options,
        }));

        const lessonForPlay: LessonPackage = { ...rawLesson, items: randomizedItems };

        // ✅ Flow load
        AudioManager.loadAll()
        .then(() => this.preloadDynamicAssets(lessonForPlay))
        .then(() => {
            this.lessonData = lessonForPlay;

            // Start LessonScene trước để vẽ UI
            this.scene.start('LessonScene', { lesson: this.lessonData });

            // Play voice câu 1, xong mới bật bgm
            this.playFirstPromptThenBgm();
        })
        .catch((e) => {
            console.error('Preload failed:', e);
            // fallback vẫn vào game
            this.scene.start('LessonScene', { lesson: lessonForPlay });
            this.safeStartBgm();
        });
    }

    /**
     * Load tất cả ảnh động (lesson options + promptImage + hint promptImage) và start loader 1 lần.
     */
    private preloadDynamicAssets(lesson: LessonPackage) {
        // --- lesson assets
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

        // --- hint prompt assets
        const rawHint = this.cache.json.get('size_hint') as any;
        if (rawHint?.items && Array.isArray(rawHint.items)) {
        rawHint.items.forEach((it: any) => {
            if (it.promptImage && !this.textures.exists(it.promptImage)) {
            this.load.image(it.promptImage, it.promptImage);
            }
        });
        }

        // Phaser loader: nếu không có file mới -> resolve luôn
        if (this.load.totalToLoad === 0) return Promise.resolve();

        return new Promise<void>((resolve) => {
        this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
        this.load.start();
        });
    }

    /**
     * Phát voice câu 1, khi voice kết thúc thì bật BGM.
     * Có fallback delay + kick bằng pointerdown để chống autoplay block.
     */
    private playFirstPromptThenBgm() {
        const firstItem = this.lessonData.items?.[0];
        const firstVoice =
        firstItem?.promptAudio || this.lessonData.defaultPromptAudio || null;

        // nếu không có voice -> bật bgm luôn
        if (!firstVoice) {
        this.safeStartBgm();
        this.registry.set('played_first_prompt', true);
        return;
        }

        // đảm bảo bgm chưa chạy (nếu AudioManager có stop)
        if ((AudioManager as any).stop) {
        (AudioManager as any).stop('bgm_main');
        }

        // cố gắng lấy onend từ AudioManager nếu có
        const tryHookOnEnd = () => {
        // Nếu AudioManager.playOneShot trả về Howl/handle có .once('end')
        // hoặc AudioManager có API kiểu playOneShotWithOnEnd
        const anyAM: any = AudioManager;

        // Option A: AudioManager.playOneShotWithOnEnd(key, vol, cb)
        if (typeof anyAM.playOneShotWithOnEnd === 'function') {
            anyAM.playOneShotWithOnEnd(firstVoice, 1.0, () => {
            this.safeStartBgm();
            });
            return true;
        }

        // Option B: AudioManager.playOneShot(...) trả về sound handle
        const handle = anyAM.playOneShot(firstVoice, 1.0);
        if (handle && typeof handle.once === 'function') {
            // howler: howl.once('end', cb)
            handle.once('end', () => {
            this.safeStartBgm();
            });
            return true;
        }

        // default: vẫn play được, nhưng không hook được end
        // (vẫn đảm bảo đã play)
        return false;
        };

        const hooked = tryHookOnEnd();

        // fallback: delay bật bgm nếu không hook được end
        if (!hooked) {
        this.time.delayedCall(FIRST_VOICE_FALLBACK_MS, () => {
            this.safeStartBgm();
        });
        }

        // kick iOS/Android autoplay block (BGM loop hay bị chặn)
        this.input.once('pointerdown', () => {
        if (!AudioManager.isPlaying('bgm_main')) {
            this.safeStartBgm();
        }
        });

        this.registry.set('played_first_prompt', true);
    }

    /**
     * Bật BGM chắc chắn: play + retry 1 lần.
     */
    private safeStartBgm() {
        AudioManager.play('bgm_main');

        // retry 1 nhịp nếu chưa lên
        this.time.delayedCall(300, () => {
        if (!AudioManager.isPlaying('bgm_main')) {
            AudioManager.play('bgm_main');
        }
        });
    }
    }
