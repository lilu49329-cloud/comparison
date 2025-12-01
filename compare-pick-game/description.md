
1. **Mô tả game (cho team edu/product hiểu)**
2. **Mô tả kỹ thuật (data, state, flow, lesson package)**
3. **Công việc cụ thể cho dev**

---

## 1. MÔ TẢ GAME (CHO EDU / PRODUCT)

**Tên game:** So sánh – Chọn đúng (Compare & Pick)
**Đơn vị sản xuất:** *Bài học (lesson)* theo từng khái niệm, ví dụ:

* Bài 1: Cao hơn / Thấp hơn
* Bài 2: Dài hơn / Ngắn hơn
* Bài 3: To hơn / Nhỏ hơn
* Bài 4: Rộng hơn / Hẹp hơn
* (sau mở rộng thêm: Nhiều hơn / Ít hơn, Trái / Phải, Trước / Sau...)

**Độ tuổi:** 3–5 (mẫu giáo bé – nhỡ – lớn)

### Mục tiêu giáo dục

* Giúp trẻ hiểu và sử dụng các khái niệm so sánh:

  * cao – thấp, dài – ngắn, to – nhỏ, rộng – hẹp…
* Rèn quan sát, chú ý chi tiết, ra quyết định.
* Làm quen với “tư duy so sánh” – nền cho toán tiểu học.

### Cách chơi (một bài học)

Ví dụ bài: **Cao hơn / Thấp hơn**

1. Màn hình hiện **2 hình** (hoặc 3–4 hình ở level cao hơn): cây, nhà, bút, cột cờ…
2. Phía trên có **câu lệnh + audio**:

   * “Con hãy chạm vào **cây cao hơn**.”
   * Hoặc: “Chọn tòa nhà **cao hơn**.”
3. Bé chạm vào 1 hình:

   * Nếu đúng: hiệu ứng vui, âm thanh khen, +1 câu đúng.
   * Nếu sai: hiệu ứng nhẹ (rung hình, âm thanh “oops”), gợi ý, cho bé chọn lại.
4. Mỗi bài thường có **5–10 câu**, cùng một khái niệm nhưng thay hình ảnh.
5. Kết thúc bài: hiện tổng kết (số câu đúng, lời khen, huy hiệu).

**Điểm quan trọng:**

* Tư duy **sản xuất hàng loạt**:

  * Logic game **giữ nguyên**, chỉ thay **hình ảnh + audio + value** → thành câu mới.
  * Mỗi khái niệm = 1 “gói bài học” (lesson package).

---

## 2. MÔ TẢ KỸ THUẬT

### 2.1. Khái niệm kỹ thuật chính

* **Game Engine:** 1 engine duy nhất cho tất cả bài so sánh.
* **Lesson Package:** một file cấu hình (JSON/TS) mô tả **1 bài học** (vd: Cao/Thấp).
* **Item (câu hỏi):** mỗi lần hiển thị 2–4 hình để bé chọn → 1 item.

---

### 2.2. Kiểu dữ liệu tổng quát

#### Concept & Mode

```ts
type LessonConcept =
  | 'HEIGHT'   // Cao / Thấp
  | 'LENGTH'   // Dài / Ngắn
  | 'SIZE'     // To / Nhỏ
  | 'WIDTH'    // Rộng / Hẹp
  | 'QUANTITY' // Nhiều / Ít (mở rộng sau);

type QuestionMode =
  | 'BINARY_PICK'   // 2 hình, chọn 1
  | 'MAX_IN_GROUP'  // 3–4 hình, chọn "lớn nhất/cao nhất/dài nhất"
  | 'MIN_IN_GROUP'; // 3–4 hình, chọn "nhỏ nhất/thấp nhất/ngắn nhất"
```

#### Lesson Package (1 bài học)

```ts
type LessonPackage = {
  lessonId: string;            // 'height_basic_01'
  title: string;               // 'Cao hơn / Thấp hơn'
  concept: LessonConcept;      // 'HEIGHT'
  defaultMode: QuestionMode;   // mặc định: 'BINARY_PICK'

  // Câu lệnh chung (nếu item không override)
  defaultPromptText: string;   
  defaultPromptAudio?: string;

  // Danh sách câu hỏi
  items: LessonItem[];
};
```

