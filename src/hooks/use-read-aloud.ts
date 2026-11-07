'use client';

/**
 * Read Aloud via the Web Speech Synthesis API.
 * Reads the ACTUAL workspace text; exposes voice selection, rate,
 * pause/resume (feature-detected), and honest unsupported states.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export interface UseReadAloudResult {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  /** Configure the voice used by the next `speak` call. */
  setVoice: (name: string | null) => void;
  /** Configure the speech rate (0.5 – 2). */
  setRate: (rate: number) => void;
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/** Capability detection without setState-in-effect. */
const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useReadAloud(): UseReadAloudResult {
  const supported = useSyncExternalStore(
    () => () => undefined,
    speechSupported,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef(1);

  useEffect(() => {
    if (!speechSupported()) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    // Initial read on a task, then keep in sync with the voiceschanged event.
    const initial = setTimeout(load, 0);
    synth.addEventListener('voiceschanged', load);
    return () => {
      clearTimeout(initial);
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, []);

  const setVoice = useCallback((name: string | null) => {
    if (name === null) {
      voiceRef.current = null;
      return;
    }
    voiceRef.current = window.speechSynthesis?.getVoices().find((v) => v.name === name) ?? null;
  }, []);

  const setRate = useCallback((rate: number) => {
    rateRef.current = Math.min(2, Math.max(0.5, rate));
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const clean = text.trim();
    if (clean === '') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rateRef.current;
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  return { supported, speaking, paused, voices, setVoice, setRate, speak, stop, pause, resume };
}
