// src/game/scenes/LessonScene.ts
import Phaser from 'phaser';
import type { LessonPackage, LessonItem } from '../types/lesson';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { domBackgroundManager } from '../domBackground';

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
    private speakerIcon!: Phaser.GameObjects.Image;
    private progressText!: Phaser.GameObjects.Text;
    private questionBar?: Phaser.GameObjects.Image;

    private optionImages: Phaser.GameObjects.Image[] = [];
    private optionPanels: Phaser.GameObjects.Image[] = [];

    private lockInput = false;
    private currentPromptAudioKey: string | null = null;

    private answerLogs: AnswerLog[] = [];

    constructor() {
        super('LessonScene');
    }

    init(data: { lesson: LessonPackage }) {
        this.lesson = data.lesson;
    }

    create() {
        domBackgroundManager.setBackgroundByKey(this.lesson.concept);

        // ===== HEADER =====

        // Thanh câu hỏi (khung)
        // dùng chung cho tất cả câu trong bài này
        if (this.textures.exists('question_bar')) {
            const barWidth = GAME_WIDTH * 0.4;
            this.questionBar = this.add
                .image(GAME_WIDTH / 2 + 60, 60, 'question_bar')
                .setOrigin(0.5);

            const ratio = this.questionBar.height / this.questionBar.width;
            this.questionBar.setDisplaySize(barWidth, barWidth * ratio);
        }

        // Prompt text nằm ngay dưới thanh câu hỏi
        this.promptText = this.add
            .text(GAME_WIDTH / 2 + 60, 60, '', {
                fontSize: '26px',
                color: '#000',
                align: 'center',
                wordWrap: { width: GAME_WIDTH - 120 },
            })
            .setOrigin(0.5);

        // Icon loa
        this.speakerIcon = this.add
            .image(GAME_WIDTH - 60, 80, 'speaker-icon')
            .setOrigin(0.5)
            .setScale(0.4)
            .setInteractive({ useHandCursor: true });

        this.speakerIcon.on('pointerdown', () => {
            const key = this.currentPromptAudioKey;
            if (!key) return;

            // chỉ play nếu audio có trong cache
            const hasSound =
                this.sound.get(key) !== null ||
                (this.cache.audio && this.cache.audio.exists(key));

            if (hasSound) {
                this.sound.play(key);
            }
        });

        // Progress text
        this.progressText = this.add
            .text(GAME_WIDTH - 40, 20, '', {
                fontSize: '18px',
                color: '#555',
                align: 'right',
            })
            .setOrigin(1, 0);

        // Tutorial lần đầu
        if (!this.hasSeenTutorial()) {
            this.showTutorialOverlay();
        } else {
            this.showQuestion();
        }

        // Nhân vật boy đứng ở góc trái
        if (this.textures.exists('boy')) {
            this.boy = this.add
                .image(120, GAME_HEIGHT - 40, 'boy')
                .setOrigin(0.5, 1); // chân boy trùng đáy

            // Scale nhẹ cho phù hợp canvas, tuỳ kích thước gốc
            const targetHeight = 350;
            const scale = targetHeight / this.boy.height;
            this.boy.setScale(scale);

            this.boy.setDepth(-1);

            // Idle tween: nhún lên xuống nhẹ
            this.tweens.add({
                targets: this.boy,
                y: this.boy.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
            });
        }
    }

    // ===== Tutorial overlay =====

    private hasSeenTutorial(): boolean {
        const key = `compare_tutorial_${this.lesson.lessonId}`;
        try {
            return localStorage.getItem(key) === '1';
        } catch {
            return false;
        }
    }

    private markTutorialSeen() {
        const key = `compare_tutorial_${this.lesson.lessonId}`;
        try {
            localStorage.setItem(key, '1');
        } catch {
            // ignore
        }
    }

    private showTutorialOverlay() {
        const overlay = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.5
        );

        const text = this.add
            .text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 - 20,
                'Chạm vào bức tranh đúng theo câu lệnh nhé!',
                {
                    fontSize: '24px',
                    color: '#fff',
                    align: 'center',
                    wordWrap: { width: GAME_WIDTH - 160 },
                }
            )
            .setOrigin(0.5);

        const btn = this.add
            .rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 60,
                200,
                50,
                0x42a5f5,
                1
            )
            .setInteractive({ useHandCursor: true });

        const btnText = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Bắt đầu', {
                fontSize: '22px',
                color: '#fff',
            })
            .setOrigin(0.5);

        btn.on('pointerdown', () => {
            overlay.destroy();
            text.destroy();
            btn.destroy();
            btnText.destroy();

            this.markTutorialSeen();
            this.showQuestion();
        });
    }

    // ===== Hiển thị 1 câu hỏi =====

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

        // Audio
        const promptAudio =
            item.promptAudio || this.lesson.defaultPromptAudio || null;
        this.currentPromptAudioKey = promptAudio;

        if (promptAudio) {
            const hasSound =
                this.sound.get(promptAudio) !== null ||
                (this.cache.audio && this.cache.audio.exists(promptAudio));

            if (hasSound) {
                this.sound.play(promptAudio);
            }
        }

        // Progress
        this.progressText.setText(
            `Câu ${this.index + 1}/${this.lesson.items.length}`
        );

        // Clear options cũ
        this.optionImages.forEach((img) => img.destroy());
        this.optionPanels.forEach((panel) => panel.destroy());
        this.optionImages = [];
        this.optionPanels = [];

        // Render options mới
        this.renderOptions(item);
    }

    // ===== Vẽ panel + hình cho mỗi lựa chọn =====

    private renderOptions(item: LessonItem) {
        const opts = item.options;
        const count = opts.length;

        // toạ độ trung tâm vùng hiển thị chọn đáp án
        const centerY = GAME_HEIGHT / 2 + 40;

        // Clear cũ nếu bạn chưa clear ở ngoài (an toàn thêm)
        this.optionImages.forEach((img) => img.destroy());
        this.optionPanels.forEach((p) => p.destroy());
        this.optionImages = [];
        this.optionPanels = [];

        if (count === 2) {
            // 2 đáp án: panel to, đặt trái – phải
            const spacing = 460;
            const startX = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2 + 60;
            const y = centerY + 20;

            opts.forEach((opt, idx) => {
                const x = startX + idx * spacing;

                const panel = this.add
                    .image(x, y, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(420, 500);

                const img = this.add.image(x, y, opt.image).setOrigin(0.5);
                img.setDisplaySize(250, 250);
                img.setInteractive({ useHandCursor: true });

                img.on('pointerdown', () =>
                    this.onSelect(item, opt.id, img, panel)
                );

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        } else if (count === 3) {
            // 3 đáp án: 3 panel ngang hàng, nhỏ hơn
            const spacing = 320; // hẹp hơn để fit 3 cái
            const startX = GAME_WIDTH / 2 - spacing + 80; // 3 ô: -1, 0, +1
            const y = centerY + 10;

            opts.forEach((opt, idx) => {
                const x = startX + idx * spacing;

                const panel = this.add
                    .image(x, y, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(300, 400);

                const img = this.add.image(x, y, opt.image).setOrigin(0.5);
                img.setDisplaySize(200, 200);
                img.setInteractive({ useHandCursor: true });

                img.on('pointerdown', () =>
                    this.onSelect(item, opt.id, img, panel)
                );

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        } else if (count === 4) {
            // 4 đáp án: layout 2x2
            const colSpacing = 420;
            const rowSpacing = 300;

            const centerX = GAME_WIDTH / 2 + 60;
            const topY = centerY - rowSpacing / 2;
            const bottomY = centerY + rowSpacing / 2;

            // vị trí 4 ô: [ (left, top), (right, top), (left, bottom), (right, bottom) ]
            const positions = [
                { x: centerX - colSpacing / 2, y: topY },
                { x: centerX + colSpacing / 2, y: topY },
                { x: centerX - colSpacing / 2, y: bottomY },
                { x: centerX + colSpacing / 2, y: bottomY },
            ];

            opts.forEach((opt, idx) => {
                const pos = positions[idx] ?? positions[positions.length - 1];

                const panel = this.add
                    .image(pos.x, pos.y, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(380, 280);

                const img = this.add
                    .image(pos.x, pos.y, opt.image)
                    .setOrigin(0.5);
                img.setDisplaySize(200, 200);
                img.setInteractive({ useHandCursor: true });

                img.on('pointerdown', () =>
                    this.onSelect(item, opt.id, img, panel)
                );

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        } else {
            // Fallback: mọi trường hợp khác (1, 5, ...) cứ xếp ngang cho an toàn
            const spacing = 240;
            const startX = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2;
            const y = centerY + 10;

            opts.forEach((opt, idx) => {
                const x = startX + idx * spacing;

                const panel = this.add
                    .image(x, y, 'panel_bg')
                    .setOrigin(0.5)
                    .setDisplaySize(320, 380);

                const img = this.add.image(x, y, opt.image).setOrigin(0.5);
                img.setDisplaySize(200, 200);
                img.setInteractive({ useHandCursor: true });

                img.on('pointerdown', () =>
                    this.onSelect(item, opt.id, img, panel)
                );

                this.optionImages.push(img);
                this.optionPanels.push(panel);
            });
        }
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

        const isCorrect = optId === item.correctOptionId;

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

            // Panel đúng giống CompareScene: đổi texture + zoom nhẹ
            if (this.textures.exists('panel_bg_correct')) {
                panel.setTexture('panel_bg_correct');
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
                    this.time.delayedCall(300, () => this.nextQuestion());
                },
            });
        } else {
            // Panel sai: đổi texture + rung, rồi đổi lại panel_bg
            if (this.textures.exists('panel_bg_wrong')) {
                panel.setTexture('panel_bg_wrong');
            }

            const targets: Phaser.GameObjects.GameObject[] = [panel, img];

            this.tweens.add({
                targets,
                x: '+=10',
                yoyo: true,
                duration: 70,
                repeat: 3,
                onComplete: () => {
                    // trả panel về bình thường
                    panel.setTexture('panel_bg');
                    this.lockInput = false;
                },
            });
        }
    }

    private nextQuestion() {
        this.index++;
        this.showQuestion();
    }

    private endLesson() {
        console.log('Answer logs:', this.answerLogs);

        this.scene.start('SummaryScene', {
            lessonId: this.lesson.lessonId,
            score: this.score,
            total: this.lesson.items.length,
        });
    }
}
