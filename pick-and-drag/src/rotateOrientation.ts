// src/rotateOrientation.ts
import Phaser from 'phaser';
import AudioManager from './audio/AudioManager';

// ================== STATE CHUNG ==================
let gameRef: Phaser.Game | null = null;
let mainSceneKey = 'LessonSelectScene';
let overlaySceneKey: string | null = 'OverlayScene';

let rotateOverlay: HTMLDivElement | null = null;
let isRotateOverlayActive = false;

// Không còn dùng trực tiếp Phaser.Sound ở đây;
// mọi âm thanh xoay màn hình dùng Howler qua AudioManager.

// ================== UI OVERLAY XOAY NGANG ==================
function ensureRotateOverlay() {
    if (rotateOverlay) return;

    rotateOverlay = document.createElement('div');
    rotateOverlay.id = 'rotate-overlay';
    rotateOverlay.style.position = 'fixed';
    rotateOverlay.style.inset = '0';
    rotateOverlay.style.zIndex = '9999';
    rotateOverlay.style.display = 'none';
    rotateOverlay.style.alignItems = 'center';
    rotateOverlay.style.justifyContent = 'center';
    rotateOverlay.style.textAlign = 'center';
    rotateOverlay.style.background = 'rgba(0, 0, 0, 0.6)';
    rotateOverlay.style.padding = '16px';
    rotateOverlay.style.boxSizing = 'border-box';

    const box = document.createElement('div');
    box.style.background = 'white';
    box.style.borderRadius = '16px';
    box.style.padding = '16px 20px';
    box.style.maxWidth = '320px';
    box.style.margin = '0 auto';
    box.style.fontFamily =
        '"Fredoka", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    box.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';

    const title = document.createElement('div');
    title.textContent = 'Bé Hãy Xoay Ngang Màn Hình Để Chơi Nhé 🌈';
    title.style.fontSize = '18px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '8px';
    title.style.color = '#222';

    box.appendChild(title);
    rotateOverlay.appendChild(box);
    document.body.appendChild(rotateOverlay);
}

// ================== CORE LOGIC XOAY + ÂM THANH ==================
function updateRotateHint() {
    ensureRotateOverlay();
    if (!rotateOverlay) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const shouldShow = h > w && w < 768; // portrait & nhỏ

    const overlayWasActive = isRotateOverlayActive;
    isRotateOverlayActive = shouldShow;

    const overlayTurnedOn = !overlayWasActive && shouldShow;
    const overlayTurnedOff = overlayWasActive && !shouldShow;

    rotateOverlay.style.display = shouldShow ? 'flex' : 'none';

    if (overlayTurnedOn) {
        const tryPlayVoiceRotate = () => {
            AudioManager.play('voice_rotate');
        };
        tryPlayVoiceRotate();
    }

    if (overlayTurnedOff) {
        AudioManager.stop('voice_rotate');
    }
}

// ================== KHỞI TẠO HỆ THỐNG XOAY ==================
export function initRotateOrientation(
    game: Phaser.Game,
    options?: {
        mainSceneKey?: string;
        overlaySceneKey?: string | null;
    }
) {
    gameRef = game;
    if (options?.mainSceneKey) mainSceneKey = options.mainSceneKey;
    if (options && 'overlaySceneKey' in options) {
        overlaySceneKey = options.overlaySceneKey ?? null;
    }

    ensureRotateOverlay();
    updateRotateHint();

    window.addEventListener('resize', updateRotateHint);
    window.addEventListener('orientationchange', updateRotateHint as any);

    window.addEventListener('pointerdown', () => {
        if (!isRotateOverlayActive) return;
        try {
            AudioManager.play('voice_rotate');
        } catch {}
    });
}
