import Phaser from 'phaser';
import type GameScene from './GameScene';
import AudioManager from './AudioManager';
import { resetRotateVoiceLock, playVoiceLocked } from './rotateOrientation';

type Subject = 'SNAIL' | 'AQUARIUM';
type Side = 'LEFT' | 'RIGHT';

/* ===================== ASSET MAP ===================== */

// base nhân vật trái/phải theo subject
const BASE_CHARACTER_TEXTURE: Record<Subject, { left: string; right: string }> = {
  SNAIL: { left: 'snail1', right: 'snail2' },
  AQUARIUM: { left: 'aquarium1', right: 'aquarium2' },
};

// ✅ chỉ 2 biến thể nâng cấp CHUNG cho mỗi subject
const UPGRADE_TEXTURES: Record<Subject, [string, string]> = {
  SNAIL: ['snail_plus_1', 'snail_plus_2'],
  AQUARIUM: ['aquarium_plus_1', 'aquarium_plus_2'],
};

// icon kéo (giữ theo bạn)
const DRAG_TEXTURES: Record<Subject, string[]> = {
  SNAIL: ['icon2', 'icon2', 'icon2'],
  AQUARIUM: ['icon3', 'icon3', 'icon3'],
};

const RESULT_STAMP_MARGIN = 28;
const RESULT_STAMP_SIZE = 72;

/* ===================== DROP TARGET (CÁCH 2) ===================== */

// ✅ nới vùng thả quanh nhân vật (tăng = dễ thả hơn)
const DROP_PAD_X = 70;
const DROP_PAD_Y = 70;

// ✅ chống “tap cũng tính drop”
const DRAG_DISTANCE_THRESHOLD = 12;

/* ===================== TYPES ===================== */

type BalanceInitData = {
  subject: Subject;

  // ✅ nhận count để tính logic cân bằng
  leftCount: number;
  rightCount: number;

  // legacy vẫn nhận, nhưng sẽ ưu tiên tính theo count để khỏi sai
  lessCharacter?: Side | 'BALL1' | 'BALL2';

  nextScene?: string;
  score?: number;
  levelIndex?: number;
};

/* ===================== SCENE ===================== */

export default class BalanceScene extends Phaser.Scene {
  private subject: Subject = 'SNAIL';

  private actorY = 0;
  private leftActorCenterX = 0;
  private rightActorCenterX = 0;

  private objectScale = 0.3;

  private leftBase?: Phaser.GameObjects.Image;
  private rightBase?: Phaser.GameObjects.Image;

  private nextSceneKey = 'GameScene';
  public score = 0;
  public levelIndex = 0;

  private cornerCharacter?: Phaser.GameObjects.Image;
  private boardFeedbackStamp?: Phaser.GameObjects.Image;
  private guideVoiceKey?: string;

  // ✅ logic cân bằng
  private leftCount = 0;
  private rightCount = 0;
  private upgradeSide: Side = 'LEFT';
  private needAdd = 2;
  private addedCount = 0;
  private locked = false;

  constructor() {
    super('BalanceScene');
  }

  init(data: BalanceInitData) {
    this.subject = data.subject;
    this.nextSceneKey = data.nextScene ?? 'GameScene';
    this.score = data.score ?? 0;
    this.levelIndex = data.levelIndex ?? 0;

    this.leftCount = data.leftCount ?? 0;
    this.rightCount = data.rightCount ?? 0;

    // ✅ số lần cần kéo = chênh lệch để bằng nhau
    this.needAdd = Math.max(2, Math.abs(this.leftCount - this.rightCount));
    this.addedCount = 0;
    this.locked = false;

    // ✅ chỉ đúng khi thả vào nhân vật bên PHẢI
    this.upgradeSide = 'RIGHT';
  }

  /* ===================== FX: blink alpha 1 lần / mỗi lần kéo ===================== */
  private blinkAlphaOnce(target: Phaser.GameObjects.Image, onDone?: () => void) {
    target.setAlpha(1);
    this.tweens.add({
      targets: target,
      alpha: { from: 1, to: 0.25 },
      duration: 90,
      yoyo: true,
      repeat: 0,
      ease: 'Sine.InOut',
      onComplete: () => {
        target.setAlpha(1);
        onDone?.();
      },
    });
  }

