// src/game/domBackground.ts

// Danh sách background có thể dùng (bg1..bg5)
const BG_LIST: string[] = [
    'assets/bg/bg1.jpg',
    'assets/bg/bg2.jpg',
    'assets/bg/bg3.jpg',
    'assets/bg/bg4.jpg',
    'assets/bg/bg5.jpg',
];

const FALLBACK_BG = BG_LIST[0];

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
     * Trong phiên bản này, background sẽ được random giữa bg1..bg5,
     * key chỉ dùng để giữ API tương thích.
     */
    setBackgroundByKey(key: string) {
        if (!this.initialized) this.init();
        if (!this.bgLayerA || !this.bgLayerB) return;

        // Random 1 background từ danh sách
        const url =
            BG_LIST[Math.floor(Math.random() * BG_LIST.length)] ??
            FALLBACK_BG;

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
