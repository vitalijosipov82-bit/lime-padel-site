(() => {
  const menu = document.querySelector('.mobile-menu');
  const summary = menu?.querySelector('summary');
  const mobile = window.matchMedia('(max-width: 1199px)');

  function closeMenu(returnFocus = false) {
    if (!menu?.open) return;
    menu.open = false;
    if (returnFocus) summary.focus();
  }
  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.open) {
      event.preventDefault();
      closeMenu(true);
    }
  });
  document.addEventListener('click', (event) => {
    if (menu?.open && !menu.contains(event.target)) closeMenu();
  });
  mobile.addEventListener('change', () => { if (!mobile.matches) closeMenu(); });

  // Header visibility is fixed in CSS; scrolling never toggles its state.
})();
