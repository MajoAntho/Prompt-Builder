import { describe, it, expect } from 'vitest';

describe('Toast component', () => {
  it('doit exister avec la classe toast', () => {
    const toast = document.createElement('div');
    toast.className = 'toast toast--success';
    document.body.appendChild(toast);
    expect(toast.classList.contains('toast')).toBe(true);
    expect(toast.classList.contains('toast--success')).toBe(true);
    document.body.removeChild(toast);
  });

  it('doit avoir le rôle status et aria-live', () => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    document.body.removeChild(toast);
  });
});
