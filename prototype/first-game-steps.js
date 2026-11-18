(() => {
  const steps = document.querySelector('.first-game-steps');
  if (!steps) return;

  const switcher = steps.querySelector('.first-game-steps__switch');
  const buttons = [...switcher.querySelectorAll('button')];
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
  if (panels.some(panel => !panel || !steps.contains(panel))) return;

  const wide = matchMedia('(min-width: 761px)');
  let active = 0;

  function show(index, animate = false) {
    active = index;
    switcher.hidden = !wide.matches;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    panels.forEach((panel, i) => {
      panel.hidden = wide.matches && i !== index;
      panel.classList.toggle('is-step-entering', animate && i === index);
    });
  }

  buttons.forEach((button, i) => button.addEventListener('click', () => {
    if (i !== active) show(i, true);
  }));
  wide.addEventListener('change', () => show(active));
  show(active);
})();
