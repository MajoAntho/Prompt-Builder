// store.js - Gestion centralisée de l'état
export const store = {
  // État global
  state: {
    currentFormat: 'text',
    promptData: {},
    history: [],
    draggedElement: null,
    updateTimer: null,
    autoSaveTimer: null,
    lastAutoSaveData: null,
    saveIndicatorTimeout: null,
    formHistory: null
  },

  // Getters
  get currentFormat() { return this.state.currentFormat; },
  get promptData() { return this.state.promptData; },
  get history() { return this.state.history; },
  get draggedElement() { return this.state.draggedElement; },
  get formHistory() { return this.state.formHistory; },

  // Setters avec notification optionnelle
  setCurrentFormat(value) {
    this.state.currentFormat = value;
  },

  setPromptData(value) {
    this.state.promptData = value;
  },

  updatePromptData(updates) {
    Object.assign(this.state.promptData, updates);
  },

  setHistory(value) {
    this.state.history = value;
  },

  addToHistory(item) {
    this.state.history.unshift(item);
    if (this.state.history.length > 20) {
      this.state.history.pop();
    }
  },

  setDraggedElement(value) {
    this.state.draggedElement = value;
  },

  setFormHistory(value) {
    this.state.formHistory = value;
  },

  // Timers
  setUpdateTimer(value) {
    if (this.state.updateTimer) clearTimeout(this.state.updateTimer);
    this.state.updateTimer = value;
  },

  setAutoSaveTimer(value) {
    if (this.state.autoSaveTimer) clearTimeout(this.state.autoSaveTimer);
    this.state.autoSaveTimer = value;
  },

  setSaveIndicatorTimeout(value) {
    if (this.state.saveIndicatorTimeout) clearTimeout(this.state.saveIndicatorTimeout);
    this.state.saveIndicatorTimeout = value;
  },

  setLastAutoSaveData(value) {
    this.state.lastAutoSaveData = value;
  }
};

// Classe HistoryManager pour undo/redo
export class HistoryManager {
  constructor(maxSize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  push(state) {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    this.history.push(JSON.stringify(state));
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
    this.currentIndex = this.history.length - 1;
  }

  undo() {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return JSON.parse(this.history[this.currentIndex]);
  }

  redo() {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return JSON.parse(this.history[this.currentIndex]);
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  reset() {
    this.history = [];
    this.currentIndex = -1;
  }

  getCurrent() {
    if (this.currentIndex === -1) return null;
    return JSON.parse(this.history[this.currentIndex]);
  }
}