import Phaser from 'phaser';
import type GameScene from './GameScene';
import AudioManager from './AudioManager';
import { resetRotateVoiceLock, playVoiceLocked } from './rotateOrientation';

type Subject = 'CHILI' | 'VEGETABLE';
type IncomingSubject = Subject | 'FLOWER';
type Side = 'LEFT' | 'RIGHT';

type InitData = {
  nextScene?: string;
  score?: number;
  levelIndex?: number;

  // from GameScene
  subject?: IncomingSubject;
  leftCount?: number;
  rightCount?: number;
};

const PROMPT_IMG_KEY: Record<Subject, string> = {
  CHILI: 'q_remove_chili',
  VEGETABLE: 'q_remove_veg',
};

const STACK_TEXTURE: Record<Subject, { LEFT: string; RIGHT: string }> = {
  CHILI: { LEFT: 'chili', RIGHT: 'chili' },
  VEGETABLE: { LEFT: 'veg', RIGHT: 'veg' },
};

const STACK_BIAS_BY_KEY: Record<string, { x: number; y: number }> = {
  chili: { x: 0, y: -55 },
  veg: { x: 0, y: -12 },
};

const COUNT_MIN = 1;
const COUNT_MAX = 5;
const NEED_REMOVE_FIXED = 2;

const PANEL_SCALE = 1.6;
const BANNER_Y = 80;
const PROMPT_IMG_SCALE = 0.6;
const FRAME_CONTENT_OFFSET_Y = -30;

const ITEM_SCALE = 1.15;

const DROP_OUTSIDE_THRESHOLD = 12;

const GUIDE_VOICE_COOLDOWN_MS = 2500;
let lastGuideVoiceAtMs = 0;

const FRAME_KEY_DEFAULT = 'basket';
const FRAME_KEY_BY_SUBJECT: Record<Subject, string> = {
  CHILI: 'basket_chili',
  VEGETABLE: 'basket_veg',
};

export default class RemoveScene extends Phaser.Scene {
  private nextSceneKey = 'GameScene';
  public score = 0;
  public levelIndex = 0;

  private subject: Subject = 'CHILI';
  private leftCount = 0;
  private rightCount = 0;
  private removeSide: Side = 'RIGHT';
  private needRemove = NEED_REMOVE_FIXED;

  private removedCount = 0;
  private removedItems: Phaser.GameObjects.Image[] = [];
  private removableItems: Phaser.GameObjects.Image[] = [];

  private panelRect?: Phaser.Geom.Rectangle;
  private leftFrameRect?: Phaser.Geom.Rectangle;
  private rightFrameRect?: Phaser.Geom.Rectangle;

  private boardFeedbackStamp?: Phaser.GameObjects.Image;

  private stopGuideVoice() {
    AudioManager.stopSound('remove_chili');
    AudioManager.stopSound('remove_veg');
  }

  constructor() {
    super('RemoveScene');
  }

  init(data: InitData) {
    this.nextSceneKey = data.nextScene ?? 'GameScene';
    this.score = data.score ?? 0;
    this.levelIndex = data.levelIndex ?? 0;

    this.subject = this.pickSubjectForRemove(data.subject);
    const { leftCount, rightCount } = this.generateCountsDiff2();
    this.leftCount = leftCount;
    this.rightCount = rightCount;

    const diff = Math.abs(this.leftCount - this.rightCount);
    this.needRemove = Math.max(1, diff || NEED_REMOVE_FIXED);
    this.removeSide = this.leftCount > this.rightCount ? 'LEFT' : 'RIGHT';

    this.removedCount = 0;
    this.removedItems.forEach((i) => i.destroy());
    this.removedItems = [];
    this.removableItems = [];
  }

  private pickSubjectForRemove(subject?: IncomingSubject): Subject {
    if (subject === 'CHILI' || subject === 'VEGETABLE') return subject;
    return Phaser.Math.Between(0, 1) === 0 ? 'CHILI' : 'VEGETABLE';
  }

  private generateCountsDiff2() {
    // Both sides are in [1..5] and always differ by 2:
    // (1,3), (2,4), (3,5) (and swapped).
    const baseMax = COUNT_MAX - NEED_REMOVE_FIXED;
    const base = Phaser.Math.Between(COUNT_MIN, baseMax);
    const more = base + NEED_REMOVE_FIXED;

    const leftMore = Phaser.Math.Between(0, 1) === 1;
    return leftMore ? { leftCount: more, rightCount: base } : { leftCount: base, rightCount: more };
  }

