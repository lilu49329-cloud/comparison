import { Howl, Howler } from 'howler';

interface SoundConfig {
    src: string;
    loop?: boolean;
    volume?: number;
    html5?: boolean;
}

const BASE_PATH = 'audio/';

const SOUND_MAP: Record<string, SoundConfig> = {
    bgm_main: {
        src: `${BASE_PATH}sfx/bgm_main.mp3`,
        loop: true,
        volume: 0.4,
        html5: false,
    },

    // Các SFX / voice chạy bằng HTML5 Audio để phù hợp policy iOS
    complete: { src: `${BASE_PATH}sfx/complete.mp3`, html5: true },
    fireworks: { src: `${BASE_PATH}sfx/fireworks.mp3`, html5: true },
    applause: { src: `${BASE_PATH}sfx/applause.mp3`, html5: true },

    'sfx-click': {
        src: `${BASE_PATH}sfx/click.mp3`,
        volume: 0.9,
        html5: true,
    },
    correct: {
        src: `${BASE_PATH}sfx/correct.mp3`,
        volume: 1.0,
        html5: true,
    },
    wrong: {
        src: `${BASE_PATH}sfx/wrong.mp3`,
        volume: 0.9,
        html5: true,
    },

    correct_answer_1: {
        src: `${BASE_PATH}sfx/correct_answer_1.mp3`,
        volume: 1.0,
        html5: true,
    },
    correct_answer_2: {
        src: `${BASE_PATH}sfx/correct_answer_2.mp3`,
        volume: 1.0,
        html5: true,
    },
    correct_answer_3: {
        src: `${BASE_PATH}sfx/correct_answer_3.mp3`,
        volume: 1.0,
        html5: true,
    },
    correct_answer_4: {
        src: `${BASE_PATH}sfx/correct_answer_4.mp3`,
        volume: 1.0,
        html5: true,
    },

    voice_rotate: { src: `${BASE_PATH}sfx/rotate.mp3`, volume: 0.9 },
};

class AudioManager {
    private sounds: Record<string, Howl> = {};
    private isLoaded = false;
    private dynamicSounds: Record<string, Howl> = {};

    constructor() {
        Howler.autoUnlock = true;
        Howler.volume(1.0);
        (Howler as any).html5PoolSize = 32;
    }

    loadAll(): Promise<void> {
        return new Promise((resolve) => {
            const keys = Object.keys(SOUND_MAP);
            if (keys.length === 0) {
                this.isLoaded = true;
                resolve();
                return;
            }

            let loadedCount = 0;
            const total = keys.length;

            keys.forEach((key) => {
                const cfg = SOUND_MAP[key];

                this.sounds[key] = new Howl({
                    src: [cfg.src],
                    loop: cfg.loop ?? false,
                    volume: cfg.volume ?? 1.0,
                    html5: cfg.html5 ?? true,
                    onload: () => {
                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                    onloaderror: (id, err) => {
                        console.warn(
                            `[Howler Load Error] key=${key}, id=${id}, err=${err}, src=${cfg.src}`
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

    play(id: string): number | undefined {
        const sound = this.sounds[id];
        if (!this.isLoaded || !sound) {
            console.warn(
                `[AudioManager] Sound not ready or not found: ${id}`
            );
            return;
        }
        return sound.play();
    }

    isPlaying(id: string): boolean {
        const sound = this.sounds[id];
        return !!sound && sound.playing();
    }

    stop(id: string): void {
        const sound = this.sounds[id];
        if (!sound) return;
        sound.stop();
    }

    stopAll(): void {
        Howler.stop();
    }

    playRandomCorrectAnswer(): void {
        const index = Math.floor(Math.random() * 4) + 1;
        this.play(`correct_answer_${index}`);
    }

    /**
     * Phát 1 file audio bất kỳ (thường dùng cho promptText, hint...),
     * không cần khai báo trước trong SOUND_MAP.
     * key ở đây chính là đường dẫn file (vd: 'audio/size/pencil-s.mp3').
     */
    playOneShot(path: string, volume = 1.0): number | undefined {
        if (!path) return;

        // HTMLMediaElement.volume chỉ cho phép [0, 1]
        const safeVolume = Math.max(0, Math.min(volume, 1));

        let snd = this.dynamicSounds[path];
        if (!snd) {
            snd = new Howl({
                src: [path],
                volume: safeVolume,
                html5: true,
            });
            this.dynamicSounds[path] = snd;
        } else {
            snd.volume(safeVolume);
        }

        return snd.play();
    }

    stopAllExceptBgm(): void {
        // Dừng tất cả SFX / voice, nhưng giữ nguyên trạng thái bgm_main
        Object.entries(this.sounds).forEach(([id, snd]) => {
            if (id === 'bgm_main') return;
            snd.stop();
        });

        // Dừng luôn các dynamic one-shot (prompt, hint, ...)
        Object.values(this.dynamicSounds).forEach((snd) => {
            snd.stop();
        });
    }
}

export default new AudioManager();
