import Phaser from 'phaser';
import type { LevelConfig } from './types';
import AudioManager from './AudioManager';
import { ChoiceFeedback } from './ChoiceFeedback';

/* ===================== TYPES ===================== */

type GameState =
  | 'SHOW_LEVEL'
  | 'WAIT_CHOICE'
  | 'CHECK_CHOICE'
  | 'BALANCING'
  | 'LEVEL_END'
  | 'GAME_END';

type Subject = 'CHILI' | 'VEGETABLE' | 'FLOWER';
type Side = 'LEFT' | 'RIGHT';
type StackVariant = 'MORE' | 'LESS';

/* ===================== ASSETS ===================== */

const STACK_TEXTURE: Record<Subject, Record<StackVariant, string>> = {
  CHILI: { MORE: 'chili_left', LESS: 'chili_right' },
  VEGETABLE: { MORE: 'veg_left', LESS: 'veg_right' },
  FLOWER: { MORE: 'flower_right', LESS: 'flower_left' },
};

const PICK_X_KEY = 'pick_x';
const RESULT_CORRECT_KEY = 'result_correct';
const RESULT_WRONG_KEY = 'result_wrong';
const ANSWER_DEFAULT = 'answer_default';

const QUESTION_IMG_KEY: Record<Subject, string> = {
  CHILI: 'q_more_chili',
  VEGETABLE: 'q_more_veg',
  FLOWER: 'q_more_flower',
};

const QUESTION_VOICE_KEY: Record<Subject, string> = {
  CHILI: 'more_chili',
  VEGETABLE: 'more_veg',
  FLOWER: 'more_flower',
};

/* ===================== SCALE ===================== */

const BOARD_SCALE = 1.0;

const BASE_BOARD_WIDTH = 900;
const BASE_BOARD_HEIGHT = 550;

const BASE_ANSWER_SCALE = 0.6;
const BASE_ITEM_SCALE = 0.78;

const BOARD_WIDTH = BASE_BOARD_WIDTH * BOARD_SCALE;
const BOARD_HEIGHT = BASE_BOARD_HEIGHT * BOARD_SCALE;

const ANSWER_SCALE = BASE_ANSWER_SCALE * BOARD_SCALE;
const ITEM_SCALE = BASE_ITEM_SCALE * BOARD_SCALE;

/* ===================== LAYOUT ===================== */

const BANNER_Y = 80;
const BANNER_SCALE = 0.65;

const BOARD_GAP_FROM_BANNER = 40;
const BOARD_OFFSET_X = 90;
const BOARD_OFFSET_Y = -30;

const BUTTON_BOTTOM_MARGIN = 70;
const BUTTON_OFFSET_Y = 0;
const STACK_GAP_ABOVE_BUTTON = 20;

const PROMPT_FONT_SIZE = 30;
const FEEDBACK_FONT_SIZE = 22;
const FEEDBACK_BOTTOM_MARGIN = 40;

const BOARD_RESULT_MARGIN_X = 26;
const BOARD_RESULT_MARGIN_Y = 26;

const PICK_X_SCALE = 0.55 * BOARD_SCALE;
const RESULT_BADGE_SCALE = 0.75 * BOARD_SCALE;

const PROMPT_IMG_SCALE = 0.615 * BOARD_SCALE;

/* ===================== ALIGN ===================== */

const BOARD_INNER_PADDING_X = 40 * BOARD_SCALE;
const COLUMN_RATIO_LEFT = 0.2;
const COLUMN_RATIO_RIGHT = 0.8;

const BOARD_INNER_PADDING_TOP = 26 * BOARD_SCALE;
const BOARD_INNER_PADDING_BOTTOM = 26 * BOARD_SCALE;

/* ===================== CHAR OFFSET ===================== */

const CHAR_OFFSET_X = -140;
const CHAR_OFFSET_Y = 12;

/* ===================== BIAS ===================== */

const STACK_BIAS_BY_KEY: Record<string, { x: number; y: number }> = {
  chili_left: { x: 0, y: -10 },
  chili_right: { x: 0, y: -10 },
  veg_left: { x: 4, y: -12 },
  veg_right: { x: -4, y: -12 },
  flower_left: { x: 0, y: -8 },
  flower_right: { x: 0, y: -8 },
};

/* ===================== SUBJECT TWEAKS ===================== */

