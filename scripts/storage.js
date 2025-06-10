// storage.js - Gestion du stockage et de l'historique
import { store } from './store.js';
// Import escapeHtml pour sécuriser les contenus dynamiques
import { escapeHtml } from './ui.js';

// Import dynamique pour éviter les dépendances circulaires
let ui = null;
async function getUI() {
  if (!ui) {
    ui = await import('./ui.js');
  }
  return ui;
}

// Sauvegarde automatique
export function autoSave(showIndicator = true) {
  const container = document.getElementById('formFieldsContainer');
  const orderedFields = [...container.querySelectorAll('.form-group')].map(group => group.dataset.field);
  let data = {};
  
  orderedFields.forEach(field => {
    if (field === 'variables') {
      data[field] = getVariables();
    } else {
      const element = document.getElementById(field);
      if (element && element.value) data[field] = element.value;
    }
  });
  
  if (JSON.stringify(data) === JSON.stringify(store.state.lastAutoSaveData)) return;
  
  localStorage.setItem('promptBuilder_autosave', JSON.stringify(data));
  store.setLastAutoSaveData(data);
  
  if (showIndicator) {
    getUI().then(ui => ui.showSaveIndicator());
  }
}

// Récupération des variables (pour éviter l'import circulaire)
function getVariables() {
  const variables = [];
  document.querySelectorAll('.variable-item').forEach(item => {
    const name = item.querySelector('.var-name').value;
    const value = item.querySelector('.var-value').value;
    if (name || value) {
      variables.push({ name: name || '', value: value || '' });
    }
  });
  return variables;
}

// Sauvegarde dans l'historique
export function saveToHistory() {
  if (Object.keys(store.promptData).length === 0) return;
  
  const historyItem = {
    id: Date.now(),
    date: new Date().toLocaleString('fr-FR'),
    data: store.promptData,
    format: store.currentFormat,
    preview: document.getElementById('previewContent').textContent.substring(0, 100) + '...'
  };
  
  store.addToHistory(historyItem);
  localStorage.setItem('promptHistory', JSON.stringify(store.history));
  loadHistory();
}

// Chargement de l'historique (sécurité XSS)
export function loadHistory() {
  const historyList = document.getElementById('historyList');
  if (store.history.length === 0) {
    historyList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">Aucun historique</p>';
    return;
  }
  historyList.innerHTML = store.history.map(item => `
    <div class="history-item" data-history-id="${item.id}" tabindex="0" role="button" aria-label="Charger le prompt du ${escapeHtml(item.date)}">
      <div class="history-date">${escapeHtml(item.date)}</div>
      <div class="history-preview">${escapeHtml(item.preview)}</div>
    </div>
  `).join('');
  
  // Event listeners pour les items d'historique
  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      loadFromHistory(parseInt(item.dataset.historyId));
    });
  });
}

// Chargement depuis l'historique
export function loadFromHistory(id) {
  const item = store.history.find(h => h.id === id);
  if (!item) return;
  
  fillFormFromData(item.data);
  getUI().then(ui => {
    ui.updatePreview();
    ui.showToast('Prompt chargé depuis l\'historique', 'info');
  });
}