  /* ===================== APPLY UPGRADE (2 STEP, CHUNG) ===================== */
  private applyUpgrade(side: Side, addedCount: number, onDone?: () => void) {
    const stepIndex = Phaser.Math.Clamp(addedCount - 1, 0, 1);
    const tex = UPGRADE_TEXTURES[this.subject][stepIndex];

    const sprite = side === 'LEFT' ? this.leftBase : this.rightBase;
    if (!sprite) return;
    if (!this.textures.exists(tex)) return;

    sprite.setTexture(tex);
    this.blinkAlphaOnce(sprite, onDone);
  }

  /* ===================== FINISH LEVEL ===================== */
  private finishLevel() {
    this.locked = true;

    this.showResultStamp('result_correct');
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

  private showResultStamp(key: string) {
    if (!this.boardFeedbackStamp) return;
    this.boardFeedbackStamp.setTexture(key).setVisible(true);
  }

  private hideResultStamp() {
    this.boardFeedbackStamp?.setVisible(false);
  }

  create() {
    const { width, height } = this.scale;
    resetRotateVoiceLock();
    this.input.setDefaultCursor('default');

    // ✅ chống “tap cũng ăn”
    this.input.dragDistanceThreshold = DRAG_DISTANCE_THRESHOLD;

    /* ===================== CHAR NỀN ===================== */
    const baseCornerCharScale = height / 720;
    const cornerCharScale = baseCornerCharScale * 0.55;
    const charX = width * 0.1;
    const charY = height - 10;

    this.cornerCharacter = this.add
      .image(charX, charY, 'char')
      .setOrigin(0.5, 1)
      .setScale(cornerCharScale)
      .setDepth(15);

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
    const bannerY = 80;
    const banner = this.add.image(width / 2, bannerY, 'btn_primary_pressed').setOrigin(0.5);

    const baseBannerWidth = banner.width;
    const bannerScaleY = 0.65;

    const bannerTextKey = this.subject === 'SNAIL' ? 'q_add_snail' : 'q_add_aquarium';
    const padding = 200;
    const minBannerWidth = 800;

    let contentWidth = minBannerWidth;

    if (this.textures.exists(bannerTextKey)) {
      this.add.image(width / 2, bannerY, bannerTextKey).setOrigin(0.5).setScale(0.65);
      contentWidth = this.textures.get(bannerTextKey).getSourceImage().width * 0.65;
    }

    const desiredWidth = Math.max(minBannerWidth, contentWidth + padding);
    const scaleX = desiredWidth / baseBannerWidth;
    banner.setScale(scaleX, bannerScaleY);

    /* ===================== PANEL ===================== */
    const panel = this.add.image(width / 2, height / 2 + 40, 'banner_question').setOrigin(0.5).setScale(1.6);

    const panelW = panel.displayWidth;
    const panelH = panel.displayHeight;

    const panelRect = new Phaser.Geom.Rectangle(panel.x - panelW / 2, panel.y - panelH / 2, panelW, panelH);

    // Stamp đúng/sai
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
      2.0;

    /* ===================== LAYOUT: ĐẨY LÊN + CĂN ĐỀU ===================== */
    const SHIFT_UP = panelH * 0.01;
    const SIDE_PAD = panelW * 0.02;
    const TOP_PAD = panelH * 0.10;
    const BOT_PAD = panelH * 0.10;

    const actorRowY = panelRect.top + TOP_PAD + panelH * 0.28 - SHIFT_UP;
    const iconRowY = panelRect.bottom - BOT_PAD - panelH * 0.04 - SHIFT_UP;

    this.actorY = actorRowY;

    const maxTexW = Math.max(texL.width, texR.width);
    const charW = maxTexW * charScale;

    this.leftActorCenterX = panelRect.left + SIDE_PAD + charW / 2;
    this.rightActorCenterX = panelRect.right - SIDE_PAD - charW / 2;

    this.leftBase = this.add.image(this.leftActorCenterX, this.actorY, baseL).setScale(charScale).setOrigin(0.5);
    this.rightBase = this.add.image(this.rightActorCenterX, this.actorY, baseR).setScale(charScale).setOrigin(0.5);

    /* ===================== ICON KÉO ===================== */
    const dragCount = 3;

    this.objectScale = charScale * 1.3;

    const usableW = panelW * 0.35;
    const spacingX = usableW / (dragCount - 1);
    const startX = panel.x - usableW / 2;

    const dragY = iconRowY;

    // helper: idle “bơi/nhúc nhích”
    const makeIdleFx = (obj: Phaser.GameObjects.Image) => {
      const d1 = 700 + Phaser.Math.Between(0, 250);
      const d2 = 900 + Phaser.Math.Between(0, 300);

      const t1 = this.tweens.add({
        targets: obj,
        y: obj.y - 8,
        duration: d1,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });

      const t2 = this.tweens.add({
        targets: obj,
        angle: { from: -4, to: 4 },
        duration: d2,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });

      const t3 = this.tweens.add({
        targets: obj,
        scale: { from: this.objectScale * 0.98, to: this.objectScale * 1.02 },
        duration: 850 + Phaser.Math.Between(0, 250),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });

      return {
        pause: () => {
          t1.pause();
          t2.pause();
          t3.pause();
        },
        resume: () => {
          t1.resume();
          t2.resume();
          t3.resume();
        },
        stop: () => {
          t1.stop();
          t2.stop();
          t3.stop();
          this.tweens.remove(t1);
          this.tweens.remove(t2);
          this.tweens.remove(t3);
        },
      };
    };

    for (let i = 0; i < dragCount; i++) {
      const dragKey = DRAG_TEXTURES[this.subject][i];
      const iconX = startX + i * spacingX;
      const iconHomeX = iconX;
      const iconHomeY = dragY;

      const icon = this.add
        .image(iconX, dragY, dragKey)
        .setScale(this.objectScale)
        .setInteractive({ draggable: true, cursor: 'pointer' });

      this.input.setDraggable(icon);

      const fx = makeIdleFx(icon);

      // ✅ chống tap: phải kéo đủ xa mới tính “thả”
      let dragStartX = 0;
      let dragStartY = 0;
      let hasDragged = false;
      const MIN_DRAG = 18 * this.objectScale;

      icon.on('dragstart', () => {
        if (this.locked) return;

        dragStartX = icon.x;
        dragStartY = icon.y;
        hasDragged = false;

        fx.pause();
        icon.setAngle(0);
        icon.setScale(this.objectScale);

        if (this.guideVoiceKey) {
          AudioManager.stop(this.guideVoiceKey);
          this.guideVoiceKey = undefined;
        }
      });

      icon.on('drag', (_: Phaser.Input.Pointer, x: number, y: number) => {
        if (this.locked) return;

        // ✅ không cho kéo ra khỏi board
        const halfW = icon.displayWidth * 0.5;
        const halfH = icon.displayHeight * 0.5;
        const clampedX = Phaser.Math.Clamp(x, panelRect.left + halfW, panelRect.right - halfW);
        const clampedY = Phaser.Math.Clamp(y, panelRect.top + halfH, panelRect.bottom - halfH);
        icon.setPosition(clampedX, clampedY);

        if (!hasDragged) {
          const d = Phaser.Math.Distance.Between(dragStartX, dragStartY, clampedX, clampedY);
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

        // ✅ chỉ đúng khi thả vào nhân vật bên PHẢI
        const target = this.rightBase;

        let isCorrectDrop = false;
        if (inPanel && target) {
          const r = target.getBounds(); // theo display size hiện tại
          Phaser.Geom.Rectangle.Inflate(r, DROP_PAD_X, DROP_PAD_Y);
          isCorrectDrop = Phaser.Geom.Rectangle.Contains(r, icon.x, icon.y);
        }

        if (isCorrectDrop) {
          AudioManager.play('sfx_correct');
          AudioManager.playCorrectAnswer?.();

          fx.stop();
          this.tweens.killTweensOf(icon);

          icon.destroy();
          this.addedCount++;

          const shouldFinish = this.addedCount >= this.needAdd;

          this.applyUpgrade(this.upgradeSide, this.addedCount, () => {
            if (shouldFinish) this.finishLevel();
          });
        } else {
          AudioManager.play('sfx_wrong');
          this.showResultStamp('result_wrong');
          this.time.delayedCall(500, () => this.hideResultStamp());

          icon.setPosition(iconHomeX, iconHomeY);
          fx.resume();
        }
      });
    }

    // Voice hướng dẫn
    this.guideVoiceKey = this.subject === 'SNAIL' ? 'add_snail' : 'add_aquarium';

    if (this.guideVoiceKey && !AudioManager.isPlaying(this.guideVoiceKey)) {
      playVoiceLocked(this.sound, this.guideVoiceKey);
    }

    this.input.once('pointerdown', () => {
      if (this.guideVoiceKey && AudioManager.isPlaying(this.guideVoiceKey)) {
        AudioManager.stop(this.guideVoiceKey);
        this.guideVoiceKey = undefined;
      }
    });
  }
}
