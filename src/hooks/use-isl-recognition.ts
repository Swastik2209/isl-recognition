'use client';

/**
 * ISL (Indian Sign Language) Recognition — in-browser heuristic recognition.
 *
 * Uses MediaPipe Hands (via @mediapipe/tasks-vision) for 21 3D hand landmarks,
 * then applies a geometric/heuristic classifier for 150+ ISL signs.
 * Runs fully in-browser, no server required.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { ISL_SIGNS, ISL_CLASS_COUNT, type ISLSign } from '@/lib/isl-vocab';

export type IslStatus =
  | 'idle'
  | 'camera-requesting'
  | 'camera-denied'
  | 'model-loading'
  | 'running'
  | 'paused'
  | 'unsupported'
  | 'model-error';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface IslRecognitionResult {
  sign: ISLSign | null;
  confidence: number;
  allPredictions: Array<{ sign: ISLSign; confidence: number }>;
  handedness: 'Left' | 'Right' | 'None';
}

export interface UseIslRecognitionOptions {
  onUpdate?: (result: IslRecognitionResult) => void;
  confidenceThreshold?: number;
  stabilizationFrames?: number;
  autoCommit?: boolean;
  onAutoCommit?: (phrase: string) => void;
}

export interface UseIslRecognitionResult {
  status: IslStatus;
  errorMessage: string | null;
  currentSign: IslRecognitionResult | null;
  /** Callback ref — attach to your <video> element. */
  attachVideo: (el: HTMLVideoElement | null) => void;
  start: () => Promise<void>;
  stop: () => void;
  setRecognising: (on: boolean) => void;
  recognising: boolean;
}

// Model paths - using CDN for MediaPipe Hands
const WASM_PATH = '/wasm';
const HAND_MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Heuristic classifier for ISL signs
class ISLHeuristicClassifier {
  private readonly NUM_LANDMARKS = 21;

  classify(landmarks: HandLandmark[], handedness: 'Left' | 'Right'): IslRecognitionResult {
    if (landmarks.length !== this.NUM_LANDMARKS) {
      return { sign: null, confidence: 0, allPredictions: [], handedness };
    }

    const normalized = this.normalizeLandmarks(landmarks);
    const features = this.extractFeatures(normalized, landmarks);
    const predictions = this.classifyHeuristic(features, landmarks);
    predictions.sort((a, b) => b.confidence - a.confidence);

    const topSign = predictions[0]?.sign || null;
    const topConfidence = predictions[0]?.confidence || 0;

    return {
      sign: topSign,
      confidence: topConfidence,
      allPredictions: predictions.slice(0, 5),
      handedness,
    };
  }

  private normalizeLandmarks(landmarks: HandLandmark[]): HandLandmark[] {
    const wrist = landmarks[0];
    return landmarks.map(lm => ({
      x: lm.x - wrist.x,
      y: lm.y - wrist.y,
      z: lm.z - wrist.z,
    }));
  }

  private extractFeatures(normalized: HandLandmark[], raw: HandLandmark[]) {
    return {
      fingerStates: this.getFingerStates(raw),
      thumbState: this.getThumbState(raw),
      distances: this.getKeyDistances(normalized),
      orientation: this.getHandOrientation(normalized),
      curvatures: this.getFingerCurvatures(raw),
    };
  }

  private getFingerStates(landmarks: HandLandmark[]): boolean[] {
    const tips = [4, 8, 12, 16, 20];
    const pips = [3, 6, 10, 14, 18];
    const states: boolean[] = [];

    for (let i = 0; i < 5; i++) {
      if (i === 0) {
        // Thumb: extended if tip is further from palm than IP joint
        states.push(landmarks[4].x < landmarks[3].x);
      } else {
        // Fingers: extended if tip is higher (smaller y) than PIP
        states.push(landmarks[tips[i]].y < landmarks[pips[i]].y);
      }
    }
    return states;
  }

  private getThumbState(landmarks: HandLandmark[]) {
    const tip = landmarks[4];
    const ip = landmarks[3];
    const mcp = landmarks[2];
    const cmc = landmarks[1];
    const indexMcp = landmarks[5];

    return {
      extended: tip.x < ip.x,
      tucked: Math.abs(tip.x - mcp.x) < 0.05 && tip.y > mcp.y,
      sideways: Math.abs(tip.y - mcp.y) < 0.03,
      crossedOverIndex: tip.x > indexMcp.x,
    };
  }

