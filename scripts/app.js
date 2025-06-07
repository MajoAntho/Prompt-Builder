import {
  generateTextFormat,
  generateMarkdownFormat,
  generateJSONFormat,
  generateXMLFormat
} from "./preview.js";

let currentFormat = 'text';
let promptData = {};
let history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
let draggedElement = null;
let updateTimer = null;
// ====== Sauvegarde automatique (ajout) ======
let autoSaveTimer = null;
let lastAutoSaveData = null;
let saveIndicatorTimeout = null;

// ====== Annuler/Restaurer (HistoryManager) ======
class HistoryManager {
    constructor(maxSize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxSize = maxSize;
    }
    push(state) {
        // Si on a restauré puis modifié, on supprime le futur
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
const formHistory = new HistoryManager(50);

// Mets à jour les boutons Annuler/Restaurer
function updateUndoRedoButtons() {
    document.getElementById('undoBtn').disabled = !formHistory.canUndo();
    document.getElementById('redoBtn').disabled = !formHistory.canRedo();
}

// Ajoute l'état actuel à l'historique (appelé à chaque modif)
function pushFormHistory() {
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
    formHistory.push(data);
    updateUndoRedoButtons();
}

// Remplit le formulaire depuis un "state"
function fillFormFromHistory(state) {
    Object.entries(state).forEach(([field, value]) => {
        if (field === 'variables' && Array.isArray(value)) {
            const container = document.getElementById('variablesContainer');
            container.innerHTML = '';
            if (value.length === 0) {
                container.innerHTML = `
                    <div class="variable-item">
                        <input type="text" placeholder="Nom de la variable" class="var-name" />
                        <input type="text" placeholder="Valeur" class="var-value" />
                        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
                    </div>
                `;
            } else {
                value.forEach(v => {
                    const div = document.createElement('div');
                    div.className = 'variable-item';
                    div.innerHTML = `
                        <input type="text" placeholder="Nom de la variable" class="var-name" value="${v.name || ''}" />
                        <input type="text" placeholder="Valeur" class="var-value" value="${v.value || ''}" />
                        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
                    `;
                    container.appendChild(div);
                });
            }
            // Event listeners pour la validation live
            container.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => {
                    clearTimeout(updateTimer);
                    updateTimer = setTimeout(updatePreview, 300);
                });
            });
        } else if (field !== 'variables') {
            const element = document.getElementById(field);
            if (element) element.value = value;
        }
    });
    updatePreview();
}

// Fonctions appelées par les boutons Annuler/Restaurer
function undoForm() {
    const prev = formHistory.undo();
    if (prev) fillFormFromHistory(prev);
    updateUndoRedoButtons();
}
function redoForm() {
    const next = formHistory.redo();
    if (next) fillFormFromHistory(next);
    updateUndoRedoButtons();
}

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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderTemplateDropdown();
    setupDragAndDrop();
    setupEventListeners();
    loadHistory();
    checkURLParams();
    updatePreview(); // Mise à jour initiale
    const last = localStorage.getItem('promptBuilder_autosave');
    if (last) {
        setTimeout(() => {
            if (confirm('⚠️ Restaurer la dernière sauvegarde automatique ?')) {
                importFromData(JSON.parse(last));
                showSaveIndicator();
            }
        }, 700);
    }

    pushFormHistory();
    updateUndoRedoButtons();
});

// Gestion du thème
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

// Template dropdown
function renderTemplateDropdown() {
    const menu = document.getElementById('templateDropdownMenu');
    menu.innerHTML = '';

    Object.entries(templates).forEach(([key, template]) => {
        const option = document.createElement('div');
        option.className = 'template-option';
        option.onclick = () => selectTemplate(key);
        option.innerHTML = `
            <div class="template-option-icon">${template.icon}</div>
            <div class="template-option-content">
                <div class="template-option-name">${template.name}</div>
                <div class="template-option-desc">${template.desc}</div>
            </div>
        `;
        menu.appendChild(option);
    });
}

function toggleTemplateDropdown() {
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

function selectTemplate(key) {
    const template = templates[key];
    if (!template) return;

    // Mise à jour des champs
    Object.entries(template.data).forEach(([field, value]) => {
        const element = document.getElementById(field);
        if (element) {
            element.value = value;
        }
    });

    // Mise à jour du bouton
    document.getElementById('selectedTemplate').textContent = template.name;

    // Fermer le dropdown
    toggleTemplateDropdown();

    // Mise à jour de l'aperçu
    updatePreview();
    showToast(`Template "${template.name}" appliqué`, 'success');
}

// Fermer le dropdown en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.template-dropdown')) {
        const menu = document.getElementById('templateDropdownMenu');
        const button = document.querySelector('.template-button');
        menu.classList.remove('show');
        button.classList.remove('active');
    }
});

