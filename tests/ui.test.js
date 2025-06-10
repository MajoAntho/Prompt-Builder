import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../scripts/ui.js';

describe('escapeHtml', () => {
  it('échappe les caractères spéciaux HTML', () => {
    expect(escapeHtml('<div>"test"&\'</div>')).toBe('&lt;div&gt;&quot;test&quot;&amp;&#39;&lt;/div&gt;');
  });
  it('retourne une chaîne vide pour null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
