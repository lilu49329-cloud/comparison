import Phaser from 'phaser';

// ====== Định nghĩa type level ======

type Mode = 'side' | 'operator';
type QuestionType = 'more' | 'less';

interface BaseSideConfig {
    icon: string; // "turtle" | "fish" | "dolphin" ...
    count: number; // số lượng con vật
}

interface SideLevel {
    id: number;
    mode: 'side';
    left: BaseSideConfig;
    right: BaseSideConfig;
    questionType: QuestionType; // "more" | "less"
    correctSide: 'left' | 'right';
}

interface OperatorLevel {
    id: number;
    mode: 'operator';
    left: BaseSideConfig;
    right: BaseSideConfig;
    relation: '<' | '>' | '=';
}

type CompareLevel = SideLevel | OperatorLevel;

// ====== State game đơn giản ======

type GameState = 'idle' | 'checking' | 'transition' | 'result';

// ====== CompareScene ======

export class CompareScene extends Phaser.Scene {
    // dữ liệu level
    private levels: CompareLevel[] = [];
    private currentLevelIndex = 0;

    rabbit!: Phaser.GameObjects.Image;
    boy!: Phaser.GameObjects.Image;

    // điểm số
    private score = 0;

    // state
    private state: GameState = 'idle';

    // UI elements tái sử dụng
    private questionText!: Phaser.GameObjects.Text;
    private leftPanel!: Phaser.GameObjects.Image;
    private rightPanel!: Phaser.GameObjects.Image;
    private nextButton!: Phaser.GameObjects.Image;

    // danh sách sprite của level hiện tại để dễ clear
    private levelObjects: Phaser.GameObjects.GameObject[] = [];

    private leftPanelAnimals: Phaser.GameObjects.Image[] = [];
    private rightPanelAnimals: Phaser.GameObjects.Image[] = [];

    constructor() {
        super('CompareScene');
    }

    private getW() {
        return this.scale.width;
    }
    private getH() {
        return this.scale.height;
    }

    private pctX(p: number) {
        return this.getW() * p;
    } // p = 0..1
    private pctY(p: number) {
        return this.getH() * p;
    } // p = 0..1

    preload() {
        // ---- HÌNH ẢNH ----
        this.load.image(
            'rabbit_idle',
            '/assets/images/characters/rabbit_idle.png'
        );
        this.load.image(
            'rabbit_cheer',
            '/assets/images/characters/rabbit_cheer.png'
        );
        this.load.image('boy', '/assets/images/characters/boy.png');

        this.load.image('turtle', 'assets/images/animals/turtle.png');
        this.load.image('cat', 'assets/images/animals/cat.png');
        this.load.image('dolphin', 'assets/images/animals/dolphin.png');

        this.load.image('panel_bg', 'assets/images/ui/panel_bg.png');
        this.load.image('panel_bg_correct', 'assets/images/ui/panel_bg_ok.png'); // panel đúng
        this.load.image(
            'panel_bg_wrong',
            'assets/images/ui/panel_bg_wrong.png'
        ); // panel sai

        // this.load.image('btn_reset', 'assets/images/ui/btn_reset.png');
        this.load.image('btn_next', 'assets/images/ui/btn_next.png');

        // ---- ÂM THANH ----
        this.load.audio('sfx-correct', 'assets/audio/sfx/correct.wav');
        this.load.audio('sfx-wrong', 'assets/audio/sfx/wrong.wav');
        this.load.audio('sfx-click', 'assets/audio/sfx/click.wav');

        // ---- LEVEL DATA (JSON) ----
        this.load.json('compareLevels', 'assets/data/compareLevels.json');
    }

