**Giai đoạn 2: Thiết kế dữ liệu & asset**.

Mục tiêu:
Sau giai đoạn này, bạn có:

* Cấu trúc **lesson** & **item** chốt hẳn.
* Quy ước **folder asset**.
* 1 bản **lesson mẫu** cụ thể cho `Cao hơn / Thấp hơn`.
* Rõ cách sau này “sản xuất hàng loạt” bài mới chỉ bằng thay data.

---

## 1. Quy ước thư mục & tổ chức project

### 1.1. Khu vực game code (src/)

Không đi sâu, chỉ quan trọng là biết:

* `src/game/...` – code Phaser.
* Data + asset **không** nằm đây, để dễ fetch & deploy.

### 1.2. Khu vực public (data + asset)

Đề xuất:

```txt
public/
  lessons/
    height_basic_01.json
    height_basic_02.json
    length_basic_01.json
    ...
  assets/
    height/
      tree_short.png
      tree_tall.png
      building_low.png
      building_high.png
      ...
    length/
      pencil_short.png
      pencil_long.png
      ...
  audio/
    height/
      default_prompt.mp3
      q1_prompt.mp3
      q2_prompt.mp3
    ...
```

Lý do:

* Phaser & Vite có thể truy cập trực tiếp `/lessons/...`, `/assets/...`, `/audio/...`.
* Content/Designer sau này chỉ đụng **`public/`**, không cần hiểu source code.

---

## 2. Thiết kế schema cho dữ liệu bài học (lesson)

Không viết TypeScript, viết theo kiểu “spec data”.

### 2.1. Thông tin chung của bài (LessonPackage)

Một lesson sẽ có các field:

* `lessonId`

  * String duy nhất, dùng để load bài.
  * VD: `"height_basic_01"`.

* `title`

  * Tên bài để hiển thị.
  * VD: `"Cao hơn / Thấp hơn"`.

* `concept`

  * Khái niệm toán: `"HEIGHT" | "LENGTH" | "SIZE" | "WIDTH" | "QUANTITY"`
  * V1 dùng `"HEIGHT"`.

* `defaultMode`

  * Cách hỏi mặc định:

    * `"BINARY_PICK"` (2 hình, chọn 1)
    * `"MAX_IN_GROUP"`
    * `"MIN_IN_GROUP"`
  * V1: `"BINARY_PICK"`.

* `defaultPromptText`

  * Câu lệnh chung nếu từng câu không override.
  * VD: `"Con hãy chạm vào bức tranh có cây cao hơn."`

* `defaultPromptAudio` (optional)

  * File audio đọc câu lệnh chung.
  * VD: `"audio/height/default_prompt.mp3"`.

* `items`

  * Danh sách các câu hỏi (mảng `LessonItem`).

---

### 2.2. Thông tin từng câu hỏi (LessonItem)

Mỗi item có:

* `id`

  * Mã câu hỏi, VD `"q1"`, `"q2"`…

* `promptText` (optional)

  * Nếu tồn tại → dùng câu lệnh riêng cho câu này.
  * Nếu không → dùng `defaultPromptText`.

* `promptAudio` (optional)

  * Nếu tồn tại → dùng audio riêng.
  * Nếu không → dùng `defaultPromptAudio`.

* `mode` (optional)

  * Nếu tồn tại → dùng mode này thay cho `defaultMode`.
  * V1 có thể bỏ, cứ để all = `BINARY_PICK`.

* `options` (bắt buộc)

  * Mảng gồm 2–4 lựa chọn, mỗi option có:

    * `id`: mã lựa chọn, VD `"opt1"`, `"opt2"`.
    * `image`: đường dẫn file hình, VD `"assets/height/tree_short.png"`.
    * `label` (optional): nếu bài sau này muốn show chữ.
    * `value`: số thể hiện “độ cao/dài/to/rộng” tương đối (chỉ để logic / difficulty / debug).

* `correctOptionId`

  * `id` của option đúng.

* `difficulty`

  * 1–5 (thang độ khó).
  * V1 có thể dùng 1–2 cho dễ, nhưng nên khai báo sẵn.

---

## 3. Thiết kế cụ thể bài mẫu: `height_basic_01`

Đây là bài đầu tiên, concept **Cao hơn / Thấp hơn**, mode **BINARY_PICK**, hai hình mỗi câu.

### 3.1. Mục tiêu bài `height_basic_01`

