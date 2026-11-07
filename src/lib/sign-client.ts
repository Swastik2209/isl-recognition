/**
 * Client for the AccessBridge sign service (250-class pretrained ASL model).
 *
 * The service is a local FastAPI process (mini-services/sign-service,
 * port 3031) reached through the platform gateway with the XTransformPort
 * query parameter — relative paths only, exactly as the platform
 * prescribes for mini-services. The service loads Google's pretrained
 * Isolated Sign Language Recognition model (MediaPipe landmark format,
 * 543 landmarks per frame). The browser captures Holistic landmarks,
 * sends whole capture windows, and receives structured predictions.
 * Unknown / low-confidence states are honest — the service never
 * fabricates a guess.
 */

export const SIGN_SERVICE_PATH = '';
/** Gateway query parameter that routes to the local Python service. */
export const SERVICE_GATEWAY_QUERY = 'XTransformPort=3031';

export interface SignPrediction {
  status: 'ok';
  word: string;
  confidence: number;
  /** Margin between top-1 and top-2 probabilities (0..1 after softmax). */
  margin: number;
  alternatives: { word: string; confidence: number }[];
  latencyMs: number;
}

export interface SignNoMatch {
  status: 'no_match';
  message: string;
  alternatives: { word: string; confidence: number }[];
  latencyMs: number;
}

export interface SignNoHand {
  status: 'no_hand';
  message: string;
  latencyMs: number;
}

export interface SignError {
  status: 'error';
  message: string;
}

export type SignResponse = SignPrediction | SignNoMatch | SignNoHand | SignError;

export interface SignServiceInfo {
  status: 'ok';
  n_classes: number;
  model: string;
  license: string;
  confidence_threshold: number;
  source: string;
}

export type SignInfoResponse = SignServiceInfo | { status: 'error'; message: string };

/** Softmax over the service's raw scores, for display fallbacks. */
export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores, 0);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** True when the prediction is confidently displayable. */
export function isConfident(confidence: number, threshold: number): boolean {
  return confidence >= threshold;
}

export async function fetchSignInfo(signal?: AbortSignal): Promise<SignInfoResponse> {
  try {
    const res = await fetch(`${SIGN_SERVICE_PATH}/health?${SERVICE_GATEWAY_QUERY}`, {
      signal,
      cache: 'no-store',
    });
    if (!res.ok) return { status: 'error', message: `Service returned ${res.status}` };
    const body = (await res.json()) as {
      status: string;
      message?: string;
      n_classes?: number;
      model?: string;
      license?: string;
      confidence_threshold?: number;
      source?: string;
    };
    if (body.status !== 'ok') {
      return { status: 'error', message: body.message ?? 'Sign service is not ready' };
    }
    return {
      status: 'ok',
      n_classes: body.n_classes ?? 0,
      model: body.model ?? 'unknown',
      license: body.license ?? 'unknown',
      confidence_threshold: body.confidence_threshold ?? 0.3,
      source: body.source ?? '',
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Sign service unreachable' };
  }
}

export interface PredictPayload {
  /** Flattened landmarks: T frames × 543 landmarks × 3 values, row-major. */
  landmarks: number[];
  frames: number;
}

export async function predictSign(payload: PredictPayload, signal?: AbortSignal): Promise<SignResponse> {
  try {
    const res = await fetch(`${SIGN_SERVICE_PATH}/predict?${SERVICE_GATEWAY_QUERY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) {
      return { status: 'error', message: `Service returned ${res.status}` };
    }
    return (await res.json()) as SignResponse;
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Sign service unreachable' };
  }
}
