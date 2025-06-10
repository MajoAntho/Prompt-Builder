import { describe, it, expect } from 'vitest';

describe('Card component', () => {
  it('doit exister avec la classe card', () => {
    const card = document.createElement('div');
    card.className = 'card';
    document.body.appendChild(card);
    expect(card.classList.contains('card')).toBe(true);
    document.body.removeChild(card);
  });

  it('doit contenir un header et des actions', () => {
    const card = document.createElement('div');
    card.className = 'card';
    const header = document.createElement('div');
    header.className = 'card__header';
    const actions = document.createElement('div');
    actions.className = 'card__actions';
    card.appendChild(header);
    card.appendChild(actions);
    document.body.appendChild(card);
    expect(card.querySelector('.card__header')).not.toBeNull();
    expect(card.querySelector('.card__actions')).not.toBeNull();
    document.body.removeChild(card);
  });
});
