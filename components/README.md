# V4 Design System – Composants

## Bouton (`.btn`)

### Exemples HTML

```html
<button class="btn btn--primary">Action principale</button>
<button class="btn btn--secondary">Action secondaire</button>
<button class="btn btn--danger">Supprimer</button>
<button class="btn btn--ghost">Action fantôme</button>
<button class="btn btn--primary" disabled aria-disabled="true">Désactivé</button>
<button class="btn btn--primary" aria-busy="true">
  <span class="btn__spinner" aria-hidden="true"></span>
  Chargement...
</button>
```

### Accessibilité

- Utiliser `aria-disabled="true"` pour les boutons désactivés.
- Focus visible (`:focus-visible`) pour la navigation clavier.
- Raccourci clavier : `<button accesskey="a">` pour un accès rapide.

---

## Carte (`.card`)

### Exemples HTML

```html
<div class="card">
  <div class="card__header">Titre</div>
  <div class="card__content">Contenu</div>
  <div class="card__actions">
    <button class="btn btn--primary">Action</button>
  </div>
</div>
<div class="card card--simple">
  <div class="card__content">Carte simple</div>
</div>
```

### Accessibilité

- Utiliser `role="region"` et `aria-labelledby` pour les cartes importantes.
- Les actions doivent être accessibles au clavier.

---

## Toast (`.toast`)

### Exemples HTML

```html
<div class="toast toast--success" role="status" aria-live="polite">
  Succès ! <button class="toast__close" aria-label="Fermer">&times;</button>
</div>
```

### Utilisation JS

```js
showToast('Succès !', 'success');
showToast('Erreur survenue', 'error');
```

### Accessibilité

- `role="status"` et `aria-live="polite"` pour l'annonce vocale.
- Bouton de fermeture accessible (`aria-label="Fermer"`, focusable).
- Raccourci clavier : `Échap` pour fermer le toast.

---

## Guidelines

- Toujours utiliser les classes du design system.
- Respecter les tokens pour la cohérence visuelle.
- Tester au clavier et avec un lecteur d'écran.
