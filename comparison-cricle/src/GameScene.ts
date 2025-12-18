import Phaser from 'phaser';
import AudioManager from './AudioManager';

type Subject = 'BALL' | 'CAKE';

type GameState =
  | 'SHOW_LEVEL'
  | 'WAIT_CHOICE'
  | 'CHECK_CHOICE'
  | 'LEVEL_END'
  | 'GAME_END';
type Side = 'LEFT' | 'RIGHT';

type LevelBase = {
  id: number;
  subject: Subject;
  leftCount: number;
  rightCount: number;
  questionText: string;
  voiceKey?: string;
  bannerImageKey?: string;
};

type LevelConfig =
  | (LevelBase & {
      kind: 'TWO_ASSETS';
      imageKeyLeft: string;
      imageKeyRight: string;
      correctSide: Side;
    })
  | (LevelBase & {
      kind: 'ONE_ASSET';
      imageKey: string;
      correctSide: Side;
    });

// ===== SCALE =====
const BOARD_SCALE = 0.88;

const BASE_BOARD_WIDTH = 900;
const BASE_BOARD_HEIGHT = 550;

const BOARD_WIDTH = BASE_BOARD_WIDTH * BOARD_SCALE;
const BOARD_HEIGHT = BASE_BOARD_HEIGHT * BOARD_SCALE;

const BOARD_TOP_Y = 140;
const BANNER_Y = 80;
const BANNER_SCALE = 0.65;

// ===== CONTENT LAYOUT =====
const BOARD_CONTENT_WIDTH_RATIO = 0.9;
const BOARD_CONTENT_HEIGHT_RATIO = 0.9;

const BOARD_TWO_ASSET_WIDTH_RATIO = 0.7;
const BOARD_TWO_ASSET_HEIGHT_RATIO = 0.85;

const BOARD_SINGLE_ASSET_HEIGHT_RATIO = 0.95;

const LEFT_ASSET_SCALE_FACTOR = 0.98;
const RIGHT_ASSET_SCALE_FACTOR = 0.9;

const PROMPT_FONT_SIZE = 30;
const FEEDBACK_FONT_SIZE = 22;
const FEEDBACK_BOTTOM_MARGIN = 40;

const RESULT_STAMP_MARGIN = 28;
const RESULT_STAMP_SIZE = 72;

// ===== DRAW STYLE =====
const LINE_COLOR = 0x40916d; // #40916D
const LINE_WIDTH = 8;

// ===== DRAW RULES =====
const MIN_SHAPE_AREA_RATIO = 0.05;
const MID_DEADZONE_RATIO = 0.06; // vùng giữa không tính đúng (ép bé chọn trái/phải rõ ràng)
const MID_DEADZONE_MIN_PX = 30;
// const SIDE_DOMINANCE = 0.7;
// const MIN_AREA = 2000;
// const MAX_AREA_RATIO = 0.92;

type SnapData = { cx: number; cy: number; w: number; h: number };

export default class GameScene extends Phaser.Scene {
  public levelIndex = 0;
  public score = 0;

  private gameState: GameState = 'SHOW_LEVEL';

  private promptText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private questionBanner!: Phaser.GameObjects.Image;
  private promptImage?: Phaser.GameObjects.Image;

  private boardImageSingle!: Phaser.GameObjects.Image;
  private boardImageLeft!: Phaser.GameObjects.Image;
  private boardImageRight!: Phaser.GameObjects.Image;

  private boardRect!: Phaser.Geom.Rectangle;

  private drawGraphics!: Phaser.GameObjects.Graphics;
  private isDrawing = false;
  private drawPoints: Phaser.Math.Vector2[] = [];
  private hasDrawnOutsideBoard = false;

  private levels: LevelConfig[] = [];

  public subgameDone = false;

  private boardFeedbackStamp!: Phaser.GameObjects.Image;
  private snapEllipse?: Phaser.GameObjects.Ellipse;
  private cornerCharacter?: Phaser.GameObjects.Image;

  constructor() {
    super('GameScene');
  }

