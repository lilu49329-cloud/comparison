// src/game/scenes/LessonScene.ts
import Phaser from 'phaser';
import type { LessonPackage, LessonItem } from '../types/lesson';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { domBackgroundManager } from '../domBackground';
import AudioManager from '../../audio/AudioManager';
import { showGameButtons } from '../../main';

type AnswerLog = {
    lessonId: string;
    itemId: string;
    optionId: string;
    isCorrect: boolean;
    index: number;
    difficulty: number;
    timestamp: number;
};

export class LessonScene extends Phaser.Scene {
    private lesson!: LessonPackage;
    private index = 0;
    private score = 0;

    private boy?: Phaser.GameObjects.Image;

    private promptText!: Phaser.GameObjects.Text;
    private questionBar?: Phaser.GameObjects.Image;
    private questionBarBaseWidth = 0;
    private questionBarBaseScaleX = 1;
    private questionBarBaseScaleY = 1;

    private optionImages: Phaser.GameObjects.Image[] = [];
    private optionPanels: Phaser.GameObjects.Image[] = [];

    // Lưu lại lần trước ĐÁP ÁN ĐÚNG nằm bên nào (trái/phải) cho bài 2 lựa chọn
    private lastBinaryCorrectSide: 'left' | 'right' | null = null;

    private lockInput = false;
    private currentPromptAudioKey: string | null = null;
    private audioReplayTimer?: Phaser.Time.TimerEvent;

    private handleOrientationChange = () => {
        // Khi xoay về ngang (landscape), thiết lập lại cơ chế đọc câu hỏi
        if (window.innerWidth > window.innerHeight) {
            this.setupPromptReplay();
        } else {
            // Đang ở dọc: không auto đọc lại
            this.clearPromptReplayTimer();
        }
    };

    private answerLogs: AnswerLog[] = [];

    constructor() {
        super('LessonScene');
    }

    init(data: { lesson: LessonPackage }) {
        this.lesson = data.lesson;

        // 🔥 Quan trọng: reset state mỗi lần vào lesson
        this.index = 0;
        this.score = 0;
        this.answerLogs = [];
        this.lockInput = false;
        this.currentPromptAudioKey = null;

        // nếu muốn chắc ăn, clear luôn mảng option (chỉ để an toàn)
        this.optionImages.forEach((img) => img.destroy());
        this.optionPanels.forEach((p) => p.destroy());
        this.optionImages = [];
        this.optionPanels = [];
    }