    create() {
        const { width, height } = this.scale;

        // 👉 Thêm nhân vật thỏ ở góc trái bên dưới
        // this.rabbit = this.add
        //     .image(this.pctX(-0.05), this.pctY(1.1), 'rabbit_idle')
        //     .setOrigin(0, 1); // gốc ở bottom-left
        // this.rabbit.setScale(0.7); // tuỳ kích thước sprite thực tế

        this.boy = this.add
            .image(this.pctX(0.01), this.pctY(0.9), 'boy')
            .setOrigin(0, 1); // gốc ở bottom-left
        this.boy.setScale(0.5); // tuỳ kích thước sprite thực tế
        // Có thể thêm idle tween nhẹ cho sống động:
        // this.tweens.add({
        //     targets: this.rabbit,
        //     y: this.rabbit.y - 10,
        //     duration: 800,
        //     yoyo: true,
        //     repeat: -1,
        //     ease: 'Sine.inOut',
        // });

        // ===== Thanh câu hỏi =====
        this.questionText = this.add
            .text(width / 2, 60, 'Đang tải câu hỏi...', {
                fontSize: '36px',
                color: '#ffffff',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: width * 0.8 },
            })
            .setOrigin(0.5, 0.5);

        // ===== Nút Next (chuyển level) =====
        this.nextButton = this.add
            .image(this.pctX(0.9), this.pctY(0.15), 'btn_next')
            .setOrigin(0.5)
            .setScale(0.8)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        this.nextButton.visible = false; // 👉 mặc định ẩn

        this.nextButton.on('pointerdown', () => {
            // if (this.state !== 'waitingNext') return; // chỉ cho bấm khi đã đúng
            this.sound.play('sfx-click');
            this.nextButton.visible = false;
            this.goToNextLevel();
        });

        this.createPanels();

        // ===== Lấy dữ liệu level từ JSON =====
        const loadedLevels = this.cache.json.get('compareLevels') as
            | CompareLevel[]
            | undefined;

        if (loadedLevels && Array.isArray(loadedLevels)) {
            this.levels = loadedLevels;
        } else {
            console.warn(
                '[CompareScene] Không load được compareLevels.json, dùng dữ liệu fallback'
            );
            this.levels = [
                {
                    id: 1,
                    mode: 'side',
                    left: { icon: 'turtle', count: 2 },
                    right: { icon: 'turtle', count: 5 },
                    questionType: 'more',
                    correctSide: 'right',
                },
            ];
        }

        this.currentLevelIndex = 0;
        this.score = 0;
        this.state = 'idle';

