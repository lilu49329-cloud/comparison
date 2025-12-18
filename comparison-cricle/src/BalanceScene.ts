import Phaser from 'phaser';
import type GameScene from './GameScene';
import AudioManager from './AudioManager';
import { resetRotateVoiceLock, playVoiceLocked } from './rotateOrientation';

type Subject = 'BALL' | 'CAKE';

/* ===================== ASSET MAP ===================== */

// map icon -> code
const ICON_CODE_MAP: Record<string, string> = {
  icon2: '02',
  icon3: '03',
  icon4: '04',
};

// BALL2 texture theo stateKey
const BALL2_TEXTURE_MAP: Record<string, string> = {
  '0': 'ball2',

  '02': 'ball2_plus_02',
  '03': 'ball2_plus_03',
  '04': 'ball2_plus_04',

  '023': 'ball2_plus_023',
  '024': 'ball2_plus_024',
  '032': 'ball2_plus_032',
  '034': 'ball2_plus_034',
  '042': 'ball2_plus_042',
  '043': 'ball2_plus_043',
};

const CHARACTER_UPGRADE_TEXTURE = {
  BALL: {
    // Dùng lại texture 'ball1' cho 2 bước nâng cấp để tránh lỗi thiếu asset
    left: ['ball1', 'ball1'],
  },
  CAKE: {
    single: 'cake_plus',
  },
} as const;

const DRAG_TEXTURES: Record<Subject, string[]> = {
  BALL: ['icon2', 'icon3', 'icon4'],
  CAKE: ['icon1'],
};



const RESULT_STAMP_MARGIN = 28;
const RESULT_STAMP_SIZE = 72;

/* ===================== TYPES ===================== */

type BalanceInitData = {
  subject: Subject;
  lessCharacter: 'BALL1' | 'BALL2';
  nextScene?: string;
  score?: number;
  levelIndex?: number;
};

/* ===================== SCENE ===================== */

export default class BalanceScene extends Phaser.Scene {
  private subject: Subject = 'BALL';

  private actorY = 0;
  private leftActorCenterX = 0;
  private rightActorCenterX = 0;
  private centerActorX = 0;

  private objectScale = 0.3;

  private leftBase?: Phaser.GameObjects.Image;
  private rightBase?: Phaser.GameObjects.Image;
  private singleBase?: Phaser.GameObjects.Image;

  private upgradeCharacter: 'BALL1' | 'BALL2' = 'BALL1';
  private nextSceneKey = 'GameScene';
  public score = 0;
  public levelIndex = 0;

  private cornerCharacter?: Phaser.GameObjects.Image;
  private boardFeedbackStamp?: Phaser.GameObjects.Image;
  private guideVoiceKey?: string;

  // 🔑 lịch sử icon kéo cho BALL2
  private draggedIconCodes: string[] = [];

  constructor() {
    super('BalanceScene');
  }

  init(data: BalanceInitData) {
    this.subject = data.subject;
    this.upgradeCharacter = data.lessCharacter ?? 'BALL1';
    this.nextSceneKey = data.nextScene ?? 'GameScene';
    this.score = data.score ?? 0;
    this.levelIndex = data.levelIndex ?? 0;

    this.draggedIconCodes = [];
  }

  /* ===================== APPLY BALL2 UPGRADE ===================== */
  private applyBall2Upgrade(): Promise<void> {
    return new Promise((resolve) => {
      const sprite = this.rightBase;
      if (!sprite) return resolve();

      let stateKey: string;

      if (this.draggedIconCodes.length === 0) {
        stateKey = '0';
      } else if (this.draggedIconCodes.length === 1) {
        stateKey = this.draggedIconCodes[0];
      } else {
        const digits = this.draggedIconCodes.map((c) => c.slice(-1));
        stateKey = `0${digits.join('')}`; // ví dụ: ['02','03'] -> '023'
      }

      const texture = BALL2_TEXTURE_MAP[stateKey];
      if (!texture) return resolve();

      sprite.setAlpha(0);
      sprite.setTexture(texture);

      this.tweens.add({
        targets: sprite,
        alpha: 1,
        duration: 180,
        ease: 'Sine.Out',
        onComplete: () => resolve(),
      });
    });
  }

