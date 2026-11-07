'use client';

/**
 * Quick Gestures — in-browser recognition with Google's pretrained
 * MediaPipe GestureRecognizer (self-hosted model + WASM, no network).
 *
 * Lifecycle: request camera only when the user activates the feature;
 * load the model in VIDEO mode; run the loop on requestAnimationFrame;
 * report honest status (idle / model loading / running / error).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer, type GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { autoCommitPolicy, type AutoCommitResult } from '@/lib/gestures';

export type SignStatus =
  | 'idle'
  | 'camera-requesting'
  | 'model-loading'
  | 'running'
  | 'paused'
  | 'camera-denied'
  | 'model-error'
  | 'unsupported';

export interface UseSignRecognitionOptions {
  /** Called when the auto-commit policy decides a phrase is ready. */
  onAutoCommit?: (phrase: string) => void;
  /** Receive raw gesture updates for teaching UIs. */
  onUpdate?: (label: string | null, score: number) => void;
  /** Record landmark samples (Learn view). */
  sampleSink?: (landmarks: { x: number; y: number; z: number }[]) => void;
  autoCommit: boolean;
}

export interface UseSignRecognitionResult {
  status: SignStatus;
  errorMessage: string | null;
  /** Latest recognised gesture label ('None' included). */
  gestureLabel: string | null;
  gestureScore: number;
  /** Progress 0..1 of the current hold towards auto-commit. */
  holdProgress: number;
  /** Callback ref — attach to your <video> element. */
  attachVideo: (el: HTMLVideoElement | null) => void;
  start: () => Promise<void>;
  stop: () => void;
  setRecognising: (on: boolean) => void;
  recognising: boolean;
}

const MODEL_PATH = '/models/gesture_recognizer.task';
const WASM_PATH = '/wasm';

export function useSignRecognition(options: UseSignRecognitionOptions): UseSignRecognitionResult {
  const [status, setStatus] = useState<SignStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gestureLabel, setGestureLabel] = useState<string | null>(null);
  const [gestureScore, setGestureScore] = useState(0);
  const [recognising, setRecognisingState] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const recognisingRef = useRef(false);
  const commitRef = useRef<AutoCommitResult['next'] | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const loop = useCallback(function recognitionLoop() {
    const recognizer = recognizerRef.current;
    const video = videoRef.current;
    if (!recognizer || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(recognitionLoop);
      return;
    }

    if (recognisingRef.current) {
      let result: GestureRecognizerResult | null = null;
      try {
        result = recognizer.recognizeForVideo(video, performance.now());
      } catch {
        // Transient decode hiccup — keep the loop alive.
      }
      if (result && result.gestures.length > 0 && result.gestures[0].length > 0) {
        const top = result.gestures[0][0];
        const label = top.categoryName ?? 'None';
        const score = top.score ?? 0;
        setGestureLabel(label);
        setGestureScore(score);

        const next = autoCommitPolicy({
          label,
          score,
          at: performance.now(),
          last: commitRef.current,
        });
        commitRef.current = next.next;
        if (next.phrase && optionsRef.current.autoCommit) {
          optionsRef.current.onAutoCommit?.(next.phrase);
        }

        const holdMs = next.next.label === label ? performance.now() - next.next.since : 0;
        setHoldProgress(next.next.committed ? 1 : Math.min(1, holdMs / 500));
      } else {
        setGestureLabel('None');
        setGestureScore(0);
        setHoldProgress(0);
        commitRef.current = null;
      }
      if (optionsRef.current.onUpdate) {
        optionsRef.current.onUpdate(gestureLabel, gestureScore);
      }
    }

    rafRef.current = requestAnimationFrame(recognitionLoop);
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setErrorMessage('This browser does not support camera access (getUserMedia).');
      return;
    }

    try {
      setStatus('camera-requesting');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError') {
        setStatus('camera-denied');
        setErrorMessage('Camera access was denied. Allow camera access in your browser settings, or use the manual text fallback below.');
      } else if (name === 'NotFoundError') {
        setStatus('camera-denied');
        setErrorMessage('No camera was found on this device. You can still use the manual text fallback below.');
      } else {
        setStatus('camera-denied');
        setErrorMessage('The camera could not be started. You can still use the manual text fallback below.');
      }
      return;
    }

    try {
      setStatus('model-loading');
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      recognizerRef.current = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    } catch {
      // GPU delegate can fail on some machines — retry with CPU before giving up.
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        recognizerRef.current = await GestureRecognizer.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch {
        setStatus('model-error');
        setErrorMessage('The gesture model failed to load. Check your connection — first load fetches the model from this server.');
        return;
      }
    }

    runningRef.current = true;
    recognisingRef.current = true;
    setRecognisingState(true);
    setStatus('running');
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    recognisingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    recognizerRef.current?.close();
    recognizerRef.current = null;
    commitRef.current = null;
    setGestureLabel(null);
    setGestureScore(0);
    setHoldProgress(0);
    setRecognisingState(false);
    setStatus('idle');
  }, []);

  const setRecognising = useCallback((on: boolean) => {
    recognisingRef.current = on;
    setRecognisingState(on);
    if (!on) {
      setGestureLabel(null);
      setGestureScore(0);
      setHoldProgress(0);
      commitRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => undefined);
    }
  }, []);

  return {
    status,
    errorMessage,
    gestureLabel,
    gestureScore,
    holdProgress,
    attachVideo,
    start,
    stop,
    setRecognising,
    recognising,
  };
}
