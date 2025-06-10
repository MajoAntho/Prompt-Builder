// ui.js - Gestion de l'interface utilisateur
import { store } from './store.js';
import * as storage from './storage.js';

// Templates
const templates = {
  marketing: {
    icon: '📈',
    name: 'Marketing & Publicité',
    desc: 'Stratégies marketing et campagnes',
    data: {
      role: "Tu es un expert en marketing digital avec 15 ans d'expérience",
      context: "Une startup lance un nouveau produit innovant",
      task: "Créer une stratégie marketing complète",
      instructions: "- Analyse du marché\n- Définition des personas\n- Stratégie multi-canal\n- Budget et KPIs",
      output: "Plan marketing structuré avec tableaux"
    }
  },
  technical: {
    icon: '💻',
    name: 'Documentation technique',
    desc: 'APIs et guides techniques',
    data: {
      role: "Tu es un architecte logiciel senior",
      context: "Documentation d'une nouvelle API REST",
      task: "Rédiger une documentation technique complète",
      instructions: "- Description des endpoints\n- Exemples de code\n- Gestion des erreurs\n- Best practices",
      output: "Documentation OpenAPI avec exemples"
    }
  },
  creative: {
    icon: '✍️',
    name: 'Création de contenu',
    desc: 'Articles et contenu créatif',
    data: {
      role: "Tu es un rédacteur créatif expert en storytelling",
      context: "Blog d'entreprise dans la tech",
      task: "Produire un article captivant",
      instructions: "- Hook percutant\n- Storytelling\n- SEO optimisé\n- Call-to-action",
      output: "Article de 1500 mots structuré"
    }
  },
  analysis: {
    icon: '📊',
    name: 'Analyse de données',
    desc: 'Rapports et insights',
    data: {
      role: "Tu es un data scientist senior",
      context: "Analyse trimestrielle des performances",
      task: "Analyser les données et identifier les tendances",
      instructions: "- Analyse statistique\n- Visualisations\n- Insights actionnables\n- Recommandations",
      output: "Dashboard avec rapport détaillé"
    }
  },
  education: {
    icon: '🎓',
    name: 'Formation & Éducation',
    desc: 'Cours et contenus pédagogiques',
    data: {
      role: "Tu es un expert en ingénierie pédagogique",
      context: "Formation en ligne sur les compétences digitales",
      task: "Concevoir un parcours de formation complet",
      instructions: "- Objectifs pédagogiques\n- Modules progressifs\n- Exercices pratiques\n- Évaluations",
      output: "Syllabus détaillé avec planning"
    }
  },
  product: {
    icon: '🚀',
    name: 'Product Management',
    desc: 'Specs produit et roadmaps',
    data: {
      role: "Tu es un Senior Product Manager",
      context: "Nouvelle fonctionnalité pour app mobile",
      task: "Créer une spécification produit complète",
      instructions: "- User stories\n- Wireframes\n- Success metrics\n- Go-to-market",
      output: "PRD complet avec mockups"
    }
  }
};

