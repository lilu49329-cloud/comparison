// ===== UNLOCK AUDIO FOR IOS SILENT MODE =====
function unlockIOSAudio() {
  // Dùng Howler để phát âm thanh nhỏ, chỉ cần gọi 1 lần sau user gesture
  try {
    // Nên dùng file click.mp3 hoặc file ngắn, nhỏ
    const silent = new (window as any).Howl({
      src: ['assets/audio/click.mp3'],
      volume: 0.01
    });
    silent.play();
  } catch (e) {
    // ignore
  }
  window.removeEventListener('touchend', unlockIOSAudio);
  window.removeEventListener('click', unlockIOSAudio);
}
window.addEventListener('touchend', unlockIOSAudio, { once: true });
window.addEventListener('click', unlockIOSAudio, { once: true });
import Phaser from "phaser";
import PreloadScene from "./PreloadScene";
// import OverlayScene from "./OverlayScene";
import GameScene from "./GameScene";
import BalanceScene from "./BalanceScene";
import EndGameScene from "./EndGameScene";

// ================== TẠO CONTAINER GAME ==================
const containerId = "game-container";
let container = document.getElementById(containerId);
if (!container) {
  container = document.createElement("div");
  container.id = containerId;
  document.body.appendChild(container);
}

// ================== CSS CHO HTML & BODY ==================
const root = document.documentElement;
root.style.margin = "0";
root.style.padding = "0";
root.style.width = "100%";
root.style.height = "100%";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.width = "100%";
document.body.style.height = "100%";

// ========== RANDOM BACKGROUND VIEWPORT ==========
const INTRO_VIEWPORT_BGS = [
  "assets/bg/bg1.jpg",
  "assets/bg/bg2.jpg",
  "assets/bg/bg3.jpg",
  "assets/bg/bg4.jpg",
  "assets/bg/bg5.jpg",
  "assets/bg/bg6.jpg",
  "assets/bg/bg7.jpg",
];
const GAME_VIEWPORT_BGS = [
  "assets/bg/bg1.jpg",
  "assets/bg/bg2.jpg",
  "assets/bg/bg3.jpg",
  "assets/bg/bg4.jpg",
  "assets/bg/bg5.jpg",
  "assets/bg/bg6.jpg",
  "assets/bg/bg7.jpg",
];
const END_VIEWPORT_BGS = [
  "assets/bg/bg1.jpg",
  "assets/bg/bg2.jpg",
  "assets/bg/bg3.jpg",
  "assets/bg/bg4.jpg",
  "assets/bg/bg5.jpg",
  "assets/bg/bg6.jpg",
  "assets/bg/bg7.jpg",
];
function setViewportBg(url: string, position: string = "center center") {
  document.body.style.backgroundImage = `url("${url}")`;
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = position;
  document.body.style.boxSizing = "border-box";
}
export function setRandomIntroViewportBg() {
  const url =
    INTRO_VIEWPORT_BGS[Math.floor(Math.random() * INTRO_VIEWPORT_BGS.length)];
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape) {
    setViewportBg(url, "center top");
  } else {
    setViewportBg(url, "center center");
  }
}
export function setRandomGameViewportBg() {
  const url =
    GAME_VIEWPORT_BGS[Math.floor(Math.random() * GAME_VIEWPORT_BGS.length)];
  setViewportBg(url, "center center");
}
export function setRandomEndViewportBg() {
  const url =
    END_VIEWPORT_BGS[Math.floor(Math.random() * END_VIEWPORT_BGS.length)];
  setViewportBg(url, "center center");
}

// ========== HIỆN / ẨN NÚT VIEWPORT ==========
function setGameButtonsVisible(visible: boolean) {
  const replayBtn = document.getElementById("btn-replay") as
    | HTMLButtonElement
    | null;
  const nextBtn = document.getElementById("btn-next") as
    | HTMLButtonElement
    | null;

  const display = visible ? "block" : "none";

  // Chỉ điều khiển nút replay
  if (replayBtn) replayBtn.style.display = display;

  // Nút next luôn tắt
  if (nextBtn) nextBtn.style.display = "none";
}