    create() {
        // Cho phép html-button gọi vào lessonScene qua global
        (window as any).lessonScene = this;

        domBackgroundManager.setBackground();

        // ===== HEADER =====

        const centerX = GAME_WIDTH / 2 + 60;
        const centerY = 60;

        if (this.textures.exists('question_bar')) {
            // tạo bar với kích thước “gốc” ~ 40% màn
            const baseDisplayWidth = GAME_WIDTH * 0.4;

            const bar = this.add
                .image(centerX, centerY, 'question_bar')
                .setOrigin(0.5);

            const texW = bar.width || 1;
            const s = baseDisplayWidth / texW;

            bar.setScale(s); // scale đều theo cả 2 chiều ban đầu

            this.questionBar = bar;
            this.questionBarBaseWidth = bar.displayWidth; // chiều RỘNG hiển thị ban đầu
            this.questionBarBaseScaleX = bar.scaleX;
            this.questionBarBaseScaleY = bar.scaleY;
        }

        // Tạo prompt text, luôn nằm trên thanh
        this.promptText = this.add
            .text(centerX, centerY, '', {
                fontSize: '35px',
                color: '#ffffff',
                align: 'center',
                fontFamily: '"Baloo 2"',
                fontStyle: '700',
                padding: {
                    top: 10,
                    bottom: 10,
                },
            })
            .setOrigin(0.5, 0.5)
            .setDepth(1); // chữ ở trên

        this.showQuestion();
        this.setupPromptReplay();

        // Lắng nghe xoay màn hình để đọc lại câu hỏi khi xoay ngang
        window.addEventListener(
            'orientationchange',
            this.handleOrientationChange
        );
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener(
                'orientationchange',
                this.handleOrientationChange
            );
        });

        // Nhân vật đồng hành random: boy hoặc squirrel
        const characterKeys = ['char'];

        // Lọc những key có texture thật
        const availableKeys = characterKeys.filter((key) =>
            this.textures.exists(key)
        );

        if (availableKeys.length > 0) {
            const randomIndex = Math.floor(
                Math.random() * availableKeys.length
            );
            const chosenKey = availableKeys[randomIndex];

            // Vị trí "mặt đất" góc trái
            const baseX = 140;
            const baseY = GAME_HEIGHT - 40;

            this.boy = this.add
                .image(baseX, baseY, chosenKey)
                .setOrigin(0.5, 1); // chân trùng đáy

            // Khung tối đa cho nhân vật
            const MAX_H = 350; // chiều cao tối đa trên canvas
            const MAX_W = 220; // chiều ngang tối đa

            const texW = this.boy.width || 1;
            const texH = this.boy.height || 1;

            const scale = Math.min(MAX_H / texH, MAX_W / texW);
            this.boy.setScale(scale);

            // Nếu squirrel hơi bè, có thể dịch vô trong tí cho cân bố cục
            if (chosenKey === 'squirrel') {
                this.boy.x = baseX + 10; // đẩy nhẹ sang phải, tuỳ bạn chỉnh
            }

            this.boy.setDepth(-1);

            // Idle tween
            this.tweens.add({
                targets: this.boy,
                y: this.boy.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
            });
        }
        showGameButtons();
    }

    // ===== Hiển thị 1 câu hỏi =====

    private updateQuestionBarToFitText() {
        if (!this.questionBar) return;

        const centerX = this.promptText.x;
        const centerY = this.promptText.y;

        // chiều rộng text thực tế
        const padding = 80; // thêm khoảng trống hai bên chữ
        const textWidth = this.promptText.width;
        const neededWidth = textWidth + padding;

        const baseWidth =
            this.questionBarBaseWidth || this.questionBar.displayWidth || 1;

        // mặc định: scale theo base (không kéo ngang thêm)
        let scaleX = this.questionBarBaseScaleX;

        // chỉ khi text dài hơn bar gốc mới kéo ngang
        if (neededWidth > baseWidth) {
            const factor = neededWidth / baseWidth;
            scaleX = this.questionBarBaseScaleX * factor;
        }

        // scaleX thay đổi, scaleY giữ nguyên → height không đổi
        this.questionBar.setScale(scaleX, this.questionBarBaseScaleY);

        // đảm bảo bar nằm đúng dưới text
        this.questionBar.setPosition(centerX, centerY);
    }

    private showQuestion() {
        const item = this.lesson.items[this.index];
        if (!item) {
            this.endLesson();
            return;
        }

        this.lockInput = false;

        // Prompt
        const text = item.promptText || this.lesson.defaultPromptText;
        this.promptText.setText(text);

        this.updateQuestionBarToFitText();

        // Audio: chỉ lưu key, logic phát & auto đọc lại xử lý ở setupPromptReplay
        const promptAudio =
            item.promptAudio || this.lesson.defaultPromptAudio || null;
        this.currentPromptAudioKey = promptAudio;

        // Clear options cũ
        this.optionImages.forEach((img) => img.destroy());
        this.optionPanels.forEach((panel) => panel.destroy());
        this.optionImages = [];
        this.optionPanels = [];

        // Render options mới
        this.renderOptions(item);
    }

    // (đã chuyển sang cơ chế mới dùng AudioManager ở cuối file)

    // ===== Vẽ panel + hình cho mỗi lựa chọn =====

    private computeItemScale(
        opts: LessonItem['options'],
        panelWidth: number,
        panelHeight: number,
        padding: number = 40
    ): number {
        // vùng tối đa cho ảnh bên trong panel
        const maxW = panelWidth - padding;
        const maxH = panelHeight - padding;

        let maxOriginalW = 0;
        let maxOriginalH = 0;

        opts.forEach((opt) => {
            const tex = this.textures.get(opt.image);
            if (!tex) return;

            const frame = tex.getSourceImage() as HTMLImageElement;
            const w = frame.width;
            const h = frame.height;

            if (!w || !h) return;

            if (w > maxOriginalW) maxOriginalW = w;
            if (h > maxOriginalH) maxOriginalH = h;
        });

        if (maxOriginalW === 0 || maxOriginalH === 0) {
            return 1; // không tính được thì để scale = 1
        }

        const scaleToFit = Math.min(maxW / maxOriginalW, maxH / maxOriginalH);

        // CHỈ DOWNSCALE, KHÔNG UPSCALE
        return Math.min(1, scaleToFit);
    }

    private alignImageBottomInPanel(
        img: Phaser.GameObjects.Image,
        panelCenterY: number,
        panelHeight: number,
        paddingBottom: number = 30
    ) {
        const scaledHeight = img.height * img.scaleY; // height sau scale
        const panelBottom = panelCenterY + panelHeight / 2;
        const bottomY = panelBottom - paddingBottom;

        img.setY(bottomY - scaledHeight / 2);
    }

    // Animation lắc nhẹ cho icon trong khung đáp án
    private addOptionShakeAnimation(icon: Phaser.GameObjects.Image) {
        this.tweens.add({
            targets: icon,
            angle: { from: -3, to: 3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }
    // Dừng mọi âm thanh trừ nhạc nền chính,
    // dùng khi cần ngắt nhanh tiếng đọc câu hỏi / hiệu ứng
    // private stopAllExceptBgm() {
    //     const bgmKey = 'bgm_main';
    //     const bgm = this.sound.get(bgmKey) as Phaser.Sound.BaseSound | null;

    //     // nhớ trạng thái & volume trước khi stopAll
    //     const wasPlaying = !!bgm && bgm.isPlaying;
    //     // nếu muốn thay đổi âm lượng nhạc nền, chỉnh giá trị này
    //     const volume = 0.4;

    //     // dừng tất cả âm thanh
    //     this.sound.stopAll();

    //     // nếu trước đó BGM đang chạy thì bật lại
    //     if (bgm && wasPlaying) {
    //         bgm.play({
    //             loop: true,
    //             volume,
    //         });
    //     }
    // }

    private playCurrentPrompt() {
        const item = this.lesson.items[this.index];
        if (!item) return;

        const audioKey =
            item.promptAudio || this.lesson.defaultPromptAudio || null;
        if (!audioKey) return;

        this.currentPromptAudioKey = audioKey;
        AudioManager.playOneShot(audioKey, 1.0);
    }

    // Sắp xếp lại 2 lựa chọn để ĐÁP ÁN ĐÚNG
    // luân phiên nằm bên trái / bên phải qua từng câu,
    // tránh việc nhiều câu liên tiếp đúng cùng một bên
    private arrangeBinaryOptionsByCorrect(
        item: LessonItem
    ): LessonItem['options'] {
        const opts = [...item.options];
        if (opts.length !== 2) return opts;

        const correct = opts.find((o) => o.id === item.correctOptionId);
        const wrong = opts.find((o) => o.id !== item.correctOptionId);

        if (!correct || !wrong) return opts;

        // lần đầu thì random đáp án đúng bên trái/phải
        let correctSide: 'left' | 'right';
        if (this.lastBinaryCorrectSide === null) {
            correctSide = Math.random() < 0.5 ? 'left' : 'right';
        } else {
            // các lần sau thì luân phiên trái ↔ phải
            correctSide =
                this.lastBinaryCorrectSide === 'left' ? 'right' : 'left';
        }

        this.lastBinaryCorrectSide = correctSide;

        return correctSide === 'left' ? [correct, wrong] : [wrong, correct];
    }

    private renderOptions(item: LessonItem) {
        // copy mảng để có thể sắp xếp lại mà không đụng dữ liệu gốc
        let opts = [...item.options];
        const count = opts.length;

        // Với bài chỉ có 2 lựa chọn → sắp xếp sao cho ĐÁP ÁN ĐÚNG
        // luân phiên trái/phải giữa các câu hỏi
        if (count === 2) {
            opts = this.arrangeBinaryOptionsByCorrect(item);
        }

        const centerY = GAME_HEIGHT / 2 + 40;

        // clear cũ
        this.optionImages.forEach((img) => img.destroy());
        this.optionPanels.forEach((p) => p.destroy());
        this.optionImages = [];
        this.optionPanels = [];

        // flag: concept này có cần căn chân không?
        const alignByHeight = this.lesson.concept === 'HEIGHT';

        if (count === 2) {
            const spacing = 440;
            const startX = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2 + 60;
            const panelY = centerY;
            const panelW = 420;
            const panelH = 520;

            const scale = this.computeItemScale(opts, panelW, panelH, 60);

            opts.forEach((opt, idx) => {
                const x = startX + idx * spacing;

                const panel = this.add
                    .image(x, panelY, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(panelW, panelH);

                panel.setInteractive({ useHandCursor: true });

                const img = this.add.image(x, panelY, opt.image).setOrigin(0.5);
                img.setScale(scale);
                img.setInteractive({ useHandCursor: true });

                // nếu là bài so sánh cao/thấp → chân ảnh cùng nằm dưới
                if (alignByHeight) {
                    this.alignImageBottomInPanel(img, panelY, panelH, 40);
                }

                this.addOptionShakeAnimation(img);

                const handleClick = () => {
                    this.onSelect(item, opt.id, img, panel);
                };

                // 👇 Gán cùng handler cho cả panel và img
                panel.on('pointerdown', handleClick);
                img.on('pointerdown', handleClick);

                panel.setData('panelKeys', {
                    base: 'panel_bg',
                    correct: 'panel_bg_correct',
                    wrong: 'panel_bg_wrong',
                });

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        } else if (count === 3) {
            const spacing = 310;
            const startX = GAME_WIDTH / 2 - spacing + 80;
            const panelY = centerY + 10;
            const panelW = 300;
            const panelH = 400;

            const scale = this.computeItemScale(opts, panelW, panelH, 50);

            opts.forEach((opt, idx) => {
                const x = startX + idx * spacing;

                const panel = this.add
                    .image(x, panelY, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(panelW, panelH);

                panel.setInteractive({ useHandCursor: true });

                const img = this.add.image(x, panelY, opt.image).setOrigin(0.5);
                img.setScale(scale);
                img.setInteractive({ useHandCursor: true });

                if (alignByHeight) {
                    this.alignImageBottomInPanel(img, panelY, panelH, 35);
                }

                this.addOptionShakeAnimation(img);

                const handleClick = () => {
                    this.onSelect(item, opt.id, img, panel);
                };

                // 👇 Gán cùng handler cho cả panel và img
                panel.on('pointerdown', handleClick);
                img.on('pointerdown', handleClick);

                panel.setData('panelKeys', {
                    base: 'panel_bg',
                    correct: 'panel_bg_correct',
                    wrong: 'panel_bg_wrong',
                });

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        } else if (count === 4) {
            const colSpacing = 430;
            const rowSpacing = 290;

            const centerX = GAME_WIDTH / 2 + 60;
            const topY = centerY - rowSpacing / 2;
            const bottomY = centerY + rowSpacing / 2;

            const positions = [
                { x: centerX - colSpacing / 2, y: topY },
                { x: centerX + colSpacing / 2, y: topY },
                { x: centerX - colSpacing / 2, y: bottomY },
                { x: centerX + colSpacing / 2, y: bottomY },
            ];

            const panelW = 420;
            const panelH = 280;

            const scale = this.computeItemScale(opts, panelW, panelH, 40);

            opts.forEach((opt, idx) => {
                const pos = positions[idx] ?? positions[positions.length - 1];

                const panel = this.add
                    .image(pos.x, pos.y, 'panel_bg_1')
                    .setOrigin(0.5)
                    .setDisplaySize(panelW, panelH);

                panel.setInteractive({ useHandCursor: true });

                const img = this.add
                    .image(pos.x, pos.y, opt.image)
                    .setOrigin(0.5);
                img.setScale(scale);
                img.setInteractive({ useHandCursor: true });

                if (alignByHeight) {
                    // căn chân theo từng hàng riêng (top/bottom), panelH chung
                    this.alignImageBottomInPanel(img, pos.y, panelH, 30);
                }

                this.addOptionShakeAnimation(img);
                const handleClick = () => {
                    this.onSelect(item, opt.id, img, panel);
                };

                // 👇 Gán cùng handler cho cả panel và img
                panel.on('pointerdown', handleClick);
                img.on('pointerdown', handleClick);

                panel.setData('panelKeys', {
                    base: 'panel_bg_1',
                    correct: 'panel_bg_1_correct',
                    wrong: 'panel_bg_1_wrong',
                });

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        } else {
            // fallback: xếp ngang
            const spacing = 240;
            const startX = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2;
            const panelY = centerY + 10;
            const panelW = 320;
            const panelH = 380;

            const scale = this.computeItemScale(opts, panelW, panelH, 40);

            opts.forEach((opt, idx) => {
                const x = startX + idx * spacing;

                const panel = this.add
                    .image(x, panelY, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(panelW, panelH);

                panel.setInteractive({ useHandCursor: true });

                const img = this.add.image(x, panelY, opt.image).setOrigin(0.5);
                img.setScale(scale);
                img.setInteractive({ useHandCursor: true });

                if (alignByHeight) {
                    this.alignImageBottomInPanel(img, panelY, panelH, 35);
                }

                this.addOptionShakeAnimation(img);

                const handleClick = () => {
                    this.onSelect(item, opt.id, img, panel);
                };

                // 👇 Gán cùng handler cho cả panel và img
                panel.on('pointerdown', handleClick);
                img.on('pointerdown', handleClick);

                panel.setData('panelKeys', {
                    base: 'panel_bg',
                    correct: 'panel_bg_correct',
                    wrong: 'panel_bg_wrong',
                });

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        }
    }

    playRandomCorrect(sound: Phaser.Sound.BaseSoundManager) {
        const keys = [
            'correct_answer_1',
            'correct_answer_2',
            'correct_answer_3',
            'correct_answer_4',
        ];

        const key = keys[Math.floor(Math.random() * keys.length)];
        const sfx = sound.get(key) ?? sound.add(key);
        sfx.play();
    }

    // Được gọi từ HintScene sau khi màn gợi ý kết thúc
    public goToNextQuestionFromHint() {
        // hiện lại LessonScene sau khi màn phụ đóng
        this.scene.setVisible(true);
        this.nextQuestion();
    }

    // ===== Xử lý chọn đáp án =====

    private onSelect(
        item: LessonItem,
        optId: string,
        img: Phaser.GameObjects.Image,
        panel: Phaser.GameObjects.Image
    ) {
        if (this.lockInput) return;
        this.lockInput = true;

        // Ngắt toàn bộ âm thanh (trừ nhạc nền) để tránh chồng tiếng
        this.stopAllExceptBgm();

        // 🔥 bé đã chọn -> huỷ timer đọc lại câu hỏi
        this.clearPromptReplayTimer();

        const isCorrect = optId === item.correctOptionId;

        // Lấy bộ key của panel (base/correct/wrong)
        const keys = panel.getData('panelKeys') as
            | { base: string; correct: string; wrong: string }
            | undefined;

        const baseKey = keys?.base ?? 'panel_bg';
        const correctKey = keys?.correct ?? 'panel_bg_correct';
        const wrongKey = keys?.wrong ?? 'panel_bg_wrong';

        // log
        this.answerLogs.push({
            lessonId: this.lesson.lessonId,
            itemId: item.id,
            optionId: optId,
            isCorrect,
            index: this.index,
            difficulty: item.difficulty,
            timestamp: Date.now(),
        });

        if (isCorrect) {
            this.score++;
            AudioManager.play('correct');
            AudioManager.playRandomCorrectAnswer();

            // Panel đúng
            if (this.textures.exists(correctKey)) {
                panel.setTexture(correctKey);
            }

            const targets: Phaser.GameObjects.GameObject[] = [panel, img];

            this.tweens.add({
                targets,
                scaleX: panel.scaleX * 1.03,
                scaleY: panel.scaleY * 1.03,
                yoyo: true,
                duration: 150,
                repeat: 1,
                onComplete: () => {
                    // Sau khi tween xong, chờ voice khen gần hết rồi mới mở HintScene
                    this.time.delayedCall(1100, () => {
                        this.scene.pause();
                        // Ẩn hẳn LessonScene để chỉ thấy màn phụ
                        this.scene.setVisible(false);
                        this.scene.launch('HintScene', {
                            item,
                            concept: this.lesson.concept,
                        });
                    });
                },
            });
        } else {
            AudioManager.play('wrong');
            // Panel sai
            if (this.textures.exists(wrongKey)) {
                panel.setTexture(wrongKey);
            }

            const targets: Phaser.GameObjects.GameObject[] = [panel, img];

            this.tweens.add({
                targets,
                x: '+=10',
                yoyo: true,
                duration: 70,
                repeat: 3,
                onComplete: () => {
                    // trả panel về base
                    panel.setTexture(baseKey);
                    this.lockInput = false;
                },
            });
        }
    }

    private nextQuestion() {
        this.index++;
        // Đổi background DOM mỗi khi sang câu mới
        domBackgroundManager.setBackground();
        this.showQuestion();
        this.setupPromptReplay();
    }

    private endLesson() {
        console.log('Answer logs:', this.answerLogs);
        this.clearPromptReplayTimer();

        this.scene.start('SummaryScene', {
            score: this.score,
            total: this.lesson.items.length,
        });
    }

    private stopAllExceptBgm() {
        AudioManager.stopAllExceptBgm();
    }

    public restartLevel() {
        // reset toàn bài hiện tại về từ đầu
        if (!this.lesson) return;

        // dừng âm thanh đang phát (trừ nhạc nền)
        this.stopAllExceptBgm();
        AudioManager.play('sfx-click');

        // reset state
        this.index = 0;
        this.score = 0;
        this.lockInput = false;
        this.answerLogs = [];

        // clear option cũ trên màn
        this.optionImages.forEach((img) => img.destroy());
        this.optionPanels.forEach((panel) => panel.destroy());
        this.optionImages = [];
        this.optionPanels = [];

        // vẽ lại câu đầu tiên
        domBackgroundManager.setBackground();
        this.showQuestion();
        this.setupPromptReplay();
    }

    public goToNextLevel() {
        this.stopAllExceptBgm();
        AudioManager.play('sfx-click');
        // bỏ qua câu hiện tại, sang câu tiếp theo
        if (!this.lesson) return;

        // nếu bạn muốn không cho spam khi đang tween, giữ lock này
        if (this.lockInput) return;

        this.lockInput = true;

        // optional: log "skip" nếu bạn muốn tracking
        const item = this.lesson.items[this.index];
        if (item) {
            this.answerLogs.push({
                lessonId: this.lesson.lessonId,
                itemId: item.id,
                optionId: 'SKIP',
                isCorrect: false,
                index: this.index,
                difficulty: item.difficulty,
                timestamp: Date.now(),
            });
        }

        this.nextQuestion();
    }

    // ===== CƠ CHẾ ĐỌC LẠI CÂU HỎI KHI BÉ KHÔNG THAO TÁC =====

    private clearPromptReplayTimer() {
        if (this.audioReplayTimer) {
            this.audioReplayTimer.remove(false);
            this.audioReplayTimer = undefined;
        }
    }

    /**
     * Nếu đang ở màn ngang:
     * - Đọc câu hỏi ngay.
     * - Sau 10s, nếu vẫn chưa chơi tiếp, đọc lại 1 lần nữa.
     */
    private setupPromptReplay() {
        this.clearPromptReplayTimer();

        if (window.innerWidth < window.innerHeight) {
            return;
        }

        this.playCurrentPrompt();

        if (!this.currentPromptAudioKey) return;

        this.audioReplayTimer = this.time.addEvent({
            delay: 10000,
            loop: false,
            callback: () => {
                if (
                    window.innerWidth >= window.innerHeight &&
                    this.currentPromptAudioKey
                ) {
                    this.playCurrentPrompt();
                }
            },
        });
    }
}
