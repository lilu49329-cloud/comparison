
# 🎯 Mục tiêu của hệ thống độ khó (Difficulty System)

* Không làm game khó một cách “hại não” trẻ 3–4 tuổi.
* Nhưng phải có **route từ dễ → trung bình → khó** để:

  * tạo cảm giác tiến bộ,
  * phân tầng người học,
  * giúp AI/Core chọn bài phù hợp.

Quan trọng:
**Độ khó trong game này phụ thuộc hoàn toàn vào data, không phải code game.**
Engine chỉ render.

---

# 🔥 1. Các yếu tố thay đổi độ khó (dựa trên nghiên cứu UX cho trẻ mầm non)

### **(A) Số lượng lựa chọn**

Yếu tố mạnh nhất.

| Độ khó     | Số lựa chọn | Mô tả                                   |
| ---------- | ----------- | --------------------------------------- |
| Dễ         | 2           | Bé chỉ cần so sánh nhanh 1–1            |
| Trung bình | 3           | Bé phải quét mắt nhiều hơn, phân tích   |
| Khó        | 4           | Tương tác giống game, cần tập trung cao |

→ Với trẻ mới học, 2 lựa chọn là chuẩn.
→ Trẻ giỏi hơn thì 3–4 lựa chọn là cách tăng thử thách nhanh nhất.

---

### **(B) Mức độ “khác biệt” giữa hình đúng và hình sai**

**Độ chênh value càng nhỏ → càng khó.**

Ví dụ bài “Cao hơn / Thấp hơn”:

| Value | Hình         | Ghi chú                      |
| ----- | ------------ | ---------------------------- |
| 1     | cây thấp     |                              |
| 4     | cây rất cao  | Dễ                           |
| 2     | cây hơi thấp | Khó khi so với cây value = 3 |
| 3     | cây hơi cao  |                              |

→ Ví dụ các mức:

* **Dễ:** chênh 3–4 đơn vị
  (cây rất cao vs cây rất thấp)
* **Vừa:** chênh 1–2 đơn vị
  (cây vừa cao vs cây hơi thấp)
* **Khó:** chênh nhỏ (0.5–1 đơn vị visual)
  (cây cao vs cây hơi cao)

---

### **(C) Kiểu câu hỏi (QuestionMode)**

| Mode                    | Độ khó           | Vì sao                  |
| ----------------------- | ---------------- | ----------------------- |
| BINARY_PICK (2 hình)    | dễ nhất          | bé chỉ so sánh 1 cặp    |
| MAX_IN_GROUP (3–4 hình) | trung bình → khó | phải scan nhiều hình    |
| MIN_IN_GROUP            | tương tự MAX     | yêu cầu đảo chiều logic |

→ Chỉ cần đổi `mode` là độ thử thách tăng rõ rệt.

---

### **(D) Độ phức tạp hình ảnh**

Cũng là yếu tố quan trọng:

* Hình đơn giản, 1 màu → **dễ**
* Hình có nhiều chi tiết, màu sắc tương đồng → **khó**
* Hình giống nhau về hình dạng, chỉ khác chút về kích thước → **rất khó**

→ Ví dụ bài “to hơn / nhỏ hơn”:

* Dễ: quả bóng nhỏ vs quả bóng rất to
* Khó: hai chú gấu giống hệt nhau, chỉ khác 15–20% kích thước

---

### **(E) Câu lệnh**

* Ngắn – rõ ràng → dễ
* Dài – nhiều bước yêu cầu → khó

Ví dụ:

* Dễ: “Chọn cây cao hơn.”
* Khó (level cao): “Chọn **ngôi nhà cao hơn** nằm **bên trái**.”

(Đây là dạng multi-condition cho trẻ lớn hơn.)

---

# 🔥 2. Đề xuất hệ thống độ khó 1–5 cấp

Để Iruka team dễ áp dụng vào JSON, đề xuất chuẩn hoá như sau:

---

### **Level 1 — Rất dễ**

* 2 lựa chọn
* Hình khác nhau rõ rệt
* Lời gọi ý đơn giản
* Không có điều kiện phụ (ví dụ không có “bên trái/bên phải”)

