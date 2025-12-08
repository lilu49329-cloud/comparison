// rotateLogic.ts (minimal version - only UI + orientation logic)

let rotateOverlay: HTMLDivElement | null = null;
let isRotateOverlayActive = false;

// Tạo UI overlay xoay ngang
export function createRotateOverlay() {
  if (rotateOverlay) return;

  rotateOverlay = document.createElement("div");
  rotateOverlay.id = "rotate-overlay";
  rotateOverlay.style.display = "none"; // mặc định ẩn

  const box = document.createElement("div");
  box.id = "rotate-box";

  const title = document.createElement("div");
  title.id = "rotate-title";
  title.textContent = "Bé hãy xoay ngang màn hình để chơi nhé 🌈";

  box.appendChild(title);
  rotateOverlay.appendChild(box);

  document.body.appendChild(rotateOverlay);
}

// Cập nhật trạng thái xoay ngang / dọc
export function updateRotateState() {
  if (!rotateOverlay) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // điều kiện: màn dọc và chiều rộng nhỏ hơn 768px
  const shouldShow = h > w && w < 768;

  isRotateOverlayActive = shouldShow;
  rotateOverlay.style.display = shouldShow ? "flex" : "none";
}

// Khởi động hệ thống xoay
export function initRotateHandler() {
  createRotateOverlay();
  updateRotateState();

  const refresh = () => updateRotateState();

  window.addEventListener("resize", refresh);
  window.addEventListener("orientationchange", refresh);
}