  private showStamp(key: string) {
    if (!this.boardFeedbackStamp) return;
    this.boardFeedbackStamp.setTexture(key).setVisible(true);
  }

  private hideStamp() {
    this.boardFeedbackStamp?.setVisible(false);
  }

  private finishLevel() {
    this.showStamp('result_correct');
    playVoiceLocked(this.sound, 'voice_complete');

    const gameScene = this.scene.get('GameScene') as GameScene;
    if (gameScene) gameScene.subgameDone = true;

    this.time.delayedCall(400, () => {
      this.scene.start(this.nextSceneKey, {
        score: this.score,
        levelIndex: this.levelIndex + 1,
      });
    });
  }

  private getItemKey(side: Side) {
    return STACK_TEXTURE[this.subject][side];
  }

  private getItemsAreaRect(frameRect: Phaser.Geom.Rectangle) {
    const pad =
      this.subject === 'VEGETABLE'
        ? { x: 0.03, top: 0.06, bottom: 0.08 }
        : this.subject === 'CHILI'
          ? { x: 0.02, top: 0.06, bottom: 0.08 }
          : { x: 0.06, top: 0.12, bottom: 0.14 };
    const padX = frameRect.width * pad.x;
    const padTop = frameRect.height * pad.top;
    const padBottom = frameRect.height * pad.bottom;
    return new Phaser.Geom.Rectangle(
      frameRect.x + padX,
      frameRect.y + padTop,
      frameRect.width - padX * 2,
      frameRect.height - padTop - padBottom,
    );
  }

  private getItemAnchorPoints(count: number) {
    // Normalized points (0..1) inside items-area rect; tuned for count 1..5.
    if (this.subject === 'VEGETABLE') {
      // Basket_veg looks like 2 shelves -> lay items in 2 rows.
      const yTop = 0.28;
      const yBottom = 0.78;
      switch (count) {
        case 1:
          return [{ x: 0.5, y: yBottom }];
        case 2:
          return [
            { x: 0.25, y: yBottom },
            { x: 0.75, y: yBottom },
          ];
        case 3:
          return [
            { x: 0.25, y: yTop },
            { x: 0.75, y: yTop },
            { x: 0.5, y: yBottom },
          ];
        case 4:
          return [
            { x: 0.25, y: yTop },
            { x: 0.75, y: yTop },
            { x: 0.25, y: yBottom },
            { x: 0.75, y: yBottom },
          ];
        case 5:
        default:
          return [
            { x: 0.15, y: yTop },
            { x: 0.5, y: yTop },
            { x: 0.85, y: yTop },
            { x: 0.3, y: yBottom },
            { x: 0.7, y: yBottom },
          ];
      }
    }

    if (this.subject === 'CHILI') {
      // Basket_chili: cluster in a "round" pack (2 on top, 2-3 on bottom).
      switch (count) {
        case 1:
          return [{ x: 0.5, y: 0.72 }];
        case 2:
          return [
            { x: 0.38, y: 0.74 },
            { x: 0.62, y: 0.74 },
          ];
        case 3:
          return [
            { x: 0.5, y: 0.52 },
            { x: 0.34, y: 0.8 },
            { x: 0.66, y: 0.8 },
          ];
        case 4:
          return [
            { x: 0.38, y: 0.54 },
            { x: 0.62, y: 0.54 },
            { x: 0.34, y: 0.82 },
            { x: 0.66, y: 0.82 },
          ];
        case 5:
        default:
          return [
            { x: 0.38, y: 0.52 },
            { x: 0.62, y: 0.52 },
            { x: 0.28, y: 0.82 },
            { x: 0.5, y: 0.7 },
            { x: 0.72, y: 0.82 },
          ];
      }
    }

    switch (count) {
      case 1:
        return [{ x: 0.5, y: 0.7 }];
      case 2:
        return [
          { x: 0.25, y: 0.72 },
          { x: 0.75, y: 0.72 },
        ];
      case 3:
        return [
          { x: 0.18, y: 0.82 },
          { x: 0.5, y: 0.55 },
          { x: 0.82, y: 0.82 },
        ];
      case 4:
        return [
          { x: 0.25, y: 0.6 },
          { x: 0.75, y: 0.6 },
          { x: 0.25, y: 0.88 },
          { x: 0.75, y: 0.88 },
        ];
      case 5:
      default:
        return [
          { x: 0.32, y: 0.52 },
          { x: 0.68, y: 0.52 },
          { x: 0.18, y: 0.88 },
          { x: 0.5, y: 0.86 },
          { x: 0.82, y: 0.88 },
        ];
    }
  }