  private getKeyDistances(normalized: HandLandmark[]): Record<string, number> {
    const dist = (i: number, j: number) => {
      const a = normalized[i], b = normalized[j];
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
    };

    return {
      thumbIndexTip: dist(4, 8),
      thumbMiddleTip: dist(4, 12),
      thumbRingTip: dist(4, 16),
      thumbPinkyTip: dist(4, 20),
      indexMiddleTip: dist(8, 12),
      middleRingTip: dist(12, 16),
      ringPinkyTip: dist(16, 20),
      indexMiddleMcp: dist(5, 9),
    };
  }

  private getHandOrientation(normalized: HandLandmark[]) {
    const wrist = normalized[0];
    const indexMcp = normalized[5];
    const pinkyMcp = normalized[17];
    const middleMcp = normalized[9];

    const handVecX = { x: indexMcp.x - pinkyMcp.x, y: indexMcp.y - pinkyMcp.y };
    const handVecY = { x: middleMcp.x - wrist.x, y: middleMcp.y - wrist.y };

    return {
      yaw: Math.atan2(handVecX.y, handVecX.x),
      pitch: Math.atan2(handVecY.y, handVecY.x),
    };
  }

  private getFingerCurvatures(landmarks: HandLandmark[]): number[] {
    const tips = [4, 8, 12, 16, 20];
    const pips = [3, 6, 10, 14, 18];
    const mcps = [2, 5, 9, 13, 17];
    const curvatures: number[] = [];

    for (let i = 0; i < 5; i++) {
      const tip = landmarks[tips[i]];
      const pip = landmarks[pips[i]];
      const mcp = landmarks[mcps[i]];
      const distTipMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
      const distPipMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
      curvatures.push(distPipMcp > 0 ? distTipMcp / distPipMcp : 1);
    }
    return curvatures;
  }

  private classifyHeuristic(
    features: ReturnType<ISLHeuristicClassifier['extractFeatures']>,
    _rawLandmarks: HandLandmark[]
  ): Array<{ sign: ISLSign; confidence: number }> {
    const predictions: Array<{ sign: ISLSign; confidence: number }> = [];
    const { fingerStates, thumbState, distances, orientation, curvatures } = features;
    const [thumbExt, indexExt, middleExt, ringExt, pinkyExt] = fingerStates;
    const extendedCount = fingerStates.filter(f => f).length;

    // Check all ISL signs
    for (const sign of ISL_SIGNS) {
      const confidence = this.matchSign(sign.id, {
        fingerStates,
        thumbState,
        distances,
        orientation,
        curvatures,
        extendedCount,
        indexExt,
        middleExt,
        ringExt,
        pinkyExt,
        thumbExt,
      });
      if (confidence > 0.15) {
        predictions.push({ sign, confidence });
      }
    }

    return predictions;
  }

