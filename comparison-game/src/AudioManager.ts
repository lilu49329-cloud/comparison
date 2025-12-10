// src/audio/AudioManager.ts

import { Howl, Howler } from 'howler';

// 1. Định nghĩa Interface cho cấu hình âm thanh
interface SoundConfig {
    src: string;
    loop?: boolean;
    volume?: number;
}

// 2. Đường dẫn gốc chuẩn cho public/assets
const AUDIO_PATH = 'assets/audio/'; // Chuẩn hóa cho audio

// 3. Ánh xạ ID âm thanh (key) và cấu hình chi tiết
const SOUND_MAP: Record<string, SoundConfig> = {
    // ---- BGM & SFX ----
    bgm_main: { src: `${AUDIO_PATH}bgm_main.mp3`, loop: true, volume: 0.4 },
    'sfx-correct': { src: `${AUDIO_PATH}correct.mp3`, volume: 1.0 },
    'sfx-wrong': { src: `${AUDIO_PATH}wrong.mp3`, volume: 0.8 },
    'sfx-click': { src: `${AUDIO_PATH}click.mp3`, volume: 0.8 },
    'voice-rotate': { src: `${AUDIO_PATH}xoay.mp3`, volume: 0.8 },

    // ---- Correct Answers Voice Prompts ----
    'correct-answer-1': {
        src: `${AUDIO_PATH}correct_answer_1.mp3`,
        volume: 1.0,
    },
    'correct-answer-2': {
        src: `${AUDIO_PATH}correct_answer_2.mp3`,
        volume: 1.0,
    },
    'correct-answer-3': {
        src: `${AUDIO_PATH}correct_answer_3.mp3`,
        volume: 1.0,
    },
    'correct-answer-4': {
        src: `${AUDIO_PATH}correct_answer_4.mp3`,
        volume: 1.0,
    },

    // ---- Voice câu hỏi banner ----
    q_balloon_more: { src: `${AUDIO_PATH}more_b.mp3`, volume: 1.0 },
    q_balloon_less: { src: `${AUDIO_PATH}less_b.mp3`, volume: 1.0 },
    q_flower_more: { src: `${AUDIO_PATH}more_f.mp3`, volume: 1.0 },
    q_flower_less: { src: `${AUDIO_PATH}less_f.mp3`, volume: 1.0 },

    // ---- Voice hướng dẫn kéo ----
    drag_balloon: { src: `${AUDIO_PATH}keo_bong.mp3` },
    drag_flower: { src: `${AUDIO_PATH}keo_hoa.mp3` },

    // ---- Voice end/game ----
    voice_need_finish: { src: `${AUDIO_PATH}finish.mp3` },
    voice_complete: { src: `${AUDIO_PATH}complete.mp3` },
    voice_end: { src: `${AUDIO_PATH}voice_end.mp3` },

    // ---- Hiệu ứng kết thúc ----
    complete: { src: `${AUDIO_PATH}vic_sound.mp3`, volume: 1.0 },
    fireworks: { src: `${AUDIO_PATH}fireworks.mp3`, volume: 1.0 },
    applause: { src: `${AUDIO_PATH}applause.mp3`, volume: 1.0 },
};

// Các key âm thanh quan trọng cho màn đầu (ưu tiên preload)
const AUDIO_KEYS_MAIN_STAGE: string[] = [
    'bgm_main',
    'sfx-correct',
    'sfx-wrong',
    'sfx-click',
    'voice-rotate',
    'correct-answer-1',
    'correct-answer-2',
    'correct-answer-3',
    'correct-answer-4',
    'q_balloon_more',
    'q_balloon_less',
    'q_flower_more',
    'q_flower_less',
    'drag_balloon',
    'drag_flower',
];

class AudioManager {
    private sounds: Record<string, Howl> = {};
    private isLoaded = false;
    private lastLoadErrors: string[] = [];

    constructor() {
        // Cấu hình quan trọng cho iOS
        Howler.autoUnlock = true;
        Howler.volume(1.0);
    }