// Fonction utilitaire d'échappement HTML pour la sécurité XSS
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mise à jour de l'aperçu
export function updatePreview() {
  const loader = document.getElementById('previewLoader');
  if (loader) loader.style.display = 'inline-block';
  
  const container = document.getElementById('formFieldsContainer');
  const orderedFields = [...container.querySelectorAll('.form-group')].map(group => group.dataset.field);
  
  const newPromptData = {};
  orderedFields.forEach(field => {
    if (field === 'variables') {
      newPromptData[field] = getVariables();
    } else {
      const element = document.getElementById(field);
      if (element && element.value) {
        newPromptData[field] = element.value;
      }
    }
  });
  
  store.setPromptData(newPromptData);
  
  let preview = '';
  const hasContent = Object.keys(store.promptData).some(key => {
    if (key === 'variables') return store.promptData[key].length > 0;
    return store.promptData[key];
  });
  
  if (!hasContent) {
    // Utilisation textContent pour éviter XSS
    const placeholder = document.createElement('div');
    placeholder.className = 'preview-placeholder';
    placeholder.innerHTML = `
      <div class="preview-placeholder-icon">📝</div>
      <div>Commencez à remplir le formulaire pour voir l'aperçu...</div>
    `;
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = '';
    previewContent.appendChild(placeholder);
  } else {
    let preview = '';
    switch (store.currentFormat) {
      case 'text':
        preview = generateTextFormat(orderedFields);
        break;
      case 'markdown':
        preview = generateMarkdownFormat(orderedFields);
        break;
      case 'json':
        preview = generateJSONFormat(orderedFields);
        break;
      case 'xml':
        preview = generateXMLFormat(orderedFields);
        break;
    }
    // Sécurité XSS : on utilise textContent
    const previewContent = document.getElementById('previewContent');
    previewContent.textContent = preview;
  }
  
  if (loader) {
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
}

// Toast notification (sécurité XSS)
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `<span>${icons[type]}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Gestion du thème
export function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
}

export function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
}

// Drag and drop
export function setupDragAndDrop() {
  const container = document.getElementById('formFieldsContainer');
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragenter', handleDragEnter);
  container.addEventListener('dragleave', handleDragLeave);
}

function handleDragStart(e) {
  if (!e.target.classList.contains('form-group')) return;
  store.setDraggedElement(e.target);
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
  if (!e.target.classList.contains('form-group')) return;
  e.target.classList.remove('dragging');
  document.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('drag-over');
  });
  updatePreview();
  showToast('Ordre modifié', 'info');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const afterElement = getDragAfterElement(e.currentTarget, e.clientY);
  const dragging = document.querySelector('.dragging');
  if (afterElement == null) {
    e.currentTarget.appendChild(dragging);
  } else {
    e.currentTarget.insertBefore(dragging, afterElement);
  }
}

function handleDragEnter(e) {
  if (e.target.classList.contains('form-group')) {
    e.target.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  if (e.target.classList.contains('form-group')) {
    e.target.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.form-group:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Template dropdown (sécurité XSS + accessibilité)
export function renderTemplateDropdown() {
  const menu = document.getElementById('templateDropdownMenu');
  menu.innerHTML = '';
  Object.entries(templates).forEach(([key, template]) => {
    const option = document.createElement('div');
    option.className = 'template-option';
    option.dataset.templateKey = key;
    option.setAttribute('tabindex', '0');
    option.setAttribute('role', 'option');
    option.setAttribute('aria-label', template.name);
    option.innerHTML = `
      <div class="template-option-icon">${escapeHtml(template.icon)}</div>
      <div class="template-option-content">
        <div class="template-option-name">${escapeHtml(template.name)}</div>
        <div class="template-option-desc">${escapeHtml(template.desc)}</div>
      </div>
    `;
    menu.appendChild(option);
  });
}

export function toggleTemplateDropdown() {
  const button = document.querySelector('.template-button');
  const menu = document.getElementById('templateDropdownMenu');
  const isOpen = menu.classList.contains('show');
  
  if (isOpen) {
    menu.classList.remove('show');
    button.classList.remove('active');
  } else {
    menu.classList.add('show');
    button.classList.add('active');
  }
}

export function selectTemplate(key) {
  const template = templates[key];
  if (!template) return;
  Object.entries(template.data).forEach(([field, value]) => {
    const element = document.getElementById(field);
    if (element) {
      element.value = value;
    }
  });
  document.getElementById('selectedTemplate').textContent = template.name;
  toggleTemplateDropdown();
  updatePreview();
  showToast(`Template "${escapeHtml(template.name)}" appliqué`, 'success');
}

// Variables (sécurité XSS sur les valeurs)
export function getVariables() {
  const variables = [];
  document.querySelectorAll('.variable-item').forEach(item => {
    const name = escapeHtml(item.querySelector('.var-name').value);
    const value = escapeHtml(item.querySelector('.var-value').value);
    if (name || value) {
      variables.push({ name: name || '', value: value || '' });
    }
  });
  return variables;
}

export function addVariable() {
  const container = document.getElementById('variablesContainer');
  const div = document.createElement('div');
  div.className = 'variable-item';
  div.innerHTML = `
    <input type="text" placeholder="Nom de la variable" class="var-name" aria-label="Nom de la variable" />
    <input type="text" placeholder="Valeur" class="var-value" aria-label="Valeur de la variable" />
    <button class="btn btn-danger var-remove" tabindex="0" aria-label="Supprimer la variable" role="button">✕</button>
    <button class="btn btn-secondary var-up" tabindex="0" aria-label="Monter la variable" role="button">▲</button>
    <button class="btn btn-secondary var-down" tabindex="0" aria-label="Descendre la variable" role="button">▼</button>
  `;
  container.appendChild(div);
  
  // Event listeners
  div.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      store.setUpdateTimer(setTimeout(updatePreview, 300));
    });
  });
  
  // Ajout navigation clavier pour les boutons
  div.querySelectorAll('.var-remove, .var-up, .var-down').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
  
  showToast('Variable ajoutée', 'success');
}

// Accessibilité : gestion des boutons Monter/Descendre pour variables
function moveVariableItem(item, direction) {
  const container = document.getElementById('variablesContainer');
  if (direction === 'up' && item.previousElementSibling) {
    container.insertBefore(item, item.previousElementSibling);
  } else if (direction === 'down' && item.nextElementSibling) {
    container.insertBefore(item.nextElementSibling, item);
  }
  updatePreview();
}

export function removeVariable(btn) {
  btn.parentElement.remove();
  updatePreview();
  showToast('Variable supprimée', 'info');
}

// Format switching (accessibilité)
export function switchFormat(format) {
  store.setCurrentFormat(format);
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  // Ajout gestion du focus et aria-selected
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.id.toLowerCase().includes(format)) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.focus();
    } else {
      tab.setAttribute('aria-selected', 'false');
    }
  });
  updatePreview();
}

// Actions
export function copyToClipboard() {
  const content = document.getElementById('previewContent').textContent;
  if (content.includes('Commencez à remplir')) {
    showToast('Rien à copier pour le moment', 'warning');
    return;
  }
  
  navigator.clipboard.writeText(content).then(() => {
    showToast('✅ Copié dans le presse-papiers!', 'success');
  }).catch(() => {
    showToast('❌ Erreur lors de la copie', 'error');
  });
}

export function downloadPrompt() {
  const content = document.getElementById('previewContent').textContent;
  if (content.includes('Commencez à remplir')) {
    showToast('Rien à télécharger pour le moment', 'warning');
    return;
  }
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const extensions = {
    'text': 'txt',
    'markdown': 'md',
    'json': 'json',
    'xml': 'xml'
  };
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  a.download = `prompt_${timestamp}.${extensions[store.currentFormat]}`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  storage.saveToHistory();
  showToast('💾 Téléchargé avec succès!', 'success');
}

export function sharePrompt() {
  if (Object.keys(store.promptData).length === 0) {
    showToast('Rien à partager pour le moment', 'warning');
    return;
  }
  
  const data = btoa(JSON.stringify(store.promptData));
  const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Prompt Builder Pro',
      text: 'Voici mon prompt personnalisé',
      url: url
    }).then(() => {
      showToast('🔗 Partagé avec succès!', 'success');
    }).catch(() => {
      copyShareLink(url);
    });
  } else {
    copyShareLink(url);
  }
}

function copyShareLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('🔗 Lien de partage copié!', 'success');
  });
}

export function clearForm() {
  if (confirm('Voulez-vous vraiment réinitialiser le formulaire?')) {
    document.querySelectorAll('input, textarea').forEach(el => el.value = '');
    const container = document.getElementById('variablesContainer');
    container.innerHTML = `
      <div class="variable-item">
        <input type="text" placeholder="Nom de la variable" class="var-name" />
        <input type="text" placeholder="Valeur" class="var-value" />
        <button class="btn btn-danger var-remove">✕</button>
      </div>
    `;
    document.getElementById('selectedTemplate').textContent = '-- Choisir un template --';
    
    // Réajouter les event listeners
    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        store.setUpdateTimer(setTimeout(updatePreview, 300));
      });
    });
    
    updatePreview();
    showToast('🗑️ Formulaire réinitialisé!', 'info');
  }
}

// Event listeners
export function setupEventListeners() {
  // Champs du formulaire
  document.querySelectorAll('input, textarea').forEach(element => {
    element.addEventListener('input', () => {
      store.setUpdateTimer(setTimeout(updatePreview, 300));
      store.setAutoSaveTimer(setTimeout(() => storage.autoSave(true), 2000));
      storage.pushFormHistory();
    });
  });

  // Boutons
  document.getElementById('copyBtn')?.addEventListener('click', copyToClipboard);
  document.getElementById('downloadBtn')?.addEventListener('click', downloadPrompt);
  document.getElementById('shareBtn')?.addEventListener('click', sharePrompt);
  document.getElementById('undoBtn')?.addEventListener('click', storage.undoForm);
  document.getElementById('redoBtn')?.addEventListener('click', storage.redoForm);
  document.getElementById('clearBtn')?.addEventListener('click', clearForm);

  // Format tabs
  document.getElementById('formatTextBtn')?.addEventListener('click', () => switchFormat('text'));
  document.getElementById('formatMarkdownBtn')?.addEventListener('click', () => switchFormat('markdown'));
  document.getElementById('formatJsonBtn')?.addEventListener('click', () => switchFormat('json'));
  document.getElementById('formatXmlBtn')?.addEventListener('click', () => switchFormat('xml'));

  // Template dropdown
  document.getElementById('templateDropdownBtn')?.addEventListener('click', toggleTemplateDropdown);

  // Ajout de variable
  document.getElementById('addVariableBtn')?.addEventListener('click', addVariable);

  // Historique
  document.getElementById('historyBtn')?.addEventListener('click', toggleHistory);

  // Import modal
  document.getElementById('importBtn')?.addEventListener('click', showImportModal);
  document.getElementById('importModalCloseBtn')?.addEventListener('click', closeImportModal);
  document.getElementById('importModalCancelBtn')?.addEventListener('click', closeImportModal);
  document.getElementById('importModalImportBtn')?.addEventListener('click', storage.importPrompt);

  // Thème
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

  // Détection du format dans l'import
  document.getElementById('importTextarea')?.addEventListener('input', (e) => {
    const content = e.target.value.trim();
    let format = '-';
    if (content.startsWith('{')) format = 'JSON';
    else if (content.startsWith('<?xml')) format = 'XML';
    else if (content.includes('#')) format = 'Markdown';
    else if (content) format = 'Texte';
    document.getElementById('detectedFormat').textContent = format;
  });

  // Fermer le dropdown en cliquant ailleurs
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.template-dropdown')) {
      const menu = document.getElementById('templateDropdownMenu');
      const button = document.querySelector('.template-button');
      if (menu && button) {
        menu.classList.remove('show');
        button.classList.remove('active');
      }
    }
  });

  // Raccourcis clavier
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          storage.saveToHistory();
          break;
        case 'd':
          e.preventDefault();
          downloadPrompt();
          break;
        case 'k':
          e.preventDefault();
          document.getElementById('role')?.focus();
          break;
        case 'z':
          e.preventDefault();
          storage.undoForm();
          break;
        case 'y':
          e.preventDefault();
          storage.redoForm();
          break;
      }
    }
  });
}

// Event listeners pour éléments dynamiques
export function setupDynamicEventListeners() {
  // Délégation d'événements pour les boutons de suppression et déplacement de variables
  document.getElementById('variablesContainer')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('var-remove')) {
      removeVariable(e.target);
    }
    if (e.target.classList.contains('var-up')) {
      moveVariableItem(e.target.parentElement, 'up');
    }
    if (e.target.classList.contains('var-down')) {
      moveVariableItem(e.target.parentElement, 'down');
    }
  });

  // Délégation pour les templates
  document.getElementById('templateDropdownMenu')?.addEventListener('click', (e) => {
    const option = e.target.closest('.template-option');
    if (option) {
      selectTemplate(option.dataset.templateKey);
    }
  });
  
  // Accessibilité clavier pour les options du template
  document.getElementById('templateDropdownMenu')?.addEventListener('keydown', (e) => {
    const options = Array.from(document.querySelectorAll('.template-option'));
    const current = document.activeElement;
    let idx = options.indexOf(current);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < options.length - 1) options[idx + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) options[idx - 1].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      current.click();
    }
  });
}

// Modals
export function showImportModal() {
  document.getElementById('importModal').classList.add('active');
  document.getElementById('importTextarea').focus();
}

export function closeImportModal() {
  document.getElementById('importModal').classList.remove('active');
  document.getElementById('importTextarea').value = '';
  document.getElementById('detectedFormat').textContent = '-';
}

// Panel historique
export function toggleHistory() {
  const panel = document.getElementById('historyPanel');
  panel.classList.toggle('active');
}

// Indicateur de sauvegarde
export function showSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  if (!indicator) return;
  indicator.style.display = 'flex';
  indicator.classList.add('saved');
  store.setSaveIndicatorTimeout(
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 2000)
  );
}

// Helper pour échapper le XML (utilise escapeHtml pour sécurité)
export function escapeXML(str) {
  if (!str) return '';
  return escapeHtml(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Générateurs de format
function generateTextFormat(orderedFields) {
  let text = '';
  const fieldLabels = {
    role: 'RÔLE',
    context: 'CONTEXTE',
    task: 'TÂCHE',
    instructions: 'INSTRUCTIONS',
    output: 'FORMAT DE SORTIE',
    variables: 'VARIABLES'
  };
  
  orderedFields.forEach(field => {
    if (store.promptData[field]) {
      if (field === 'variables' && store.promptData.variables.length > 0) {
        text += `${fieldLabels[field]}:\n`;
        store.promptData.variables.forEach(v => {
          if (v.name) {
            text += `- ${v.name}: ${v.value}\n`;
          }
        });
        text += '\n';
      } else if (field !== 'variables') {
        text += `${fieldLabels[field]}:\n${store.promptData[field]}\n\n`;
      }
    }
  });
  
  return text.trim();
}

function generateMarkdownFormat(orderedFields) {
  let md = '# Prompt Structuré\n\n';
  const fieldLabels = {
    role: 'Rôle',
    context: 'Contexte',
    task: 'Tâche',
    instructions: 'Instructions',
    output: 'Format de sortie',
    variables: 'Variables'
  };
  
  orderedFields.forEach(field => {
    if (store.promptData[field]) {
      if (field === 'variables' && store.promptData.variables.length > 0) {
        md += `## ${fieldLabels[field]}\n\n`;
        store.promptData.variables.forEach(v => {
          if (v.name) {
            md += `- **${v.name}**: ${v.value}\n`;
          }
        });
        md += '\n';
      } else if (field !== 'variables') {
        md += `## ${fieldLabels[field]}\n\n${store.promptData[field]}\n\n`;
      }
    }
  });
  
  return md.trim();
}