  // ===== FIT =====
  private fitContain(
    img: Phaser.GameObjects.Image,
    targetW: number,
    targetH: number,
    padding = 0.98
  ) {
    const texture = img.texture;
    const sourceImage = texture?.getSourceImage() as
      | HTMLImageElement
      | HTMLCanvasElement
      | undefined;

    const iw = sourceImage?.width ?? img.width;
    const ih = sourceImage?.height ?? img.height;
    if (!iw || !ih) return;

    img.setScale(1);

    const maxScale = Math.min(targetW / iw, targetH / ih);
    img.setScale(maxScale * padding);
  }

  // ===== SNAP ELLIPSE =====
  private showSnapEllipse(cx: number, cy: number, w: number, h: number) {
    const PAD = 1.08;
    const ew = Math.max(60, w * PAD);
    const eh = Math.max(60, h * PAD);

    this.snapEllipse?.destroy();

    this.snapEllipse = this.add
      .ellipse(cx, cy, ew, eh)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(LINE_WIDTH, LINE_COLOR, 1)
      .setDepth(20);

    this.snapEllipse.setAlpha(0).setScale(0.92);
    this.tweens.add({
      targets: this.snapEllipse,
      alpha: 1,
      scale: 1,
      duration: 140,
      ease: 'Back.Out',
    });
  }

  private clearSnapEllipse() {
    this.snapEllipse?.destroy();
    this.snapEllipse = undefined;
  }

  private showResultStamp(key: string) {
    this.boardFeedbackStamp.setTexture(key).setVisible(true);
  }

  private hideResultStamp() {
    this.boardFeedbackStamp.setVisible(false);
  }

  private failAttempt(resetDelay = 500) {
    if (this.gameState === 'LEVEL_END' || this.gameState === 'GAME_END') return;

    this.gameState = 'CHECK_CHOICE';

    this.showResultStamp('answer_wrong');
    AudioManager.play('sfx_wrong');

    this.time.delayedCall(resetDelay, () => {
      this.drawGraphics.clear();
      this.clearSnapEllipse();
      this.hideResultStamp();
      this.gameState = 'WAIT_CHOICE';
    });
  }

  init(data: { levelIndex?: number; score?: number }) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;

    this.levels = [
      {
        id: 1,
        subject: 'BALL',
        leftCount: 5,
        rightCount: 3,
        kind: 'TWO_ASSETS',
        imageKeyLeft: 'ball1',
        imageKeyRight: 'ball2',
        correctSide: 'RIGHT',
        questionText: 'KHOANH VÀO CHÚ HỀ CÓ ÍT QUẢ BÓNG HƠN!',
        bannerImageKey: 'q_less_ball',
        voiceKey: 'less_ball',
      },
      {
        id: 2,
        subject: 'CAKE',
        leftCount: 6,
        rightCount: 4,
        kind: 'ONE_ASSET',
        imageKey: 'cake',
        correctSide: 'RIGHT',
        questionText: 'KHOANH VÀO ĐĨA CÓ ÍT BÁNH HƠN!',
        bannerImageKey: 'q_less_cake',
        voiceKey: 'less_cake',
      },
      {
        id: 3,
        subject: 'BALL',
        leftCount: 6,
        rightCount: 3,
        kind: 'TWO_ASSETS',
        imageKeyLeft: 'ball1',
        imageKeyRight: 'ball2',
        correctSide: 'LEFT',
        questionText: 'KHOANH VÀO CHÚ HỀ CÓ NHIỀU QUẢ BÓNG HƠN!',
        bannerImageKey: 'q_more_ball',
        voiceKey: 'more_ball',
      },
      {
        id: 4,
        subject: 'CAKE',
        leftCount: 7,
        rightCount: 5,
        kind: 'ONE_ASSET',
        imageKey: 'cake',
        correctSide: 'LEFT',
        questionText: 'KHOANH VÀO ĐĨA CÓ NHIỀU BÁNH HƠN!',
        bannerImageKey: 'q_more_cake',
        voiceKey: 'more_cake',
      },
    ];