// ================== CSS CHO CONTAINER (TRONG SUỐT) ==================
if (container instanceof HTMLDivElement) {
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  container.style.overflow = "hidden";
  container.style.boxSizing = "border-box";
  container.style.background = "transparent";
}

let game: Phaser.Game | null = null;
let rotateOverlay: HTMLDivElement | null = null;

// ========== HÀM CHỐNG SPAM / CHỒNG VOICE ==========
let currentVoice: Phaser.Sound.BaseSound | null = null;
let currentVoiceKey: string | null = null;
let isRotateOverlayActive = false; // trạng thái overlay xoay ngang

// Lưu lại BGM loop + question đang phát khi bước vào overlay dọc
let pausedLoopKeys: string[] = [];
let pendingQuestionKey: string | null = null;
let pausedSceneKeys: string[] = [];

// Hook toàn cục để chặn âm thanh mới khi đang màn dọc,
// chỉ cho phép phát riêng voice_rotate. Các sound bị chặn
// được xếp hàng để phát lại khi quay ngang.
let soundPlayPatched = false;
function patchGlobalSoundPlay() {
  if (soundPlayPatched) return;
  const SoundNS: any = (Phaser as any).Sound;
  if (!SoundNS || !SoundNS.BaseSoundManager) return;

  const BaseMgr = SoundNS.BaseSoundManager;
  const proto = BaseMgr.prototype;
  if (!proto || typeof proto.play !== "function") return;

  const originalPlay = proto.play;
  proto.play = function (
    key: string | Phaser.Types.Sound.SoundConfig,
    config?: Phaser.Types.Sound.SoundConfig
  ) {
    const k = typeof key === "string" ? key : (key as any)?.key;

    // Khi overlay xoay dọc đang bật: block tất cả sound mới trừ voice-rotate
    if (isRotateOverlayActive && typeof k === "string" && k !== "voice-rotate") {
      // Nếu là BGM loop thì nhớ để phát lại sau
      const willLoop =
        (config && config.loop) ||
        (typeof (this as any).loop === "boolean" && (this as any).loop) ||
        k === "bgm_main";
      if (willLoop && !pausedLoopKeys.includes(k)) {
        pausedLoopKeys.push(k);
      }

      // Nếu là câu hỏi thì phát lại sau khi quay ngang
      if (k.startsWith("q_")) {
        pendingQuestionKey = k;
      }

      return null;
    }

    return originalPlay.call(this, key, config);
  };

  soundPlayPatched = true;
}


function getVoicePriority(key: string): number {
  // Ưu tiên thấp: drag / câu hỏi
  if (key.startsWith("drag_") || key.startsWith("q_")) return 1;
  // Trung bình: đúng / sai
  if (key === "correct" || key === "wrong") return 2;
  // Trung bình / cao: các voice hướng dẫn
  if (key === "voice_need_finish" || key === "voice-rotate") return 3;
  // Cao nhất: complete
  if (key === "voice_complete") return 4;
  // Mặc định
  return 1;
}

