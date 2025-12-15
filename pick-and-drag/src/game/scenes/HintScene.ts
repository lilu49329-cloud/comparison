import Phaser from 'phaser';
import type { LessonItem, LessonConcept } from '../types/lesson';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import AudioManager from '../../audio/AudioManager';

type HintSceneData = {
    item: LessonItem;
    concept: LessonConcept;
};

export class HintScene extends Phaser.Scene {
    private item!: LessonItem;
    // private concept!: LessonConcept;

    constructor() {
        super('HintScene');
    }

    init(data: HintSceneData) {
        this.item = data.item;
        // this.concept = data.concept;
    }

    create() {
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;

        // Khung trắng chính (bảng trắng hint) – canvas Hint giữ trong suốt,
        // không phủ lớp mờ lên toàn bộ game
        const panelWidth = w * 0.6;
        const panelHeight = h * 0.65;

        if (this.textures.exists('hint_board')) {
            const mainPanelImg = this.add
                .image(w / 2, h / 2, 'hint_board')
                .setOrigin(0.5)
                .setDepth(1);
            mainPanelImg.setDisplaySize(panelWidth, panelHeight);
        } else {
            const mainPanel = this.add
                .rectangle(w / 2, h / 2, panelWidth, panelHeight, 0xffffff, 1)
                .setDepth(1);
            mainPanel.setStrokeStyle(4, 0x3da5ff);
        }

        // ===== Lấy prompt từ size_hint.json (random nhưng đảm bảo đủ 4 hint trước khi lặp lại) =====
        let hintPromptKey: string | null = null; // texture key của prompt dạng ảnh

        let hintKind: 'pencil' | 'train' = 'pencil';
        let correctIsShort = false; // true: hình ngắn là đáp án, false: hình dài
        let hintAudioKey: string | null = null;

        const rawHint = this.cache.json.get('size_hint') as
            | import('../types/lesson').LessonPackage
            | undefined;

        if (rawHint && Array.isArray(rawHint.items) && rawHint.items.length > 0) {
            // helper: lấy kind từ 1 item
            const getKind = (item: import('../types/lesson').LessonItem) => {
                const hasTrain = item.options.some((opt) =>
                    opt.image.includes('train')
                );
                const hasPencil = item.options.some((opt) =>
                    opt.image.includes('pencil')
                );
                if (hasTrain) return 'train' as const;
                if (hasPencil) return 'pencil' as const;
                return item.id.includes('train')
                    ? ('train' as const)
                    : ('pencil' as const);
            };

            // Hàng đợi id hint (đảm bảo đủ 4 trước khi lặp)
            let queue =
                (this.registry.get('size_hint_queue') as string[] | undefined) ??
                [];

            if (!Array.isArray(queue) || queue.length === 0) {
                // Khi hết 4 hint, tạo lại hàng đợi mới.
                // Ưu tiên cho các hint kiểu BÚT xuất hiện trước, sau đó mới tới TÀU,
                // để hint đầu tiên không bị cố định vào tàu và cảm giác đa dạng hơn.
                const pencilItems: import('../types/lesson').LessonItem[] = [];
                const trainItems: import('../types/lesson').LessonItem[] = [];

                rawHint.items.forEach((it) => {
                    const kind = getKind(it);
                    if (kind === 'train') {
                        trainItems.push(it);
                    } else {
                        pencilItems.push(it);
                    }
                });

                Phaser.Utils.Array.Shuffle(pencilItems);
                Phaser.Utils.Array.Shuffle(trainItems);

                queue = [
                    ...pencilItems.map((it) => it.id),
                    ...trainItems.map((it) => it.id),
                ];
            };

            // Loại hint lần trước (bút / tàu) để xen kẽ cho đỡ chán
            const lastKind =
                (this.registry.get('size_hint_last_kind') as
                    | 'pencil'
                    | 'train'
                    | null) ?? null;

            // Ưu tiên chọn hint có kind khác với lần trước nếu còn trong queue
            let chosenId: string | undefined;
            // let chosenKind: 'pencil' | 'train' = 'pencil';

            if (lastKind) {
                const indexInQueue = queue.findIndex((id) => {
                    const item = rawHint.items.find((it) => it.id === id);
                    if (!item) return false;
                    return getKind(item) !== lastKind;
                });

                if (indexInQueue !== -1) {
                    chosenId = queue.splice(indexInQueue, 1)[0];
                }
            }

            // Nếu không tìm được khác loại, lấy phần tử đầu như bình thường
            if (!chosenId) {
                chosenId = queue.shift()!;
            }

            this.registry.set('size_hint_queue', queue);

            const hintItem =
                rawHint.items.find((it) => it.id === chosenId) ??
                rawHint.items[0];

            hintKind = getKind(hintItem);
            this.registry.set('size_hint_last_kind', hintKind);

            hintPromptKey = (hintItem as any).promptImage || null;
            hintAudioKey =
                hintItem.promptAudio || rawHint.defaultPromptAudio || null;

            // Xác định đáp án đúng (ngắn / dài) dựa vào correctOptionId trong JSON
            // Mặc định: opt1 là hình NGẮN, opt2 là hình DÀI
            const optCorrect = hintItem.options.find(
                (opt) => opt.id === hintItem.correctOptionId
            );
            if (optCorrect) {
                correctIsShort = optCorrect.id === 'opt1';
            }
        } else {
            // fallback nếu không có JSON hint
        hintPromptKey =
        (this.item as any).promptImage ||
        null; // không có ảnh thì sẽ fallback text bên dưới
        
        }

        // Banner hướng dẫn trên cùng
        const bannerY = 60;
        let bannerObj: Phaser.GameObjects.Image | undefined;
        if (this.textures.exists('question_bar')) {
            bannerObj = this.add
                .image(w / 2, bannerY, 'question_bar')
                .setOrigin(0.5)
                .setDepth(2);

            // scale ban đầu giống LessonScene: ~40% chiều rộng game
            const targetWidth = GAME_WIDTH * 0.4;
            const texW = bannerObj.width || 1;
            const s = targetWidth / texW;
            bannerObj.setScale(s);
        }

        let hintLabelWidth = 0;

        // ===== PROMPT IMAGE ưu tiên =====
        if (hintPromptKey && this.textures.exists(hintPromptKey)) {
            // Lấy toạ độ X của bannerObj nếu có, nếu không thì w / 2
            let imgX = w / 2;
            if (bannerObj) {
                imgX = bannerObj.x;
            }
            const img = this.add
                .image(imgX, bannerY, hintPromptKey)
                .setOrigin(0.5)
                .setDepth(3);

            // scale để vừa trong banner
            if (bannerObj) {
                const maxW = bannerObj.displayWidth * 1.55;
                const maxH = bannerObj.displayHeight * 1.55;

                const texW = img.width || 1;
                const texH = img.height || 1;

                const s = Math.min(maxW / texW, maxH / texH);
                img.setScale(s);

                hintLabelWidth = img.displayWidth;
            } else {
                hintLabelWidth = img.displayWidth;
            }
        } else {
        // ===== fallback TEXT nếu chưa có asset =====
        const fallbackText =
        (this.item as any).promptText ;

        const hintLabel = this.add
            .text(w / 2, bannerY, fallbackText, {
            font: '700 32px "Baloo 2"', // shorthand
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: w * 0.64 },
            })
            .setOrigin(0.5)
            .setDepth(3);

        hintLabelWidth = hintLabel.width;
        }

