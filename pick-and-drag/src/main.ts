    import Phaser from 'phaser';
    import { gameConfig } from './game/config';
    import { initRotateOrientation } from './rotateOrientation';
    import AudioManager from './audio/AudioManager'; // ✅ nếu path khác thì sửa lại

    declare global {
    interface Window {
        lessonScene?: any;
        hintScene?: any;

        // (tuỳ chọn) để debug / chia sẻ state
        __currentLesson?: any;
        __currentLessonId?: string;
        __lessonPool?: string[];

        __lastResetAt?: number;

        game?: Phaser.Game;
    }
    }

    function startGame() {
    const game = new Phaser.Game(gameConfig);
    window.game = game;

    setTimeout(() => {
        if (!window.game) return;
        initRotateOrientation(window.game, {
        mainSceneKey: 'LessonSelectScene',
        overlaySceneKey: null,
        });
    }, 100);

    resizeGame();
    updateUIButtonScale();
    }

    // Chờ load font 'Baloo 2' trước khi khởi tạo game để tránh FOIT/FOUT
    if (document.fonts && document.fonts.load) {
    document.fonts.load('700 32px "Baloo 2"').then(() => startGame());
    } else {
    startGame();
    }

    function resizeGame() {
    const gameDiv = document.getElementById('game-container');
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (gameDiv) {
        gameDiv.style.transform = '';
        gameDiv.style.width = `${w}px`;
        gameDiv.style.height = `${h}px`;
    }
    }

    window.addEventListener('resize', () => {
    resizeGame();
    updateUIButtonScale();
    });
    window.addEventListener('orientationchange', () => {
    resizeGame();
    updateUIButtonScale();
    });

    function updateUIButtonScale() {
    const container = document.getElementById('game-container');
    const resetBtn = document.getElementById('btn-reset') as HTMLImageElement | null;

    if (!container || !resetBtn) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scale = Math.min(w, h) / 720;
    const baseSize = 80;
    const newSize = baseSize * scale;

    resetBtn.style.width = `${newSize}px`;
    resetBtn.style.height = 'auto';
    }

    export function showGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (!reset) return;
    reset.style.display = 'block';
    updateUIButtonScale();
    }

    export function hideGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (!reset) return;
    reset.style.display = 'none';
    }

    // ✅ RESET: bấm là về PreloadScene để nó random lesson + load json lại
    document.getElementById('btn-reset')?.addEventListener('click', () => {
    const game = window.game;
    if (!game) return;

    // chống double fire quá nhanh (touch/click)
    const now = Date.now();
    if (window.__lastResetAt && now - window.__lastResetAt < 120) return;
    window.__lastResetAt = now;

    // dừng voice/sfx (giữ BGM tuỳ bạn)
    try {
        AudioManager.stopAllExceptBgm();
    } catch {}

    const sm = game.scene;

    // stop các scene gameplay có thể đang mở
    const scenesToStop = ['HintScene', 'SummaryScene', 'LessonScene', 'PreloadScene'];
    for (const key of scenesToStop) {
        const s = sm.getScene(key) as Phaser.Scene | null;
        if (s && s.scene?.isActive()) sm.stop(key);
    }

    // ✅ quay về preload (PreloadScene sẽ pick random lessonId + load json)
    sm.start('PreloadScene');
    });