export function playVoiceLocked(
  sound: Phaser.Sound.BaseSoundManager,
  key: string
): void {
  // Khi overlay xoay ngang đang hiện: chỉ cho phép phát voice_rotate
  if (isRotateOverlayActive && key !== "voice-rotate") {
    console.warn(`[CompareGame] Đang overlay xoay ngang, chỉ phát voice-rotate!`);
    return;
  }

  const newPri = getVoicePriority(key);
  const curPri = currentVoiceKey ? getVoicePriority(currentVoiceKey) : 0;

  // Nếu đang có voice chạy với priority >= mới thì bỏ qua (không chồng)
  if (currentVoice && currentVoice.isPlaying && curPri >= newPri) {
    return;
  }

  // Nếu voice mới ưu tiên cao hơn thì dừng voice cũ trước
  if (currentVoice && currentVoice.isPlaying && curPri < newPri) {
    currentVoice.stop();
    currentVoice = null;
    currentVoiceKey = null;
  }

  let trueKey = key === "voice-rotate" ? "voice-rotate" : key;
  let instance = sound.get(trueKey) as Phaser.Sound.BaseSound | null;
  if (!instance) {
    try {
      // Nếu asset chưa có trong cache, add vào trước khi phát
      instance = sound.add(trueKey);
      if (!instance) {
        console.warn(
          `[CompareGame] Không phát được audio key="${trueKey}": Asset chưa được preload hoặc chưa có trong cache.`
        );
        return;
      }
    } catch (e) {
      console.warn(`[CompareGame] Không phát được audio key="${trueKey}":`, e);
      return;
    }
  }

  currentVoice = instance;
  currentVoiceKey = trueKey;
  instance.once("complete", () => {
    if (currentVoice === instance) {
      currentVoice = null;
      currentVoiceKey = null;
    }
  });
  instance.play();
}

// Cố gắng resume AudioContext khi overlay bật/tắt
function resumeSoundContext(scene: Phaser.Scene) {
  const sm = scene.sound as any;
  const ctx: AudioContext | undefined = sm.context || sm.audioContext;
  if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
    ctx.resume();
  }
}

function ensureRotateOverlay() {
  if (rotateOverlay) return;

  rotateOverlay = document.createElement("div");
  rotateOverlay.id = "rotate-overlay";
  rotateOverlay.style.position = "fixed";
  rotateOverlay.style.inset = "0";
  rotateOverlay.style.zIndex = "9999";
  rotateOverlay.style.display = "none";
  rotateOverlay.style.alignItems = "center";
  rotateOverlay.style.justifyContent = "center";
  rotateOverlay.style.textAlign = "center";
  rotateOverlay.style.background = "rgba(0, 0, 0, 0.6)";
  rotateOverlay.style.padding = "16px";
  rotateOverlay.style.boxSizing = "border-box";

  const box = document.createElement("div");
  box.style.background = "white";
  box.style.borderRadius = "16px";
  box.style.padding = "16px 20px";
  box.style.maxWidth = "320px";
  box.style.margin = "0 auto";
  box.style.fontFamily =
    '"Fredoka", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  box.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";

  const title = document.createElement("div");
  title.textContent = "Bé Hãy Xoay Ngang Màn Hình Để Chơi Nhé 🌈";
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  title.style.color = "#222";

  box.appendChild(title);
  rotateOverlay.appendChild(box);
  document.body.appendChild(rotateOverlay);
}

