import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../game/MainScene';
import { useSound } from '../context/SoundContext';

interface PhaserGameProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER';
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onShowButtons: () => void;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({ 
  gameState, 
  onGameOver, 
  onScoreUpdate,
  onShowButtons
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { playSound } = useSound();

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: containerRef.current,
      backgroundColor: '#020617',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Communication bridge
    game.events.on('GAME_OVER', (score: number) => {
      onGameOver(score);
      playSound('hit');
    });

    game.events.on('SHOW_BUTTONS', () => {
      onShowButtons();
    });

    game.events.on('SCORE_UP', (score: number) => {
      onScoreUpdate(score);
      if (score > 0 && score % 50 === 0) playSound('score');
    });

    game.events.on('PLAYER_JUMP', () => {
      playSound('jump');
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene;
    if (scene) {
      if (gameState === 'PLAYING') {
        scene.startGame();
        playSound('start');
      } else if (gameState === 'START') {
        scene.stopGame();
      }
    }
  }, [gameState, playSound]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />;
};