        this.showCurrentLevel();
    }

    update(time: number, delta: number): void {
        // Sau có thể anim background, bong bóng, v.v.
    }

    private createPanels() {
        const panelWidth = this.getW() * 0.35;
        const panelHeight = this.getH() * 0.7;

        // toạ độ theo tỉ lệ màn
        const panelY = this.pctY(0.55);
        const leftX = this.pctX(0.4); // 0.5 - 0.15
        const rightX = this.pctX(0.76); // 0.5 + 0.23

        this.leftPanel = this.add
            .image(leftX, panelY, 'panel_bg')
            .setOrigin(0.5)
            .setDisplaySize(panelWidth, panelHeight)
            .setDepth(1);

        this.rightPanel = this.add
            .image(rightX, panelY, 'panel_bg')
            .setOrigin(0.5)
            .setDisplaySize(panelWidth, panelHeight)
            .setDepth(1);
    }

    // ========== HÀM HIỂN THỊ LEVEL ==========

    private showCurrentLevel() {
        if (!this.levels.length) return;

        const level = this.levels[this.currentLevelIndex];

        // reset attempt
        this.state = 'idle';
        this.nextButton.visible = false;

        // 🔁 RESET PANEL VỀ TRẠNG THÁI BÌNH THƯỜNG
        if (this.leftPanel) {
            this.leftPanel.setTexture('panel_bg');
            this.leftPanel.clearTint(); // nếu sau này có tint màu thì cũng xoá luôn
        }
        if (this.rightPanel) {
            this.rightPanel.setTexture('panel_bg');
            this.rightPanel.clearTint();
        }

        // 1. Cập nhật câu hỏi
        if (level.mode === 'side') {
            if (level.questionType === 'more') {
                this.questionText.setText('Bên nào có NHIỀU con hơn?');
            } else {
                this.questionText.setText('Bên nào có ÍT con hơn?');
            }
        }

        // 2. Xoá sprite & nút cũ của level trước
        this.clearLevelObjects();

        // Vẽ con vật
        this.drawAnimals(level.left, this.leftPanel);
        this.drawAnimals(level.right, this.rightPanel);

        // Gắn interactive panel
        this.leftPanel.setInteractive({ useHandCursor: true });
        this.rightPanel.setInteractive({ useHandCursor: true });

        this.leftPanel.on('pointerdown', () => this.onSideSelected('left'));
        this.rightPanel.on('pointerdown', () => this.onSideSelected('right'));
    }

    private clearLevelObjects() {
        // Xóa sprite con vật
        this.levelObjects.forEach((obj) => obj.destroy());
        this.levelObjects = [];

        // reset list động vật trong panel
        this.leftPanelAnimals = [];
        this.rightPanelAnimals = [];

        // Nếu panel chưa được tạo thì bỏ qua
        if (this.leftPanel) {
            this.leftPanel.removeAllListeners('pointerdown');
            this.leftPanel.disableInteractive();
        }

        if (this.rightPanel) {
            this.rightPanel.removeAllListeners('pointerdown');
            this.rightPanel.disableInteractive();
        }
    }

    // Tính scale cho con vật để vừa ô trong panel
    private getAnimalScale(
        textureKey: string,
        cellWidth: number,
        cellHeight: number
    ): number {
        const tex = this.textures.get(textureKey);
        const source = tex.getSourceImage() as
            | HTMLImageElement
            | HTMLCanvasElement;

        const texW = source.width;
        const texH = source.height;

        if (!texW || !texH) return 1; // fallback, trường hợp texture lỗi

        // chừa padding 80% cell
        const maxW = cellWidth * 0.8;
        const maxH = cellHeight * 0.8;

        const scaleX = maxW / texW;
        const scaleY = maxH / texH;

        // chọn scale nhỏ hơn để không tràn
        const baseScale = Math.min(scaleX, scaleY);

        // nếu muốn toàn bộ nhỏ hơn nữa thì nhân 0.9 / 0.8 tuỳ mắt
        return baseScale;
    }

    // ===== Vẽ con vật trong 1 panel =====
    // ===== Vẽ con vật trong 1 panel, auto scale theo kích thước ô =====
    private drawAnimals(side: BaseSideConfig, panel: Phaser.GameObjects.Image) {
        const panelWidth = panel.displayWidth;
        const panelHeight = panel.displayHeight;

        const paddingX = panelWidth * 0.12;
        const paddingY = panelHeight * 0.15;

        const usableWidth = panelWidth - paddingX * 2;
        const usableHeight = panelHeight - paddingY * 2;

        const cols = 3;
        const rows = Math.max(1, Math.ceil(side.count / cols));

        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;

        const spacingX = usableWidth / (cols + 1);
        const spacingY = usableHeight / (rows + 1);

        const left = panel.x - usableWidth / 2;
        const top = panel.y - usableHeight / 2;

        const animalsArray =
            panel === this.leftPanel
                ? this.leftPanelAnimals
                : this.rightPanelAnimals;

        for (let i = 0; i < side.count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = left + spacingX * (col + 1);
            const y = top + spacingY * (row + 1);

            const sprite = this.add
                .image(x, y, side.icon)
                .setOrigin(0.5, 0.5)
                .setDepth(panel.depth + 1);

            // 🔥 scale theo kích thước cell & texture
            const scale = this.getAnimalScale(side.icon, cellWidth, cellHeight);
            sprite.setScale(scale);

            this.levelObjects.push(sprite);
            animalsArray.push(sprite);
        }
    }

    // ========== XỬ LÝ TƯƠNG TÁC ==========

    private onSideSelected(side: 'left' | 'right') {
        if (this.state !== 'idle') return;

        const level = this.levels[this.currentLevelIndex];
        if (level.mode !== 'side') return;

        this.state = 'checking';
        this.sound.play('sfx-click');

        const isCorrect = side === level.correctSide;
        const target = side === 'left' ? this.leftPanel : this.rightPanel;

        this.handleAnswer(isCorrect, target);
    }

    private handleAnswer(
        isCorrect: boolean,
        target: Phaser.GameObjects.GameObject
    ) {
        const panel = target as Phaser.GameObjects.Image;

        if (isCorrect) {
            this.score += 1;
            this.playCorrectFeedback(panel);

            // khoá panel, chờ bé bấm Next
            this.leftPanel.disableInteractive();
            this.rightPanel.disableInteractive();

            // this.state = 'waitingNext';
            this.nextButton.visible = true; // 👉 chỉ đúng mới hiện Next
        } else {
            this.playWrongFeedback(panel);

            // Sai thì chắc chắn ẩn Next (phòng khi vì lý do gì đó nó đang hiện)
            this.nextButton.visible = false;

            // Cho bé làm lại cùng câu
            this.time.delayedCall(500, () => {
                this.state = 'idle';
            });
        }
    }

    // ========== FEEDBACK ==========

    private playCorrectFeedback(panel: Phaser.GameObjects.Image) {
        this.sound.play('sfx-correct', { volume: 0.8 });

        // đổi texture sang panel đúng, giữ nguyên cho đến hết câu
        panel.setTexture('panel_bg_correct');

        // hiệu ứng zoom nhẹ cho vui mắt
        this.tweens.add({
            targets: panel,
            scaleX: panel.scaleX * 1.03,
            scaleY: panel.scaleY * 1.03,
            yoyo: true,
            duration: 150,
            repeat: 1,
        });
    }

    private playWrongFeedback(panel: Phaser.GameObjects.Image) {
        this.sound.play('sfx-wrong', { volume: 0.8 });

        // lấy danh sách con vật thuộc panel này
        const animals =
            panel === this.leftPanel
                ? this.leftPanelAnimals
                : this.rightPanelAnimals;

        // targets = panel + tất cả con vật trong panel
        const targets: Phaser.GameObjects.GameObject[] = [panel, ...animals];

        // đổi sang panel sai
        panel.setTexture('panel_bg_wrong');

        // tween rung: dịch tương đối, không bị lệch vị trí cuối
        this.tweens.add({
            targets,
            x: '+=10',
            yoyo: true,
            duration: 70,
            repeat: 3,
        });

        // sau 500ms đổi về panel bình thường
        this.time.delayedCall(500, () => {
            panel.setTexture('panel_bg');
        });
    }

    // ========== CHUYỂN LEVEL & KẾT QUẢ ==========

    private goToNextLevel() {
        this.currentLevelIndex += 1;

        if (this.currentLevelIndex >= this.levels.length) {
            this.showResultScreen();
        } else {
            this.showCurrentLevel();
        }
    }

    private showResultScreen() {
        this.state = 'result';

        // dọn object level
        this.clearLevelObjects();

        const { width, height } = this.scale;

        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width * 0.8,
            height * 0.6,
            0x000000,
            0.7
        );
        this.levelObjects.push(overlay);

        const resultText = this.add
            .text(
                width / 2,
                height / 2 - 40,
                `Con làm đúng ${this.score}/${this.levels.length} câu!`,
                {
                    fontSize: '40px',
                    color: '#ffffff',
                    fontFamily: 'Arial',
                    align: 'center',
                }
            )
            .setOrigin(0.5);
        this.levelObjects.push(resultText);

        const replayText = this.add
            .text(width / 2, height / 2 + 40, 'Chạm để chơi lại', {
                fontSize: '28px',
                color: '#ffff66',
                fontFamily: 'Arial',
            })
            .setOrigin(0.5);
        this.levelObjects.push(replayText);

        // cho phép chạm bất kỳ đâu để chơi lại
        overlay.setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => {
            this.restartGame();
        });
    }

    private restartGame() {
        this.currentLevelIndex = 0;
        this.score = 0;
        this.state = 'idle';

        this.clearLevelObjects();
        this.showCurrentLevel();
    }
}