        // ===== Căn lại độ rộng banner để ôm nội dung =====
        if (bannerObj) {
        const padding = 145;
        const neededWidth = hintLabelWidth + padding;
        const baseWidth = bannerObj.displayWidth || 1;

        if (neededWidth > baseWidth) {
            const factor = neededWidth / baseWidth;
            bannerObj.setScale(bannerObj.scaleX * factor, bannerObj.scaleY);
        }
        }

        // Phát giọng đọc hướng dẫn cho hint (nếu có)
        this.playHintPrompt(hintAudioKey);

        // ===== Vùng minh hoạ bút chì + bàn kéo thả =====
        const centerY = h / 2 - 40;

        // Hai hình cố định bên trong board (ngắn & dài) – bút chì hoặc tàu
        const shortKey =
            hintKind === 'train' ? 'hint_train_short' : 'hint_pencil_short';
        const longKey =
            hintKind === 'train' ? 'hint_train_long' : 'hint_pencil_long';

        const shortPencil = this.add
            .image(w / 2, centerY - 40, shortKey)
            .setOrigin(0.5)
            .setDepth(2);

        const longPencil = this.add
            .image(w / 2, centerY + 10, longKey)
            .setOrigin(0.5)
            .setDepth(2);

        // Scale riêng: bút chì ngắn và tàu đều có thể chỉnh riêng
        const maxTexW = Math.max(shortPencil.width, longPencil.width);
        const maxTexH = Math.max(shortPencil.height, longPencil.height);
        if (maxTexW > 0 && maxTexH > 0) {
            if (hintKind === 'pencil') {
                // Tăng riêng cho bút chì ngắn
                const maxDisplayWShort = panelWidth * 0.5;
                const maxDisplayHShort = panelHeight * 0.11;
                const sShort = Math.min(
                    maxDisplayWShort / shortPencil.width,
                    maxDisplayHShort / shortPencil.height,
                    1
                );
                // Bút chì dài giữ nguyên scale cũ
                const maxDisplayWLong = panelWidth * 0.55;
                const maxDisplayHLong = panelHeight * 0.12;
                const sLong = Math.min(
                    maxDisplayWLong / longPencil.width,
                    maxDisplayHLong / longPencil.height,
                    1
                );
                shortPencil.setScale(sShort);
                longPencil.setScale(sLong);
            } else if (hintKind === 'train') {
                // Tăng riêng cho cả hai hình tàu
                const maxDisplayWShort = panelWidth * 0.75;
                const maxDisplayHShort = panelHeight * 0.17;
                const sShort = Math.min(
                    maxDisplayWShort / shortPencil.width,
                    maxDisplayHShort / shortPencil.height,
                    1
                );
                const maxDisplayWLong = panelWidth * 0.75;
                const maxDisplayHLong = panelHeight * 0.17;
                const sLong = Math.min(
                    maxDisplayWLong / longPencil.width,
                    maxDisplayHLong / longPencil.height,
                    1
                );
                shortPencil.setScale(sShort);
                longPencil.setScale(sLong);
            } else {
                // Các trường hợp khác giữ nguyên như cũ
                const maxDisplayW = panelWidth * 0.55;
                const maxDisplayH = panelHeight * 0.12;
                const s = Math.min(
                    maxDisplayW / maxTexW,
                    maxDisplayH / maxTexH,
                    1
                );
                shortPencil.setScale(s);
                longPencil.setScale(s);
            }
        }

