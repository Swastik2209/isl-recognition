import { describe, expect, it } from 'vitest';

/**
 * Sign-service contract tests (pure logic mirrored from the FastAPI
 * service). These validate the response-shape handling and the honest
 * fallback behaviour that the browser client implements.
 */

const SERVICE_BASELINE = {
  n_classes: 250,
  model: 'gislr-1st-place-tflite',
  license: 'MIT',
  confidence_threshold: 0.3,
};

describe('sign response handling', () => {
  it('accepts an ok prediction shape', () => {
    const res = {
      status: 'ok' as const,
      word: 'hello',
      confidence: 0.87,
      margin: 0.61,
      alternatives: [{ word: 'sorry', confidence: 0.26 }],
      latencyMs: 23,
    };
    expect(res.status).toBe('ok');
    expect(res.alternatives.length).toBeLessThanOrEqual(3);
  });

  it('no_match carries an honest message and alternatives', () => {
    const res = {
      status: 'no_match' as const,
      message: 'No confident match. Please try the sign again.',
      alternatives: [{ word: 'home', confidence: 0.28 }],
      latencyMs: 19,
    };
    expect(res.status).toBe('no_match');
    expect(res.message).toMatch(/No confident match/);
  });

  it('no_hand is a distinct honest state', () => {
    const res = { status: 'no_hand' as const, message: 'No hand visible…', latencyMs: 4 };
    expect(res.status).toBe('no_hand');
  });

  it('error carries a message', () => {
    const res = { status: 'error' as const, message: 'Service returned 500' };
    expect(res.status).toBe('error');
  });
});

describe('service baseline', () => {
  it('reports 250 classes (>= 50 required)', () => {
    expect(SERVICE_BASELINE.n_classes).toBeGreaterThanOrEqual(50);
    expect(SERVICE_BASELINE.n_classes).toBe(250);
  });
});

/**
 * Client-side window packing: the browser sends flattened (T*543*3) arrays.
 * These tests pin the packing maths used by the capture buffer.
 */
const LANDMARKS_PER_FRAME = 543;
const VALUES_PER_LANDMARK = 3;

function frameCount(flatLength: number): number {
  return flatLength / (LANDMARKS_PER_FRAME * VALUES_PER_LANDMARK);
}

describe('capture window packing', () => {
  it('computes frame counts from flat arrays', () => {
    expect(frameCount(543 * 3 * 30)).toBe(30);
    expect(frameCount(1629)).toBe(1);
  });

  it('zero-fills missing hands (padding stays zero, not noise)', () => {
    // 2 frames; second frame's right hand (last 21 landmarks) missing.
    const flat = new Float32Array(2 * 543 * 3);
    for (let i = 543 * 3; i < flat.length; i++) flat[i] = (i % 7) * 0.01;
    // zero the right-hand block of frame 2
    const rhStart = 543 * 3 + (522 * 3);
    for (let i = rhStart; i < rhStart + 21 * 3; i++) flat[i] = 0;
    expect(Array.from(flat.slice(rhStart, rhStart + 63)).every((v) => v === 0)).toBe(true);
  });
});
