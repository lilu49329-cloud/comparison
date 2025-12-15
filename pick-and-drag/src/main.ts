
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { initRotateOrientation } from './rotateOrientation';

declare global {
    interface Window {
        lessonScene: any;
        game: Phaser.Game; // ✅ thêm dòng này
    }
}



function startGame() {
    // Khởi tạo game sau khi font đã sẵn sàng
    const game = new Phaser.Game(gameConfig);
    window["game"] = game;
}

// Chờ load font 'Baloo 2' trước khi khởi tạo game để tránh FOIT/FOUT
if (document.fonts && document.fonts.load) {
    document.fonts.load('700 32px "Baloo 2"').then(() => {
        startGame();
    });
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
});
window.addEventListener('orientationchange', () => {
    resizeGame();
});

function updateUIButtonScale() {
    const container = document.getElementById('game-container')!;
    const resetBtn = document.getElementById('btn-reset') as HTMLImageElement;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // base height = 720 (game design gốc)
    const scale = Math.min(w, h) / 720;

    const baseSize = 80; // kích thước nút thiết kế gốc (80px)
    const newSize = baseSize * scale;

    resetBtn.style.width = `${newSize}px`;
    resetBtn.style.height = 'auto';
}

export function showGameButtons() {
    const reset = document.getElementById('btn-reset');

    reset!.style.display = 'block';
}

export function hideGameButtons() {
    const reset = document.getElementById('btn-reset');

    reset!.style.display = 'none';
}


// Khởi tạo xoay màn hình sau khi game đã được tạo
// Đảm bảo gọi sau khi game đã khởi tạo
setTimeout(() => {
    initRotateOrientation(window["game"], {
        mainSceneKey: 'LessonSelectScene',
        overlaySceneKey: null,
    });
}, 100);

// Scale nút
updateUIButtonScale();
window.addEventListener('resize', updateUIButtonScale);
window.addEventListener('orientationchange', updateUIButtonScale);

document.getElementById('btn-reset')?.addEventListener('click', () => {
    window.lessonScene?.restartLevel();
});