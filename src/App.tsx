import React, { useState, useEffect, useCallback } from 'react';
import { PhaserGame } from './components/PhaserGame';
import { UI } from './components/UI';
import { SoundProvider, useSound } from './context/SoundContext';

export interface ScoreEntry {
  score: number;
  date: string;
}

function AppContent() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [showHighScores, setShowHighScores] = useState(false);
  const [showGameOverButtons, setShowGameOverButtons] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  
  useEffect(() => {
    document.title = "KAOTIK SPACE RUSH";
  }, []);

  const [history, setHistory] = useState<ScoreEntry[]>(() => {
    const saved = localStorage.getItem('kaotik_space_rush_history');
    return saved ? JSON.parse(saved) : [];
  });

  const highScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0;

  const { initAudio } = useSound();

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    
    setHistory(prev => {
      const newEntry: ScoreEntry = {
        score: finalScore,
        date: new Date().toLocaleDateString()
      };
      const updated = [...prev, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      localStorage.setItem('kaotik_space_rush_history', JSON.stringify(updated));
      return updated;
    });
    
    setGameState('GAMEOVER');
    setShowGameOverButtons(true);
  }, []);

  const handleShowButtons = useCallback(() => {
    setShowGameOverButtons(true);
  }, []);

  const startGame = useCallback(() => {
    initAudio(); 
    setGameState('PLAYING');
    setScore(0);
    setShowHighScores(false);
    setShowGameOverButtons(false);
    setRestartKey(prev => prev + 1); 
  }, [initAudio]);

  const toggleHighScores = useCallback(() => {
    setShowHighScores(prev => !prev);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden font-sans text-white select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.25),transparent)] pointer-events-none z-[1]" />
      
      <div className="absolute inset-0 z-0">
        <PhaserGame 
          gameState={gameState} 
          onGameOver={handleGameOver} 
          onScoreUpdate={setScore}
          onShowButtons={handleShowButtons}
        />
      </div>

      <UI 
        gameState={gameState} 
        score={score} 
        highScore={highScore} 
        history={history}
        showHighScores={showHighScores}
        showButtons={showGameOverButtons}
        onStart={startGame} 
        onToggleHighScores={toggleHighScores}
      />
    </div>
  );
}

function App() {
  return (
    <SoundProvider>
      <AppContent />
    </SoundProvider>
  );
}

export default App;