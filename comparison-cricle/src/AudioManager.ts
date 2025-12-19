// src/audio/AudioManager.ts

import { Howl, Howler } from 'howler';

// 1. Định nghĩa Interface cho cấu hình âm thanh
interface SoundConfig {
    src: string;
    loop?: boolean;
    volume?: number;
    html5?: boolean; // thêm dòng này
}

// 2. Đường dẫn gốc tới thư mục audio (tương đối so với index.html trong dist)
// Dùng 'assets/...' thay vì '/assets/...' để khi nhúng game vào sub-folder vẫn load đúng.
const BASE_PATH = 'assets/audio/';

// 3. Ánh xạ ID âm thanh (key) và cấu hình chi tiết
const SOUND_MAP: Record<string, SoundConfig> = {
    // ---- SFX Chung ----
    'sfx_correct': { src: `${BASE_PATH}correct.mp3`, volume: 1.0 },
    'sfx_wrong': { src: `${BASE_PATH}wrong.mp3`, volume: 0.8 },
    'sfx_click': { src: `${BASE_PATH}click.mp3`, volume: 0.8 },
    'voice_rotate': { src: `${BASE_PATH}xoay.mp3`, volume: 0.8 },

    // ---- Correct Answers Voice Prompts ----
    'correct_answer_1': {
        src: `${BASE_PATH}correct_answer_1.mp3`,
        volume: 1.0,
    },
    'correct_answer_2': {
        src: `${BASE_PATH}correct_answer_2.mp3`,
        volume: 1.0,
    },
    'correct_answer_3': {
        src: `${BASE_PATH}correct_answer_3.mp3`,
        volume: 1.0,
    },
    'correct_answer_4': {
        src: `${BASE_PATH}correct_answer_4.mp3`,
        volume: 1.0,
    },

    // ---- Prompt/Voice Prompts (ví dụ) ----
    "bgm_main": {
        src: `${BASE_PATH}bgm_main.mp3`,
        loop: true,
        volume: 0.5, // tuỳ bạn, có thể giữ 1.0
        html5: false,
        },
        
    "complete": { src: `${BASE_PATH}vic_sound.mp3` },
    "voice_intro": { src: `${BASE_PATH}voice_intro.mp3` },
    // ... Thêm các cặp còn lại vào SOUND_MAP ...
    "voice_need_finish": { src: `${BASE_PATH}voice_need_finish.mp3` },

    "voice_complete": { src: `${BASE_PATH}complete.mp3`, volume: 1.0 },
    "fireworks": { src: `${BASE_PATH}fireworks.mp3`, volume: 1.0 },
    "applause": { src: `${BASE_PATH}applause.mp3`, volume: 1.0 },

    // ==== Voice câu hỏi cho Comparison Game ====
    // Hướng dẫn kéo bóng / hoa (màn phụ BalanceScene)
    "add_ball": { src: `${BASE_PATH}add_ball.mp3`, volume: 1.0 },
    "add_cake": { src: `${BASE_PATH}add_cake.mp3`, volume: 1.0 },
    // Bóng bay (BALLOON)
    "more_ball": { src: `${BASE_PATH}more_ball.mp3`, volume: 1.0 },
    "less_ball": { src: `${BASE_PATH}less_ball.mp3`, volume: 1.0 },
    // Bó hoa (FLOWER)
    "more_cake": { src: `${BASE_PATH}more_cake.mp3`, volume: 1.0 },
    "less_cake": { src: `${BASE_PATH}less_cake.mp3`, volume: 1.0 },
};

class AudioManager {
    // Khai báo kiểu dữ liệu cho Map chứa các đối tượng Howl
    private sounds: Record<string, Howl> = {};
    private isLoaded: boolean = false;
    // Lưu thời điểm phát gần nhất của từng âm thanh (ms)
    private lastPlayTimes: Record<string, number> = {};

    
    constructor() {
        // Cấu hình quan trọng cho iOS
        Howler.autoUnlock = true;
        Howler.volume(1.0);
        (Howler as any).html5PoolSize = 100;
    }

