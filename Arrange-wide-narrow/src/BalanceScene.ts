import Phaser from 'phaser';
import type GameScene from './GameScene';
import AudioManager from './AudioManager';
import { resetRotateVoiceLock, playVoiceLocked } from './rotateOrientation';

type Subject = 'BIRDCAGE';
type Side = 'LEFT' | 'RIGHT';

/* ===================== ASSET MAP ===================== */

// base nhân vật trái/phải theo subject
const BASE_CHARACTER_TEXTURE: Record<Subject, { left: string; right: string }> = {
  BIRDCAGE: { left: 'birdcage_left', right: 'birdcage_right' }, // <-- đổi key theo asset thật
};

// ✅ chỉ 2 biến thể nâng cấp CHUNG cho mỗi subject
// icon kéo (giữ theo bạn)
const DRAG_TEXTURES: Record<Subject, string[]> = {
  BIRDCAGE: ['icon1', 'icon2', 'icon3'], // <-- đổi key theo asset thật
};

const BUTTON_ASSET_URLS = {
  replay: 'assets/button/replay.png',
  next: 'assets/button/next.png',
} as const;

const RESULT_STAMP_MARGIN = 28;
const RESULT_STAMP_SIZE = 72;
const CORRECT_ICON_KEY = 'icon3';
const CORRECT_TARGET_TEXTURE_KEY = 'birdcage_left';

/* ===================== ICON3 PLACEMENT TUNING ===================== */

type CorrectIconPlacement = {
  originX: number;
  originY: number;
  maxWRatio: number;
  maxHRatio: number;
  bottomMarginRatio: number;
  offsetX: number;
  offsetY: number;
};

const CORRECT_ICON_PLACEMENT_DEFAULT: CorrectIconPlacement = {
  originX: 0.5,// center
  originY: 1, // bottom
  maxWRatio: 0.5, // chiếm tối đa 55% chiều rộng target
  maxHRatio: 0.5,// chiếm tối đa 55% chiều cao target
  bottomMarginRatio: 0.13415,// cách đáy target 6% chiều cao target
  offsetX: 0,// chỉnh dịch chuyển tâm X
  offsetY: 0,// chỉnh dịch chuyển tâm Y
};

// Override theo texture của target (ví dụ: 'birdcage_left', 'birdcage_right')
const CORRECT_ICON_PLACEMENT_BY_TARGET: Partial<Record<string, Partial<CorrectIconPlacement>>> = {
  // birdcage_left: { offsetX: 10, offsetY: -6, maxWRatio: 0.6, bottomMarginRatio: 0.04 },
};

/* ===================== DROP TARGET (CÁCH 2) ===================== */

// Icon3 phải thả "lọt hẳn" vào trong ảnh target, không tính các cạnh biên.
// Tăng inset nếu muốn khó hơn, giảm nếu muốn dễ hơn.
const DROP_INNER_INSET_X = 8;
const DROP_INNER_INSET_Y = 8;
const DRAG_DISTANCE_THRESHOLD = 12;

/* ===================== VOICE CUT ON SPAM ===================== */

const VOICE_SPAM_CLICK_WINDOW_MS = 260;

/* ===================== TYPES ===================== */

type BalanceInitData = {
  subject?: Subject; // ✅ optional vì giờ chỉ có 1 option
  leftCount: number;
  rightCount: number;

  // legacy
  lessCharacter?: Side | 'BALL1' | 'BALL2';

  nextScene?: string;
  score?: number;
  levelIndex?: number;
  totalLevels?: number;
  lessonId?: string;
};

/* ===================== SCENE ===================== */

export default class BalanceScene extends Phaser.Scene {
  private subject: Subject = 'BIRDCAGE';

  private actorY = 0;
  private leftActorCenterX = 0;
  private rightActorCenterX = 0;

  private leftBase?: Phaser.GameObjects.Image;
  private rightBase?: Phaser.GameObjects.Image;

  private nextSceneKey = 'GameScene';
  public score = 0;
  public levelIndex = 0;
  private totalLevels = 2;
  private lessonId = 'Arrange-wide-narrow';

