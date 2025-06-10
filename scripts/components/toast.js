// Toast system - showToast, hideToast, createToast

let toastQueue = [];
let isToastVisible = false;

function createToast(message, type = 'info', duration = 4000) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.tabIndex = 0;

  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast__close" aria-label="Fermer" tabindex="0">&times;</button>
  `;

  // Fermeture manuelle
  toast.querySelector('.toast__close').onclick = () => hideToast(toast);

  // Fermeture clavier (Échap)
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideToast(toast);
  });

  container.appendChild(toast);

  setTimeout(() => {
    hideToast(toast);
  }, duration);

  // Animation de sortie
  toast.addEventListener('animationend', (e) => {
    if (e.animationName === 'toast-out') {
      container.removeChild(toast);
      isToastVisible = false;
      if (toastQueue.length > 0) {
        const next = toastQueue.shift();
        showToast(next.message, next.type, next.duration);
      }
    }
  });
}

function showToast(message, type = 'info', duration = 4000) {
  if (isToastVisible) {
    toastQueue.push({ message, type, duration });
    return;
  }
  isToastVisible = true;
  createToast(message, type, duration);
}

function hideToast(toastEl) {
  toastEl.style.animation = 'toast-out 0.3s forwards';
}

function getToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

// Export pour intégration
export { showToast, hideToast, createToast };