Dùng cho trẻ 3–4 tuổi mới làm quen.

---

### **Level 2 — Dễ**

* 2 lựa chọn
* Chênh lệch vừa phải
* Hình vẫn rõ ràng
* Có thể đổi loại vật (cây → nhà → thú)

---

### **Level 3 — Trung bình**

* 3 lựa chọn
* Khoảng cách value nhỏ hơn
* Trẻ cần quan sát kỹ từng hình

---

### **Level 4 — Khó**

* 4 lựa chọn
* Hình giống nhau nhiều
* Chênh lệch value rất nhỏ (gần giống nhau)
* Bắt đầu có thể yêu cầu mode MAX_IN_GROUP/MIN_IN_GROUP

---

### **Level 5 — Rất khó**

* 3–4 lựa chọn
* Trẻ phải nhìn chi tiết nhỏ (ví dụ độ dài chỉ chênh 10–20%)
* Có thể kết hợp 2 điều kiện:

  * “Chọn cây **cao nhất** ở **bên phải**.”
* Hình ảnh phức tạp, nhiều chi tiết màu sắc

Dành cho trẻ 5–6 tuổi hoặc bài luyện tập nâng cao.

---

# 🔥 3. Cách dev xử lý độ khó trong engine

Bản chất về code rất đơn giản:

* Engine **không cần hiểu "độ khó" là gì**.
* Engine chỉ:

  * lấy item theo đúng JSON
  * render các options
  * xử lý click đúng/sai

**Độ khó hoàn toàn do cấu hình data chi phối**.

---

## Dev chỉ cần làm 2 thứ:

### **(1) Engine đọc đúng JSON → render thành item**

Không logic gì đặc biệt.

### **(2) Nếu muốn adaptive (tự động tăng giảm độ khó):**

* Nếu bé trả lời đúng nhiều → lấy những item có `difficulty` cao hơn.
* Nếu bé sai liên tục → ưu tiên item difficulty thấp.

Cơ chế đơn giản:

```
let currentDifficulty = lesson.defaultStartDifficulty;

if (correctCount > wrongCount + 3) → tăng difficulty  
if (wrongCount > correctCount + 2) → giảm difficulty
```

Nhưng đây là optional.
Phần core game **không cần đụng độ khó**, chỉ chạy theo data.

---

# 🔥 4. Cách team nội dung sản xuất item theo độ khó

### Mức độ khó chủ yếu thay bằng:

* thay cỡ hình
* thay số lượng lựa chọn
* thay độ tương đồng
* thay lời hướng dẫn
* thay mode

Content team chỉ cần:

* Mô tả mỗi item như:

  ```json
  { 
    "difficulty": 4,
    "mode": "MAX_IN_GROUP",
    "options": [...]
  }
  ```

→ Engine hiểu ngay.

---

# 🔥 5. Một bảng tóm tắt cho team dev & team content

| Yếu tố chỉnh khó       | Tác động mạnh? | Cách team content làm?      |
| ---------------------- | -------------- | --------------------------- |
| Số lựa chọn            | Rất mạnh       | 2 → 3 → 4                   |
| Độ chênh value         | Rất mạnh       | value 1 vs 5 → value 2 vs 3 |
| Mode                   | Mạnh           | BINARY → MAX/MIN            |
| Độ phức tạp hình       | Vừa            | Hình nhiều chi tiết         |
| Độ dài câu lệnh        | Nhẹ – vừa      | thêm vị trí, điều kiện      |
| Màu sắc, độ tương đồng | Trung bình     | hình gần giống nhau         |

---

# ✨ Tóm lại

**Độ khó trong game “so sánh – chọn đúng” không phải thứ để code trong engine.
Nó là thứ để *thiết kế qua data* và engine chỉ render.**

Nó tăng/giảm dựa trên 6 yếu tố:

1. Số lựa chọn (2 → 4)
2. Chênh lệch value (dễ → khó)
3. Mode (binary → max/min group)
4. Độ phức tạp hình ảnh
5. Độ tương đồng hình
6. Câu lệnh 1 bước → 2 bước

Engine chỉ cần đọc JSON và render theo config, không có logic phức tạp nào khác.

---