* Làm trẻ hiểu rõ khái niệm “cao hơn / thấp hơn” với đồ vật quen thuộc.
* Dạng bài:

  * Câu 1–2: cây cao vs cây thấp (chênh lệch rõ).
  * Câu 3–4: nhà cao tầng vs nhà thấp.
  * Câu 5–6: cột cờ, tháp, người, v.v.

### 3.2. Quy ước value (chiều cao tương đối)

Để dễ làm nội dung:

* 1 = thấp nhất
* 2 = trung bình
* 3 = cao
* 4 = rất cao

Ví dụ:

* `tree_short.png` → value 1
* `tree_tall.png` → value 3
* `building_low.png` → value 2
* `building_high.png` → value 4

**Lưu ý**: Engine không bắt buộc dùng `value` để chấm điểm (đã có `correctOptionId`), nhưng `value` hữu ích cho analytics & auto gán `difficulty`.

---

### 3.3. Nội dung từng câu (ở mức data, chưa code)

Ví dụ bạn định làm **6 câu**:

1. **q1** – Cây thấp vs cây cao

   * options:

     * opt1: `tree_short.png`, value = 1
     * opt2: `tree_tall.png`, value = 3
   * correct: `opt2`, difficulty: 1

2. **q2** – Cây hơi thấp vs cây rất cao

   * opt1: `tree_mid.png`, value = 2
   * opt2: `tree_very_tall.png`, value = 4
   * correct: `opt2`, difficulty: 1

3. **q3** – Nhà thấp vs nhà cao

   * promptText riêng: `"Chọn ngôi nhà cao hơn."`
   * opt1: `house_small.png`, value = 1
   * opt2: `house_tall.png`, value = 3
   * correct: `opt2`, difficulty: 1

4. **q4** – Nhà hơi cao vs nhà rất cao (khó hơn q3)

   * opt1: `house_medium.png`, value = 2
   * opt2: `house_very_tall.png`, value = 4
   * correct: `opt2`, difficulty: 2

5. **q5** – Cột cờ thấp vs cột cờ cao

   * promptText có thể change: `"Chạm vào cột cờ cao hơn."`
   * opt1: `flagpole_short.png`, value = 1
   * opt2: `flagpole_tall.png`, value = 3
   * correct: `opt2`, difficulty: 1

6. **q6** – Nhân vật 1 vs nhân vật 2

   * 2 bạn nhỏ khác chiều cao
   * opt1: `kid_short.png`, value = 1
   * opt2: `kid_tall.png`, value = 3
   * correct: `opt2`, difficulty: 1–2 (tuỳ hình).

Như vậy, cả bài:

* Giữ 1 khái niệm xuyên suốt (HEIGHT).
* Chuyển đổi ngữ cảnh (cây → nhà → cột → người) để không nhàm chán.
* Độ khó chủ yếu là level 1–2, phù hợp bài đầu.

---

## 4. Cách “sản xuất hàng loạt” bài mới từ schema này

Khi schema đã chốt như trên, tạo bài mới chỉ cần:

1. Copy file JSON mẫu của `height_basic_01`.
2. Đổi:

   * `lessonId`, `title`.
3. Thay:

   * `defaultPromptText` nếu là concept khác (vd: Dài/Ngắn).
4. Thay `items`:

   * Mỗi item chỉ cần:

     * đổi đường dẫn `image`
     * set đúng `correctOptionId`
     * value + difficulty cho hợp lý.

Ví dụ bạn muốn có bài `height_basic_02` (khó hơn):

* Dùng 3–4 hình trong mỗi item, mode `"MAX_IN_GROUP"`.
* Hình chênh nhau ít hơn (value gần nhau hơn).
* difficulty = 2–3.

Engine **không cần sửa** – chỉ đọc thêm data.

---

## 5. Checklist cuối Giai đoạn 2

Sau giai đoạn 2, bạn nên có rõ trên giấy / Notion:

* ✅ Quy ước folder `public/lessons`, `public/assets`, `public/audio`.
* ✅ Schema dữ liệu:

  * Field list cho LessonPackage.
  * Field list cho LessonItem & Option.
* ✅ Một bản spec nội dung cho `height_basic_01`:

  * Số câu, mỗi câu dùng hình nào, câu lệnh nào, đáp án nào, difficulty bao nhiêu.
* ✅ Quy ước `value` cho “cao/thấp” để sau dễ dùng cho analytics & độ khó.

---
