
# 🚀 LỘ TRÌNH CODE GAME “CHỌN ĐÚNG SỐ TRÊN QUẢ BÓNG”

## **Giai đoạn 1: Chuẩn Bị Project**

### **1. Tạo project Phaser**

* Tạo cấu trúc:

```
src/
  assets/
    images/
    audio/
  scenes/
    GameScene.ts
    NextScene.ts
main.ts
```

### **2. Cấu hình Webpack / Vite (nếu chưa có)**

* Cho phép load `png`, `jpg`, `mp3`, `json`.

### **3. Đặt asset vào thư mục**

* Gồm: `bg_forest`, `rabbit_idle`, `rabbit_cheer`, các balloon, âm thanh…

---

## **Giai đoạn 2: Tạo GameScene**

### **4. Tạo file GameScene.ts**

Tối thiểu 3 hàm quan trọng:

```ts
preload() {}
create() {}
update() {}
```

### **5. Viết preload()**

* Load toàn bộ hình và âm thanh.
* Kiểm tra console tránh thiếu file.

---

## **Giai đoạn 3: Dựng UI nền**

### **6. Trong create() → Dựng background + nhân vật**

* Add `bg_forest`
* Add `rabbit_idle` tại góc trái
* Add `banner_top`
* Add text hướng dẫn: `"Chạm vào số X"`

### **7. Tạo dữ liệu màn chơi**

```ts
this.levelData = {
  prompt: "Chạm vào số 4",
  correctNumber: 4,
  options: [1, 2, 3, 4]
}
```

### **8. Random vị trí 4 quả bóng**

* Dùng mảng `positions = [{x,y}, ...]`.

---

## **Giai đoạn 4: Code phần Balloons**

### **9. Tạo hàm `createBalloons()`**

* Loop qua options
* Tạo sprite balloon màu ngẫu nhiên
* Add số lên bằng `setText`
* SetInteractive với pointerdown

### **10. Gắn sự kiện**

```ts
balloon.on("pointerdown", () => this.handleSelect(balloon))
```

---

## **Giai đoạn 5: Xử lý chọn đúng – sai**

### **11. Tạo hàm handleSelect(balloon)**

* So sánh:

```ts
if (balloon.value === this.levelData.correctNumber) this.onCorrect(balloon)
else this.onWrong(balloon)
```

---

## **Giai đoạn 6: Viết logic chọn sai**

### **12. Tạo hàm onWrong(balloon)**

* Tween rung:

```ts
this.tweens.add({
  targets: balloon,
  angle: { from: -10, to: 10 },
  duration: 100,
  yoyo: true,
  repeat: 1
})
```

* Play `sfx_wrong`

---

## **Giai đoạn 7: Logic chọn đúng**

### **13. Tắt tương tác toàn bộ ball**

```ts
this.balloons.forEach(b => b.disableInteractive())
```

### **14. Viết hàm onCorrect(balloon)**

* Play `sfx_correct`
* Gọi `playPop(balloon)`
* Gọi `flyAwayOtherBalloons(balloon)`
* Đổi sprite thỏ → `rabbit_cheer`
* Set timeout 1.5s → `scene.start("NextScene")`

---

## **Giai đoạn 8: Hiệu ứng đúng**

### **15. Hiệu ứng pop**

Nếu dùng scale:

```ts
this.tweens.add({
  targets: balloon,
  scale: 0,
  duration: 250,
  onComplete: () => balloon.destroy()
})
```

### **16. Các bóng khác bay lên**

```ts
this.tweens.add({
  targets: otherBall,
  y: otherBall.y - 600,
  alpha: 0,
  duration: 1000,
  ease: "Cubic.easeOut"
})
```

---

## **Giai đoạn 9: Thỏ hoạt hình**

### **17. Chuyển trạng thái**

```ts
this.rabbit.setTexture("rabbit_cheer")
```

---

## **Giai đoạn 10: Chuyển sang cảnh kế tiếp**

### **18. Dùng delay**

```ts
this.time.delayedCall(1500, () => {
  this.scene.start("NextScene")
})
```

---

## **Giai đoạn 11: Tách nhỏ code**

Sau khi chạy thử:

* Tách ra các module nhỏ:

```
createUI()
createBalloons()
handleSelect()
onCorrect()
onWrong()
```

---

# 🎯 Output cuối bạn sẽ có:

* Một GameScene hoàn chỉnh
* Hiệu ứng đúng/sai
* Animation thỏ
* Tách code rõ ràng
* Có thể dễ dàng mở rộng 10–20 màn chơi

---