#### Lesson Item (1 câu cụ thể trong bài)

```ts
type LessonItem = {
  id: string;

  // Cho phép override câu lệnh từng câu (không bắt buộc)
  promptText?: string;         
  promptAudio?: string;        

  // Nếu không set thì lấy defaultMode
  mode?: QuestionMode;         

  options: Array<{
    id: string;
    image: string;             // path asset
    label?: string;            // ít dùng cho 3-5 tuổi
    value: number;             // dùng cho logic so sánh (cao/dài/to/rộng)
  }>;

  correctOptionId: string;     // ID của option đúng
  difficulty: 1 | 2 | 3 | 4 | 5;
};
```

**Ý tưởng:**

* Engine **không cần hiểu “cao, dài, to…”**.
* Engine chỉ biết: “hiển thị options”, “câu lệnh”, “đáp án đúng là correctOptionId”.
* Giá trị `value` dùng cho:

  * auto gợi ý,
  * auto đánh difficulty (nếu cần),
  * hoặc debug.

---

### 2.3. Ví dụ JSON một bài “Cao hơn / Thấp hơn”

```json
{
  "lessonId": "height_basic_01",
  "title": "Cao hơn / Thấp hơn",
  "concept": "HEIGHT",
  "defaultMode": "BINARY_PICK",
  "defaultPromptText": "Con hãy chạm vào bức tranh có cây cao hơn.",
  "defaultPromptAudio": "audio/height/default_prompt.mp3",
  "items": [
    {
      "id": "q1",
      "options": [
        { "id": "opt1", "image": "assets/height/tree_short.png", "value": 1 },
        { "id": "opt2", "image": "assets/height/tree_tall.png",  "value": 3 }
      ],
      "correctOptionId": "opt2",
      "difficulty": 1
    },
    {
      "id": "q2",
      "promptText": "Chọn tòa nhà cao hơn.",
      "promptAudio": "audio/height/q2_prompt.mp3",
      "options": [
        { "id": "opt1", "image": "assets/height/building_medium.png", "value": 2 },
        { "id": "opt2", "image": "assets/height/building_tall.png",   "value": 4 }
      ],
      "correctOptionId": "opt2",
      "difficulty": 2
    }
  ]
}
```

Để sản xuất bài mới, team edu chỉ việc:

* copy cấu trúc này,
* thay `title`, `defaultPromptText`, `image`, `audio`, `correctOptionId`.

---

### 2.4. Game flow / State

Các state chính:

* `LOADING` – load lesson + asset
* `TUTORIAL` – hướng dẫn lần đầu
* `QUESTION` – hiển thị câu + options
* `FEEDBACK` – đúng/sai + hiệu ứng
* `SUMMARY` – tổng kết bài

Pseudo-code:

```ts
async function startLesson(lessonId: string) {
  const lesson = await loadLessonPackage(lessonId);

  await preloadAssets(lesson);
  showTutorialIfFirstTime(lesson.lessonId);

  for (const item of lesson.items) {
    await playQuestion(item, lesson);
  }

  showSummary(lesson);
}

async function playQuestion(item: LessonItem, lesson: LessonPackage) {
  const promptText = item.promptText || lesson.defaultPromptText;
  const promptAudio = item.promptAudio || lesson.defaultPromptAudio;
  const mode = item.mode || lesson.defaultMode;

  renderPrompt(promptText);
  playAudio(promptAudio);
  renderOptions(item.options, mode);

  const userChoiceId = await waitForUserChoice();

  const isCorrect = userChoiceId === item.correctOptionId;
  logAnswer({ lessonId: lesson.lessonId, itemId: item.id, userChoiceId, isCorrect });

  if (isCorrect) {
    playCorrectEffect();
  } else {
    playWrongEffect();
    showHintOrAllowRetry(item, lesson);
  }
}
```

---