  private cornerCharacter?: Phaser.GameObjects.Image;
  private boardFeedbackStamp?: Phaser.GameObjects.Image;
  private guideVoiceKey?: string;
  private bannerPromptImage?: Phaser.GameObjects.Image;
  private lastPointerDownAt = 0;

  private needAdd = 1;
  private addedCount = 0;
  private locked = false;

  constructor() {
    super('BalanceScene');
  }

  init(data: BalanceInitData) {
    this.subject = data.subject ?? 'BIRDCAGE';
    this.nextSceneKey = data.nextScene ?? 'GameScene';
    this.score = data.score ?? 0;
    this.levelIndex = data.levelIndex ?? 0;
    this.totalLevels = data.totalLevels ?? 2;
    this.lessonId = data.lessonId ?? 'Arrange-wide-narrow';

    // Mini-game hiện tại: chỉ cần kéo đúng 1 lần (icon3 -> birdcage_left)
    this.needAdd = 1;
    this.addedCount = 0;
    this.locked = false;
    this.lastPointerDownAt = 0;

    this.cornerCharacter = undefined;
    this.boardFeedbackStamp = undefined;
    this.bannerPromptImage = undefined;
    this.leftBase = undefined;
    this.rightBase = undefined;

    // legacy: ignore lessCharacter/side in current mini-game
  }

  private getCorrectIconPlacement(targetTextureKey?: string): CorrectIconPlacement {
    const override = (targetTextureKey && CORRECT_ICON_PLACEMENT_BY_TARGET[targetTextureKey]) || {};
    return {
      originX: override.originX ?? CORRECT_ICON_PLACEMENT_DEFAULT.originX,
      originY: override.originY ?? CORRECT_ICON_PLACEMENT_DEFAULT.originY,
      maxWRatio: override.maxWRatio ?? CORRECT_ICON_PLACEMENT_DEFAULT.maxWRatio,
      maxHRatio: override.maxHRatio ?? CORRECT_ICON_PLACEMENT_DEFAULT.maxHRatio,
      bottomMarginRatio: override.bottomMarginRatio ?? CORRECT_ICON_PLACEMENT_DEFAULT.bottomMarginRatio,
      offsetX: override.offsetX ?? CORRECT_ICON_PLACEMENT_DEFAULT.offsetX,
      offsetY: override.offsetY ?? CORRECT_ICON_PLACEMENT_DEFAULT.offsetY,
    };
  }

  private getCorrectTargetSprite(): Phaser.GameObjects.Image | undefined {
    // Theo yêu cầu: hình "left" là birdcage_left -> ưu tiên đúng sprite có texture này.
    if (this.leftBase?.texture?.key === CORRECT_TARGET_TEXTURE_KEY) return this.leftBase;
    if (this.rightBase?.texture?.key === CORRECT_TARGET_TEXTURE_KEY) return this.rightBase;
    return this.leftBase ?? this.rightBase;
  }

  private isPointInsideTargetStrict(target: Phaser.GameObjects.Image, x: number, y: number): boolean {
    const r = target.getBounds();
    const left = r.left + DROP_INNER_INSET_X;
    const right = r.right - DROP_INNER_INSET_X;
    const top = r.top + DROP_INNER_INSET_Y;
    const bottom = r.bottom - DROP_INNER_INSET_Y;

    return x > left && x < right && y > top && y < bottom;
  }

  /* ===================== FINISH LEVEL ===================== */
  private finishLevel() {
    this.locked = true;

    this.showResultStamp('result_correct');
    playVoiceLocked(this.sound, 'voice_complete');

    const gameScene = this.scene.get('GameScene') as GameScene;
    if (gameScene) gameScene.subgameDone = true;

    this.time.delayedCall(1000, () => {
      const nextLevelIndex = this.levelIndex + 1;
      const isLastMainLevelDone = nextLevelIndex >= this.totalLevels;

      if (isLastMainLevelDone) {
        this.scene.start('EndGameScene', {
          lessonId: this.lessonId,
          score: this.score,
          total: this.totalLevels,
        });
        return;
      }

      this.scene.start(this.nextSceneKey, {
        score: this.score,
        levelIndex: nextLevelIndex,
      });
    });
  }

  private showResultStamp(key: string) {
    if (!this.boardFeedbackStamp) return;
    this.boardFeedbackStamp.setTexture(key).setVisible(true);
  }