        // Khung "bàn gỗ" bên dưới để thả vào – asset board-wood
        const dropPanelY = h / 2 + panelHeight * 0.18;
        // Bảng gỗ: hẹp hơn theo chiều ngang, cao hơn theo chiều dọc
        const dropWidth = panelWidth * 0.74;
        const dropHeight = panelHeight * 0.4;

        let dropRect: Phaser.GameObjects.Rectangle;

        if (this.textures.exists('hint_board_wood')) {
            const wood = this.add
                .image(w / 2, dropPanelY, 'hint_board_wood')
                .setOrigin(0.5)
                .setDepth(1);
            wood.setDisplaySize(dropWidth, dropHeight);
            dropRect = this.add
                .rectangle(w / 2, dropPanelY, dropWidth, dropHeight, 0xffffff, 0)
                .setOrigin(0.5)
                .setDepth(1);
        } else {
            dropRect = this.add
                .rectangle(w / 2, dropPanelY, dropWidth, dropHeight, 0xf5e2c4)
                .setOrigin(0.5)
                .setDepth(1);
            dropRect.setStrokeStyle(3, 0xc8a76a);
        }

        // Căn mép trái 2 bút theo mép trái bảng gỗ, chừa một khoảng đệm nhỏ
        const boardBounds = dropRect.getBounds();
        const leftPadding = 0; // dịch gần mép trái hơn
        const alignLeft = boardBounds.left + leftPadding;

