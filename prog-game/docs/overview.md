# 🐸 Frog Jump Game

## 🎮 Giới thiệu

**Frog Jump Game** là một mini game 2D được xây dựng bằng **Phaser 3**, nơi người chơi điều khiển một chú ếch nhảy qua những chiếc lá sen trôi trên dòng sông.  
Mục tiêu là **nhảy vào các lá có chứa các chữ số ví dụ “1”, “2”, ...** để thu thập điểm và nghe âm thanh tương ứng. Khi người chơi **ăn được 20 lá chứa chữ số**, một **cổng chào chiến thắng** sẽ xuất hiện.

---

## 🌿 Gameplay chính

- Người chơi điều khiển **chú ếch** bằng thao tác **click phím (trên máy tính) hoặc thao tác bằng tay (trên điện thoại)** để nhảy sang lá sen tiếp theo.
- Mỗi lá sen có thể chứa:
  - Các chữ số `1` → thu điểm và phát âm thanh.
  - Lá trống → chỉ dùng để di chuyển.
- Map chạy **dài vô tận** (hiệu ứng cuộn ngang).
- Khi thu thập đủ 20 điểm → xuất hiện **cổng chào kết thúc**.

---

## 🗺️ Cấu trúc scene

| Scene        | Chức năng                                            |
| ------------ | ---------------------------------------------------- |
| `IntroScene` | Màn giới thiệu logo hoặc hiệu ứng mở đầu             |
| `MainMenu`   | Giao diện chính, có nút “Play”, “Exit”               |
| `MapScene`   | Cảnh nền: dòng sông, hai bờ cỏ, hiệu ứng chạy vô tận |
| `GameScene`  | Gameplay chính: ếch, lá sen, âm thanh, điểm số       |

---

## ⚙️ Công nghệ sử dụng

- **Phaser 3** → Xử lý logic game, vật lý, render 2D
- **React** → Giao diện và container hiển thị game
- **TailwindCSS** → Styling nhẹ nhàng, responsive
- **Sound assets (.mp3 / .wav)** → Âm thanh cho số và hiệu ứng

---

## 💡 Hướng phát triển

- Thêm **điểm số cao nhất (high score)**
- Hệ thống **vật phẩm đặc biệt** (như lá sen vàng)
- Hiệu ứng **thời tiết / ngày đêm** để tăng sinh động
- Triển khai lên web hoặc PWA để chơi trực tiếp trên điện thoại