function updateRotateHint() {
  ensureRotateOverlay();
  if (!rotateOverlay) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const shouldShow = h > w && w < 768;

  const overlayWasActive = isRotateOverlayActive;
  isRotateOverlayActive = shouldShow;

  const overlayTurnedOn = !overlayWasActive && shouldShow;
  const overlayTurnedOff = overlayWasActive && !shouldShow;

  rotateOverlay.style.display = shouldShow ? "flex" : "none";

  const sceneManager = game?.scene;
  const audioScene =
    (sceneManager?.getScene("GameScene") as Phaser.Scene | undefined) ??
    (sceneManager?.getScene("PreloadScene") as Phaser.Scene | undefined);

  if (!audioScene || !audioScene.sound) {
    return;
  }

  const soundManager = audioScene.sound as any;
  const sounds = soundManager.sounds as Phaser.Sound.BaseSound[] | undefined;

  // Khi vừa bước vào màn hình dọc (overlay bật)
  if (overlayTurnedOn && Array.isArray(sounds)) {
    // Tạm dừng toàn bộ game loop để game không tiếp tục chạy nền
    if (game && !game.loop.sleep) {
      // no-op: phòng trường hợp loop không hỗ trợ sleep (fallback an toàn)
    } else if (game) {
      
      game.loop.sleep();
    }
    // Tạm dừng các scene gameplay để game không chạy nền
    pausedSceneKeys = [];
    ["GameScene", "BalanceScene", "EndGameScene"].forEach((key) => {
      const s = sceneManager?.getScene(key);
      if (s && s.scene.isActive()) {
        s.scene.pause();
        pausedSceneKeys.push(key);
      }
    });

    resumeSoundContext(audioScene);

    pausedLoopKeys = [];
    pendingQuestionKey = null;

    sounds.forEach((snd: Phaser.Sound.BaseSound) => {
      if (
        snd &&
        typeof snd.key === "string" &&
        snd.key !== "voice-rotate" &&
        snd.isPlaying &&
        typeof snd.stop === "function"
      ) {
        // Lưu BGM loop lại để phát lại sau
        if ((snd as any).loop) {
          pausedLoopKeys.push(snd.key);
        }
        // Nếu là câu hỏi thì lưu key để đọc lại
        if (snd.key.startsWith("q_")) {
          pendingQuestionKey = snd.key;
        }
        snd.stop();
      }
    });
  }

  // Khi overlay bật lên lần đầu -> phát voice_rotate
  if (overlayTurnedOn) {
    const tryPlayVoiceRotate = (retry = 0) => {
      const isActive = audioScene.scene.isActive();
      const hasVoiceRotate = audioScene.sound.get("voice-rotate");
      if (isActive && hasVoiceRotate) {
        playVoiceLocked(audioScene.sound, "voice-rotate");
      } else if (retry < 20) { // thử lại tối đa 20 lần (6s)
        setTimeout(() => tryPlayVoiceRotate(retry + 1), 300);
      } else {
        console.warn("[CompareGame] Không thể phát voice-rotate sau khi overlay bật (asset chưa load?)");
      }
    };
    tryPlayVoiceRotate();
  }

  // Khi overlay tắt -> dừng voice_rotate, phát lại BGM + question nếu có
  if (overlayTurnedOff) {
    // Đánh thức lại game loop
    if (game && !game.loop.wake) {
      // no-op
    } else if (game) {

      game.loop.wake();
    }

    // Resume lại các scene gameplay đã pause
    pausedSceneKeys.forEach((key) => {
      const s = sceneManager?.getScene(key);
      if (s && s.scene.isPaused()) {
        s.scene.resume();
      }
    });
    pausedSceneKeys = [];

    resumeSoundContext(audioScene);

    const rotateSound = audioScene.sound.get(
      "voice-rotate"
    ) as Phaser.Sound.BaseSound | null;
    if (rotateSound && rotateSound.isPlaying) {
      rotateSound.stop();
    }
    if (currentVoice === rotateSound) {
      currentVoice = null;
      currentVoiceKey = null;
    }

    // Phát lại các BGM loop đã pause
    pausedLoopKeys.forEach((key) => {
      const bg = audioScene.sound.get(key) as Phaser.Sound.BaseSound | null;
      if (bg) {
        (bg as any).loop = true;
        bg.play();
      }
    });
    pausedLoopKeys = [];

    // Phát lại question nếu có
    if (pendingQuestionKey) {
      playVoiceLocked(audioScene.sound, pendingQuestionKey);
      pendingQuestionKey = null;
    }
  }
}

function setupRotateHint() {
  ensureRotateOverlay();
  updateRotateHint();
  window.addEventListener("resize", updateRotateHint);
  window.addEventListener("orientationchange", updateRotateHint as any);

   // Khi người dùng chạm lần đầu trong trạng thái màn dọc,
   // cố gắng phát lại voice_rotate (tránh bị chặn autoplay)
  window.addEventListener("pointerdown", () => {
      if (!isRotateOverlayActive || !game) return;

      const sceneManager = game.scene;
      const audioScene =
        (sceneManager.getScene("GameScene") as Phaser.Scene | undefined) ??
        (sceneManager.getScene("PreloadScene") as Phaser.Scene | undefined);

      if (!audioScene || !audioScene.sound) return;

      resumeSoundContext(audioScene);
      try {
        playVoiceLocked(audioScene.sound, "voice-rotate");
      } catch (e) {
        console.warn("[CompareGame] Không phát được voice-rotate sau pointerdown:", e);
      }
    });
  }

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: containerId,
  transparent: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [PreloadScene, GameScene, BalanceScene, EndGameScene],
};

