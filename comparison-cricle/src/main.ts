import Phaser from "phaser";
//import OverlayScene from "./OverlayScene";
import GameScene from "./GameScene";
import EndGameScene from "./EndGameScene";
import AudioManager from "./AudioManager";
import { initRotateOrientation } from "./rotateOrientation";
import PreloadScene from "./PreloadScene";
import BalanceScene from "./BalanceScene";

// ===== GLOBAL FONT READY FLAG =====
;(window as any).__fontsReady = false;

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
];

const GAME_VIEWPORT_BGS = [
  "assets/bg/bg1.jpg",
  "assets/bg/bg2.jpg",
  "assets/bg/bg3.jpg",
  "assets/bg/bg4.jpg",
  "assets/bg/bg5.jpg",
];

const END_VIEWPORT_BGS = [
  "assets/bg/bg1.jpg",
  "assets/bg/bg2.jpg",
  "assets/bg/bg3.jpg",
  "assets/bg/bg4.jpg",
  "assets/bg/bg5.jpg",
];

// Cho phép chỉnh vị trí BG (center / top...)
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

  // Landscape: ưu tiên giữ phần trên (title), cắt nhiều phía dưới
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
  if (replayBtn) replayBtn.style.display = display;
  // Luôn ẩn nút chuyển màn
  if (nextBtn) nextBtn.style.display = "none";
}

// ================== CSS CHO CONTAINER (TRONG SUỐT) ==================
if (container instanceof HTMLDivElement) {
  container.style.position = "fixed";
  container.style.inset = "0"; // full màn hình
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  container.style.overflow = "hidden";
  container.style.boxSizing = "border-box";
  container.style.background = "transparent";
}

// Giữ tham chiếu game để tránh tạo nhiều lần (HMR, reload…)
let game: Phaser.Game | null = null;
// ========== GLOBAL BGM (CHẠY XUYÊN SUỐT GAME) ==========
// ========== GLOBAL BGM (CHẠY XUYÊN SUỐT GAME) ==========

export function ensureBgmStarted() {
  console.log("[BGM] ensure play bgm_main");
  // Chỉ bật nếu chưa phát; để BGM chạy liên tục xuyên suốt các màn
  if (!AudioManager.isPlaying("bgm_main")) {
    AudioManager.play("bgm_main");
  }
}



// function setupGlobalBgm() {
//   const startBgm = () => {
//     ensureBgmStarted();
//   };

//   ["pointerdown", "touchstart", "mousedown"].forEach((ev) => {
//     document.addEventListener(ev, startBgm, { once: true });
//   });
// }


// Cố gắng resume AudioContext khi overlay bật/tắt
// function resumeSoundContext(scene: Phaser.Scene) {
//   const sm = scene.sound as any;
//   const ctx: AudioContext | undefined = sm.context || sm.audioContext;
//   if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
//     ctx.resume();
//   }
// }
// Cho các Scene gọi qua window
(Object.assign(window as any, {
  setRandomIntroViewportBg,
  setRandomGameViewportBg,
  setRandomEndViewportBg,
  setGameButtonsVisible,
}));

// ================== CẤU HÌNH PHASER ==================
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720, // 16:9
  parent: containerId,
  transparent: true, // Canvas trong suốt để nhìn thấy background của body
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  // Chạy PreloadScene trước để load toàn bộ asset, rồi mới vào GameScene
  scene: [PreloadScene, GameScene,BalanceScene, EndGameScene],
};

// ================== KẾT NỐI NÚT HTML (ngoài Phaser) ==================
function setupHtmlButtons() {
  const replayBtn = document.getElementById("btn-replay");
  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      if (!game) return;

      // Dừng toàn bộ âm thanh trước khi chơi lại để tránh lồng nhau
      AudioManager.stopAll();

      // Nếu đang ở màn phụ (BalanceScene) → dừng màn phụ và quay lại GameScene của level hiện tại
      const balance = game.scene.getScene("BalanceScene") as BalanceScene | null;
      if (balance && balance.scene.isActive()) {
        // Khi đang ở màn phụ → quay lại GameScene với level ngẫu nhiên, score reset
        const maxLevel = 3; // 4 level: 0..3
        const randomLevelIndex = Math.floor(Math.random() * (maxLevel + 1));

        game.scene.stop("BalanceScene");
        game.scene.start("GameScene", { levelIndex: randomLevelIndex, score: 0 });
        ensureBgmStarted();
        return;
      }

      // Ngược lại, đang ở GameScene → restart lại với level ngẫu nhiên (không chỉ 1 màn)
      const scene = game.scene.getScene("GameScene") as GameScene | null;
      if (!scene) return;

      const maxLevel = 3; // 4 level: 0..3
      const randomLevelIndex = Math.floor(Math.random() * (maxLevel + 1));

      scene.scene.restart({
        levelIndex: randomLevelIndex,
        score: 0,
      });
      ensureBgmStarted();
    });
  }

  // Ẩn hoàn toàn nút chuyển màn
  const nextBtn = document.getElementById("btn-next") as
    | HTMLButtonElement
    | null;
  if (nextBtn) {
    nextBtn.style.display = "none";
  }

  // Mặc định ẩn nút (intro, endgame)
  setGameButtonsVisible(false);
}

// ================== CHỜ FONT WEB (DỨT ĐIỂM) ==================
async function waitForWebFonts(): Promise<void> {
  const fonts = (document as any).fonts;
  if (!fonts) return;

  try {
    // 🔑 ÉP LOAD CỤ THỂ TỪNG FONT (quan trọng nhất)
    await fonts.load('16px "Baloo 2"');
    await fonts.load('16px "Fredoka"');

    // 🔒 Chờ browser xác nhận font usable
    await fonts.ready;

    console.log("[Font] Web fonts ready");
  } catch (e) {
    console.warn("[Font] Load font failed, fallback may be used", e);
  }
}

// ================== KHỞI TẠO GAME ==================
async function initGame() {
try {
  await waitForWebFonts();
  (window as any).__fontsReady = true; // 🔑 QUAN TRỌNG
} catch (e) {
  console.warn("Không load kịp webfonts, chạy game luôn.");
  (window as any).__fontsReady = true; // fallback vẫn cho chạy
}


  try {
    await AudioManager.loadAll();
  } catch (e) {
    console.warn("Không load được audio, chạy game luôn.", e);
  }

  // Bật nhạc nền 1 lần, loop xuyên suốt game (sau user gesture)
  // setupGlobalBgm();

  if (!game) {
    // setRandomIntroViewportBg();
    game = new Phaser.Game(config);
    initRotateOrientation(game); 
    setupHtmlButtons();
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
