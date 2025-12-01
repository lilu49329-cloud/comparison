// src/game/domBackground.ts

// Map key -> url ảnh background
const bgByKey: Record<string, string> = {
    // bạn tự chỉnh map này, ví dụ:
    HEIGHT: 'assets/bg/bg_forest.webp',
    LENGTH: 'assets/bg/bg_home.webp',
    SIZE: 'assets/bg/bg_sea.webp',
    DEFAULT: 'assets/bg/bg_forest.webp',
};

const FALLBACK_BG = bgByKey.DEFAULT;

export class DomBackgroundManager {
    private bgLayerA: HTMLDivElement | null = null;
    private bgLayerB: HTMLDivElement | null = null;
    private isBgAActive = true;
    private initialized = false;

    init() {
        if (this.initialized) return;

        this.bgLayerA = document.getElementById(
            'bg-layer-a'
        ) as HTMLDivElement | null;
        this.bgLayerB = document.getElementById(
            'bg-layer-b'
        ) as HTMLDivElement | null;

        if (!this.bgLayerA || !this.bgLayerB) {
            console.warn(
                '[DomBackgroundManager] bg-layer-a/b not found in DOM'
            );
            return;
        }

        this.bgLayerA.classList.add('visible');
        this.bgLayerB.classList.remove('visible');

        this.initialized = true;
    }

    /**
     * Gọi hàm này với 1 "key" bất kỳ (lessonId, concept, icon...)
     * Nó sẽ chọn url theo bgByKey, fade cross 2 layer.
     */
    setBackgroundByKey(key: string) {
        if (!this.initialized) this.init();
        if (!this.bgLayerA || !this.bgLayerB) return;

        const url = bgByKey[key] ?? FALLBACK_BG;

        const active = this.isBgAActive ? this.bgLayerA : this.bgLayerB;
        const hidden = this.isBgAActive ? this.bgLayerB : this.bgLayerA;

        const currentBg = active.style.backgroundImage;
        const targetBg = `url("${url}")`;

        // giống logic bạn: cùng ảnh thì khỏi đổi
        if (currentBg === targetBg) return;

        hidden.style.backgroundImage = targetBg;

        hidden.classList.add('visible');
        active.classList.remove('visible');

        this.isBgAActive = !this.isBgAActive;
    }
}

// singleton cho tiện xài trong scene
export const domBackgroundManager = new DomBackgroundManager();
