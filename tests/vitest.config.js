/**
 * Vitest config pour tests unitaires ES6 + couverture V8.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['dist', 'node_modules', 'coverage']
    }
  }
});

// À SUPPRIMER : ce fichier de config doit être à la racine du projet.
