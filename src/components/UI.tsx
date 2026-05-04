import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Volume2, VolumeX, Rocket, ArrowLeftRight, X, Play } from 'lucide-react';
import { useSound } from '../context/SoundContext';
import { ScoreEntry } from '../App';

interface UIProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER';
  score: number;
  highScore: number;
  history: ScoreEntry[];
  showHighScores: boolean;
  showButtons: boolean;
  onStart: () => void;
  onToggleHighScores: () => void;
}

export const UI: React.FC<UIProps> = ({ 
  gameState, 
  score, 
  highScore, 
  history,
  showHighScores,
  showButtons,
  onStart, 
  onToggleHighScores 
}) => {
  const { isMuted, toggleMute } = useSound();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 sm:p-10 z-10">
      {/* Top Bar - HUD */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-1">
          <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl flex items-end gap-3">
            <div className="flex flex-col">
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Distance</span>
              <span className="text-4xl font-black text-white tabular-nums leading-none tracking-tight">{score}km</span>
            </div>
            {score > 0 && score >= highScore && gameState !== 'START' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="bg-amber-500 text-[10px] font-black px-2 py-1 rounded text-slate-950 uppercase"
              >
                Record
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <div className="flex gap-2">
             <button 
              onClick={toggleMute}
              className="w-12 h-12 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <button
              onClick={onToggleHighScores}
              className="bg-slate-900/40 backdrop-blur-xl p-3 px-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95"
            >
              <Trophy className="text-amber-400" size={18} />
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">Max</div>
                <div className="text-xl font-black text-white leading-none mt-1">{highScore}km</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Center Modals */}
      <AnimatePresence mode="wait">
        {showHighScores && (
          <motion.div
            key="highscore-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center p-6 z-50 pointer-events-auto bg-slate-950/40 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
              <button 
                onClick={onToggleHighScores}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                  <Trophy className="text-amber-500" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Space Legends</h2>
              </div>

              <div className="space-y-3">
                {history.length > 0 ? (
                  history.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-black ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                          #0{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{entry.date}</span>
                      </div>
                      <span className="text-xl font-black text-white">{entry.score}km</span>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-slate-500 font-medium">No flight data found. Launch now!</div>
                )}
              </div>

              {gameState !== 'PLAYING' && (
                <button
                  onClick={onStart}
                  className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  INITIATE LAUNCH
                </button>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'START' && !showHighScores && (
          <motion.div 
            key="start-screen"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="bg-slate-950/60 backdrop-blur-2xl p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center text-center max-w-sm pointer-events-auto"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-12 group-hover:rotate-0 transition-transform">
                <Rocket className="text-white" size={48} />
              </div>
            </div>
            
            <h1 className="text-4xl font-black mb-3 tracking-tighter text-white uppercase leading-tight">
              KAOTIK<br/><span className="text-blue-500 text-5xl">SPACE RUSH</span>
            </h1>
            
            <p className="text-slate-400 mb-10 text-sm font-medium leading-relaxed max-w-[220px]">
              Defy gravity, dodge meteors, and reach the edge of the galaxy!
            </p>

            <button 
              onClick={onStart}
              className="group relative w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-xl uppercase"
            >
              Launch Mission
            </button>
            
            <div className="mt-6 flex flex-col items-center gap-3 text-slate-500">
              <div className="flex items-center gap-1.5 border border-white/5 bg-white/5 px-3 py-1.5 rounded-full">
                <ArrowLeftRight size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Move: Arrows / WASD</span>
              </div>
              <div className="flex items-center gap-1.5 border border-white/5 bg-white/5 px-3 py-1.5 rounded-full">
                <span className="text-[10px] font-bold uppercase tracking-wider">Jump: Space / W</span>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && !showHighScores && (
          <motion.div 
            key="gameover-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-6 z-50 pointer-events-none bg-slate-950/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-slate-900/90 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col items-center text-center max-w-sm w-full pointer-events-auto"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                <RotateCcw className="text-red-500 animate-[spin_4s_linear_infinite]" size={32} />
              </div>

              <div className="text-red-500 font-black tracking-[0.3em] text-[10px] mb-2 uppercase">Mission Failed</div>
              <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Distance Reached</div>
              <div className="text-7xl font-black text-white mb-10 tabular-nums tracking-tighter drop-shadow-2xl">
                {score}<span className="text-3xl ml-1 text-slate-500">km</span>
              </div>
              
              <div className="flex flex-col w-full gap-4">
                <button 
                  onClick={onStart}
                  className="group relative flex items-center justify-center gap-3 w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg transition-all hover:scale-[1.05] active:scale-95 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)]"
                >
                  <Play className="fill-current" size={20} />
                  RETRY MISSION
                </button>
                
                <button 
                  onClick={onToggleHighScores}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl font-black transition-all hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <Trophy size={18} className="text-amber-400" />
                  LEADERBOARD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch Area Indicator for Mobile */}
      <AnimatePresence>
        {gameState === 'PLAYING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex justify-between mb-10 px-10 pointer-events-none"
          >
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">\\\\u2190 Thrusters Left</p>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Thrusters Right \\\\u2192</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};