// Import d'un prompt
export function importPrompt() {
  const content = document.getElementById('importTextarea').value.trim();
  if (!content) {
    getUI().then(ui => ui.showToast('Veuillez coller un prompt', 'warning'));
    return;
  }
  
  try {
    let promptData = {};
    
    if (content.startsWith('{')) {
      // JSON
      const data = JSON.parse(content);
      promptData = data.prompt || data;
    } else if (content.startsWith('<?xml')) {
      // XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      const fields = ['role', 'context', 'task', 'output'];
      fields.forEach(field => {
        const element = xmlDoc.querySelector(field);
        if (element) promptData[field] = element.textContent;
      });
      const instructions = xmlDoc.querySelectorAll('instruction');
      if (instructions.length > 0) {
        promptData.instructions = Array.from(instructions).map(i => i.textContent).join('\n');
      }
      const variables = xmlDoc.querySelectorAll('variable');
      if (variables.length > 0) {
        promptData.variables = Array.from(variables).map(v => ({
          name: v.getAttribute('name'),
          value: v.textContent
        }));
      }
    } else {
      // Markdown ou Texte
      const sections = content.split(/\n(?=[A-Z#]+)/);
      sections.forEach(section => {
        const lines = section.split('\n');
        const firstLine = lines[0].toLowerCase();
        const content = lines.slice(1).join('\n').trim();
        if (firstLine.includes('rôle') || firstLine.includes('role')) {
          promptData.role = content;
        } else if (firstLine.includes('contexte') || firstLine.includes('context')) {
          promptData.context = content;
        } else if (firstLine.includes('tâche') || firstLine.includes('task')) {
          promptData.task = content;
        } else if (firstLine.includes('instruction')) {
          promptData.instructions = content;
        } else if (firstLine.includes('format') || firstLine.includes('sortie') || firstLine.includes('output')) {
          promptData.output = content;
        }
      });
    }
    
    importFromData(promptData);
    getUI().then(ui => {
      ui.closeImportModal();
      ui.showToast('✅ Prompt importé avec succès!', 'success');
    });
  } catch (error) {
    console.error('Erreur d\'import:', error);
    getUI().then(ui => ui.showToast('❌ Format non reconnu', 'error'));
  }
}

// Import depuis des données
export function importFromData(data) {
  fillFormFromData(data);
  getUI().then(ui => ui.updatePreview());
}

// Remplissage du formulaire (sécurité XSS sur les valeurs dynamiques)
function fillFormFromData(data) {
  // Réinitialiser
  document.querySelectorAll('input, textarea').forEach(el => el.value = '');
  
  // Charger les données
  Object.entries(data).forEach(([field, value]) => {
    if (field === 'variables' && Array.isArray(value)) {
      const container = document.getElementById('variablesContainer');
      container.innerHTML = '';
      
      if (value.length === 0) {
        container.innerHTML = `
          <div class="variable-item">
            <input type="text" placeholder="Nom de la variable" class="var-name" aria-label="Nom de la variable" />
            <input type="text" placeholder="Valeur" class="var-value" aria-label="Valeur de la variable" />
            <button class="btn btn-danger var-remove" tabindex="0" aria-label="Supprimer la variable" role="button">✕</button>
            <button class="btn btn-secondary var-up" tabindex="0" aria-label="Monter la variable" role="button">▲</button>
            <button class="btn btn-secondary var-down" tabindex="0" aria-label="Descendre la variable" role="button">▼</button>
          </div>
        `;
      } else {
        value.forEach(v => {
          const div = document.createElement('div');
          div.className = 'variable-item';
          div.innerHTML = `
            <input type="text" placeholder="Nom de la variable" class="var-name" value="${escapeHtml(v.name || '')}" aria-label="Nom de la variable" />
            <input type="text" placeholder="Valeur" class="var-value" value="${escapeHtml(v.value || '')}" aria-label="Valeur de la variable" />
            <button class="btn btn-danger var-remove" tabindex="0" aria-label="Supprimer la variable" role="button">✕</button>
            <button class="btn btn-secondary var-up" tabindex="0" aria-label="Monter la variable" role="button">▲</button>
            <button class="btn btn-secondary var-down" tabindex="0" aria-label="Descendre la variable" role="button">▼</button>
          `;
          container.appendChild(div);
        });
      }
      
      // Event listeners
      container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
          store.setUpdateTimer(setTimeout(() => {
            getUI().then(ui => ui.updatePreview());
          }, 300));
        });
      });
    } else if (field !== 'variables') {
      const element = document.getElementById(field);
      if (element) element.value = value;
    }
  });
}

// Historique des modifications (undo/redo)
export function pushFormHistory() {
  const container = document.getElementById('formFieldsContainer');
  const orderedFields = [...container.querySelectorAll('.form-group')].map(group => group.dataset.field);
  let data = {};
  
  orderedFields.forEach(field => {
    if (field === 'variables') {
      data[field] = getVariables();
    } else {
      const element = document.getElementById(field);
      if (element && element.value) data[field] = element.value;
    }
  });
  
  store.formHistory.push(data);
  updateUndoRedoButtons();
}

export function undoForm() {
  const prev = store.formHistory.undo();
  if (prev) {
    fillFormFromData(prev);
    getUI().then(ui => ui.updatePreview());
  }
  updateUndoRedoButtons();
}

export function redoForm() {
  const next = store.formHistory.redo();
  if (next) {
    fillFormFromData(next);
    getUI().then(ui => ui.updatePreview());
  }
  updateUndoRedoButtons();
}

export function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = !store.formHistory.canUndo();
  if (redoBtn) redoBtn.disabled = !store.formHistory.canRedo();
}

// Vérification des paramètres URL
export function checkURLParams() {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  
  if (data) {
    try {
      const promptData = JSON.parse(atob(data));
      importFromData(promptData);
      getUI().then(ui => ui.showToast('Prompt chargé depuis le lien', 'info'));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  }
}