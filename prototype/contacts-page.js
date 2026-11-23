// Chrome exposes focus inside a cross-origin map through activeElement,
// while neither :focus nor :focus-visible matches the iframe itself.
(() => {
  const map = document.querySelector('.contact-page__map');
  if (!map) return;
  const syncFocus = () => map.toggleAttribute('data-map-focused', document.activeElement === map);
  window.addEventListener('blur', () => setTimeout(syncFocus, 0));
  window.addEventListener('focus', syncFocus);
  document.addEventListener('focusin', syncFocus);
})();