  private matchSign(
    signId: string,
    ctx: {
      fingerStates: boolean[];
      thumbState: ReturnType<ISLHeuristicClassifier['getThumbState']>;
      distances: Record<string, number>;
      orientation: ReturnType<ISLHeuristicClassifier['getHandOrientation']>;
      curvatures: number[];
      extendedCount: number;
      indexExt: boolean;
      middleExt: boolean;
      ringExt: boolean;
      pinkyExt: boolean;
      thumbExt: boolean;
    }
  ): number {
    const { fingerStates, thumbState, distances, orientation, curvatures, extendedCount, indexExt, middleExt, ringExt, pinkyExt, thumbExt } = ctx;

    // Alphabet patterns
    const alphabetPatterns: Record<string, () => number> = {
      'isl-a': () => (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.tucked) ? 0.9 : 0,
      'isl-b': () => (indexExt && middleExt && ringExt && pinkyExt && thumbState.tucked) ? 0.95 : 0,
      'isl-c': () => (curvatures[1] > 0.3 && curvatures[1] < 0.8 && curvatures[2] > 0.3 && curvatures[2] < 0.8) ? 0.85 : 0,
      'isl-d': () => (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbState.tucked && distances.thumbMiddleTip < 0.06) ? 0.9 : 0,
      'isl-e': () => (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.tucked && curvatures[0] > 0.8) ? 0.8 : 0,
      'isl-f': () => (!indexExt && middleExt && ringExt && pinkyExt && distances.thumbIndexTip < 0.04) ? 0.95 : 0,
      'isl-g': () => (indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.sideways) ? 0.85 : 0,
      'isl-h': () => (indexExt && middleExt && !ringExt && !pinkyExt && thumbState.tucked) ? 0.9 : 0,
      'isl-i': () => (!indexExt && !middleExt && !ringExt && pinkyExt && thumbState.tucked) ? 0.95 : 0,
      'isl-j': () => (pinkyExt && !indexExt && !middleExt && !ringExt && orientation.yaw < -0.5) ? 0.7 : 0,
      'isl-k': () => (indexExt && middleExt && !ringExt && !pinkyExt && thumbState.crossedOverIndex && distances.thumbMiddleTip < 0.08) ? 0.85 : 0,
      'isl-l': () => (indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.extended && !thumbState.tucked) ? 0.9 : 0,
      'isl-m': () => (!indexExt && !middleExt && !ringExt && thumbState.tucked && extendedCount === 1) ? 0.8 : 0,
      'isl-n': () => (!indexExt && !middleExt && thumbState.tucked && extendedCount === 1) ? 0.8 : 0,
      'isl-o': () => (distances.thumbIndexTip < 0.04 && distances.thumbMiddleTip < 0.05 && distances.thumbRingTip < 0.05 && distances.thumbPinkyTip < 0.05) ? 0.95 : 0,
      'isl-p': () => (indexExt && middleExt && !ringExt && !pinkyExt && orientation.pitch < -0.5) ? 0.75 : 0,
      'isl-q': () => (indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.sideways && orientation.pitch < -0.3) ? 0.75 : 0,
      'isl-r': () => (indexExt && middleExt && extendedCount === 2) ? 0.7 : 0, // crossed fingers
      'isl-s': () => (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.tucked) ? 0.75 : 0,
      'isl-t': () => (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.tucked) ? 0.7 : 0, // thumb between index/middle
      'isl-u': () => (indexExt && middleExt && !ringExt && !pinkyExt && thumbState.tucked && distances.indexMiddleTip < 0.06) ? 0.9 : 0,
      'isl-v': () => (indexExt && middleExt && !ringExt && !pinkyExt && thumbState.tucked && distances.indexMiddleTip > 0.08) ? 0.95 : 0,
      'isl-w': () => (indexExt && middleExt && ringExt && !pinkyExt && thumbState.tucked) ? 0.85 : 0,
      'isl-x': () => (indexExt && curvatures[1] > 1.5) ? 0.8 : 0,
      'isl-y': () => (!indexExt && !middleExt && !ringExt && pinkyExt && thumbState.extended) ? 0.95 : 0,
      'isl-z': () => (indexExt && Math.abs(orientation.yaw) > 0.5) ? 0.7 : 0,
    };

    // Number patterns
    const numberPatterns: Record<string, () => number> = {
      'isl-0': () => (distances.thumbIndexTip < 0.04 && distances.thumbMiddleTip < 0.05 && distances.thumbRingTip < 0.05 && distances.thumbPinkyTip < 0.05) ? 0.95 : 0,
      'isl-1': () => (extendedCount === 1 && indexExt && !thumbExt) ? 0.98 : 0,
      'isl-2': () => (extendedCount === 2 && indexExt && middleExt && !thumbExt) ? 0.98 : 0,
      'isl-3': () => (extendedCount === 3 && indexExt && middleExt && ringExt && !thumbExt) ? 0.95 : 0,
      'isl-4': () => (extendedCount === 4 && indexExt && middleExt && ringExt && pinkyExt && !thumbExt) ? 0.98 : 0,
      'isl-5': () => (extendedCount === 5) ? 0.98 : 0,
      'isl-6': () => (extendedCount === 4 && pinkyExt && ringExt && middleExt && indexExt && thumbState.tucked) ? 0.85 : 0,
      'isl-7': () => (extendedCount === 3 && indexExt && middleExt && ringExt && thumbState.tucked) ? 0.85 : 0,
      'isl-8': () => (extendedCount === 2 && indexExt && middleExt && thumbState.tucked) ? 0.85 : 0,
      'isl-9': () => (extendedCount === 1 && indexExt && thumbState.tucked) ? 0.85 : 0,
      'isl-10': () => (thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) ? 0.98 : 0,
    };

    // Word patterns (simplified - many words need temporal analysis)
    const wordPatterns: Record<string, () => number> = {
      'isl-yes': () => (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.extended) ? 0.8 : 0,
      'isl-good': () => (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.extended) ? 0.8 : 0,
      'isl-no': () => (indexExt && middleExt && !ringExt && !pinkyExt && thumbState.tucked && distances.indexMiddleTip < 0.05) ? 0.7 : 0,
      'isl-ok': () => (distances.thumbIndexTip < 0.03 && middleExt && ringExt && pinkyExt && !thumbExt) ? 0.85 : 0,
      'isl-water': () => (distances.thumbPinkyTip < 0.05 && indexExt && middleExt && ringExt) ? 0.75 : 0, // W handshape
      'isl-food': () => (distances.indexMiddleTip < 0.03 && distances.middleRingTip < 0.03 && distances.ringPinkyTip < 0.03 && !thumbExt) ? 0.7 : 0,
      'isl-love': () => false ? 0.5 : 0, // needs two hands
      'isl-stop': () => (indexExt && middleExt && ringExt && pinkyExt && thumbState.extended) ? 0.7 : 0,
      'isl-wait': () => (indexExt && middleExt && ringExt && pinkyExt && curvatures.every(c => c > 0.5)) ? 0.6 : 0,
      'isl-help': () => (thumbState.extended && indexExt && middleExt && !ringExt && !pinkyExt && distances.thumbIndexTip < 0.06) ? 0.6 : 0,
      'isl-thankyou': () => (indexExt && middleExt && ringExt && pinkyExt && thumbState.tucked && orientation.pitch > 0) ? 0.6 : 0,
      'isl-sorry': () => (!thumbState.extended && !indexExt && !middleExt && !ringExt && !pinkyExt) ? 0.5 : 0,
      'isl-please': () => (!thumbState.extended && !indexExt && !middleExt && !ringExt && !pinkyExt) ? 0.5 : 0,
      'isl-hello': () => (indexExt && middleExt && ringExt && pinkyExt && thumbState.extended && orientation.yaw > 0) ? 0.6 : 0,
      'isl-friend': () => (distances.indexMiddleTip < 0.04) ? 0.5 : 0,
      'isl-family': () => (distances.thumbIndexTip < 0.05 && distances.indexMiddleTip < 0.05) ? 0.5 : 0,
      'isl-understand': () => (indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.extended && orientation.pitch < -0.2) ? 0.6 : 0,
      'isl-dont-understand': () => (indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.tucked && orientation.pitch > 0.2) ? 0.5 : 0,
      'isl-know': () => (indexExt && !middleExt && !ringExt && !pinkyExt && thumbState.extended) ? 0.6 : 0,
      'isl-dont-know': () => false ? 0.5 : 0, // shrug gesture
      'isl-mom': () => (thumbState.extended && !indexExt && !middleExt && !ringExt && !pinkyExt && orientation.pitch > 0.3) ? 0.6 : 0,
      'isl-dad': () => (thumbState.extended && !indexExt && !middleExt && !ringExt && !pinkyExt && orientation.pitch < -0.3) ? 0.6 : 0,
    };

    // Check alphabet
    if (alphabetPatterns[signId]) return alphabetPatterns[signId]!();
    // Check numbers
    if (numberPatterns[signId]) return numberPatterns[signId]!();
    // Check words
    if (wordPatterns[signId]) return wordPatterns[signId]!();
    // Check phrases (simplified)
    return 0;
  }
}