// Dùng để tinh chỉnh RIÊNG cho ớt/rau/hoa:
// - `offsetX/Y`: đẩy icon trong stack (trái/phải, trên/dưới)
// - `fitX/Y`: phần trăm vùng fit (lớn hơn -> icon to hơn)
// - `scaleMul`: nhân thêm kích thước icon (to/nhỏ)
const STACK_TWEAK_BY_SUBJECT: Record<
  Subject,
  { offsetX: number; offsetY: number; fitX: number; fitY: number; scaleMul: number }
> = {
  CHILI: { offsetX: 0, offsetY: 0, fitX: 0.98, fitY: 0.98, scaleMul: 1.15 },
  VEGETABLE: { offsetX: 0, offsetY: 0, fitX: 1.3, fitY: 1.3, scaleMul: 1.15 },
  FLOWER: { offsetX: 0, offsetY: 0, fitX: 0.98, fitY: 0.92, scaleMul: 1.15 },
};

// Tinh chỉnh vị trí CỤM icon (container) trong board theo từng subject:
// - `leftX/rightX`: dịch riêng từng bên (trái/phải)
// - `leftY/rightY`: dịch riêng từng bên (lên/xuống)
const STACK_AREA_TWEAK_BY_SUBJECT: Record<
  Subject,
  { leftX: number; rightX: number; leftY: number; rightY: number }
> = {
  CHILI: { leftX: 0, rightX: 0, leftY: 0, rightY: 0 },
  VEGETABLE: { leftX: 0, rightX: 0, leftY: 0, rightY: 0 },
  FLOWER: { leftX: -15, rightX: 3, leftY: 0, rightY: 0 },
};

/* ===================== SCENE ===================== */

export default class GameScene extends Phaser.Scene {
  public levels: LevelConfig[] = [];
  public levelIndex = 0;
  public score = 0;
  public level = 0;

  private gameState: GameState = 'SHOW_LEVEL';
  private hasQueuedQuestionVoiceUnlock = false;

  private board?: Phaser.GameObjects.Image;
  private promptText!: Phaser.GameObjects.Text;
  private promptImage?: Phaser.GameObjects.Image;

  private feedbackText!: Phaser.GameObjects.Text;

  private leftBtn!: Phaser.GameObjects.Image;
  private rightBtn!: Phaser.GameObjects.Image;
  private questionBanner!: Phaser.GameObjects.Image;

  private leftStack!: Phaser.GameObjects.Container;
  private rightStack!: Phaser.GameObjects.Container;

  private cornerCharacter?: Phaser.GameObjects.Image;
  private leftPickX!: Phaser.GameObjects.Image;
  private rightPickX!: Phaser.GameObjects.Image;
  private resultBadge!: Phaser.GameObjects.Image;

  private boardX = 0;
  private boardY = 0;

  private levelSubjects: Subject[] = [];
  private currentSubject?: Subject;

  private leftStackMaxW = 0;
  private rightStackMaxW = 0;
  private stackMaxH = 0;

  public subgameEntered = false;
  public subgameDone = false;

  private choiceFeedback!: ChoiceFeedback;

  constructor() {
    super('GameScene');
  }

  /* ===================== CREATE ===================== */