// Drag and Drop corrigé
function setupDragAndDrop() {
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

    draggedElement = e.target;
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

// Event Listeners avec mise à jour temps réel
function setupEventListeners() {
    // Mise à jour en temps réel pour tous les champs
    document.querySelectorAll('input, textarea').forEach(element => {
        element.addEventListener('input', () => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(updatePreview, 300);

            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => autoSave(true), 2000); // 2 sec

            pushFormHistory();
        });
    });

    document.querySelectorAll('input, textarea').forEach(element => {
        element.addEventListener('input', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => autoSave(true), 2000); // 2 sec
        });
    });

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    saveToHistory();
                    break;
                case 'd':
                    e.preventDefault();
                    downloadPrompt();
                    break;
                case 'k':
                    e.preventDefault();
                    document.getElementById('role').focus();
                    break;
                case 'z': // Annuler
                    e.preventDefault();
                    undoForm();
                    break;
                case 'y': // Restaurer
                    e.preventDefault();
                    redoForm();
                    break;
            }
        }
    });

}

// Mise à jour de l'aperçu améliorée
function updatePreview() {
    const loader = document.getElementById('previewLoader');
    loader.style.display = 'inline-block';

    const container = document.getElementById('formFieldsContainer');
    const orderedFields = [...container.querySelectorAll('.form-group')].map(group => group.dataset.field);

    promptData = {};
    orderedFields.forEach(field => {
        if (field === 'variables') {
            promptData[field] = getVariables();
        } else {
            const element = document.getElementById(field);
            if (element && element.value) {
                promptData[field] = element.value;
            }
        }
    });

    let preview = '';
    const hasContent = Object.keys(promptData).some(key => {
        if (key === 'variables') return promptData[key].length > 0;
        return promptData[key];
    });

    if (!hasContent) {
        preview = `<div class="preview-placeholder">
            <div class="preview-placeholder-icon">📝</div>
            <div>Commencez à remplir le formulaire pour voir l'aperçu...</div>
        </div>`;
        document.getElementById('previewContent').innerHTML = preview;
    } else {
        switch(currentFormat) {
    case 'text':
        preview = generateTextFormat(orderedFields, promptData);
        break;
    case 'markdown':
        preview = generateMarkdownFormat(orderedFields, promptData);
        break;
    case 'json':
        preview = generateJSONFormat(orderedFields, promptData);
        break;
    case 'xml':
        preview = generateXMLFormat(orderedFields, promptData);
        break;
}
        document.getElementById('previewContent').textContent = preview;
    }

    setTimeout(() => {
        loader.style.display = 'none';
    }, 300);
}

// Sauvegarde automatique du formulaire dans localStorage toutes les 5 secondes
function autoSave(showIndicator = true) {
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
    // Ne sauvegarde que si le contenu a changé
    if (JSON.stringify(data) === JSON.stringify(lastAutoSaveData)) return;
    localStorage.setItem('promptBuilder_autosave', JSON.stringify(data));
    lastAutoSaveData = data;
    if (showIndicator) showSaveIndicator();
}

// Affiche l'indicateur 'sauvegardé'
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (!indicator) return;
    indicator.style.display = 'flex';
    indicator.classList.add('saved');
    clearTimeout(saveIndicatorTimeout);
    saveIndicatorTimeout = setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

// Variables
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

function addVariable() {
    const container = document.getElementById('variablesContainer');
    const div = document.createElement('div');
    div.className = 'variable-item';
    div.innerHTML = `
        <input type="text" placeholder="Nom de la variable" class="var-name" />
        <input type="text" placeholder="Valeur" class="var-value" />
        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
    `;
    container.appendChild(div);

    // Ajouter les event listeners
    div.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(updatePreview, 300);
        });
    });

    showToast('Variable ajoutée', 'success');
}

function removeVariable(btn) {
    btn.parentElement.remove();
    updatePreview();
    showToast('Variable supprimée', 'info');
}

// Format switching
function switchFormat(format) {
    currentFormat = format;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    updatePreview();
}