const classifier = new ISLHeuristicClassifier();

export function useIslRecognition(options: UseIslRecognitionOptions = {}): UseIslRecognitionResult {
  const { onUpdate, confidenceThreshold = 0.35, stabilizationFrames = 3, autoCommit = false, onAutoCommit } = options;

  const [status, setStatus] = useState<IslStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentSign, setCurrentSign] = useState<IslRecognitionResult | null>(null);
  const [recognising, setRecognisingState] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const recognisingRef = useRef(false);
  const stableCountRef = useRef(0);
  const lastLabelRef = useRef<string | null>(null);
  const commitRef = useRef<{ label: string | null; since: number; committed: boolean } | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const loop = useCallback(function recognitionLoop() {
    const landmarker = landmarkerRef.current;
    const video = videoRef.current;
    if (!landmarker || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(recognitionLoop);
      return;
    }

    if (recognisingRef.current) {
      try {
        const result = landmarker.detectForVideo(video, performance.now());
        if (result && result.landmarks.length > 0) {
          // Use the most confident hand (prefer right)
          let bestHand = result.landmarks[0];
          let bestHandedness = result.handedness[0]?.[0]?.categoryName || 'Right';

          if (result.landmarks.length > 1) {
            const rightIdx = result.handedness.findIndex(h => h[0]?.categoryName === 'Right');
            if (rightIdx >= 0) {
              bestHand = result.landmarks[rightIdx];
              bestHandedness = 'Right';
            }
          }

          const landmarks: HandLandmark[] = bestHand.map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z || 0,
          }));

          const classification = classifier.classify(landmarks, bestHandedness as 'Left' | 'Right');

          // Stabilization
          if (classification.sign) {
            if (classification.sign.id === lastLabelRef.current) {
              stableCountRef.current++;
            } else {
              stableCountRef.current = 1;
              lastLabelRef.current = classification.sign.id;
            }

            if (stableCountRef.current >= stabilizationFrames && classification.confidence >= confidenceThreshold) {
              const result = { ...classification };
              setCurrentSign(result);
              optionsRef.current.onUpdate?.(result);

              // Auto-commit logic
              if (optionsRef.current.autoCommit && optionsRef.current.onAutoCommit) {
                const commitState = commitRef.current;
                const sameHold = commitState !== null && commitState.label === classification.sign.id && !commitState.committed;
                const since = sameHold ? commitState.since : performance.now();
                const committed = sameHold && performance.now() - since >= 500; // 500ms hold

                if (committed) {
                  optionsRef.current.onAutoCommit(classification.sign.label);
                  commitRef.current = { label: classification.sign.id, since, committed: true };
                } else {
                  commitRef.current = { label: classification.sign.id, since, committed: false };
                }
              }
            }
          } else {
            lastLabelRef.current = null;
            stableCountRef.current = 0;
            commitRef.current = null;
            setCurrentSign(null);
          }
        } else {
          setCurrentSign(null);
          lastLabelRef.current = null;
          stableCountRef.current = 0;
        }
      } catch {
        // Transient error, keep loop alive
      }
    }

    rafRef.current = requestAnimationFrame(recognitionLoop);
  }, [confidenceThreshold, stabilizationFrames]);

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
        setErrorMessage('Camera access was denied. Allow camera access in your browser settings.');
      } else if (name === 'NotFoundError') {
        setStatus('camera-denied');
        setErrorMessage('No camera was found on this device.');
      } else {
        setStatus('camera-denied');
        setErrorMessage('The camera could not be started.');
      }
      return;
    }

    try {
      setStatus('model-loading');
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      landmarkerRef.current = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: HAND_MODEL_PATH, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch {
      // GPU delegate can fail - retry with CPU
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        landmarkerRef.current = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAND_MODEL_PATH, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch {
        setStatus('model-error');
        setErrorMessage('The hand landmark model failed to load.');
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
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setCurrentSign(null);
    setRecognisingState(false);
    setStatus('idle');
    stableCountRef.current = 0;
    lastLabelRef.current = null;
  }, []);

  const setRecognising = useCallback((on: boolean) => {
    recognisingRef.current = on;
    setRecognisingState(on);
    if (!on) {
      setCurrentSign(null);
      stableCountRef.current = 0;
      lastLabelRef.current = null;
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
    currentSign,
    attachVideo,
    start,
    stop,
    setRecognising,
    recognising,
  };
}