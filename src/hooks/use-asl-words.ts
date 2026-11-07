'use client';

/**
 * ASL Words (250-class) — capture pipeline for the pretrained Gislr model.
 *
 * Uses the legacy MediaPipe Holistic solution in the browser, which
 * produces exactly the 543-landmark format the model was trained on:
 * [face 468, left_hand 21, pose 33, right_hand 21] × (x, y, z).
 *
 * The capture is user-triggered with a 3-2-1 countdown (learned from
 * field testing: an immediate window records idle frames and the model
 * confidently predicts nonsense). Landmarks leave the laptop only as
 * compact numbers to the local sign service — never video.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { predictSign, type SignResponse } from '@/lib/sign-client';

export type AslStatus =
  | 'idle'
  | 'camera-requesting'
  | 'camera-denied'
  | 'holistic-loading'
  | 'ready'
  | 'countdown'
  | 'capturing'
  | 'predicting'
  | 'unsupported';

export interface HolisticFrame {
  faceLandmarks: { x: number; y: number; z: number }[] | null;
  leftHandLandmarks: { x: number; y: number; z: number }[] | null;
  poseLandmarks: { x: number; y: number; z: number }[] | null;
  rightHandLandmarks: { x: number; y: number; z: number }[] | null;
}

/** Landmark block sizes in the Gislr column order. */
const BLOCK_SIZES = { face: 468, leftHand: 21, pose: 33, rightHand: 21 } as const;
const TOTAL_LANDMARKS = 543;

/** Pack one Holistic result into 543×3 values in the Gislr column order. */
export function packFrame(frame: HolisticFrame): Float32Array {
  const out = new Float32Array(TOTAL_LANDMARKS * 3);
  const blocks: ({ x: number; y: number; z: number }[] | null | undefined)[] = [
    frame.faceLandmarks,
    frame.leftHandLandmarks,
    frame.poseLandmarks,
    frame.rightHandLandmarks,
  ];
  const sizes = [BLOCK_SIZES.face, BLOCK_SIZES.leftHand, BLOCK_SIZES.pose, BLOCK_SIZES.rightHand];
  let offset = 0;
  for (let b = 0; b < blocks.length; b += 1) {
    const block = blocks[b];
    if (block) {
      const limit = Math.min(block.length, sizes[b]);
      for (let i = 0; i < limit; i += 1) {
        out[offset + i * 3] = block[i].x;
        out[offset + i * 3 + 1] = block[i].y;
        out[offset + i * 3 + 2] = block[i].z ?? 0;
      }
    }
    offset += sizes[b] * 3;
  }
  return out;
}

/** True when a frame has at least one non-zero hand block. */
export function frameHasHands(frame: Float32Array): boolean {
  const lhStart = BLOCK_SIZES.face * 3;
  const poseStart = (BLOCK_SIZES.face + BLOCK_SIZES.leftHand) * 3;
  const rhStart = (BLOCK_SIZES.face + BLOCK_SIZES.leftHand + BLOCK_SIZES.pose) * 3;
  const nonZero = (start: number, end: number) => {
    for (let i = start; i < end; i += 1) if (frame[i] !== 0) return true;
    return false;
  };
  return nonZero(lhStart, poseStart) || nonZero(rhStart, rhStart + BLOCK_SIZES.rightHand * 3);
}

export const CAPTURE_SECONDS = 2;
export const SAMPLE_HZ = 15;

export interface UseAslWordsResult {
  status: AslStatus;
  errorMessage: string | null;
  countdown: number | null;
  captureProgress: number;
  framesCaptured: number;
  /** Callback ref — attach to your <video> element. */
  attachVideo: (el: HTMLVideoElement | null) => void;
  beginCapture: () => void;
  start: () => Promise<void>;
  stop: () => void;
}

