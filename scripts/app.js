// app.js - Point d'entrée principal
import { store, HistoryManager } from './store.js';
import * as ui from './ui.js';
import * as storage from './storage.js';

// Initialisation du formHistory
store.setFormHistory(new HistoryManager(50));

// Charger l'historique depuis localStorage
store.setHistory(JSON.parse(localStorage.getItem('promptHistory') || '[]'));

// Exposer les fonctions critiques globalement pour les handlers dynamiques
// (Alternative : utiliser la délégation d'événements)
window.removeVariable = ui.removeVariable;
window.loadFromHistory = storage.loadFromHistory;
window.selectTemplate = ui.selectTemplate;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  ui.loadTheme();
  ui.renderTemplateDropdown();
  ui.setupDragAndDrop();
  ui.setupEventListeners();
  ui.setupDynamicEventListeners();
  storage.loadHistory();
  storage.checkURLParams();
  ui.updatePreview();
  
  // Restauration de la sauvegarde automatique
  const lastSave = localStorage.getItem('promptBuilder_autosave');
  if (lastSave) {
    setTimeout(() => {
      if (confirm('⚠️ Restaurer la dernière sauvegarde automatique ?')) {
        storage.importFromData(JSON.parse(lastSave));
        ui.showSaveIndicator();
      }
    }, 700);
  }
  
  // Push initial dans l'historique des modifications
  storage.pushFormHistory();
  storage.updateUndoRedoButtons();
});

// Sauvegarde automatique toutes les 5 secondes
setInterval(() => storage.autoSave(false), 5000);

// Focus trap pour le modal Import (accessibilité)
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('importModal');
  if (!modal || !modal.classList.contains('active')) return;
  
  if (e.key === 'Escape') {
    ui.closeImportModal();
    return;
  }
  
  const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), textarea');
  if (!focusable.length) return;
  
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  
  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
});