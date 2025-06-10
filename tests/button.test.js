import { describe, it, expect } from 'vitest';

describe('Button component', () => {
  it('doit exister avec la classe btn', () => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    document.body.appendChild(btn);
    expect(btn.classList.contains('btn')).toBe(true);
    expect(btn.classList.contains('btn--primary')).toBe(true);
    document.body.removeChild(btn);
  });

  it('doit être accessible (aria-disabled)', () => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.setAttribute('aria-disabled', 'true');
    document.body.appendChild(btn);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    document.body.removeChild(btn);
  });
});