  private hideResultStamp() {
    this.boardFeedbackStamp?.setVisible(false);
  }

  private fitPromptImageToBanner(banner: Phaser.GameObjects.Image, img: Phaser.GameObjects.Image) {
    const targetH = banner.displayHeight * 0.62;
    const maxAllowedW = banner.displayWidth * 0.82;

    const texW = img.width || 1;
    const texH = img.height || 1;

    img.setScale(Math.min(targetH / texH, maxAllowedW / texW));
    img.setPosition(banner.x, banner.y);
  }

  create() {
    const { width, height } = this.scale;
    resetRotateVoiceLock();
    this.input.setDefaultCursor('default');

    this.input.dragDistanceThreshold = DRAG_DISTANCE_THRESHOLD;

    // Nếu bé click nhanh/spam -> ngắt voice hướng dẫn.
    this.input.on('pointerdown', () => {
      const now = this.time?.now ?? Date.now();
      const isSpam = now - this.lastPointerDownAt <= VOICE_SPAM_CLICK_WINDOW_MS;
      this.lastPointerDownAt = now;

      if (!isSpam) return;
      if (!this.guideVoiceKey) return;
      AudioManager.stop(this.guideVoiceKey);
      this.guideVoiceKey = undefined;
    });

    // ===== Viewport buttons (Replay/Next) like GameScene =====
    (window as unknown as { setGameButtonsVisible?: (visible: boolean) => void }).setGameButtonsVisible?.(true);
    const replayBtnEl = document.getElementById('btn-replay') as HTMLButtonElement | null;
    const nextBtnEl = document.getElementById('btn-next') as HTMLButtonElement | null;
    const setBtnBgFromUrl = (el: HTMLButtonElement | null, url?: string) => {
      if (!el || !url) return;
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.backgroundSize = 'contain';
    };
    setBtnBgFromUrl(replayBtnEl, BUTTON_ASSET_URLS.replay);
    setBtnBgFromUrl(nextBtnEl, BUTTON_ASSET_URLS.next);

    /* ===================== CHAR NỀN ===================== */
    const baseCornerCharScale = height / 720;
    const cornerCharScale = baseCornerCharScale * 0.55;
    const charX = width * 0.1;
    const charY = height - 10;

    this.cornerCharacter = this.add.image(charX, charY, 'char').setOrigin(0.5, 1).setScale(cornerCharScale).setDepth(15);

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

    /* ===================== BANNER ===================== */
    // Logic giống GameScene: banner cố định + promptImage scale theo banner.
    const bannerY = 60;
    const banner = this.add
      .image(width / 2, bannerY, 'btn_primary_pressed')
      .setOrigin(0.5)
      .setScale(0.45, 0.5)
      .setDepth(20);

    const bannerTextKey = 'q_add_birdcage';
    if (this.textures.exists(bannerTextKey)) {
      if (this.bannerPromptImage && !(this.bannerPromptImage.scene as any)?.sys) {
        this.bannerPromptImage = undefined;
      }

      if (!this.bannerPromptImage) {
        this.bannerPromptImage = this.add.image(banner.x, banner.y, bannerTextKey).setOrigin(0.5).setDepth(21);
      } else {
        this.bannerPromptImage.setTexture(bannerTextKey).setVisible(true);
      }

      this.fitPromptImageToBanner(banner, this.bannerPromptImage);
    } else if (this.bannerPromptImage) {
      this.bannerPromptImage.setVisible(false);
    }

    /* ===================== PANEL ===================== */
    const panel = this.add.image(width / 2, height / 2 + 40, 'banner_question').setOrigin(0.5).setScale(1.6);

    const panelW = panel.displayWidth;
    const panelH = panel.displayHeight;

    const panelRect = new Phaser.Geom.Rectangle(panel.x - panelW / 2, panel.y - panelH / 2, panelW, panelH);

    const stampX = panel.x + panelW / 2 - RESULT_STAMP_MARGIN;
    const stampY = panel.y + panelH / 2 - RESULT_STAMP_MARGIN;
    this.boardFeedbackStamp = this.add
      .image(stampX, stampY, 'answer_default')
      .setOrigin(1, 1)
      .setDisplaySize(RESULT_STAMP_SIZE, RESULT_STAMP_SIZE)
      .setVisible(false)
      .setDepth(12);

    /* ===================== 2 NHÂN VẬT (TRÁI + PHẢI) ===================== */
    const baseL = BASE_CHARACTER_TEXTURE[this.subject].left;
    const baseR = BASE_CHARACTER_TEXTURE[this.subject].right;

    const texL = this.textures.get(baseL).getSourceImage() as HTMLImageElement;
    const texR = this.textures.get(baseR).getSourceImage() as HTMLImageElement;

    const charScale =
      Math.min((panelH * 0.6) / Math.max(texL.height, texR.height), (panelW * 0.25) / Math.max(texL.width, texR.width)) *
      1.6;

    const SHIFT_UP = panelH * 0.01;
    const SIDE_PAD = panelW * 0.02;
    const TOP_PAD = panelH * 0.10;
    const BOT_PAD = panelH * 0.10;

    // Fine-tune: dịch hàng asset (nhân vật) lên và hàng icon xuống một chút
    const yNudge = height / 720;
    const ACTOR_ROW_OFFSET_Y = -12 * yNudge;
    const ICON_ROW_OFFSET_Y = 12 * yNudge;

    const actorRowY = panelRect.top + TOP_PAD + panelH * 0.28 - SHIFT_UP + ACTOR_ROW_OFFSET_Y;
    const iconRowY = panelRect.bottom - BOT_PAD - panelH * 0.04 - SHIFT_UP + ICON_ROW_OFFSET_Y;

    this.actorY = actorRowY;

    const maxTexW = Math.max(texL.width, texR.width);
    const charW = maxTexW * charScale;

    this.leftActorCenterX = panelRect.left + SIDE_PAD + charW / 2;
    this.rightActorCenterX = panelRect.right - SIDE_PAD - charW / 2;

    // Cố định: bên trái luôn là birdcage_left, bên phải luôn là birdcage_right
    const leftKey = baseL;
    const rightKey = baseR;

    this.leftBase = this.add.image(this.leftActorCenterX, this.actorY, leftKey).setScale(charScale).setOrigin(0.5);
    this.rightBase = this.add.image(this.rightActorCenterX, this.actorY, rightKey).setScale(charScale).setOrigin(0.5);

    /* ===================== ICON KÉO ===================== */
    // Random đổi thứ tự icon (icon1/icon2/icon3)
    const dragKeys = Phaser.Utils.Array.Shuffle([...DRAG_TEXTURES[this.subject]]);
    const dragCount = dragKeys.length;

    const usableW = panelW * 0.35;
    const spacingX = usableW / (dragCount - 1);
    const startX = panel.x - usableW / 2;

    const dragY = iconRowY;

    const makeIdleFx = (obj: Phaser.GameObjects.Image, baseScale: number) => {
      const d1 = 700 + Phaser.Math.Between(0, 250);
      const d2 = 900 + Phaser.Math.Between(0, 300);

      const t1 = this.tweens.add({ targets: obj, y: obj.y - 8, duration: d1, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const t2 = this.tweens.add({ targets: obj, angle: { from: -4, to: 4 }, duration: d2, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const t3 = this.tweens.add({
        targets: obj,
        scale: { from: baseScale * 0.98, to: baseScale * 1.02 },
        duration: 850 + Phaser.Math.Between(0, 250),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });

      return {
        pause: () => { t1.pause(); t2.pause(); t3.pause(); },
        resume: () => { t1.resume(); t2.resume(); t3.resume(); },
        stop: () => {
          t1.stop(); t2.stop(); t3.stop();
          this.tweens.remove(t1); this.tweens.remove(t2); this.tweens.remove(t3);
        },
      };
    };

    for (let i = 0; i < dragCount; i++) {
      const dragKey = dragKeys[i]!;
      const iconX = startX + i * spacingX;
      const iconHomeX = iconX;
      const iconHomeY = dragY;

      const tex = this.textures.get(dragKey);
      const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const srcW = (src as any)?.width ?? 1;
      const srcH = (src as any)?.height ?? 1;

      const maxIconW = spacingX * 0.75;
      const maxIconH = panelH * 0.18;
      const iconScale = Math.min(maxIconW / srcW, maxIconH / srcH);

      const icon = this.add
        .image(iconX, dragY, dragKey)
        .setScale(iconScale)
        .setInteractive({ draggable: true, cursor: 'pointer' });

      this.input.setDraggable(icon);

      const fx = makeIdleFx(icon, iconScale);

      let dragStartX = 0;
      let dragStartY = 0;
      let hasDragged = false;
      const MIN_DRAG = 18 * iconScale;

      icon.on('dragstart', () => {
        if (this.locked) return;

        dragStartX = icon.x;
        dragStartY = icon.y;
        hasDragged = false;

        fx.pause();
        icon.setAngle(0);
        icon.setScale(iconScale);

        if (this.guideVoiceKey) {
          AudioManager.stop(this.guideVoiceKey);
          this.guideVoiceKey = undefined;
        }
      });

      icon.on('drag', (_: Phaser.Input.Pointer, x: number, y: number) => {
        if (this.locked) return;

        icon.setPosition(x, y);

        if (!hasDragged) {
          const d = Phaser.Math.Distance.Between(dragStartX, dragStartY, x, y);
          if (d >= MIN_DRAG) hasDragged = true;
        }
      });

      icon.on('dragend', () => {
        if (this.locked) return;

        const dist = Phaser.Math.Distance.Between(dragStartX, dragStartY, icon.x, icon.y);
        if (!hasDragged || dist < MIN_DRAG) {
          icon.setPosition(iconHomeX, iconHomeY);
          fx.resume();
          return;
        }

        const inPanel = Phaser.Geom.Rectangle.Contains(panelRect, icon.x, icon.y);
        const target = this.getCorrectTargetSprite();

        let isCorrectDrop = false;
        if (inPanel && target && dragKey === CORRECT_ICON_KEY) {
          isCorrectDrop = this.isPointInsideTargetStrict(target, icon.x, icon.y);
        }

        if (isCorrectDrop) {
          AudioManager.play('sfx_correct');
          AudioManager.playCorrectAnswer?.();

          fx.stop();
          this.tweens.killTweensOf(icon);

          // Giữ icon3 nằm trên đúng mục tiêu (không nháy alpha, không đổi texture)
          icon.disableInteractive();
          icon.removeAllListeners();
          icon.setAlpha(1);
          icon.setAngle(0);

          if (target) {
            const tb = target.getBounds();
            const placement = this.getCorrectIconPlacement(target.texture?.key);
            const maxW = tb.width * placement.maxWRatio;
            const maxH = tb.height * placement.maxHRatio;
            const displayScale = Math.min(maxW / srcW, maxH / srcH);
            icon.setScale(displayScale);
            const bottomMargin = tb.height * placement.bottomMarginRatio;
            icon.setOrigin(placement.originX, placement.originY);
            icon.setPosition(tb.centerX + placement.offsetX, tb.bottom - bottomMargin + placement.offsetY);
            icon.setDepth((target.depth ?? 0) + 2);
          }
          this.addedCount++;

          const shouldFinish = this.addedCount >= this.needAdd;
          if (shouldFinish) this.finishLevel();
        } else {
          AudioManager.play('sfx_wrong');
          this.showResultStamp('result_wrong');
          this.time.delayedCall(500, () => this.hideResultStamp());

          icon.setPosition(iconHomeX, iconHomeY);
          fx.resume();
        }
      });
    }

    /* ===================== Voice hướng dẫn ===================== */
    this.guideVoiceKey = 'add_birdcage'; // <-- preload key này

    if (this.guideVoiceKey && !AudioManager.isPlaying(this.guideVoiceKey)) {
      playVoiceLocked(this.sound, this.guideVoiceKey);
    }

    // Nếu bé chạm lần đầu cũng dừng voice (tránh chồng khi bắt đầu thao tác).
    this.input.once('pointerdown', () => {
      if (!this.guideVoiceKey) return;
      if (!AudioManager.isPlaying(this.guideVoiceKey)) return;
      AudioManager.stop(this.guideVoiceKey);
      this.guideVoiceKey = undefined;
    });
  }
}
