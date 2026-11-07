'use client';

/**
 * Live captions via the Web Speech API.
 *
 * Support varies by browser (Chrome/Edge: yes, Firefox: no). The hook
 * reports honest capability and error states, and never discards text
 * already captured when an error occurs.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/* Minimal typings for the vendor-prefixed Web Speech API. */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

export const CAPTIONS_SUPPORT = {
  get supported(): boolean {
    return getRecognitionCtor() !== null;
  },
};

export type CaptionsError =
  | 'unsupported'
  | 'not-allowed'
  | 'no-mic'
  | 'network'
  | 'aborted'
  | 'unknown';

export interface UseCaptionsResult {
  supported: boolean;
  listening: boolean;
  finalText: string;
  interimText: string;
  error: CaptionsError | null;
  errorMessage: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const ERROR_MESSAGES: Record<CaptionsError, string> = {
  unsupported: 'This browser does not support the Web Speech API. Live captions need Chrome or Edge.',
  'not-allowed': 'Microphone access was denied. Allow microphone access in your browser settings and try again.',
  'no-mic': 'No microphone was found. Connect a microphone and try again.',
  network: 'The speech service could not be reached. Check your internet connection — browser speech recognition needs network access.',
  aborted: 'Listening was interrupted. Press Start listening to continue.',
  unknown: 'Speech recognition stopped unexpectedly. Your transcript is safe — press Start listening to continue.',
};

export function useCaptions(language: string): UseCaptionsResult {
  const [supported] = useState<boolean>(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<CaptionsError | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('unsupported');
      return;
    }
    setError(null);
    wantListeningRef.current = true;
    try {
      recognitionRef.current?.abort();
    } catch {
      // Not started yet — fine.
    }
    const rec = new Ctor();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (final) setFinalText((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
      setInterimText(interim.trim());
    };
    rec.onerror = (event) => {
      const map: Record<string, CaptionsError> = {
        'not-allowed': 'not-allowed',
        'service-not-allowed': 'not-allowed',
        'audio-capture': 'no-mic',
        network: 'network',
        aborted: 'aborted',
        'no-speech': 'unknown',
      };
      setError(map[event.error] ?? 'unknown');
    };
    rec.onend = () => {
      setListening(false);
      setInterimText('');
      // Chrome ends the session periodically; restart if the user still wants to listen.
      if (wantListeningRef.current) {
        try {
          rec.start();
          return;
        } catch {
          // fallthrough — surface the aborted state
        }
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('unknown');
    }
  }, [language]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped.
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setFinalText('');
    setInterimText('');
    setError(null);
  }, []);

  return {
    supported,
    listening,
    finalText,
    interimText,
    error,
    errorMessage: error ? ERROR_MESSAGES[error] : null,
    start,
    stop,
    reset,
  };
}