    /**
     * Tải tất cả âm thanh
     * @returns {Promise<void>}
     */
    loadAll(): Promise<void> {
        return new Promise((resolve) => {
            const keys = Object.keys(SOUND_MAP);
            let loadedCount = 0;
            const total = keys.length;

            if (total === 0) return resolve();

            keys.forEach((key) => {
                const config = SOUND_MAP[key];

                this.sounds[key] = new Howl({
                    src: [config.src],
                    loop: config.loop ?? false,
                    volume: config.volume ?? 1.0,
                    // Mặc định dùng WebAudio; chỉ bật html5 nếu cấu hình riêng
                    html5: config.html5 ?? true,

                    onload: () => {
                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                    onloaderror: (id: number, error: unknown) => {
                        // Chúng ta vẫn có thể chuyển nó sang string để ghi log nếu muốn
                        const errorMessage =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        console.error(
                            `[Howler Load Error] Key: ${key}, ID: ${id}, Msg: ${errorMessage}. Check file path: ${config.src}`
                        );

                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                });
            });
        });
    }

    /**
     * Phát một âm thanh
     * @param {string} id - ID âm thanh
     * @returns {number | undefined} - Sound ID của Howler
     */
   // src/AudioManager.ts

play(id: string): number | undefined {
  const now = Date.now();
  const cooldown = this.getCooldown(id);
  const lastTime = this.lastPlayTimes[id] ?? 0;

  // Nếu đang trong khoảng cooldown thì bỏ qua, tránh spam
  if (cooldown > 0 && now - lastTime < cooldown) {
    return;
  }

  if (!this.isLoaded || !this.sounds[id]) {
    console.warn(
      `[AudioManager] Sound ID not found or not loaded: ${id}`
    );
    return;
  }

  this.lastPlayTimes[id] = now;

  return this.sounds[id].play();
}

isPlaying(id: string): boolean {
  const sound = this.sounds[id];
  return !!sound && sound.playing();
}



    /**
     * Dừng một âm thanh
     * @param {string} id - ID âm thanh
     */
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

    // Thiết lập cooldown riêng cho từng loại âm thanh (ms)
    private getCooldown(id: string): number {
        switch (id) {
            case 'sfx_click':
                return 200; // chống spam click nút chơi lại
            case 'voice_intro':
                return 3000;
            case 'voice_complete':
            case 'complete':
                return 1500;
            default:
                return 0;
        }
    }

    /**
     * Dừng TẤT CẢ các Prompt và Feedback để tránh chồng chéo giọng nói.
     */
    stopAllVoicePrompts(): void {
        // Cần liệt kê tất cả các ID giọng nói/prompt có thể chạy cùng lúc
        const voiceKeys = Object.keys(SOUND_MAP).filter(
            (key) =>
                key.startsWith('prompt_') || key.startsWith('correct_answer_')
        );

        voiceKeys.forEach((key) => {
            this.stopSound(key);
        });

        // Hoặc bạn có thể dùng: Howler.stop(); để dừng TẤT CẢ âm thanh (thận trọng khi dùng)
    }

    // Hàm tiện ích: Dùng để lấy ngẫu nhiên một trong 4 câu trả lời đúng
    playCorrectAnswer(): void {
        // Phaser.Math.Between(min, max) -> thay thế bằng hàm Math.random thuần túy hoặc import từ Phaser
        const randomIndex = Math.floor(Math.random() * 4) + 1;
        this.play(`correct_answer_${randomIndex}`);
    }

    // Hàm tiện ích: Dùng để phát lời nhắc (ví dụ: 'prompt_more_cat')
    playPrompt(type: 'less' | 'more', animal: string): void {
        const id = `prompt_${type}_${animal}`;
        this.play(id);
    }
}

// Xuất phiên bản duy nhất (Singleton)
export default new AudioManager();
