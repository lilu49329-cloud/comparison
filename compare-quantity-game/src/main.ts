import Phaser from 'phaser';
import { CompareScene } from './scenes/CompareScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280, // chuẩn 16:9
    height: 720,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    scene: [CompareScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        pixelArt: false,
        antialias: true,
        transparent: true,
    },
};

new Phaser.Game(config);

// --- Xử lý xoay ngang trên mobile ---
function resizeGame() {
    const gameDiv = document.getElementById('game-container')!;
    const rotateMsg = document.getElementById('rotate-msg')!;

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (h > w) {
        // Điện thoại dọc → hiển thị overlay
        rotateMsg.style.display = 'block';
        gameDiv.style.transform = 'rotate(90deg)';
        gameDiv.style.transformOrigin = 'center center';
        gameDiv.style.width = `${h}px`;
        gameDiv.style.height = `${w}px`;
    } else {
        // Landscape → ẩn overlay
        rotateMsg.style.display = 'none';
        gameDiv.style.transform = '';
        gameDiv.style.width = `${w}px`;
        gameDiv.style.height = `${h}px`;
    }
}

// Gọi lần đầu
resizeGame();
