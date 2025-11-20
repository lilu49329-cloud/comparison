Hình **không hiển thị** trong Phaser + Vite gần như chắc chắn do **sai đường dẫn asset**.
Vite **không cho load file trong `src/` trực tiếp bằng URL**, nên Phaser không tìm thấy hình.

Đây là lỗi **60% dev gặp**, nhất là khi mới dùng Vite.

---

# ✅ **Giải pháp đúng trong Vite: đặt asset vào thư mục `public/`**

### 👉 Bạn hãy tạo cấu trúc sau:

```
public/
   assets/
      images/
         bg_forest.png
         rabbit_idle.png
         banner_top.png
         ...
      audio/
         vo_prompt_1.mp3
         ...
src/
   main.ts
   scenes/
      GameScene.ts
```

🎯 Khi asset đặt trong `public/`, Vite sẽ phục vụ file đúng chuẩn như static server.

---

# ✅ Sau đó, thay preload() như sau:

```ts
preload() {
  this.load.image("bg_forest", "/assets/images/bg_forest.png");
  this.load.image("rabbit_idle", "/assets/images/rabbit_idle.png");
  this.load.image("rabbit_cheer", "/assets/images/rabbit_cheer.png");
  this.load.image("banner_top", "/assets/images/banner_top.png");

  this.load.image("balloon_red", "/assets/images/balloon_red.png");
  this.load.image("balloon_blue", "/assets/images/balloon_blue.png");
  this.load.image("balloon_green", "/assets/images/balloon_green.png");
  this.load.image("balloon_purple", "/assets/images/balloon_purple.png");

  // AUDIO
  this.load.audio("vo_prompt_1", "/assets/audio/vo_prompt_1.mp3");
  this.load.audio("sfx_correct", "/assets/audio/sfx_correct.mp3");
  this.load.audio("sfx_wrong", "/assets/audio/sfx_wrong.mp3");
  this.load.audio("sfx_pop", "/assets/audio/sfx_pop.mp3");
  this.load.audio("sfx_flyaway", "/assets/audio/sfx_flyaway.mp3");
}
```

💡 Lưu ý:
**Đường dẫn phải bắt đầu bằng `/`**
→ vì `public/` luôn map vào root của server.

---

# 🟩 Tổng kết: Cách đúng để hiển thị hình trong Phaser + Vite

✔ Đặt asset vào `public/assets/...`
✔ Load bằng đường dẫn `/assets/...`
✔ Không được load từ `src/assets`

---

---

# 🎯 Lưu ý: Bugs đã fix — GameScene

## Tóm tắt ngắn

Sửa các lỗi liên quan đến animation `pop` (nổ) và trạng thái `balloons` khi chuyển level, đảm bảo:

- Bóng sai nổ đúng màu.
- Bóng sai bị destroy sau khi nổ.
- Bóng đúng không bị nổ.
- Không còn lỗi `Cannot read properties of undefined (reading 'getData')`.
- Không mất animation khi qua level tiếp theo.
- Chờ xong animation / audio mới hiện nút Next / chuyển level.
- Reset và cleanup resource khi restart scene.

---

## 1. Triệu chứng (issues)

- `Uncaught TypeError: Cannot read properties of undefined (reading 'getData')` khi `onCorrect()` chạy (level 2+).
- Bóng đúng vẫn bị xử lý như bóng sai (vẫn nổ).
- Hiệu ứng nổ màu sai (pop màu red nhưng hiển thị blue).
- Bóng sai không bị xóa (chỉ ẩn) → vẫn chiếm vùng click.
- Hiệu ứng nổ bị mất khi chuyển sang level kế tiếp (scene restart quá sớm hoặc mảng balloons không reset).
- Tạo `anims` trong `preload()` gây hoạt động không ổn định.

---

## 2. Nguyên nhân chính

1. `this.balloons` không được reset/cleanup khi restart → mảng chứa phần tử cũ (destroyed/undefined).
2. Lưu `color` sai (chỉ `"red"`) rồi dùng làm key texture `pop` (thực tế key cần là `"pop_red"`).
3. Dùng biến `img` của _bóng đúng_ khi tạo pop cho các bóng còn lại → dùng sai `popKey`.
4. Tạo `this.anims.create()` trong `preload()` hoặc tạo animation nhiều lần → không ổn định qua nhiều restart.
5. Restart/scene.start chạy trước khi animation/audio kết thúc → animation bị cắt.

---

## 3. Sửa đổi chính (code snippets)

### A. Reset/cleanup mảng `balloons` khi load lại / create

```ts
create(data: any) {
  // reset lại mảng tránh giữ reference cũ
  this.balloons?.forEach(b => b?.destroy());
  this.balloons = [];
  // ... tiếp tục tạo UI / balloons
}
```

### B. Trong `createBalloons()` — lưu đúng `popKey` trên image/container

