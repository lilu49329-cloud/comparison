import BaseScene from './BaseScene';

export default class OverlayScene extends BaseScene {
  constructor() {
    super('OverlayScene');
  }

  create() {
    const { width, height } = this.scale;
    // Không vẽ hình nền phủ kín canvas để lộ background viewport

    this.add
      .text(width / 2, height / 2 - 80, 'So sánh số lượng 1 & 2', {
        fontSize: '32px',
        color: '#333',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 - 20,
        'Chọn bên ÍT HƠN hoặc NHIỀU HƠN,\n' +
          'rồi giúp cho hai bên bằng nhau!',
        {
          fontSize: '20px',
          color: '#555',
          align: 'center',
        }
      )
      .setOrigin(0.5);

    this.createButton(width / 2, height / 2 + 80, 'Bắt đầu', () => {
      this.scene.start('GameScene', { levelIndex: 0, score: 0 });
    });

    const bgm =
      this.sound.get('bgm_main') ??
      this.sound.add('bgm_main', { loop: true, volume: 0.5 });
    if (!bgm.isPlaying) bgm.play();
  }
}