        // đặt lại vị trí X theo mép trái bảng gỗ
        shortPencil.x = alignLeft + shortPencil.displayWidth / 2;
        longPencil.x = alignLeft + longPencil.displayWidth / 2;

        // và Y cách nhau rõ ràng, nằm phía trên bảng gỗ
        const topAboveBoard = boardBounds.top - 150;
        let verticalGap = 75;
        // Nếu là tàu thì tăng khoảng cách giữa hai hình
        if (hintKind === 'train') {
            verticalGap = 90;
        }
        shortPencil.y = topAboveBoard;
        longPencil.y = topAboveBoard + verticalGap;

        // Zone để kiểm tra va chạm khi thả
        const dropZone = this.add
            .zone(dropRect.x, dropRect.y, dropWidth, dropHeight)
            .setRectangleDropZone(dropWidth, dropHeight);

        // Chọn hình đúng để bé kéo (ngắn / dài) dựa theo correctIsShort
        const correctTarget = correctIsShort ? shortPencil : longPencil;

        // Cho phép kéo cả 2 hình, nhưng chỉ hình đúng mới hoàn thành hint
        [shortPencil, longPencil].forEach((img) => {
            img.setDepth(img === correctTarget ? 3 : 2);
            img.setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(img);
            img.setData('startX', img.x);
            img.setData('startY', img.y);
            img.setData('isCorrect', img === correctTarget);
        });

        // Bàn tay hướng dẫn – chỉ xuất hiện ở hình đúng,
        // CHỈ cho màn hint đầu tiên trong cả game
        let hand: Phaser.GameObjects.Image | undefined;
        const hasShownHand =
            (this.registry.get('size_hint_shown_hand') as boolean) === true;