    /**
     * Tải các âm thanh cần thiết (tối ưu cho từng scene)
     * @param keysToLoad - chỉ load các key này, nếu không truyền sẽ load các key quan trọng cho màn đầu
     * Muốn load tất cả: truyền Object.keys(SOUND_MAP)
     */
    loadAll(keysToLoad?: string[]): Promise<void> {
        return new Promise((resolve) => {
            const keys =
                keysToLoad && keysToLoad.length > 0
                    ? keysToLoad
                    : AUDIO_KEYS_MAIN_STAGE;

            let loadedCount = 0;
            const total = keys.length;
            this.lastLoadErrors = [];
            const t0 = performance.now();

            if (total === 0) return resolve();

            keys.forEach((key: string) => {
                const config = SOUND_MAP[key];
                if (!config) {
                    loadedCount++;
                    if (loadedCount === total) {
                        this.isLoaded = true;
                        resolve();
                    }
                    return;
                }

                this.sounds[key] = new Howl({
                    src: [config.src],
                    loop: config.loop || false,
                    volume: config.volume ?? 1.0,
                    onload: () => {
                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            const t1 = performance.now();
                            if (this.lastLoadErrors.length > 0) {
                                console.warn(
                                    '[AudioManager] Một số file âm thanh lỗi:',
                                    this.lastLoadErrors
                                );
                            }
                            console.log(
                                `[AudioManager] Đã load xong ${total} file âm thanh trong ${(t1 - t0).toFixed(
                                    0
                                )}ms.`
                            );
                            resolve();
                        }
                    },
                    onloaderror: (id: number, error: unknown) => {
                        const errorMessage =
                            error instanceof Error
                                ? error.message
                                : String(error);
                        const msg = `[Howler Load Error] Key: ${key}, ID: ${id}, Msg: ${errorMessage}. Check file path: ${config.src}`;
                        console.error(msg);
                        this.lastLoadErrors.push(msg);
                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            const t1 = performance.now();
                            if (this.lastLoadErrors.length > 0) {
                                console.warn(
                                    '[AudioManager] Một số file âm thanh lỗi:',
                                    this.lastLoadErrors
                                );
                            }
                            console.log(
                                `[AudioManager] Đã load xong ${total} file âm thanh trong ${(t1 - t0).toFixed(
                                    0
                                )}ms.`
                            );
                            resolve();
                        }
                    },
                });
            });
        });
    }

    /**
     * Lazy load một file âm thanh phụ khi cần (ví dụ: hiệu ứng kết thúc, applause...)
     */
    loadSingle(key: string): Promise<void> {
        return new Promise((resolve) => {
            if (this.sounds[key]) return resolve();
            const config = SOUND_MAP[key];
            if (!config) return resolve();
            this.sounds[key] = new Howl({
                src: [config.src],
                loop: config.loop || false,
                volume: config.volume ?? 1.0,
                onload: () => resolve(),
                onloaderror: () => resolve(),
            });
        });
    }

    /**
     * Phát một âm thanh
     */
    play(id: string): number | undefined {
        if (!this.isLoaded) {
            console.warn(`[AudioManager] Sound system not loaded yet: ${id}`);
            return;
        }
        if (!this.sounds[id]) {
            console.warn(`[AudioManager] Sound ID not found: ${id}`);
            return;
        }
        try {
            return this.sounds[id].play();
        } catch (e) {
            console.error(`[AudioManager] Failed to play sound: ${id}`, e);
            return;
        }
    }

    stop(id: string): void {
        if (!this.isLoaded || !this.sounds[id]) return;
        this.sounds[id].stop();
    }

    stopSound(id: string): void {
        if (this.sounds[id]) {
            this.sounds[id].stop();
        }
    }

    stopAll(): void {
        Howler.stop();
    }

    /**
     * Dừng TẤT CẢ các Prompt và Feedback để tránh chồng chéo giọng nói.
     */
    stopAllVoicePrompts(): void {
        const voiceKeys = Object.keys(SOUND_MAP).filter(
            (key) =>
                key.startsWith('prompt_') ||
                key.startsWith('correct-answer-')
        );

        voiceKeys.forEach((key) => {
            this.stopSound(key);
        });
    }

    // Hàm tiện ích: Dùng để lấy ngẫu nhiên một trong 4 câu trả lời đúng
    playCorrectAnswer(): void {
        const randomIndex = Math.floor(Math.random() * 4) + 1;
        this.play(`correct-answer-${randomIndex}`);
    }

    // Hàm tiện ích: Dùng để phát lời nhắc (ví dụ: 'prompt_more_cat')
    playPrompt(type: 'less' | 'more', animal: string): void {
        const id = `prompt_${type}_${animal}`;
        this.play(id);
    }
}

export default new AudioManager();