  private getItemScaleForRect(
    itemKey: string,
    itemsRect: Phaser.Geom.Rectangle,
    points: Array<{ x: number; y: number }>,
  ) {
    const tex = this.textures.get(itemKey);
    const src = tex?.getSourceImage() as { width: number; height: number } | undefined;
    const srcW = src?.width ?? 1;
    const srcH = src?.height ?? 1;

    // Convert anchor points to pixel positions and compute max scale that:
    // - keeps icons inside itemsRect
    // - avoids overlap (based on minimum distance between anchors)
    const px = points.map((p) => ({
      x: itemsRect.x + itemsRect.width * p.x,
      y: itemsRect.y + itemsRect.height * p.y,
    }));

    const maxByEdges = px.reduce((minScale, p) => {
      const left = p.x - itemsRect.x;
      const right = itemsRect.right - p.x;
      const top = p.y - itemsRect.y;
      const bottom = itemsRect.bottom - p.y;
      const edgeRelax =
        this.subject === 'VEGETABLE'
          ? 1.25
          : this.subject === 'CHILI'
            ? 1.25
            : 1.15;
      const maxScaleX = ((2 * Math.min(left, right)) / srcW) * edgeRelax;
      const maxScaleY = ((2 * Math.min(top, bottom)) / srcH) * edgeRelax;
      return Math.min(minScale, maxScaleX, maxScaleY);
    }, Number.POSITIVE_INFINITY);

    let minDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < px.length; i++) {
      for (let j = i + 1; j < px.length; j++) {
        const d = Phaser.Math.Distance.Between(px[i].x, px[i].y, px[j].x, px[j].y);
        minDist = Math.min(minDist, d);
      }
    }

    const effectiveDim = Math.sqrt(srcW * srcH);
    const maxByNeighbor =
      Number.isFinite(minDist) && px.length >= 2
        ? (minDist * (this.subject === 'CHILI' ? 2.0 : 1.75)) / effectiveDim
        : Number.POSITIVE_INFINITY;

