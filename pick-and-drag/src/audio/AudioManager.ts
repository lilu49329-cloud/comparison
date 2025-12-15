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

    complete: { src: `${BASE_PATH}sfx/complete.mp3`, html5: false },
    fireworks: { src: `${BASE_PATH}sfx/fireworks.mp3`, html5: false },
    applause: { src: `${BASE_PATH}sfx/applause.mp3`, html5: false },

    'sfx-click': {
        src: `${BASE_PATH}sfx/click.mp3`,
        volume: 0.9,
        html5: false,
    },
    correct: {
        src: `${BASE_PATH}sfx/correct.mp3`,
        volume: 1.0,
        html5: false,
    },
    wrong: {
        src: `${BASE_PATH}sfx/wrong.mp3`,
        volume: 0.9,
        html5: false,
    },

    correct_answer_1: {
        src: `${BASE_PATH}sfx/correct_answer_1.mp3`,
        volume: 1.0,
        html5: false,
    },
    correct_answer_2: {
        src: `${BASE_PATH}sfx/correct_answer_2.mp3`,
        volume: 1.0,
        html5: false,
    },
    correct_answer_3: {
        src: `${BASE_PATH}sfx/correct_answer_3.mp3`,
        volume: 1.0,
        html5: false,
    },
    correct_answer_4: {
        src: `${BASE_PATH}sfx/correct_answer_4.mp3`,
        volume: 1.0,
        html5: false,
    },

    voice_rotate: { src: `${BASE_PATH}sfx/rotate.mp3`, volume: 0.9 },
};

class AudioManager {
    private sounds: Record<string, Howl> = {};
    private isLoaded = false;

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
}

export default new AudioManager();