  /* ===================== FINISH LEVEL ===================== */
  private finishLevel() {
    this.showResultStamp('answer_correct');
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

    /* ===================== CHAR NỀN (giống GameScene) ===================== */
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

    const bannerTextKey = this.subject === 'BALL' ? 'q_add_ball' : 'q_add_cake';

    const padding = 200;
    const minBannerWidth = 800;

    let contentWidth = minBannerWidth;

    if (this.textures.exists(bannerTextKey)) {
      const textImg = this.add
        .image(width / 2, bannerY, bannerTextKey)
        .setOrigin(0.5)
        .setScale(0.65);

      contentWidth = textImg.displayWidth;
    } else {
      // fallback text (nếu muốn bật lại thì uncomment)
    }

    const desiredWidth = Math.max(minBannerWidth, contentWidth + padding);
    const scaleX = desiredWidth / baseBannerWidth;
    banner.setScale(scaleX, bannerScaleY);

    /* ===================== PANEL ===================== */

    const panel = this.add
      .image(width / 2, height / 2 + 40, 'banner_question')
      .setOrigin(0.5)
      .setScale(1.6);

    const panelW = panel.displayWidth;
    const panelH = panel.displayHeight;

    // ✅ rect của panel để kiểm tra thả trong vùng hợp lệ
    const panelRect = new Phaser.Geom.Rectangle(
      panel.x - panelW / 2,
      panel.y - panelH / 2,
      panelW,
      panelH
    );

    this.centerActorX = panel.x;
    this.leftActorCenterX = panel.x - panelW * 0.22;
    this.rightActorCenterX = panel.x + panelW * 0.22;
    this.actorY = panel.y - panelH * 0.05;

    // Stamp đúng/sai ở góc dưới bên phải panel
    const stampX = panel.x + panelW / 2 - RESULT_STAMP_MARGIN;
    const stampY = panel.y + panelH / 2 - RESULT_STAMP_MARGIN;
    this.boardFeedbackStamp = this.add
      .image(stampX, stampY, 'answer_default')
      .setOrigin(1, 1)
      .setDisplaySize(RESULT_STAMP_SIZE, RESULT_STAMP_SIZE)
      .setVisible(false)
      .setDepth(12);

    /* ===================== CHARACTER ===================== */

    let charScale = 1;

    if (this.subject === 'BALL') {
      const texL = this.textures.get('ball1').getSourceImage() as HTMLImageElement;
      const texR = this.textures.get('ball2').getSourceImage() as HTMLImageElement;

      charScale =
        Math.min(
          (panelH * 0.6) / Math.max(texL.height, texR.height),
          (panelW * 0.25) / Math.max(texL.width, texR.width)
        ) * 1.7;

      this.leftBase = this.add
        .image(this.leftActorCenterX, this.actorY, 'ball1')
        .setScale(charScale)
        .setOrigin(0.5);

      this.rightBase = this.add
        .image(this.rightActorCenterX, this.actorY, 'ball2')
        .setScale(charScale)
        .setOrigin(0.5);
    }

    if (this.subject === 'CAKE') {
      const tex = this.textures.get('cake').getSourceImage() as HTMLImageElement;

      charScale =
        Math.min((panelH * 0.6) / tex.height, (panelW * 0.3) / tex.width) * 2.5;

      this.singleBase = this.add
        .image(this.centerActorX, this.actorY, 'cake')
        .setScale(charScale)
        .setOrigin(0.5);
    }

    /* ===================== ICON KÉO ===================== */

    const dragCount = 3;
    const needAdd = this.subject === 'BALL' ? 2 : 1;
    const spacingX = 140;
    const dragY = panel.y + panelH / 2 - 50;

    let addedCount = 0;
    this.objectScale = charScale * (this.subject === 'CAKE' ? 1.05 : 1.3);

    const startX = panel.x - ((dragCount - 1) * spacingX) / 2;

    for (let i = 0; i < dragCount; i++) {
      const dragKey =
        this.subject === 'BALL' ? DRAG_TEXTURES.BALL[i] : DRAG_TEXTURES.CAKE[0];

      const iconX = startX + i * spacingX;

      const icon = this.add
        .image(iconX, dragY, dragKey)
        .setScale(this.objectScale)
        .setInteractive({ draggable: true, cursor: 'pointer' });

      this.input.setDraggable(icon);

      icon.on('dragstart', () => {
        if (this.guideVoiceKey) {
          AudioManager.stop(this.guideVoiceKey);
          this.guideVoiceKey = undefined;
        }
      });

      icon.on('drag', (_: Phaser.Input.Pointer, x: number, y: number) => {
        icon.setPosition(x, y);
      });

      icon.on('dragend', async () => {
        // ✅ CHỈ CẦN THẢ ĐÚNG BÊN (không cần đúng vùng "tay" nữa)
        const inPanel = Phaser.Geom.Rectangle.Contains(panelRect, icon.x, icon.y);
        const midX = panel.x;

        let isCorrectDrop = false;

        if (this.subject === 'BALL') {
          const droppedSide: 'LEFT' | 'RIGHT' = icon.x < midX ? 'LEFT' : 'RIGHT';
          const needSide: 'LEFT' | 'RIGHT' =
            this.upgradeCharacter === 'BALL1' ? 'LEFT' : 'RIGHT';

          isCorrectDrop = inPanel && droppedSide === needSide;
        } else {
          // ✅ CAKE: thả bên PHẢI (nửa phải panel) mới đúng
          const droppedSide: 'LEFT' | 'RIGHT' = icon.x < midX ? 'LEFT' : 'RIGHT';
          isCorrectDrop = inPanel && droppedSide === 'RIGHT';
        }


        if (isCorrectDrop) {
          AudioManager.play('sfx_correct');
          AudioManager.playCorrectAnswer?.();

          icon.destroy();
          addedCount++;

          if (this.subject === 'BALL') {
            if (this.upgradeCharacter === 'BALL1') {
              const textures = CHARACTER_UPGRADE_TEXTURE.BALL.left;
              const idx = Math.min(addedCount - 1, textures.length - 1);
              this.leftBase?.setTexture(textures[idx]);

              if (addedCount === needAdd) {
                this.time.delayedCall(200, () => this.finishLevel());
              }
            } else {
              const code = ICON_CODE_MAP[dragKey];
              if (code) {
                this.draggedIconCodes.push(code);
                await this.applyBall2Upgrade();

                if (addedCount === needAdd) {
                  this.time.delayedCall(200, () => this.finishLevel());
                }
              }
            }
          }

          if (this.subject === 'CAKE') {
            this.singleBase?.setTexture(CHARACTER_UPGRADE_TEXTURE.CAKE.single);
            if (addedCount === needAdd) {
              this.time.delayedCall(200, () => this.finishLevel());
            }
          }
        } else {
          AudioManager.play('sfx_wrong');
          this.showResultStamp('answer_wrong');
          this.time.delayedCall(500, () => this.hideResultStamp());
          icon.setPosition(iconX, dragY);
        }
      });
    }

    // Voice hướng dẫn kéo thêm bóng / bánh
    this.guideVoiceKey = this.subject === 'BALL' ? 'add_ball' : 'add_cake';

    if (this.guideVoiceKey && !AudioManager.isPlaying(this.guideVoiceKey)) {
      playVoiceLocked(this.sound, this.guideVoiceKey);
    }

    // Ngắt voice hướng dẫn nếu bé click / chạm bất kỳ đâu
    this.input.once('pointerdown', () => {
      if (this.guideVoiceKey && AudioManager.isPlaying(this.guideVoiceKey)) {
        AudioManager.stop(this.guideVoiceKey);
        this.guideVoiceKey = undefined;
      }
    });
  }
}
