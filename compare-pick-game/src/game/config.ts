import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { LessonScene } from './scenes/LessonScene';
import { SummaryScene } from './scenes/SummaryScene';
import { LessonSelectScene } from './scenes/LessonSelectScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    scene: [
        BootScene,
        PreloadScene,
        LessonScene,
        SummaryScene,
        LessonSelectScene,
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        pixelArt: false,
        antialias: true,
        transparent: true,
    },
};