        if (!hasShownHand && this.textures.exists('hint_hand')) {
            // đặt tay nhỏ hơn, xuất phát gần hình đúng
            // giả sử ngón tay chỉ sang PHẢI, nên anchor gần đầu ngón tay (bên phải)
            const startX =
                correctTarget.x + correctTarget.displayWidth * 0.25;
            const startY =
                correctTarget.y + correctTarget.displayHeight * 0.1;

            hand = this.add
                .image(startX, startY, 'hint_hand')
                // anchor gần đầu ngón tay, để (x,y) trùng với vị trí ngón chỉ
                .setOrigin(0.85, 0.25)
                .setDepth(4);
            // hand nhỏ hơn để không che mất đáp án
            hand.setScale(0.6);

            // tay di chuyển từ đáp án đúng về phía bảng gỗ, lặp lại
            this.tweens.add({
                targets: hand,
                x: dropRect.x - dropWidth * 0.15,
                y: dropRect.y - dropHeight * 0.1,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // đánh dấu đã hiện tay hướng dẫn
            this.registry.set('size_hint_shown_hand', true);
        }

        let completed = false;
        let dragStartX = 0;
        let dragStartY = 0;

        this.input.on(
            'dragstart',
            (_pointer: Phaser.Input.Pointer, gameObject: any) => {
                if (completed) return;
                if (gameObject !== shortPencil && gameObject !== longPencil)
                    return;

                // Ngắt toàn bộ voice câu hỏi trong Hint (trừ nhạc nền)
                AudioManager.stopAllExceptBgm();

                dragStartX = gameObject.x;
                dragStartY = gameObject.y;

                // Khi bé bắt đầu kéo, ẩn bàn tay hướng dẫn
                if (hand) {
                    hand.destroy();
                    hand = undefined;
                }
            }
        );

        this.input.on(
            'drag',
            (_pointer: Phaser.Input.Pointer, gameObject: any, x: number, y: number) => {
                if (completed) return;
                if (gameObject !== shortPencil && gameObject !== longPencil)
                    return;
                gameObject.x = x;
                gameObject.y = y;
            }
        );

        this.input.on(
            'dragend',
            (_pointer: Phaser.Input.Pointer, gameObject: any) => {
                if (completed) return;
                if (gameObject !== shortPencil && gameObject !== longPencil)
                    return;

                const startX = gameObject.getData('startX') as number;
                const startY = gameObject.getData('startY') as number;
                const isCorrect =
                    (gameObject.getData('isCorrect') as boolean) === true;

                // Nếu chỉ click nhẹ mà không kéo đủ xa thì không tính là thả
                const moved =
                    Phaser.Math.Distance.Between(
                        dragStartX,
                        dragStartY,
                        gameObject.x,
                        gameObject.y
                    ) > 10;

                if (!moved) {
                    this.tweens.add({
                        targets: gameObject,
                        x: startX,
                        y: startY,
                        duration: 200,
                        ease: 'Sine.easeOut',
                    });
                    return;
                }

                const inZone = Phaser.Geom.Rectangle.Contains(
                    dropRect.getBounds(),
                    gameObject.x,
                    gameObject.y
                );

                if (inZone && isCorrect) {
                    // đúng: phát âm thanh + animation "nảy" rồi snap vào khung
                    AudioManager.play('correct');
                    this.playRandomCorrectVoice();
                    completed = true;
                    shortPencil.disableInteractive();
                    longPencil.disableInteractive();

                    const baseScaleX = gameObject.scaleX;
                    const baseScaleY = gameObject.scaleY;

                    this.tweens.add({
                        targets: gameObject,
                        scaleX: baseScaleX * 1.08,
                        scaleY: baseScaleY * 1.08,
                        duration: 150,
                        yoyo: true,
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            this.tweens.add({
                                targets: gameObject,
                                x: dropZone.x,
                                y: dropZone.y,
                                duration: 250,
                                ease: 'Sine.easeInOut',
                                onComplete: () => {
                                    this.time.delayedCall(1000, () => {
                                        this.finishHint();
                                    });
                                },
                            });
                        },
                    });
                } else {
                    if (inZone && !isCorrect) {
                        // Sai: phát âm thanh + lắc nhẹ
                        AudioManager.play('wrong');
                        this.tweens.add({
                            targets: gameObject,
                            x: gameObject.x + 10,
                            duration: 60,
                            yoyo: true,
                            repeat: 3,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                this.tweens.add({
                                    targets: gameObject,
                                    x: startX,
                                    y: startY,
                                    duration: 250,
                                    ease: 'Sine.easeOut',
                                });
                            },
                        });
                    } else {
                        // Kéo sai hoặc thả ra ngoài: trả về vị trí cũ
                        this.tweens.add({
                            targets: gameObject,
                            x: startX,
                            y: startY,
                            duration: 250,
                            ease: 'Sine.easeOut',
                        });
                    }
                }
            }
        );
    }   

    private playHintPrompt(audioKey: string | null) {
        if (!audioKey) {
            return;
        }

        // Tăng volume riêng cho voice câu hỏi trong Hint
        const volume =
            audioKey.startsWith('audio/size/') ||
            audioKey.includes('/size_')
                ? 1.4
                : 1.0;

        AudioManager.playOneShot(audioKey, volume);
    }

    private playRandomCorrectVoice() {
        AudioManager.playRandomCorrectAnswer();
    }

    private finishHint() {
        // Gọi LessonScene để sang câu tiếp theo
        const lessonScene = this.scene.get('LessonScene') as any;
        if (lessonScene && typeof lessonScene.goToNextQuestionFromHint === 'function') {
            lessonScene.goToNextQuestionFromHint();
        }

        this.scene.stop('HintScene');
        this.scene.resume('LessonScene');
    }
}