function generateJSONFormat(orderedFields) {
  const data = {
    version: "2.0",
    timestamp: new Date().toISOString(),
    prompt: {}
  };
  
  orderedFields.forEach(field => {
    if (store.promptData[field]) {
      if (field === 'instructions') {
        data.prompt[field] = store.promptData[field].split('\n').filter(i => i.trim());
      } else if (field === 'variables' && store.promptData.variables.length > 0) {
        data.prompt.variables = {};
        store.promptData.variables.forEach(v => {
          if (v.name) {
            data.prompt.variables[v.name] = v.value;
          }
        });
      } else if (field !== 'variables') {
        data.prompt[field] = store.promptData[field];
      }
    }
  });
  
  return JSON.stringify(data, null, 2);
}

function generateXMLFormat(orderedFields) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<prompt version="2.0">\n';
  xml += `  <metadata>\n`;
  xml += `    <created>${new Date().toISOString()}</created>\n`;
  xml += `    <generator>Prompt Builder Pro 2.0</generator>\n`;
  xml += `  </metadata>\n`;
  
  orderedFields.forEach(field => {
    if (store.promptData[field]) {
      if (field === 'instructions') {
        xml += `  <instructions>\n`;
        store.promptData[field].split('\n').filter(i => i.trim()).forEach(inst => {
          xml += `    <instruction>${escapeXML(inst.trim())}</instruction>\n`;
        });
        xml += `  </instructions>\n`;
      } else if (field === 'variables' && store.promptData.variables.length > 0) {
        xml += `  <variables>\n`;
        store.promptData.variables.forEach(v => {
          if (v.name) {
            xml += `    <variable name="${escapeXML(v.name)}">${escapeXML(v.value)}</variable>\n`;
          }
        });
        xml += `  </variables>\n`;
      } else if (field !== 'variables') {
        xml += `  <${field}>${escapeXML(store.promptData[field])}</${field}>\n`;
      }
    }
  });
  
  xml += '</prompt>';
  return xml;
}