    this.subgameDone = false;
    this.gameState = 'SHOW_LEVEL';
  }

  public isLevelComplete(): boolean {
    return this.subgameDone;
  }

  create() {
    const { width, height } = this.scale;

    if ((window as any).setGameButtonsVisible) (window as any).setGameButtonsVisible(true);
    if ((window as any).setRandomGameViewportBg) (window as any).setRandomGameViewportBg();

    // Unlock audio 1 lần
    const audioUnlockedKey = '__questionAudioUnlocked__';
    const audioUnlocked = !!(window as any)[audioUnlockedKey];
    if (audioUnlocked) {
      this.playCurrentQuestionVoice();
    } else {
      this.input.once('pointerdown', () => {
        (window as any)[audioUnlockedKey] = true;
        this.playCurrentQuestionVoice();
      });
    }

    // Nút HTML (nếu có)
    const replayBtnEl = document.getElementById('btn-replay') as HTMLButtonElement | null;
    const nextBtnEl = document.getElementById('btn-next') as HTMLButtonElement | null;

    const setBtnBgFromUrl = (el: HTMLButtonElement | null, url?: string) => {
      if (!el || !url) return;
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.backgroundSize = 'contain';
    };
    setBtnBgFromUrl(replayBtnEl, 'assets/button/replay.png');
    setBtnBgFromUrl(nextBtnEl, 'assets/button/next.png');

    // BOARD frame (dịch nhẹ sang phải để cân với char bên trái)
    const boardX = (width - BOARD_WIDTH) / 2 + width * 0.01;
    const boardY = BOARD_TOP_Y;

    this.add
      .image(boardX + BOARD_WIDTH / 2, boardY + BOARD_HEIGHT / 2, 'banner_question')
      .setDisplaySize(BOARD_WIDTH, BOARD_HEIGHT)
      .setOrigin(0.5);

    // 3 layer ảnh
    const placeholderKey = 'banner_question';

    this.boardImageSingle = this.add
      .image(boardX + BOARD_WIDTH / 2, boardY + BOARD_HEIGHT / 2, placeholderKey)
      .setOrigin(0.5)
      .setVisible(false);

    this.boardImageLeft = this.add
      .image(boardX + BOARD_WIDTH * 0.25, boardY + BOARD_HEIGHT / 2, placeholderKey)
      .setOrigin(0.5)
      .setVisible(false);

    this.boardImageRight = this.add
      .image(boardX + BOARD_WIDTH * 0.75, boardY + BOARD_HEIGHT / 2, placeholderKey)
      .setOrigin(0.5)
      .setVisible(false);

    // Rect vùng board
    this.boardRect = new Phaser.Geom.Rectangle(boardX, boardY, BOARD_WIDTH, BOARD_HEIGHT);

    // Stamp đúng/sai
    const stampX = boardX + BOARD_WIDTH - RESULT_STAMP_MARGIN;
    const stampY = boardY + BOARD_HEIGHT - RESULT_STAMP_MARGIN;
    this.boardFeedbackStamp = this.add
      .image(stampX, stampY, 'answer_default')
      .setOrigin(1, 1)
      .setDisplaySize(RESULT_STAMP_SIZE, RESULT_STAMP_SIZE)
      .setVisible(false)
      .setDepth(12);

    // Banner câu hỏi
    const bannerY = BANNER_Y;
    this.questionBanner = this.add.image(width / 2, bannerY, 'btn_primary_pressed').setOrigin(0.5);
    this.questionBanner.setScale(BANNER_SCALE * BOARD_SCALE);

    this.promptText = this.add
      .text(width / 2, bannerY + 3, '', {
        fontFamily: '"Baloo 2", "Fredoka", sans-serif',
        fontSize: `${PROMPT_FONT_SIZE}px`,
        fontStyle: '700',
        color: '#FFFFFF',
        align: 'center',
        stroke: '#222',
        strokeThickness: 2,
        resolution: 1,
      })
      .setOrigin(0.5);


    // Feedback
    this.feedbackText = this.add
      .text(width / 2, height - FEEDBACK_BOTTOM_MARGIN, '', {
        fontSize: `${FEEDBACK_FONT_SIZE * BOARD_SCALE}px`,
        color: '#333',
      })
      .setOrigin(0.5);

    // Lớp vẽ
    this.drawGraphics = this.add.graphics().setDepth(10);

    this.input.on('pointerdown', this.handleDrawStart, this);
    this.input.on('pointermove', this.handleDrawMove, this);
    this.input.on('pointerup', this.handleDrawEnd, this);
    this.input.on('pointerupoutside', this.handleDrawEnd, this);

    (window as any).playCurrentQuestionVoice = () => this.playCurrentQuestionVoice();

    // ===== NHÂN VẬT NỀN (CHAR) – neo theo viewport, không phụ thuộc board =====
    const baseCharScale = height / 720;
    const charScale = baseCharScale * 0.55;
    const charX = width * 0.1;
    const charY = height - 10;

    this.cornerCharacter = this.add
      .image(charX, charY, 'char')
      .setOrigin(0.5, 1)
      .setScale(charScale)
      .setDepth(15);

    // Nhún + lắc nhẹ (giống Match12)
    this.tweens.add({
      targets: this.cornerCharacter,
      y: charY - height * 0.02,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.tweens.add({
      targets: this.cornerCharacter,
      angle: { from: -2, to: 2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.startLevel();
  }

  private startLevel() {
    this.hideResultStamp();
    this.clearSnapEllipse();

    if (this.levelIndex >= this.levels.length) {
      this.gameState = 'GAME_END';
      this.scene.start('EndGameScene', { score: this.score, total: this.levels.length });
      return;
    }

    this.subgameDone = false;
    this.gameState = 'WAIT_CHOICE';
    this.feedbackText.setText('');
    this.drawGraphics.clear();

    const lv = this.levels[this.levelIndex];

    const boardX = this.boardRect.x;
    const boardY = this.boardRect.y;
    const boardWidth = this.boardRect.width;
    const boardHeight = this.boardRect.height;

    const contentWidth = boardWidth * BOARD_CONTENT_WIDTH_RATIO;
    const contentHeight = boardHeight * BOARD_CONTENT_HEIGHT_RATIO;
    const contentX = boardX + (boardWidth - contentWidth) / 2;
    const contentY = boardY + (boardHeight - contentHeight) / 2;

    const contentCenterX = contentX + contentWidth / 2;
    const contentCenterY = contentY + contentHeight / 2;

    const leftCenterX = contentX + contentWidth * 0.25;
    const rightCenterX = contentX + contentWidth * 0.75;

    const singleTargetHeight = contentHeight * BOARD_SINGLE_ASSET_HEIGHT_RATIO;
    const twoAssetHeight = contentHeight * BOARD_TWO_ASSET_HEIGHT_RATIO;
    const twoAssetWidth = contentWidth * BOARD_TWO_ASSET_WIDTH_RATIO;

    if (lv.kind === 'ONE_ASSET') {
      this.boardImageSingle
        .setVisible(true)
        .setTexture(lv.imageKey)
        .setOrigin(0.5)
        .setPosition(contentCenterX, contentCenterY);

      this.boardImageLeft.setVisible(false);
      this.boardImageRight.setVisible(false);

      this.fitContain(this.boardImageSingle, contentWidth, singleTargetHeight);
    } else {
      this.boardImageSingle.setVisible(false);

      this.boardImageLeft
        .setVisible(true)
        .setTexture(lv.imageKeyLeft)
        .setOrigin(0.5)
        .setPosition(leftCenterX, contentCenterY);

      this.boardImageRight
        .setVisible(true)
        .setTexture(lv.imageKeyRight)
        .setOrigin(0.5)
        .setPosition(rightCenterX, contentCenterY);

      this.fitContain(this.boardImageLeft, twoAssetWidth, twoAssetHeight);
      this.fitContain(this.boardImageRight, twoAssetWidth, twoAssetHeight);

      this.boardImageLeft.setScale(
        this.boardImageLeft.scaleX * LEFT_ASSET_SCALE_FACTOR,
        this.boardImageLeft.scaleY * LEFT_ASSET_SCALE_FACTOR
      );
      this.boardImageRight.setScale(
        this.boardImageRight.scaleX * RIGHT_ASSET_SCALE_FACTOR,
        this.boardImageRight.scaleY * RIGHT_ASSET_SCALE_FACTOR
      );
    }

    const bannerCenterX = this.questionBanner.x;
    const bannerCenterY = this.questionBanner.y;
    const bannerTextScale = 0.65; // scale nhỏ ảnh text trong banner

    if (lv.bannerImageKey && this.textures.exists(lv.bannerImageKey)) {
      // Luôn tạo lại promptImage để tránh dùng object đã bị destroy giữa các lần restart scene
      if (this.promptImage) {
        this.promptImage.destroy();
      }

      this.promptImage = this.add
        .image(bannerCenterX, bannerCenterY, lv.bannerImageKey)
        .setOrigin(0.5)
        .setScale(bannerTextScale);

      this.promptText.setVisible(false);

      const imgWidth = this.promptImage.displayWidth;
      const baseBannerWidth = this.questionBanner.width;
      const padding = 140;
      const minBannerWidth = 720;
      const desiredWidth = Math.max(minBannerWidth, imgWidth + padding);
      const scaleX = desiredWidth / baseBannerWidth;
      const scaleY = BANNER_SCALE * BOARD_SCALE;
      this.questionBanner.setScale(scaleX, scaleY);
    } else {
      // Fallback: dùng text nếu chưa có asset ảnh
      if (this.promptImage) {
        this.promptImage.setVisible(false);
      }

      this.promptText.setVisible(true);
      this.promptText.setText(lv.questionText);

      const textWidth = this.promptText.width;
      const baseBannerWidth = this.questionBanner.width;
      const padding = 140;
      const minBannerWidth = 720;
      const desiredWidth = Math.max(minBannerWidth, textWidth + padding);
      const scaleX = desiredWidth / baseBannerWidth;
      const scaleY = BANNER_SCALE * BOARD_SCALE;
      this.questionBanner.setScale(scaleX, scaleY);
    }
    this.playCurrentQuestionVoice();
  }

  private launchBalanceForLevel(lv: LevelConfig) {
    const lessCharacter: 'GIRL' | 'BOY' =
      lv.leftCount < lv.rightCount ? 'GIRL' : 'BOY';

    this.scene.start('BalanceScene', {
      leftCount: lv.leftCount,
      rightCount: lv.rightCount,
      subject: lv.subject,
      lessCharacter,
      nextScene: 'GameScene',
      score: this.score,
      levelIndex: this.levelIndex,
    });
  }

  private playCurrentQuestionVoice() {
    const lv = this.levels[this.levelIndex];
    const voiceKey = lv?.voiceKey;
    if (!voiceKey) return;

    try {
      // Khoá voice câu hỏi: nếu đang phát thì không phát lại
      if (AudioManager.isPlaying(voiceKey)) return;
      AudioManager.play(voiceKey);
    } catch {
      // ignore
    }
  }

  // ================= VẼ KHOANH =================
  private handleDrawStart(pointer: Phaser.Input.Pointer) {
    if (this.gameState !== 'WAIT_CHOICE') return;

    const insideBoard = Phaser.Geom.Rectangle.Contains(
      this.boardRect,
      pointer.worldX,
      pointer.worldY
    );
    // Chỉ cho bắt đầu khoanh khi nằm trong board
    if (!insideBoard) {
      this.input.setDefaultCursor('default');
      return;
    }

    // Ngắt âm thanh câu hỏi nếu đang phát khi bé bắt đầu khoanh
    const lv = this.levels[this.levelIndex];
    if (lv?.voiceKey) {
      AudioManager.stop(lv.voiceKey);
    }

    this.hideResultStamp();
    this.clearSnapEllipse();

    this.isDrawing = true;
    this.hasDrawnOutsideBoard = false;
    this.drawPoints = [];

    this.drawGraphics.clear();
    this.drawGraphics.lineStyle(LINE_WIDTH, LINE_COLOR, 1);
    this.drawGraphics.beginPath();
    this.drawGraphics.moveTo(pointer.worldX, pointer.worldY);

    this.drawPoints.push(new Phaser.Math.Vector2(pointer.worldX, pointer.worldY));

    this.input.setDefaultCursor('crosshair');
  }

  private handleDrawMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDrawing) return;

    const x = pointer.worldX;
    const y = pointer.worldY;

    // Khi đang khoanh mà đi ra ngoài board → không vẽ nét, đánh dấu đã ra ngoài
    if (!Phaser.Geom.Rectangle.Contains(this.boardRect, x, y)) {
      this.hasDrawnOutsideBoard = true;
      this.input.setDefaultCursor('default');
      return;
    }

    const last = this.drawPoints[this.drawPoints.length - 1];
    if (last && Phaser.Math.Distance.Between(last.x, last.y, x, y) < 6) return;

    this.drawGraphics.lineTo(x, y);
    this.drawGraphics.strokePath();
    this.drawGraphics.beginPath();
    this.drawGraphics.moveTo(x, y);

    this.drawPoints.push(new Phaser.Math.Vector2(x, y));
  }

  private handleDrawEnd() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    this.input.setDefaultCursor('default');

    // bbox
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const p of this.drawPoints) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const w = maxX - minX;
    const h = maxY - minY;

    // ✅ khoanh ra ngoài board: SAI ngay
    const anyOutsideInPoints = this.drawPoints.some(
      (p) => !Phaser.Geom.Rectangle.Contains(this.boardRect, p.x, p.y)
    );
    const anyOutside = this.hasDrawnOutsideBoard || anyOutsideInPoints;
    if (anyOutside) {
      this.drawGraphics.clear();
      this.failAttempt();
      return;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    if (!Phaser.Geom.Rectangle.Contains(this.boardRect, cx, cy)) {
      this.drawGraphics.clear();
      this.failAttempt();
      return;
    }

    // Hình phải có diện tích đủ lớn (tránh đường thẳng hoặc gần như đường thẳng)
    let area = 0;
    for (let i = 0; i < this.drawPoints.length; i++) {
      const p1 = this.drawPoints[i];
      const p2 = this.drawPoints[(i + 1) % this.drawPoints.length];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    area = Math.abs(area) * 0.5;
    const bboxArea = w * h;
    if (bboxArea > 0 && area / bboxArea < MIN_SHAPE_AREA_RATIO) {
      // Diện tích quá nhỏ so với khung → coi như đường thẳng, không chấp nhận
      this.drawGraphics.clear();
      this.failAttempt();
      return;
    }

    // Đơn giản hoá logic chọn bên:
    // - Không khoanh ra ngoài bg (đã check ở trên)
    // - Không yêu cầu diện tích / tỉ lệ quá chặt
    // - Bé khoanh hơi méo vẫn tính là đúng, chỉ cần không là đường thẳng

    const midX = this.boardRect.x + this.boardRect.width / 2;
    const deadZone = Math.max(
      MID_DEADZONE_MIN_PX,
      this.boardRect.width * MID_DEADZONE_RATIO
    );

    // ✅ khoanh ngay giữa (không nghiêng trái/phải) thì tính SAI
    if (Math.abs(cx - midX) < deadZone) {
      this.drawGraphics.clear();
      this.failAttempt();
      return;
    }
    const side: Side = cx < midX ? 'LEFT' : 'RIGHT';

    // ✅ khoá state (tránh vẽ tiếp)
    this.gameState = 'CHECK_CHOICE';

    // ✅ KHÔNG SNAP Ở ĐÂY NỮA (chỉ đúng mới snap)
    this.drawGraphics.clear();

    this.handleChoice(side, { cx, cy, w, h });
  }

  // ============ XỬ LÝ ĐÚNG/SAI ============
  private handleChoice(side: Side, snap?: SnapData) {
    if (this.gameState === 'LEVEL_END' || this.gameState === 'GAME_END') return;
    if (this.gameState !== 'WAIT_CHOICE' && this.gameState !== 'CHECK_CHOICE') return;

    this.gameState = 'CHECK_CHOICE';

    const lv = this.levels[this.levelIndex];
    const isCorrect = side === lv.correctSide;

    if (isCorrect) {
      // ✅ chỉ đúng mới snap ellipse
      if (snap) this.showSnapEllipse(snap.cx, snap.cy, snap.w, snap.h);

      this.showResultStamp('answer_correct');
      this.score++;
      this.subgameDone = true;

      AudioManager.play('sfx_correct');
      AudioManager.playCorrectAnswer?.();

      this.gameState = 'LEVEL_END';

      this.time.delayedCall(800, () => {
        this.launchBalanceForLevel(lv);
      });
    } else {
      this.failAttempt(500);
    }
  }
}
