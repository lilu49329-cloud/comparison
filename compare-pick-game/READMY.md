
Bối cảnh:

* Tech: **Vite + TypeScript + Phaser 3**
* Game: **So sánh – Chọn đúng**, dạng **data-driven theo từng bài học (lesson)**.

---

## Giai đoạn 1 – Định hình kiến trúc & phạm vi

1. Xác định **đơn vị chính** của game:

   * 1 “bài học” (lesson) = 1 khái niệm:

     * Ví dụ: `Cao hơn / Thấp hơn`, `Dài hơn / Ngắn hơn`, `To hơn / Nhỏ hơn`, `Rộng hơn / Hẹp hơn`.
   * Mỗi lesson chứa nhiều “câu hỏi” (item), mỗi item là 1 màn chọn hình đúng.

2. Chốt **flow tổng thể**:

   * Mở game → chọn bài (hoặc nhận `lessonId` từ bên ngoài hệ thống).
   * Load data bài học + asset.
   * Vào màn chơi:

     * Hiện câu lệnh + hình → bé chọn.
     * Đúng → hiệu ứng + sang câu tiếp theo.
     * Sai → hiệu ứng nhẹ, cho chọn lại.
   * Hết các câu → màn hình tổng kết.

3. Định **cách lưu data bài học**:

   * Mỗi bài là 1 file config (JSON chẳng hạn).
   * Không hard-code hình ảnh / câu hỏi trong code.
   * Việc “sản xuất hàng loạt” = tạo thêm file bài mới + thêm asset.

---

## Giai đoạn 2 – Thiết kế cấu trúc dữ liệu

Mục tiêu: bạn hiểu rõ “1 lesson” và “1 item” trông như thế nào, để sau này code bám vào.

1. Thiết kế **LessonConcept** (logic khái niệm):

   * HEIGHT (cao/thấp)
   * LENGTH (dài/ngắn)
   * SIZE (to/nhỏ)
   * WIDTH (rộng/hẹp)
   * QUANTITY (nhiều/ít – làm sau cũng được)

2. Thiết kế **QuestionMode** (cách ra câu hỏi):

   * BINARY_PICK: 2 hình, chọn 1 hình đúng.
   * MAX_IN_GROUP: 3–4 hình, chọn “cao nhất”, “dài nhất”…
   * MIN_IN_GROUP: 3–4 hình, chọn “nhỏ nhất”, “thấp nhất”...

3. Thiết kế cấu trúc **LessonPackage** (1 bài học):

   * Thông tin chung: `lessonId`, `title`, `concept`.
   * Cấu hình mặc định:

     * Mode mặc định (thường là BINARY_PICK).
     * Câu lệnh chung (defaultPromptText).
     * Audio chung (defaultPromptAudio).
   * Danh sách câu hỏi (`items`).

4. Thiết kế cấu trúc **LessonItem** (1 câu hỏi):

   * `id` riêng từng câu.
   * Câu lệnh riêng (nếu không dùng mặc định): `promptText`, `promptAudio`.
   * Mode riêng (nếu không dùng defaultMode).
   * Danh sách lựa chọn:

     * Mỗi option có `id`, đường dẫn hình, (có thể có label), giá trị `value` (để so sánh).
   * `correctOptionId` để biết đáp án đúng.
   * `difficulty` để sau này phân cấp độ khó.

5. Thiết kế **Option**:

   * Đảm bảo mỗi option:

     * Biết dùng hình nào.
     * Có 1 “giá trị số” (cao hơn = value lớn hơn, dài hơn = value lớn hơn…).

---

## Giai đoạn 3 – Thiết kế scene & flow trong Phaser

Game của bạn sẽ xoay quanh một số scene chính:

1. **BootScene**:

   * Nhiệm vụ:

     * Nhận `lessonId` (tạm thời có thể hard-code, sau này đọc từ ngoài).
     * Chuyển sang PreloadScene và truyền `lessonId` theo.

2. **PreloadScene**:

   * Nhiệm vụ:

     * Dựa vào `lessonId`, load file JSON bài học tương ứng.
     * Đọc nội dung JSON:

       * Duyệt tất cả `items` → gom lại danh sách hình & audio cần load.
     * Load tất cả asset (hình, âm thanh) của bài.
     * Khi xong → chuyển sang LessonScene, kèm object `lesson`.

3. **LessonScene** (core gameplay):

   * Nhiệm vụ:

     * Nhận `lesson` từ PreloadScene.
     * Quản lý trạng thái:

       * Chỉ số câu hiện tại (index).
       * Điểm số, số câu đúng.
       * Trạng thái “đang cho phép click hay đã khóa”.
     * Vòng đời mỗi câu:

       * Lấy `LessonItem` hiện tại.
       * Hiện câu lệnh (text + nút audio).
       * Hiện các hình lựa chọn, set lên màn hình.
       * Chờ bé chạm vào 1 hình:

         * So sánh với `correctOptionId`.
         * Nếu đúng:

           * Tăng score.
           * Phát hiệu ứng + chuyển sang câu tiếp theo.
         * Nếu sai:

           * Phát hiệu ứng sai (rung hình, âm thanh nhẹ).
           * Cho chọn lại (hoặc tùy logic config).
     * Khi hết danh sách `items` → chuyển sang SummaryScene.

4. **SummaryScene**:

   * Nhiệm vụ:

     * Nhận thông tin kết quả: `lessonId`, số câu đúng, tổng số câu.
     * Hiển thị:

       * Lời khen, kết quả.
       * Các nút: “Chơi lại”, “Thoát” hoặc “Tiếp tục bài khác”.
     * Gọi lại BootScene hoặc báo ra ngoài app (tùy cách bạn embed).

