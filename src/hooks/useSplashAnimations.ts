
import { useState, useCallback } from 'react';

interface SplashState {
  isVisible: boolean;
  type: 'gift' | 'shortcut' | 'detour' | 'rug';
  value: number;
}

export const useSplashAnimations = () => {
  const [splash, setSplash] = useState<SplashState>({
    isVisible: false,
    type: 'gift',
    value: 0
  });

  const showSplash = useCallback((type: 'gift' | 'shortcut' | 'detour' | 'rug', value: number) => {
    setSplash({ isVisible: true, type, value });
  }, []);

  const hideSplash = useCallback(() => {
    setSplash(prev => ({ ...prev, isVisible: false }));
  }, []);

  const triggerGiftSplash = useCallback((points: number) => {
    showSplash('gift', points);
  }, [showSplash]);

  const triggerDetourSplash = useCallback((moveBack: number) => {
    showSplash('detour', moveBack);
  }, [showSplash]);

  const triggerShortcutSplash = useCallback((moveForward: number) => {
    showSplash('shortcut', moveForward);
  }, [showSplash]);

  const triggerRugSplash = useCallback(() => {
    showSplash('rug', 0);
  }, [showSplash]);

  return {
    splash,
    showSplash,
    hideSplash,
    triggerGiftSplash,
    triggerDetourSplash,
    triggerShortcutSplash,
    triggerRugSplash
  };
};