  create() {
    try {
      (window as any).setRandomGameViewportBg?.();
    } catch {}

    const { width, height } = this.scale;
    if ((window as any).setGameButtonsVisible) (window as any).setGameButtonsVisible(true);
    if ((window as any).setRandomGameViewportBg) (window as any).setRandomGameViewportBg();

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

    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.board = this.add
      .image(0, 0, 'banner_question')
      .setOrigin(0.5)
      .setDisplaySize(BOARD_WIDTH, BOARD_HEIGHT);

    this.questionBanner = this.add
      .image(width / 2, BANNER_Y, 'btn_primary_pressed')
      .setOrigin(0.5)
      .setScale(0.95, BANNER_SCALE * BOARD_SCALE)
      .setDepth(20);

    this.promptText = this.add
      .text(this.questionBanner.x, this.questionBanner.y, '', {
        fontFamily: 'Fredoka, Arial',
        fontSize: `${PROMPT_FONT_SIZE}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.feedbackText = this.add
      .text(0, 0, '', {
        fontFamily: 'Fredoka, Arial',
        fontSize: `${FEEDBACK_FONT_SIZE}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.leftStack = this.add.container(0, 0).setDepth(5);
    this.rightStack = this.add.container(0, 0).setDepth(5);

    this.leftBtn = this.add.image(0, 0, ANSWER_DEFAULT).setOrigin(0.5).setScale(ANSWER_SCALE).setInteractive();
    this.rightBtn = this.add.image(0, 0, ANSWER_DEFAULT).setOrigin(0.5).setScale(ANSWER_SCALE).setInteractive();

    this.leftPickX = this.add.image(0, 0, PICK_X_KEY).setScale(PICK_X_SCALE).setVisible(false);
    this.rightPickX = this.add.image(0, 0, PICK_X_KEY).setScale(PICK_X_SCALE).setVisible(false);

    this.resultBadge = this.add
      .image(0, 0, RESULT_CORRECT_KEY)
      .setOrigin(1, 1)
      .setScale(RESULT_BADGE_SCALE)
      .setVisible(false)
      .setDepth(12);

    // ===== CHAR =====
    const baseCharScale = height / 720;
    this.cornerCharacter = this.add
      .image(-40, 0, 'char')
      .setOrigin(0.5, 1)
      .setScale(baseCharScale * 0.55)
      .setDepth(15);

    this.tweens.add({
      targets: this.cornerCharacter,
      y: '-=10',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.choiceFeedback = new ChoiceFeedback({
      scene: this,
      leftBtn: this.leftBtn,
      rightBtn: this.rightBtn,
      leftPickX: this.leftPickX,
      rightPickX: this.rightPickX,
      leftStack: this.leftStack,
      rightStack: this.rightStack,
      resultBadge: this.resultBadge,
      answerScale: ANSWER_SCALE,
      pickXScale: PICK_X_SCALE,
      boardScale: BOARD_SCALE,
      resultBadgeScale: RESULT_BADGE_SCALE,
      resultCorrectKey: RESULT_CORRECT_KEY,
      resultWrongKey: RESULT_WRONG_KEY,
    });

    this.leftBtn.on('pointerdown', () => {
      AudioManager.play('sfx_click');
      this.handleChoice('LEFT');
    });

    this.rightBtn.on('pointerdown', () => {
      AudioManager.play('sfx_click');
      this.handleChoice('RIGHT');
    });

    this.layoutBoard();
    this.startLevel();
  }

  /* ===================== LAYOUT ===================== */

  private layoutBoard() {
    const { width } = this.scale;

    this.boardX = width / 2 + BOARD_OFFSET_X;
    this.questionBanner.setPosition(this.boardX, BANNER_Y);
    this.promptText.setPosition(this.questionBanner.x, this.questionBanner.y);
    this.promptImage?.setPosition(this.questionBanner.x, this.questionBanner.y);

    const bannerBottom =
      this.questionBanner.y + this.questionBanner.displayHeight / 2;

    this.boardY = bannerBottom + BOARD_GAP_FROM_BANNER + BOARD_HEIGHT / 2 + BOARD_OFFSET_Y;

    this.board?.setPosition(this.boardX, this.boardY);

    const leftEdge = this.boardX - BOARD_WIDTH / 2;
    const topEdge = this.boardY - BOARD_HEIGHT / 2;
    const bottomEdge = this.boardY + BOARD_HEIGHT / 2;

    const usableW = BOARD_WIDTH - BOARD_INNER_PADDING_X * 2;
    const leftX = leftEdge + BOARD_INNER_PADDING_X + usableW * COLUMN_RATIO_LEFT;
    const rightX = leftEdge + BOARD_INNER_PADDING_X + usableW * COLUMN_RATIO_RIGHT;

    const buttonY =
      bottomEdge - BOARD_INNER_PADDING_BOTTOM - BUTTON_BOTTOM_MARGIN + BUTTON_OFFSET_Y;

    const stackTop = topEdge + BOARD_INNER_PADDING_TOP;
    const stackBottom = buttonY - STACK_GAP_ABOVE_BUTTON;
    const stackY = (stackTop + stackBottom) / 2;

    const stackAreaTweak = this.currentSubject
      ? STACK_AREA_TWEAK_BY_SUBJECT[this.currentSubject]
      : { leftX: 0, rightX: 0, leftY: 0, rightY: 0 };

    this.leftBtn.setPosition(leftX, buttonY);
    this.rightBtn.setPosition(rightX, buttonY);
    this.leftPickX.setPosition(leftX, buttonY);
    this.rightPickX.setPosition(rightX, buttonY);

    this.leftStack.setPosition(leftX + stackAreaTweak.leftX, stackY + stackAreaTweak.leftY);
    this.rightStack.setPosition(rightX + stackAreaTweak.rightX, stackY + stackAreaTweak.rightY);

    this.stackMaxH = stackBottom - stackTop;
    this.leftStackMaxW = usableW * 0.35;
    this.rightStackMaxW = usableW * 0.35;

    this.feedbackText.setPosition(this.boardX, bottomEdge - FEEDBACK_BOTTOM_MARGIN);

    if (this.cornerCharacter) {
      this.cornerCharacter.setPosition(
        leftEdge + CHAR_OFFSET_X,
        bottomEdge + CHAR_OFFSET_Y,
      );
    }

    this.resultBadge.setPosition(
      this.boardX + BOARD_WIDTH / 2 - BOARD_RESULT_MARGIN_X,
      bottomEdge - BOARD_RESULT_MARGIN_Y,
    );
  }

  /* ===================== INIT ===================== */

  init(data: { levelIndex?: number; score?: number }) {
    this.levelIndex = data.levelIndex ?? 0;
    this.level = this.levelIndex;
    this.score = data.score ?? 0;

    this.subgameEntered = false;
    this.subgameDone = false;
    this.promptImage = undefined;
    this.hasQueuedQuestionVoiceUnlock = false;

    const globalKey = '__comparisonLevels__';

    if (this.levelIndex === 0 || !(window as any)[globalKey]) {
      const { levels, subjects } = this.generateLevels(3);
      this.levels = levels;
      this.levelSubjects = subjects;
      (window as any)[globalKey] = { levels, subjects };
    } else {
      const saved = (window as any)[globalKey];
      this.levels = saved.levels;
      this.levelSubjects = saved.subjects;
    }
  }

  /* ===================== LEVEL GEN ===================== */

  private generateLevels(numLevels: number) {
    const baseSubjects: Subject[] = ['CHILI', 'VEGETABLE', 'FLOWER'];
    Phaser.Utils.Array.Shuffle(baseSubjects);

    const levels: LevelConfig[] = [];
    const subjects: Subject[] = [];

    for (let i = 0; i < numLevels; i++) {
      const subject = baseSubjects[i % baseSubjects.length];
      const less = Phaser.Math.Between(1, 4);
      const more = less + 2;
      const leftMore = subject === 'FLOWER' ? false : Math.random() > 0.5;

      levels.push({
        id: i + 1,
        leftCount: leftMore ? more : less,
        rightCount: leftMore ? less : more,
        mode: 'MORE' as any,
      });

      subjects.push(subject);
    }

    return { levels, subjects };
  }

  /* ===================== AUDIO ===================== */

  private playCurrentQuestionVoice() {
    const subject = this.levelSubjects[this.levelIndex];
    if (subject) AudioManager.play(QUESTION_VOICE_KEY[subject]);
  }

  private stopOverlappingVoicesBeforeQuestion() {
    AudioManager.stopSound('voice_complete');
    AudioManager.stopSound('complete');
    AudioManager.stopSound('remove_chili');
    AudioManager.stopSound('remove_veg');

    // Stop any previous prompt voices (avoid stacking when scene switches fast).
    Object.values(QUESTION_VOICE_KEY).forEach((k) => AudioManager.stopSound(k));

    // Stop correct-answer voice if still playing.
    for (let i = 1; i <= 4; i++) AudioManager.stopSound(`correct_answer_${i}`);
  }

  private ensureQuestionAudioUnlockedThenPlay() {
    const audioUnlockedKey = '__questionAudioUnlocked__';
    const audioUnlocked = !!(window as any)[audioUnlockedKey];

    if (audioUnlocked) {
      this.stopOverlappingVoicesBeforeQuestion();
      this.playCurrentQuestionVoice();
      return;
    }

    if (this.hasQueuedQuestionVoiceUnlock) return;
    this.hasQueuedQuestionVoiceUnlock = true;

    this.input.once('pointerdown', () => {
      (window as any)[audioUnlockedKey] = true;
      this.hasQueuedQuestionVoiceUnlock = false;
      this.stopOverlappingVoicesBeforeQuestion();
      this.playCurrentQuestionVoice();
    });
  }

  /* ===================== STACK ===================== */

  private renderStack(
    container: Phaser.GameObjects.Container,
    subject: Subject,
    count: number,
    side: Side,
    otherCount: number,
  ) {
    container.removeAll(true);

    const tweak = STACK_TWEAK_BY_SUBJECT[subject];
    const variant: StackVariant = count >= otherCount ? 'MORE' : 'LESS';
    const key = STACK_TEXTURE[subject][variant];
    const bias = STACK_BIAS_BY_KEY[key] ?? { x: 0, y: 0 };

    const scaleBoost = 1 + Math.max(0, count - 1) * 0.05;
    const desiredScale = ITEM_SCALE * scaleBoost * tweak.scaleMul;

    const tex = this.textures.get(key);
    const src = tex?.getSourceImage() as { width: number; height: number };

    const maxW = side === 'LEFT' ? this.leftStackMaxW : this.rightStackMaxW;
    const maxH = this.stackMaxH;

    const fitScale = Math.min((maxW * tweak.fitX) / src.width, (maxH * tweak.fitY) / src.height);
    const scale = Math.min(desiredScale, fitScale);

    const img = this.add
      .image(bias.x + tweak.offsetX, bias.y + tweak.offsetY, key)
      .setOrigin(0.5)
      .setScale(scale);
    container.add(img);
  }

  /* ===================== START LEVEL ===================== */

  private startLevel() {
    if (this.levelIndex >= this.levels.length) {
      this.scene.start('EndGameScene', {
        score: this.score,
        total: this.levels.length,
      });
      return;
    }

    const subject = this.levelSubjects[this.levelIndex];
    const level = this.levels[this.levelIndex];
    this.currentSubject = subject;

    const imgKey = QUESTION_IMG_KEY[subject];
    const hasImg = this.textures.exists(imgKey);

    if (hasImg) {
      if (!this.promptImage) {
        this.promptImage = this.add
          .image(this.questionBanner.x, this.questionBanner.y, imgKey)
          .setOrigin(0.5)
          .setScale(PROMPT_IMG_SCALE)
          .setDepth(this.promptText.depth + 1);
      } else {
        this.promptImage.setTexture(imgKey).setVisible(true);
      }
      this.promptText.setVisible(false);
    } else {
      this.promptText.setText('Chọn bên nhiều hơn').setVisible(true);
      this.promptImage?.setVisible(false);
    }

    this.renderStack(this.leftStack, subject, level.leftCount, 'LEFT', level.rightCount);
    this.renderStack(this.rightStack, subject, level.rightCount, 'RIGHT', level.leftCount);

    this.layoutBoard();
    this.resetUiForNewTry();
    this.feedbackText.setText('');
    this.ensureQuestionAudioUnlockedThenPlay();
    this.gameState = 'WAIT_CHOICE';
  }

  /* ===================== RESET ===================== */

  private resetUiForNewTry() {
    this.leftBtn.setAlpha(1).clearTint();
    this.rightBtn.setAlpha(1).clearTint();
    this.leftPickX.setVisible(false);
    this.rightPickX.setVisible(false);
    this.resultBadge.setVisible(false);
    this.feedbackText.setText('');
  }

  /* ===================== CHOICE ===================== */

  private handleChoice(side: Side) {
    Object.values(QUESTION_VOICE_KEY).forEach((k) => AudioManager.stopSound(k));

    if (this.gameState !== 'WAIT_CHOICE') return;
    this.gameState = 'CHECK_CHOICE';

    const level = this.levels[this.levelIndex];
    const moreSide: Side = level.leftCount > level.rightCount ? 'LEFT' : 'RIGHT';
    const isCorrect = side === moreSide;

    this.choiceFeedback.show(side, isCorrect);

    if (isCorrect) {
      this.subgameEntered = true;
      this.score++;

      AudioManager.play('sfx_correct');
      AudioManager.playCorrectAnswer();

      this.gameState = 'LEVEL_END';

      (window as any).setGameButtonsVisible?.(true);

      this.time.delayedCall(1800, () => {
        this.scene.start('RemoveScene', {
          leftCount: level.leftCount,
          rightCount: level.rightCount,
          nextScene: 'GameScene',
          score: this.score,
          levelIndex: this.levelIndex,
          subject: this.levelSubjects[this.levelIndex],
          moreCharacter: moreSide,
        });
      });
    } else {
      AudioManager.play('sfx_wrong');
      this.time.delayedCall(700, () => {
        this.resetUiForNewTry();
        this.feedbackText.setText('Thử lại nhé!');
        this.gameState = 'WAIT_CHOICE';
      });
    }
  }
}
