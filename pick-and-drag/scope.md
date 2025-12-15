Giai đoạn 1 là **định hình kiến trúc & phạm vi bản v1**. Mục tiêu: sau message này, bạn nắm rõ **mình sẽ làm *cái gì*** trước, cái gì để sau, game chạy theo mô hình nào.

---

## 1. Xác định phạm vi bản V1 (MVP)

Ta *không* làm tất cả concept ngay. Bản đầu tiên:

* **Chỉ 1 concept:** `Cao hơn / Thấp hơn` (HEIGHT)
* **Chỉ 1 lesson:** `height_basic_01`
* Mỗi lesson có:

  * 1 câu lệnh mặc định:

    > “Con hãy chạm vào bức tranh có cây cao hơn.”
  * Khoảng **5–8 câu hỏi (item)**, mỗi câu 2 hình để chọn (dễ, BINARY_PICK).
* Chưa cần:

  * Menu chọn bài
  * Adaptive difficulty
  * Mix nhiều concept
  * Phân tích data phức tạp

→ Mục tiêu V1: **Chạy được trọn flow 1 bài Cao/Thấp**, từ load data → chơi → tổng kết.

---

## 2. Kiến trúc tổng thể

### 2.1. Tech stack

* Shell: **Vite + TypeScript**
* Game engine: **Phaser 3**
* Render trong `<div id="game">` (đã thống nhất)
* Game chạy ở dạng SPA đơn giản, chưa cần integration sâu với Next.js hay gì khác.

### 2.2. Cách tổ chức game

Chốt mô hình:

* Game = 1 `Phaser.Game` với vài scene:

  * `BootScene` – khởi động, nhận `lessonId`
  * `PreloadScene` – load JSON & asset theo `lessonId`
  * `LessonScene` – gameplay chính (vòng câu hỏi)
  * `SummaryScene` – tổng kết kết quả

* **Kiểu định hướng:** data-driven

  * Mọi thứ về nội dung bài học nằm ở **file JSON** trong `public/lessons/...`
  * Code chỉ “đọc và hiển thị”.

---

## 3. Định hình đơn vị nội dung: Lesson & Item

Dừng ở mức *concept*, chưa cần code:

### 3.1. Lesson (1 bài học)

Một lesson có các thông tin:

* `lessonId` – ví dụ `height_basic_01`
* `title` – “Cao hơn / Thấp hơn”
* `concept` – HEIGHT
* `defaultMode` – BINARY_PICK (2 hình, chọn 1)
* `defaultPromptText` – câu lệnh chung dùng cho hầu hết câu
* `defaultPromptAudio` – file audio đọc câu lệnh chung
* `items` – danh sách các câu hỏi

### 3.2. Item (1 câu hỏi trong bài)

Mỗi item có:

* `id` – mã câu hỏi
* `promptText` (optional) – nếu muốn khác câu mặc định
* `promptAudio` (optional)
* `mode` (optional) – nếu muốn khác defaultMode
* `options` – danh sách 2 hình cho V1

  * mỗi option có:

    * `id`
    * `image` – đường dẫn hình
    * `value` – chiều cao tương đối (1, 2, 3, 4…)
* `correctOptionId` – id của hình đúng
* `difficulty` – mức 1–5 (V1 có thể set toàn 1–2)

→ Như vậy, V1 chỉ cần support:
**1 concept, 1 mode, 2 option mỗi câu**.

---

## 4. Flow game từ góc nhìn engine

### 4.1. Flow màn chơi

1. **BootScene**

   * Xác định `lessonId` sẽ chơi (V1: hard-code `height_basic_01`)
   * Chuyển sang `PreloadScene` và truyền `lessonId`.

2. **PreloadScene**

   * Dùng `lessonId` để load file JSON bài học tương ứng.
   * Từ JSON:

     * Gom danh sách hình & audio cần load
   * Load asset xong → chuyển sang `LessonScene` kèm object lesson.

3. **LessonScene**

   * Giữ:

     * lesson
     * currentItemIndex
     * score (số câu đúng)
   * Lặp:

     * Lấy item hiện tại
     * Hiển thị câu lệnh + 2 hình
     * Bé bấm vào 1 hình

       * so với `correctOptionId`
       * đúng → hiệu ứng → sang câu sau
       * sai → hiệu ứng sai, cho chọn lại
   * Hết item → chuyển sang `SummaryScene`.

4. **SummaryScene**

   * Nhận:

     * `lessonId`
     * `score` (correct)
     * `total` (tổng số câu)
   * Hiển thị kết quả, nút “Chơi lại” (quay về BootScene).

---

## 5. Thiết kế UI/UX cho V1

Chốt bố cục để sau qua giai đoạn 2/3 là map thẳng sang code:

### 5.1. Màn LessonScene

* Trên cùng:

  * Text câu lệnh, căn giữa, font to, tối giản.
  * Icon loa ở cạnh phải text (V1 có thể chưa hoạt động, hoặc chỉ play audio chung).

* Giữa màn:

  * 2 hình (option) đặt trái – phải, kích thước khá lớn, dễ bấm.
  * Khoảng cách đủ để bé không bấm nhầm.

* Dưới cùng:

  * Text nhỏ “Câu X / Y”.
  * (Optional V1) 1 thanh progress đơn giản.

### 5.2. Feedback

* Đúng:

  * Hình được chọn phóng to nhẹ, “giật giật” 1 lần, cảm giác vui.
* Sai:

  * Hình rung ngang, báo sai nhưng *không* hiện pop-up nặng nề.
  * Sau khi animation xong, cho chọn lại.

---

## 6. Định nghĩa ranh giới với hệ thống lớn (Iruka)

Để sau này dễ nhét vào platform:

* V1 giả định:

  * `lessonId` tạm thời được hard-code, **chưa** nhận từ ngoài.
  * **Chưa** gọi backend, chỉ log console nếu cần.

* Sau này:

  * `lessonId` sẽ:

    * đọc từ URL (query/hash)
    * hoặc nhận từ host app qua bridge
  * tracking (log kết quả) sẽ:

    * gửi qua HTTP fetch
    * hoặc postMessage tuỳ môi trường.

---

## 7. Checklist cuối giai đoạn 1 (những gì đã chốt)

Bạn đã có:

* ✅ Chọn concept V1: **Cao hơn / Thấp hơn**
* ✅ Chọn phạm vi bài: 1 lesson, 5–8 câu, 2 lựa chọn/câu
* ✅ Mô hình data: LessonPackage + LessonItem + Option (ở mức khái niệm)
* ✅ Mô hình scene: Boot → Preload → Lesson → Summary
* ✅ Flow gameplay từng câu: load → hiển thị → click → đúng/sai → tiếp
* ✅ Hướng UI cơ bản: text trên, hình giữa, progress dưới

---
