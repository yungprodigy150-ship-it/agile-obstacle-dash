import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (key: 'jump' | 'hit' | 'score' | 'start') => void;
  initAudio: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('game_muted') === 'true';
  });

  const soundsRef = useRef<Record<string, Howl>>({});
  const bgmRef = useRef<Howl | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Load SFX
    soundsRef.current = {
      jump: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], volume: 0.3 }),
      hit: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'], volume: 0.4 }),
      score: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2583/2583-preview.mp3'], volume: 0.2 }),
      start: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.4 }),
    };

    // Load BGM
    bgmRef.current = new Howl({
      src: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'],
      loop: true,
      volume: 0.15,
      autoplay: false,
      html5: true,
    });

    return () => {
      Object.values(soundsRef.current).forEach(s => s.unload());
      bgmRef.current?.unload();
    };
  }, []);

  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    if (isMuted) {
      bgm.mute(true);
      Object.values(soundsRef.current).forEach(s => s.mute(true));
    } else {
      bgm.mute(false);
      Object.values(soundsRef.current).forEach(s => s.mute(false));
      if (initialized.current && !bgm.playing()) {
        bgm.play();
      }
    }
    localStorage.setItem('game_muted', isMuted.toString());
  }, [isMuted]);

  const initAudio = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!isMuted && bgmRef.current && !bgmRef.current.playing()) {
      bgmRef.current.play();
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (isMuted && !initialized.current) {
        initAudio();
    }
  }, [isMuted, initAudio]);

  const playSound = useCallback((key: 'jump' | 'hit' | 'score' | 'start') => {
    const sound = soundsRef.current[key];
    if (sound && !isMuted) {
      sound.play();
    }
  }, [isMuted]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound, initAudio }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within a SoundProvider');
  return context;
};