export function useAslWords(onResult: (res: SignResponse) => void): UseAslWordsResult {
  const [status, setStatus] = useState<AslStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [framesCaptured, setFramesCaptured] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const holisticRef = useRef< HolisticLike | null>(null);
  const framesRef = useRef<Float32Array[]>([]);
  const capturingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastSampleRef = useRef(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    capturingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    holisticRef.current?.close?.();
    holisticRef.current = null;
    framesRef.current = [];
    setStatus('idle');
    setCountdown(null);
    setCaptureProgress(0);
    setFramesCaptured(0);
  }, []);

  const loop = useCallback(function aslLoop() {
    const video = videoRef.current;
    const holistic = holisticRef.current;
    if (!video || !holistic) return;
    if (video.readyState >= 2) {
      const now = performance.now();
      const interval = 1000 / SAMPLE_HZ;
      if (capturingRef.current && now - lastSampleRef.current >= interval) {
        lastSampleRef.current = now;
        try {
          holistic.send({ image: video });
        } catch {
          // transient
        }
      } else if (!capturingRef.current && now - lastSampleRef.current >= 100) {
        // keep the preview lively without recording frames
        lastSampleRef.current = now;
        try {
          holistic.send({ image: video });
        } catch {
          // transient
        }
      }
    }
    rafRef.current = requestAnimationFrame(aslLoop);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
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
      setStatus('camera-denied');
      setErrorMessage(
        name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera access in your browser settings, or type in the shared workspace instead.'
          : 'The camera could not be started. You can still use the shared workspace.',
      );
      return;
    }

    try {
      setStatus('holistic-loading');
      const { Holistic } = await import('@mediapipe/holistic');
      const holistic = new Holistic({
        locateFile: (file: string) => `/mediapipe/holistic/${file}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true,
      });
      holistic.onResults((results: HolisticFrame) => {
        if (!capturingRef.current) return;
        const packed = packFrame(results);
        framesRef.current.push(packed);
        setFramesCaptured(framesRef.current.length);
      });
      await holistic.initialize?.();
      holisticRef.current = holistic;
      setStatus('ready');
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setStatus('camera-denied');
      setErrorMessage('The landmark model failed to load. Refresh the page and try again.');
    }
  }, [loop]);

  const beginCapture = useCallback(() => {
    if (status !== 'ready' || capturingRef.current) return;
    setStatus('countdown');
    let count = 3;
    setCountdown(count);
    const tick = setInterval(() => {
      count -= 1;
      setCountdown(count > 0 ? count : null);
      if (count > 0) return;
      clearInterval(tick);

      // GO: capture window opens.
      framesRef.current = [];
      setFramesCaptured(0);
      capturingRef.current = true;
      setStatus('capturing');
      const startedAt = performance.now();
      const captureTick = setInterval(() => {
        const elapsed = performance.now() - startedAt;
        setCaptureProgress(Math.min(1, elapsed / (CAPTURE_SECONDS * 1000)));
        if (elapsed < CAPTURE_SECONDS * 1000) return;
        clearInterval(captureTick);
        capturingRef.current = false;
        setStatus('predicting');
        submit();
      }, 100);
    }, 1000);

    const submit = () => {
      const frames = framesRef.current;
      const withHands = frames.filter((f) => frameHasHands(f));
      if (frames.length === 0 || withHands.length === 0) {
        onResultRef.current({
          status: 'no_hand',
          message: 'No hand was visible during the capture window. Make sure your hands are in frame after GO.',
          latencyMs: 0,
        });
        framesRef.current = [];
        setCaptureProgress(0);
        setStatus('ready');
        return;
      }
      const total = new Float32Array(frames.length * 543 * 3);
      frames.forEach((f, i) => total.set(f, i * 543 * 3));
      const t0 = performance.now();
      predictSign({ landmarks: Array.from(total), frames: frames.length }).then((res) => {
        const latency = Math.round(performance.now() - t0);
        onResultRef.current(res.status === 'ok' || res.status === 'no_match'
          ? { ...res, latencyMs: res.latencyMs || latency }
          : res);
        framesRef.current = [];
        setCaptureProgress(0);
        setStatus('ready');
      });
    };
  }, [status]);

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
    countdown,
    captureProgress,
    framesCaptured,
    attachVideo,
    beginCapture,
    start,
    stop,
  };
}

/* Minimal structural typing for the dynamically imported Holistic. */
interface HolisticLike {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (cb: (results: HolisticFrame) => void) => void;
  send: (input: { image: HTMLVideoElement }) => void;
  initialize?: () => Promise<void>;
  close?: () => void;
}
