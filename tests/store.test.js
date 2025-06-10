import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../scripts/store.js';

describe('HistoryManager', () => {
  it('push, undo, redo fonctionne', () => {
    const h = new HistoryManager(3);
    h.push({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    expect(h.getCurrent()).toEqual({ a: 3 });
    expect(h.undo()).toEqual({ a: 2 });
    expect(h.redo()).toEqual({ a: 3 });
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);
  });
});