---

## Giai đoạn 4 – Thiết kế UI/UX trên canvas

Trước khi code, hình dung bố cục:

1. **Màn câu hỏi (LessonScene)**:

   * Trên cùng:

     * Câu lệnh (chữ lớn, dễ đọc).
     * Icon loa: bấm vào để nghe lại lời đọc.
   * Giữa màn:

     * 2–4 hình, sắp xếp:

       * Với 2 hình: trái – phải.
       * Với 3–4 hình: dạng grid.
   * Dưới hoặc trên góc:

     * Thanh tiến trình: “Câu 3/8”.
     * Có thể thêm icon nhỏ thể hiện concept (ví dụ icon cái thước cho bài “dài/ngắn”).

2. **Feedback**:

   * Khi đúng:

     * Hình được chọn lớn lên/nhún, có hiệu ứng sao, âm thanh vui.
   * Khi sai:

     * Hình rung nhẹ, âm thanh “oops”, không quá nặng nề.
   * Không nên dùng pop-up che hết màn hình.

3. **SummaryScene**:

   * Text tổng kết rõ ràng: “Con đã trả lời đúng X/Y câu”.
   * Một nút “Chơi lại bài này”.
   * Có thể để thêm nút (sau này) “Sang bài mới”.

---

## Giai đoạn 5 – Thiết kế logic chơi & điều khiển

1. **Quy luật khi click**:

   * Chỉ cho click khi không đang chạy animation / không khóa input.
   * Mỗi lần click:

     * Đọc optionId tương ứng.
     * So sánh với correctOptionId của item.
     * Phát feedback tương ứng.

2. **Retry khi sai**:

   * Quyết định:

     * Cho chọn lại vô hạn?
     * Hay cho sai 1–2 lần rồi tự highlight đáp án đúng?
   * Thiết kế sẵn để sau này cấu hình qua data (nếu muốn).

3. **Kết thúc câu**:

   * Sau hiệu ứng đúng:

     * Tự chuyển sang câu tiếp theo sau một khoảng thời gian ngắn.
   * Nếu là câu cuối:

     * Chuyển sang SummaryScene.

---

## Giai đoạn 6 – Thiết kế pipeline data & asset

1. **Quy ước đặt file**:

   * Ví dụ:

     * Bài học: `public/lessons/height_basic_01.json`.
     * Hình: `public/assets/height/...`.
     * Audio: `public/audio/height/...`.

2. **Workflow cho team nội dung (sau này)**:

   * Tạo bài mới:

     * Copy 1 JSON template.
     * Đổi `lessonId`, `title`, `concept`.
     * Thêm `items`:

       * set đúng đường dẫn hình.
       * set đúng `correctOptionId`.
       * nếu cần, đặt `promptText`, `promptAudio` riêng.
   * Không cần động tới code.

3. **Chiến lược load asset**:

   * PreloadScene:

     * Load file JSON bài học.
     * Duyệt tất cả items, gom danh sách hình & audio.
     * Load tất cả trước khi vào LessonScene.

---

## Giai đoạn 7 – Thiết kế tracking & tích hợp

1. **Quyết định muốn log gì**:

   * Per câu:

     * lessonId
     * itemId
     * option đã chọn
     * đúng/sai
     * thời gian trả lời
   * Per session:

     * tổng số câu
     * tổng số đúng
     * tỉ lệ đúng

2. **Thiết kế điểm hook trong gameplay**:

   * Khi bé click, biết là event `answer_submitted`.
   * Khi kết thúc bài, emit event `lesson_completed`.

3. **Cách gửi log**:

   * Tùy hệ thống backend Iruka:

     * Gửi mỗi câu (real-time).
     * Hoặc gom lại, gửi khi kết thúc.

---

## Giai đoạn 8 – Nâng cấp dần (sau khi bản cơ bản chạy)

Khi đã làm xong bản base, bạn có thể lần lượt thêm:

1. **Difficulties / level**:

   * Dựa vào `difficulty` trong item để:

     * Tạo bài “dễ – trung bình – khó” từ cùng 1 concept.
     * Hoặc filter item theo độ khó.

2. **Nhiều mode hơn**:

   * Thay vì chỉ BINARY_PICK, thêm bài có 3–4 hình:

     * Chọn cao nhất / thấp nhất…

3. **Animation & polish**:

   * Thêm chuyển cảnh mềm mượt giữa câu / scene.
   * Thêm hình nền, khung card đẹp hơn.

4. **Chọn bài từ menu**:

   * Làm thêm 1 scene menu:

     * Danh sách bài học (height, length, size…)
     * Chọn bài → truyền `lessonId` vào BootScene.

---

## Tóm tắt ngắn gọn lộ trình

1. Chốt kiến trúc: lesson-driven, mỗi bài là 1 file config.
2. Thiết kế cấu trúc dữ liệu: LessonPackage, LessonItem, Option, Concept, Mode.
3. Thiết kế scene & flow: Boot → Preload → Lesson → Summary.
4. Thiết kế UI/UX từng màn (nhất là LessonScene).
5. Thiết kế logic gameplay: hiển thị, click, feedback, chuyển câu, kết thúc.
6. Thiết kế pipeline asset & data để sản xuất bài hàng loạt.
7. Thiết kế hook tracking để gắn với hệ thống Iruka.
8. Sau khi bản cơ bản chạy: nâng dần level, hiệu ứng, menu, adaptive.

Khi bạn bắt đầu code theo lộ trình này, chỉ cần đi lần lượt từ “khung scene + data” rồi mới thêm dần chi tiết, game sẽ lên rất sạch và dễ mở rộng.
