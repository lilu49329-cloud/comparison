// src/games/shared/audioUtils.ts
import Phaser from 'phaser';

/**
 * Phát random 1 voice trong danh sách keys.
 * Tự ưu tiên dùng playVoiceLocked nếu có (để tránh chồng âm).
 */
export function playRandomVoice(
    sound: Phaser.Sound.BaseSoundManager,
    voiceKeys: string[]
    ) {
    if (!voiceKeys || voiceKeys.length === 0) return;

    const randomIndex = Math.floor(Math.random() * voiceKeys.length);
    const voiceKey = voiceKeys[randomIndex];

    try {
        // Nếu project đã có hàm khóa voice chung
        const anyWindow = window as any;
        if (anyWindow.playVoiceLocked) {
        anyWindow.playVoiceLocked(sound, voiceKey);
        } else {
        sound.play(voiceKey);
        }
    } catch (e) {
        console.warn('[audioUtils] Không phát được voice:', voiceKey, e);
    }
}
