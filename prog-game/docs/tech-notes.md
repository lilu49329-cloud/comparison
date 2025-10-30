# ⚙️ Ghi chú kỹ thuật

## ⚡ Cấu hình Phaser

- Type: `Phaser.AUTO`
- Canvas size: 1280x720 (16:9)
- Scale: `FIT`, auto-center.
- Physics: Arcade, gravity = 0.
- Scene list: IntroScene → MainMenu → MapScene → GameScene.

## 📦 Import bất đồng bộ

- Scene được import qua `await import(...)`.
- Giúp giảm dung lượng tải ban đầu.

## 📲 Xoay màn hình

- Khi phát hiện portrait → hiển thị overlay “Vui lòng xoay ngang”.
- Có thể lock landscape khi vào fullscreen.

## 🎨 Asset

- Sprite: ếch, lá sen, các chữ số, cổng chào.
- Background: sông, cỏ hai bên.
- Âm thanh: nhạc nền + hiệu ứng điểm.