// gắn lên window cho các scene dùng
(Object.assign(window as any, {
  setRandomIntroViewportBg,
  setRandomGameViewportBg,
  setRandomEndViewportBg,
  setGameButtonsVisible,
  playVoiceLocked,
}));

function setupHtmlButtons() {
  const replayBtn = document.getElementById("btn-replay");
  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      if (!game) return;
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      if (!gameScene) return;

      // Nếu đang ở màn phụ, dừng BalanceScene để không đè lên GameScene
      const balance = game.scene.getScene("BalanceScene");
      if (balance && balance.scene.isActive()) {
        balance.scene.stop();
      }
      
      // Replay lại toàn bộ level hiện tại (màn chính + màn phụ)
      gameScene.scene.restart({
        levelIndex: gameScene.levelIndex,
        score: gameScene.score,
      });
    });
  }

  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!game) return;
      const scene = game.scene.getScene("GameScene") as GameScene;
      if (!scene) return;

      // Lấy trạng thái màn phụ
      const anyScene = scene as any;
      const subEntered = !!anyScene.subgameEntered;
      const subDone = !!anyScene.subgameDone;

      // Chưa vào màn phụ -> cho Next luôn.
      // Đã vào màn phụ -> phải subgameDone mới được Next.
      const canNext = !subEntered || subDone;
      if (!canNext) {
        playVoiceLocked(scene.sound, "voice_need_finish");
        return;
      }

      // Nếu đang đứng ở BalanceScene thì tắt nó trước
      const balance = game.scene.getScene("BalanceScene");
      if (balance && balance.scene.isActive()) {
        balance.scene.stop();
      }

      // Tính level tiếp theo theo levelIndex
      const currentIndex = scene.levelIndex ?? 0;
      const nextIndex = currentIndex + 1;

      if (nextIndex >= scene.levels.length) {
        scene.scene.start("EndGameScene", {
          score: scene.score,
          total: scene.levels.length,
        });
      } else {
        scene.scene.start("GameScene", {
          levelIndex: nextIndex,
          score: scene.score,
        });
      }
    });
  }

  // Luôn hiện nút, logic chặn Next nằm trong GameScene.isLevelComplete()
  setGameButtonsVisible(true);
}

function waitForFredoka(): Promise<void> {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return new Promise<void>((resolve) => {
    let done = false;
    document.fonts.load('400 20px "Fredoka"').then(() => {
      if (!done) {
        done = true;
        resolve();
      }
    });
    setTimeout(() => {
      if (!done) {
        done = true;
        resolve();
      }
    }, 10);
  });
}

function setupPhaserResize(currentGame: Phaser.Game) {
  const refresh = () => {
    setTimeout(() => {
      currentGame.scale.refresh();
    }, 50);
  };
  window.addEventListener("resize", refresh);
  window.addEventListener("orientationchange", refresh as any);
  refresh();
}

async function initGame() {
  try {
    await waitForFredoka();
  } catch (e) {
    console.warn("Không load kịp font Fredoka, chạy game luôn.");
  }
  if (!game) {
    // setRandomIntroViewportBg();
    game = new Phaser.Game(config);
    // Đảm bảo hook chặn âm thanh khi xoay dọc được bật
    patchGlobalSoundPlay();
    setupHtmlButtons();
    setupPhaserResize(game);
    setupRotateHint();
  }
  setTimeout(() => {
    const canvas =
      document.querySelector<HTMLCanvasElement>("#game-container canvas");

    if (canvas) {
      canvas.style.margin = "0";
      canvas.style.padding = "0";
      canvas.style.display = "block";
      canvas.style.imageRendering = "auto";
      canvas.style.backgroundColor = "transparent";
    }
  }, 50);
}

document.addEventListener("DOMContentLoaded", initGame);
