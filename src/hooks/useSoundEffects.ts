
import { useCallback } from 'react';

export const useSoundEffects = (isMuted: boolean) => {
  const playSound = useCallback((soundType: string) => {
    if (isMuted) return;
    
    // Create audio context for web audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    switch (soundType) {
      case 'start':
        playTone(440, 0.5);
        setTimeout(() => playTone(554, 0.5), 200);
        break;
      case 'diceRoll':
        for (let i = 0; i < 5; i++) {
          setTimeout(() => playTone(200 + Math.random() * 100, 0.1, 'square'), i * 50);
        }
        break;
      case 'move':
        playTone(300, 0.2, 'triangle');
        break;
      case 'gift':
        playTone(523, 0.3);
        setTimeout(() => playTone(659, 0.3), 150);
        setTimeout(() => playTone(784, 0.4), 300);
        break;
      case 'detourTrap':
        playTone(150, 0.8, 'sawtooth');
        break;
      case 'win':
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, index) => {
          setTimeout(() => playTone(note, 0.5), index * 200);
        });
        break;
      default:
        break;
    }
  }, [isMuted]);

  return { playSound };
};