    const maxAllowed = Math.min(maxByEdges, maxByNeighbor);
    const scaled = maxAllowed * ITEM_SCALE;
    const maxMul = this.subject === 'CHILI' ? 1.65 : 1.55;
    return Phaser.Math.Clamp(scaled, maxAllowed * 0.55, maxAllowed * maxMul);
  }

  private createStackItems(side: Side, count: number, frameRect: Phaser.Geom.Rectangle) {
    const key = this.getItemKey(side);
    const bias = STACK_BIAS_BY_KEY[key] ?? { x: 0, y: 0 };
    const itemsRect = this.getItemsAreaRect(frameRect);
    const points = this.getItemAnchorPoints(count);
    // Use the same icon size for counts 1..5 (match the scale when count=5).
    const scale = this.getItemScaleForRect(key, itemsRect, this.getItemAnchorPoints(5));

    for (let i = 0; i < count; i++) {
      const p = points[i] ?? points[points.length - 1];
      const x = itemsRect.x + itemsRect.width * p.x + bias.x;
      const y = itemsRect.y + itemsRect.height * p.y + bias.y;

      const item = this.add.image(x, y, key).setScale(scale).setDepth(10 + i);

      const isDraggable = side === this.removeSide;
      if (isDraggable) {
        this.removableItems.push(item);
        this.enableRemoveDrag(item, side);
      }
    }
  }

  private enableRemoveDrag(item: Phaser.GameObjects.Image, side: Side) {
    const startX = item.x;
    const startY = item.y;
    const startDepth = item.depth;

    item.setInteractive({ draggable: true, cursor: 'pointer' });
    this.input.setDraggable(item);

    const clampToBoard = (x: number, y: number) => {
      const r = this.panelRect;
      if (!r) return { x, y };

      const halfW = item.displayWidth * 0.5;
      const halfH = item.displayHeight * 0.5;

      const minX = r.left + halfW;
      const maxX = r.right - halfW;
      const minY = r.top + halfH;
      const maxY = r.bottom - halfH;

      return {
        x: maxX < minX ? r.centerX : Phaser.Math.Clamp(x, minX, maxX),
        y: maxY < minY ? r.centerY : Phaser.Math.Clamp(y, minY, maxY),
      };
    };

    item.on('dragstart', () => {
      // As soon as the child interacts, stop the guide voice (avoid talking over dragging).
      this.stopGuideVoice();

      if (this.removedCount >= this.needRemove) {
        item.disableInteractive();
        item.setPosition(startX, startY);
        return;
      }
      this.hideStamp();
      item.setDepth(999);
    });

    item.on('drag', (_: Phaser.Input.Pointer, x: number, y: number) => {
      const p = clampToBoard(x, y);
      item.setPosition(p.x, p.y);
    });

    item.on('dragend', () => {
      if (this.removedCount >= this.needRemove) {
        item.setPosition(startX, startY);
        item.setDepth(startDepth);
        return;
      }
      const rect = side === 'LEFT' ? this.leftFrameRect : this.rightFrameRect;
      if (!rect) {
        item.setPosition(startX, startY);
        return;
      }

      const isStillInside = Phaser.Geom.Rectangle.Contains(rect, item.x, item.y);
      const dist = Phaser.Math.Distance.Between(startX, startY, item.x, item.y);
      const removed = !isStillInside && dist >= DROP_OUTSIDE_THRESHOLD;

      if (!removed) {
        AudioManager.play('sfx_wrong');
        this.showStamp('result_wrong');
        this.time.delayedCall(450, () => this.hideStamp());
        item.setPosition(startX, startY);
        item.setDepth(startDepth);
        return;
      }

      item.disableInteractive();
      AudioManager.play('sfx_correct');
      AudioManager.playCorrectAnswer?.();

      const target = this.getBottomDropPos(this.removedCount);
      this.removedItems.push(item);
      this.removedCount += 1;

      this.tweens.add({
        targets: item,
        x: target.x,
        y: target.y,
        scale: item.scaleX * 1.05,
        duration: 220,
        ease: 'Sine.Out',
      });

      if (this.removedCount >= this.needRemove) {
        // Stop further dragging immediately.
        this.removableItems.forEach((it) => {
          if (it !== item) it.disableInteractive();
        });
        this.time.delayedCall(250, () => this.finishLevel());
      }
    });
  }

  private getBottomDropPos(index: number) {
    const r = this.panelRect;
    if (!r) return { x: 0, y: 0 };

    const centerX = r.centerX;
    const baseY = r.bottom - 80;
    const gap = 100;

    const offset = (index - (this.needRemove - 1) / 2) * gap;
    return { x: centerX + offset, y: baseY };
  }

  private tryRenderBasketFrames(frameW: number, frameH: number) {
    if (!this.leftFrameRect || !this.rightFrameRect) return false;

    const preferredKey = FRAME_KEY_BY_SUBJECT[this.subject];
    const key = this.textures.exists(preferredKey)
      ? preferredKey
      : this.textures.exists(FRAME_KEY_DEFAULT)
        ? FRAME_KEY_DEFAULT
        : null;

    if (!key) return false;

    const leftCenter = { x: this.leftFrameRect.centerX, y: this.leftFrameRect.centerY };
    const rightCenter = { x: this.rightFrameRect.centerX, y: this.rightFrameRect.centerY };

    const leftBasket = this.add.image(leftCenter.x, leftCenter.y, key).setOrigin(0.5).setDepth(2);
    const rightBasket = this.add.image(rightCenter.x, rightCenter.y, key).setOrigin(0.5).setDepth(2);

    const fitScaleLeft = Math.min((frameW * 0.9) / leftBasket.width, (frameH * 0.9) / leftBasket.height);
    const fitScaleRight = Math.min((frameW * 0.9) / rightBasket.width, (frameH * 0.9) / rightBasket.height);
    const fitScale = Math.min(fitScaleLeft, fitScaleRight);

    leftBasket.setScale(fitScale);
    rightBasket.setScale(fitScale);

    // Replace hit rects by inner area of each basket (shrink bounds).
    const leftBounds = leftBasket.getBounds();
    const rightBounds = rightBasket.getBounds();

    const makeInnerRect = (b: Phaser.Geom.Rectangle) => {
      const pad =
        this.subject === 'VEGETABLE'
          ? { x: 0.06, top: 0.06, bottom: 0.06 }
          : this.subject === 'CHILI'
            ? { x: 0.05, top: 0.08, bottom: 0.12 }
            : { x: 0.22, top: 0.18, bottom: 0.28 };
      const padX = b.width * pad.x;
      const padTop = b.height * pad.top;
      const padBottom = b.height * pad.bottom;
      return new Phaser.Geom.Rectangle(
        b.x + padX,
        b.y + padTop,
        b.width - padX * 2,
        b.height - padTop - padBottom,
      );
    };

    this.leftFrameRect = makeInnerRect(leftBounds);
    this.rightFrameRect = makeInnerRect(rightBounds);
    return true;
  }

  create() {
    resetRotateVoiceLock();
    this.input.setDefaultCursor('default');
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    // Stop any carry-over voices from the previous scene to avoid voice overlap.
    AudioManager.stopSound('more_chili');
    AudioManager.stopSound('more_veg');
    AudioManager.stopSound('more_flower');
    for (let i = 1; i <= 4; i++) AudioManager.stopSound(`correct_answer_${i}`);

    // Any touch/click should stop the guide voice immediately (kids often spam).
    this.input.on('pointerdown', () => this.stopGuideVoice());

    const { width, height } = this.scale;

    // ===== Banner =====
    const banner = this.add.image(width / 2, BANNER_Y, 'btn_primary_pressed')
    .setOrigin(0.5)
    .setScale(0.7, 0.65);
    const promptKey = PROMPT_IMG_KEY[this.subject];
    if (this.textures.exists(promptKey)) {
      this.add
        .image(banner.x, banner.y, promptKey)
        .setOrigin(0.5)
        .setScale(PROMPT_IMG_SCALE)
        .setDepth(banner.depth + 1);
    } else {
      this.add
        .text(banner.x, banner.y, 'Bỏ bớt để bằng nhau', {
          fontFamily: 'Fredoka, Arial',
          fontSize: '28px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(banner.depth + 1);
    }

    // ===== Panel / Board =====
    const panel = this.add.image(width / 2, height / 2 + 40, 'banner_question').setOrigin(0.5).setScale(PANEL_SCALE);

    const panelW = panel.displayWidth;
    const panelH = panel.displayHeight;

    this.panelRect = new Phaser.Geom.Rectangle(panel.x - panelW / 2, panel.y - panelH / 2, panelW, panelH);

    // frames inside panel (left/right)
    const framePadX = panelW * 0.07;
    const framePadY = panelH * 0.12;
    const frameW = (panelW - framePadX * 2) / 2;
    const frameH = panelH - framePadY * 2;

    this.leftFrameRect = new Phaser.Geom.Rectangle(
      panel.x - panelW / 2 + framePadX,
      panel.y - panelH / 2 + framePadY + FRAME_CONTENT_OFFSET_Y,
      frameW,
      frameH,
    );
    this.rightFrameRect = new Phaser.Geom.Rectangle(this.leftFrameRect.right, this.leftFrameRect.y, frameW, frameH);

    this.tryRenderBasketFrames(frameW, frameH);

    // stamp đúng/sai
    const stampX = panel.x + panelW / 2 - 28;
    const stampY = panel.y + panelH / 2 - 28;
    this.boardFeedbackStamp = this.add
      .image(stampX, stampY, 'answer_default')
      .setOrigin(1, 1)
      .setDisplaySize(72, 72)
      .setVisible(false)
      .setDepth(1000);

    // Always show "equal" result after removing: left/right always differ by 2 in this scene.
    const baseCount = Math.min(this.leftCount, this.rightCount);
    const moreCount = baseCount + this.needRemove;

    const leftRenderCount = this.removeSide === 'LEFT' ? moreCount : baseCount;
    const rightRenderCount = this.removeSide === 'RIGHT' ? moreCount : baseCount;

    // Render items inside each frame (basket/frame area)
    this.createStackItems('LEFT', leftRenderCount, this.leftFrameRect);
    this.createStackItems('RIGHT', rightRenderCount, this.rightFrameRect);

    // Voice hướng dẫn (optional)
    const voiceKey = this.subject === 'CHILI' ? 'remove_chili' : 'remove_veg';
    const otherVoiceKey = voiceKey === 'remove_chili' ? 'remove_veg' : 'remove_chili';
    // Stop any previous guide voice immediately (avoid overlap when user re-enters quickly).
    AudioManager.stopSound(voiceKey);
    AudioManager.stopSound(otherVoiceKey);

    const now = Date.now();
    if (now - lastGuideVoiceAtMs >= GUIDE_VOICE_COOLDOWN_MS) {
      lastGuideVoiceAtMs = now;
      playVoiceLocked(this.sound, voiceKey);
    }
  }
}
