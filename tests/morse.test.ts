import { describe, expect, it } from 'vitest';
import { decodeMorse, encodeMorse, MORSE_TABLE, UNKNOWN } from '@/lib/morse';

describe('decodeMorse — valid sequences', () => {
  it('decodes single letters', () => {
    expect(decodeMorse('.-').text).toBe('A');
    expect(decodeMorse('-...').text).toBe('B');
    expect(decodeMorse('--').text).toBe('M');
  });

  it('decodes words with / separators', () => {
    expect(decodeMorse('... --- ...').text).toBe('SOS');
    expect(decodeMorse('.... .. / - .... . .-. .').text).toBe('HI THERE');
  });

  it('decodes digits', () => {
    for (const [char, seq] of Object.entries(MORSE_TABLE)) {
      if (!/[0-9]/.test(char)) continue;
      expect(decodeMorse(seq).text).toBe(char);
    }
  });

  it('decodes punctuation', () => {
    expect(decodeMorse('.-.-.-').text).toBe('.');
    expect(decodeMorse('--..--').text).toBe(',');
    expect(decodeMorse('..--..').text).toBe('?');
  });

  it('handles leading/trailing and repeated spaces', () => {
    expect(decodeMorse('  .-   -.. ').text).toBe('AD');
  });

  it('empty input decodes to empty text', () => {
    const r = decodeMorse('');
    expect(r.text).toBe('');
    expect(r.unknownTokens).toEqual([]);
    const r2 = decodeMorse('   ');
    expect(r2.text).toBe('');
  });
});

describe('decodeMorse — unknown sequences', () => {
  it('reports unknown tokens honestly', () => {
    const r = decodeMorse('.-.-.-.-');
    expect(r.text).toBe(UNKNOWN);
    expect(r.unknownTokens).toEqual([0]);
  });

  it('keeps position of unknown tokens between valid ones', () => {
    const r = decodeMorse('.- .-.-.-.- -...');
    expect(r.text).toBe(`A${UNKNOWN}B`);
    expect(r.unknownTokens).toEqual([1]);
  });

  it('unknown word separators still split words', () => {
    const r = decodeMorse('.-.-.-.- / -...');
    expect(r.text).toBe(`${UNKNOWN} B`);
    expect(r.unknownTokens).toEqual([0]);
  });
});

describe('encodeMorse', () => {
  it('round-trips letters and words', () => {
    expect(encodeMorse('SOS')).toBe('... --- ...');
    expect(encodeMorse('HI THERE')).toBe('.... .. / - .... . .-. .');
  });

  it('skips characters outside the table', () => {
    expect(encodeMorse('A#c')).toBe('.- -.-.');
  });

  it('empty text encodes to empty', () => {
    expect(encodeMorse('')).toBe('');
    expect(encodeMorse('   ')).toBe('');
  });
});