```ts
const balloonKey = shuffledColors[index]; // "balloon_red"
const popKey = balloonKey.replace('balloon_', 'pop_'); // "pop_red"
img.setData('balloonKey', balloonKey);
img.setData('popKey', popKey);
(balloon as any).popKey = popKey; // lưu tạm trên container để nhanh truy xuất
(balloon as any).isCorrect = false;
```

### C. Tạo animation trong `create()` và chỉ tạo 1 lần

```ts
const colors = ['red', 'blue', 'green', 'purple'];
colors.forEach((color) => {
    const animKey = `pop_${color}_anim`;
    if (!this.anims.exists(animKey)) {
        this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(`pop_${color}`),
            frameRate: 20,
            repeat: 0,
            hideOnComplete: true,
        });
    }
});
```

### D. `onCorrect()` — check null, không dùng `img` của bóng đúng để lấy popKey, destroy đúng thời điểm

```ts
onCorrect(correctBalloon) {
  // đánh dấu correct
  (correctBalloon as any).isCorrect = true;

  // tắt tương tác
  this.balloons.forEach(b => {
    const i = b.getAt?.(0) as Phaser.GameObjects.Image;
    if (i) i.disableInteractive();
  });

  // phóng to bóng đúng (dùng container đúng)
  const imgCorrect = correctBalloon.getAt(0) as Phaser.GameObjects.Image;
  const baseScale = (Math.min(this.scale.width,this.scale.height) / 1280) * 2;
  this.tweens.add({
    targets: imgCorrect,
    scaleX: baseScale,
    scaleY: baseScale,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => {
      correctBalloon.destroy();
      // show board + chờ audio -> showNextButton
      const waitTime = this.showNumberBoard(this.levelData.correctNumber, itemKey, 'board_bg');
      this.time.delayedCall(waitTime, () => this.showNextButton());
    }
  });

  // nổ bóng sai (dùng popKey của từng balloon, check tồn tại)
  this.balloons.forEach(b => {
    if (!b || (b as any).isCorrect) return;             // skip correct & invalid
    const imgB = b.getAt(0) as Phaser.GameObjects.Image;
    if (!imgB) return;
    const popKey = imgB.getData('popKey');              // "pop_red"
    if (!popKey) {
      b.destroy(); return;
    }

    b.setVisible(false); // ẩn container cũ
    const fx = this.add.sprite(b.x, b.y, popKey).setScale(/* responsive scale */);
    fx.play(`${popKey}_anim`);
    fx.once('animationcomplete', () => {
      fx.destroy();
      b.destroy(); // destroy container sai sau khi pop xong
    });
  });

  // rabbit cheer
  this.rabbit.setTexture('rabbit_cheer').setScale(1.2);
}
```

### E. `cleanup()` trước khi restart (nếu cần)

```ts
cleanup() {
  this.balloons?.forEach(b => b?.destroy());
  this.balloons = [];
  // destroy effects array nếu có
  this.popEffects?.forEach(e => e?.destroy());
  this.popEffects = [];
}
```

Gọi `cleanup()` trước `this.scene.restart({ level: ... })` hoặc reset trong `create()`.

### F. Chờ audio/animation xong mới show Next (tính toán thời gian hoặc dùng event)

- Nếu dùng delayedCall: `waitTime = numberOfItems * delayPerItem + estimatedVoiceDuration`
- Tốt hơn: play audio clip có callback `on('complete')` / hoặc `sound.once('complete', ...)` rồi gọi showNextButton.

---

## 4. Cách kiểm thử (Test cases ngắn)

1. Level 1: chọn đúng → bóng đúng phóng to, các bóng còn lại nổ đúng màu → bị xóa → bảng xuất hiện → đếm audio chạy → Next hiện.
2. Bấm Next → chuyển level 2: không còn lỗi console, balloons array rỗng trước khi tạo mới.
3. Lặp qua hết level → EndScene hiển thị.
4. Thử bấm liên tục nhiều lần → không duplicate animation, không crash.
5. Kiểm tra `this.anims.exists(...)` để đảm bảo không tạo trùng key.

---

## 5. Gợi ý code nhỏ để debug nhanh

- Log state khi restart / create:

```ts
console.log(
    'Creating level:',
    this.currentLevel,
    'balloons before reset:',
    this.balloons?.length
);
```

- Log khi tạo popKey:

```ts
console.log('Balloon created:', balloonKey, '→ popKey:', popKey);
```

- Log khi pop play:

```ts
console.log('Play pop:', popKey, 'at', b.x, b.y);
```

---

## 6. Checklist để commit vào repo (README/CHANGELOG)

- [ ] Đã reset/cleanup `this.balloons` khi tạo level mới.
- [ ] Lưu `popKey` chính xác (`pop_red`, ...) trên từng image/container.
- [ ] Tạo animation trong `create()` và kiểm tra `this.anims.exists()` trước khi tạo.
- [ ] Kiểm tra `!b || !b.active` trước khi truy xuất `b.getAt(0)`.
- [ ] Destroy container bóng sai sau khi animation pop kết thúc.
- [ ] Chờ audio/animation hoàn thành trước khi hiện Next / restart scene.

---
