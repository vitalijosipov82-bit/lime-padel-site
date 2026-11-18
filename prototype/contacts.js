(() => {
  function settleAnchor() {
    if (location.hash !== '#contacts') return;
    document.querySelector('#contacts')?.scrollIntoView({ behavior: 'instant' });
  }
  // One initial position correction after the local fonts settle; no scrolling interception.
  (document.fonts?.ready || Promise.resolve()).then(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) settleAnchor();
    else requestAnimationFrame(settleAnchor);
  });

  const shell = document.querySelector('[data-map-shell]');
  const frame = shell?.querySelector('iframe');
  if (!frame) return;
  let started = false;
  function loadMap() {
    if (started) return;
    started = true;
    frame.src = frame.dataset.mapSrc;
    window.setTimeout(() => {
      if (!shell.hasAttribute('data-map-loaded')) {
        shell.querySelector('[role="status"]').textContent = 'Если карта не появилась, открой Яндекс Карты или 2ГИС';
      }
    }, 12000);
  }
  frame.addEventListener('load', () => {
    if (!frame.getAttribute('src')) return;
    // Cross-origin load is a UI state, not proof that the provider rendered a successful map.
    shell.setAttribute('data-map-loaded', '');
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadMap();
        observer.disconnect();
      }
    }, { rootMargin: '500px 0px' });
    observer.observe(shell);
  } else loadMap();
})();
