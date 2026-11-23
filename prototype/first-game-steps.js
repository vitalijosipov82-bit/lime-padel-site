(() => {
  const route = document.querySelector('.first-game-steps__list');
  if (!route || !('IntersectionObserver' in window)) return;

  const steps = [...route.children];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = steps[0];
  let observer;

  function mark(step) {
    if (step === active) return;
    active.removeAttribute('data-step-active');
    step.setAttribute('data-step-active', '');
    active = step;
  }

  function observeReadingLine() {
    observer?.disconnect();
    if (motion.matches) {
      mark(steps[0]);
      return;
    }

    const readingLine = Math.round(innerHeight * .52);
    observer = new IntersectionObserver((entries) => {
      const step = entries.find(entry => entry.isIntersecting)?.target;
      if (step) mark(step);
    }, { rootMargin: `-${readingLine}px 0px -${innerHeight - readingLine - 1}px` });

    steps.forEach(step => observer.observe(step));
  }

  route.addEventListener('focusin', (event) => {
    const step = event.target.closest('li');
    if (step && !motion.matches) mark(step);
  });
  window.addEventListener('resize', observeReadingLine);
  motion.addEventListener('change', observeReadingLine);
  observeReadingLine();
})();