// Actions
function copyToClipboard() {
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

function downloadPrompt() {
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
    a.download = `prompt_${timestamp}.${extensions[currentFormat]}`;
    a.click();
    window.URL.revokeObjectURL(url);

    saveToHistory();
    showToast('💾 Téléchargé avec succès!', 'success');
}

function sharePrompt() {
    if (Object.keys(promptData).length === 0) {
        showToast('Rien à partager pour le moment', 'warning');
        return;
    }

    const data = btoa(JSON.stringify(promptData));
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

function clearForm() {
    if (confirm('Voulez-vous vraiment réinitialiser le formulaire?')) {
        document.querySelectorAll('input, textarea').forEach(el => el.value = '');
        document.getElementById('variablesContainer').innerHTML = `
            <div class="variable-item">
                <input type="text" placeholder="Nom de la variable" class="var-name" />
                <input type="text" placeholder="Valeur" class="var-value" />
                <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
            </div>
        `;
        document.getElementById('selectedTemplate').textContent = '-- Choisir un template --';

        // Réajouter les event listeners
        document.querySelectorAll('input, textarea').forEach(element => {
            element.addEventListener('input', () => {
                clearTimeout(updateTimer);
                updateTimer = setTimeout(updatePreview, 300);
            });
        });

        updatePreview();
        showToast('🗑️ Formulaire réinitialisé!', 'info');
    }
}

// Toast amélioré
function showToast(message, type = 'success') {
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

    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Historique
function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    panel.classList.toggle('active');
}

function saveToHistory() {
    if (Object.keys(promptData).length === 0) return;

    const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString('fr-FR'),
        data: promptData,
        format: currentFormat,
        preview: document.getElementById('previewContent').textContent.substring(0, 100) + '...'
    };

    history.unshift(historyItem);
    if (history.length > 20) history.pop();

    localStorage.setItem('promptHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">Aucun historique</p>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadFromHistory(${item.id})">
            <div class="history-date">${item.date}</div>
            <div class="history-preview">${item.preview}</div>
        </div>
    `).join('');
}

function loadFromHistory(id) {
    const item = history.find(h => h.id === id);
    if (!item) return;

    // Charger les données
    Object.entries(item.data).forEach(([field, value]) => {
        if (field === 'variables') {
            const container = document.getElementById('variablesContainer');
            container.innerHTML = '';
            if (value.length === 0) {
                container.innerHTML = `
                    <div class="variable-item">
                        <input type="text" placeholder="Nom de la variable" class="var-name" />
                        <input type="text" placeholder="Valeur" class="var-value" />
                        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
                    </div>
                `;
            } else {
                value.forEach(v => {
                    const div = document.createElement('div');
                    div.className = 'variable-item';
                    div.innerHTML = `
                        <input type="text" placeholder="Nom de la variable" class="var-name" value="${v.name || ''}" />
                        <input type="text" placeholder="Valeur" class="var-value" value="${v.value || ''}" />
                        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
                    `;
                    container.appendChild(div);
                });
            }
            // Réajouter les event listeners
            container.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => {
                    clearTimeout(updateTimer);
                    updateTimer = setTimeout(updatePreview, 300);
                });
            });
        } else {
            const element = document.getElementById(field);
            if (element) element.value = value;
        }
    });

    updatePreview();
    toggleHistory();
    showToast('Prompt chargé depuis l\'historique', 'info');
}

// Import/Export
function showImportModal() {
    document.getElementById('importModal').classList.add('active');
    document.getElementById('importTextarea').focus();
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
    document.getElementById('importTextarea').value = '';
    document.getElementById('detectedFormat').textContent = '-';
}

// Détection du format en temps réel
document.getElementById('importTextarea').addEventListener('input', (e) => {
    const content = e.target.value.trim();
    let format = '-';

    if (content.startsWith('{')) format = 'JSON';
    else if (content.startsWith('<?xml')) format = 'XML';
    else if (content.includes('#')) format = 'Markdown';
    else if (content) format = 'Texte';

    document.getElementById('detectedFormat').textContent = format;
});

function importPrompt() {
    const content = document.getElementById('importTextarea').value.trim();
    if (!content) {
        showToast('Veuillez coller un prompt', 'warning');
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
        closeImportModal();
        showToast('✅ Prompt importé avec succès!', 'success');
    } catch (error) {
        console.error('Erreur d\'import:', error);
        showToast('❌ Format non reconnu', 'error');
    }
}

function importFromData(data) {
    // Réinitialiser d'abord
    document.querySelectorAll('input, textarea').forEach(el => el.value = '');

    // Charger les données
    Object.entries(data).forEach(([field, value]) => {
        if (field === 'variables' && Array.isArray(value)) {
            const container = document.getElementById('variablesContainer');
            container.innerHTML = '';
            if (value.length === 0) {
                container.innerHTML = `
                    <div class="variable-item">
                        <input type="text" placeholder="Nom de la variable" class="var-name" />
                        <input type="text" placeholder="Valeur" class="var-value" />
                        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
                    </div>
                `;
            } else {
                value.forEach(v => {
                    const div = document.createElement('div');
                    div.className = 'variable-item';
                    div.innerHTML = `
                        <input type="text" placeholder="Nom de la variable" class="var-name" value="${v.name || ''}" />
                        <input type="text" placeholder="Valeur" class="var-value" value="${v.value || ''}" />
                        <button class="btn btn-danger" onclick="removeVariable(this)">✕</button>
                    `;
                    container.appendChild(div);
                });
            }
            // Réajouter les event listeners
            container.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => {
                    clearTimeout(updateTimer);
                    updateTimer = setTimeout(updatePreview, 300);
                });
            });
        } else if (field !== 'variables') {
            const element = document.getElementById(field);
            if (element) element.value = value;
        }
    });

    updatePreview();
}

// Vérifier les paramètres URL
function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (data) {
        try {
            const promptData = JSON.parse(atob(data));
            importFromData(promptData);
            showToast('Prompt chargé depuis le lien', 'info');

            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Erreur de chargement:', error);
        }
    }
}
// Lancement de la sauvegarde toutes les 5 secondes
setInterval(() => autoSave(false), 5000);
// ====== ACCESSIBILITÉ : Focus trap pour le modal Import ======
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('importModal');
    if (!modal.classList.contains('active')) return;
    // Touche Échap pour fermer
    if (e.key === 'Escape') {
        closeImportModal();
    }
    // Focus trap
    const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), textarea');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
        if (e.shiftKey) { // shift + tab
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else { // tab
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
});
