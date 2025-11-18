# Game: Chọn Đúng Số Trên Quả Bóng

## 1. Mô Tả Game (Gameplay Design)

### Tên game
Chọn đúng số trên quả bóng

### Độ tuổi
3–4 tuổi

### Mục tiêu học tập
- Trẻ nhận biết số và số lượng.
- Trẻ nghe – hiểu – chạm để chọn đáp án đúng.

---

## 2. Mô Tả Chi Tiết Trò Chơi

### Luật chơi
- Màn hình gồm:
  - Nền rừng (`bg_forest`)
  - Nhân vật thỏ (idle & cheer)
  - Banner hiển thị yêu cầu: *“Chạm vào số X”*
  - 4 quả bóng bay chứa số khác nhau

- Trẻ phải chạm vào quả bóng mang số đúng theo yêu cầu.

---

## 3. Hành Vi Khi Chạm

### Trường hợp chọn sai
- Bóng bị chạm rung nhẹ (shake).
- Phát âm thanh `sfx_wrong`.
- Không thay đổi màn hình, trẻ chọn lại.

### Trường hợp chọn đúng
- Tắt interaction của toàn bộ bóng.
- Phát âm thanh `sfx_correct`.
- Bóng đúng:
  - Nổ (animation `effect_pop` hoặc scale → 0)
- Các bóng sai còn lại:
  - Bay lên trời rồi biến mất.
- Thỏ đổi trạng thái → `rabbit_cheer`.
- Chờ ~1.5 giây → chuyển sang màn tiếp theo.

---

## 4. Mô Tả Kỹ Thuật (Technical Requirements)

### A. Tài Nguyên (Asset Keys)

#### Hình ảnh
- `bg_forest`
- `rabbit_idle`
- `rabbit_cheer`
- `banner_top`
- `balloon_green`
- `balloon_purple`
- `balloon_blue`
- `balloon_red`
- `effect_pop` (optional)
- `icon_hand` (optional)

#### Âm thanh
- `vo_prompt_1`
- `sfx_correct`
- `sfx_wrong`
- `sfx_pop`
- `sfx_flyaway`

---

### B. Luồng Scene

#### 1. Hàm `create()`
- Load background.
- Hiển thị thỏ idle.
- Hiển thị banner + text hướng dẫn.
- Render 4 quả bóng (setInteractive).
- Play `vo_prompt_1`.
- Lưu `correctNumber`.

#### 2. Xử lý pointerdown

##### Sai:
- Tween shake (angle ±10).
- Play `sfx_wrong`.

##### Đúng:
- Disable tất cả tương tác.
- Play `sfx_correct`.
- Bóng đúng nổ (pop).
- Bóng sai còn lại bay lên (tween y-600 & alpha 0).
- Đổi sprite → `rabbit_cheer`.
- Delay 1500ms → chuyển cảnh.

---

## 5. Dữ Liệu Cấu Hình Màn Chơi

```ts
{
  prompt: "Chạm vào số 4",
  correctNumber: 4,
  options: [1, 2, 3, 4]
}
```

---

## 6. Công Việc Dev Cần Làm

### Chuẩn bị asset
- Import images, sprites, audio.
- Tạo animation nổ nếu dùng.

### Dựng UI
- Background, banner, thỏ, 4 bóng.

### Logic chạm
- Check đúng/sai.
- Chạy hiệu ứng tương ứng.

### Hiệu ứng
- Shake khi sai.
- Pop khi đúng.
- Fly away cho bóng sai còn lại.

### Âm thanh
- Play tương ứng từng trạng thái.

### Chuyển cảnh
- Sau delay 1.5s → `scene.start("NextScene")`.

---

## 7. Gợi Ý Tách Code
- `createBalloons()`
- `handleSelect(balloon)`
- `playCorrectAnimation()`
- `playWrongAnimation()`

---