### 2.5. UI / Layout cơ bản

Trong 1 màn hình câu hỏi:

* **Khu vực đầu:** câu lệnh (text lớn, icon loa).
* **Giữa:** 2–4 hình (card) – layout dạng grid hoặc 2 bên trái/phải.
* **Trên/dưới:** thanh tiến trình (Câu 3/8), nút quay lại / thoát.
* **Hiệu ứng:**

  * Đúng: card nhảy nhẹ, icon sao, âm thanh “correct”.
  * Sai: card rung, âm thanh “oops”, highlight lại câu lệnh.

---

## 3. CÔNG VIỆC CỤ THỂ CHO DEV

Chia 3 mảng: **Engine**, **Data/Tool**, **Tích hợp Iruka**.

---

### 3.1. Engine / Frontend

1. **Xây Lesson Engine**

   * Hàm `startLesson(lessonId)` nhận `lessonId` từ ngoài.
   * Load `LessonPackage` tương ứng (từ file JSON hoặc API).
   * Quản lý state: loading → tutorial → loop qua các item → summary.

2. **Render câu hỏi**

   * Component `Prompt`:

     * hiện text,
     * icon loa → play audio.
   * Component `OptionCard`:

     * nhận prop: `image`, `onClick`, `isCorrect?`, `isSelected?`.
     * xử lý animation click, đúng, sai.

3. **Chấm điểm & feedback**

   * So sánh `userChoiceId` với `item.correctOptionId`.
   * Cập nhật:

     * số câu đúng
     * danh sách câu sai (để gửi backend hoặc gợi ý chơi lại).

4. **Tutorial**

   * Overlay đơn giản cho lần chơi đầu tiên (per `lessonId`):

     * Cuộn tay demo, text: “Hãy chạm vào bức tranh đúng nhé.”

5. **Summary screen**

   * Hiển thị:

     * tổng số câu, số câu đúng
     * gợi ý: “Chơi lại”, “Đi tiếp bài mới”

---

### 3.2. Data & Tooling

1. **Định nghĩa type & schema**

   * Tạo file `lessonTypes.ts` chứa:

     * `LessonConcept`, `QuestionMode`, `LessonPackage`, `LessonItem`.
   * Đảm bảo dùng chung cho FE, BE (nếu có).

2. **Loader + validator**

   * `loadLessonPackage(lessonId): Promise<LessonPackage>`
   * Validate:

     * có `lessonId`, `title`, `concept`
     * mỗi `item` có `options.length >= 2`
     * `correctOptionId` tồn tại trong `options`.

3. **(Có thể làm sau) Tool nội bộ cho content**

   * Web form đơn giản:

     * chọn concept (HEIGHT/LENGTH/...)
     * nhập prompt default
     * thêm từng câu: upload ảnh A/B, nhập value, chọn đáp án đúng
   * Export file JSON đúng format.

---

### 3.3. Tích hợp với hệ thống Iruka

1. **Nhận context từ app chính**

   * `userId`, `lessonId`, `pathwayId`, `difficultyInitial` (nếu có).

2. **Log học tập**

   * Mỗi câu log:

     * `userId`, `lessonId`, `itemId`, `isCorrect`, `attemptCount`, `timeToAnswer`.
   * Gửi về backend để:

     * phân tích năng lực,
     * điều chỉnh đường học (Pathway).

3. **Điều chỉnh độ khó (sau này)**

   * Dựa vào kết quả:

     * nếu đúng cao → lần sau ưu tiên item `difficulty` cao hơn
     * nếu sai nhiều → loop lại bài dễ, hoặc gửi gợi ý cho phụ huynh.

---

Với cấu trúc này:

* Edu/Content có thể **đóng gói từng bài học** “Cao/Thấp”, “Dài/Ngắn”, “To/Nhỏ” như một “gói sản phẩm”.
* Dev chỉ xây **1 engine** chạy được cho tất cả bài, chỉ thay data: hình + audio + value.
* Sau khi có engine, việc mở rộng bài mới gần như chỉ là công việc của team nội dung.
