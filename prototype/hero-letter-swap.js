(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }
    return items;
  }

  document.querySelectorAll('.hero-decision .hero-action').forEach((action) => {
    const label = action.querySelector('[data-letter-swap]');
    if (!label) return;

    const letters = [];
    const content = document.createDocumentFragment();

    for (const character of label.textContent) {
      if (character === ' ') {
        content.append(document.createTextNode(' '));
        continue;
      }

      const slot = document.createElement('span');
      slot.className = 'hero-action__char';

      const current = document.createElement('span');
      current.className = 'hero-action__char-current';
      current.textContent = character;

      const next = document.createElement('span');
      next.className = 'hero-action__char-next';
      next.textContent = character;

      slot.append(current, next);
      content.append(slot);
      letters.push(slot);
    }

    label.replaceChildren(content);

    const animate = () => {
      if (reduceMotion.matches) return;
      shuffle([...letters]).forEach((slot, index) => {
        slot.style.setProperty('--swap-delay', `${index * 20}ms`);
      });
      action.classList.add('is-swapping');
    };

    const reset = () => action.classList.remove('is-swapping');

    action.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') animate();
    });
    action.addEventListener('pointerleave', reset);
    action.addEventListener('focus', animate);
    action.addEventListener('blur', reset);
    reduceMotion.addEventListener('change', (event) => {
      if (event.matches) reset();
    });
  });
})();
