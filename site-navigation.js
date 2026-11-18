(() => {
  const menu = document.querySelector('.mobile-menu');
  const summary = menu?.querySelector('summary');
  const mobile = window.matchMedia('(max-width: 800px)');

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

  const header = document.querySelector('.home-page > .site-header');
  if (!header) return;

  // requestAnimationFrame groups scroll reads. CSS handles prefers-reduced-motion for transitions.
  let referenceY = Math.max(0, window.scrollY);
  let visible = false;
  let frame = 0;

  function updateHeader() {
    frame = 0;
    const y = Math.max(0, window.scrollY);
    const floating = y > header.offsetHeight;
    const heldOpen = menu?.open || header.querySelector(':focus-visible');

    if (!floating || heldOpen) {
      referenceY = y;
      visible = floating && heldOpen;
    } else if (Math.abs(y - referenceY) >= 12) {
      visible = y < referenceY;
      referenceY = y;
    }

    header.classList.toggle('is-scroll-nav', floating);
    header.classList.toggle('is-scroll-nav-visible', visible);
    if (!floating) header.classList.remove('has-revealed-scroll-nav');
    else if (visible) header.classList.add('has-revealed-scroll-nav');
  }

  function scheduleHeader() {
    if (!frame) frame = requestAnimationFrame(updateHeader);
  }

  window.addEventListener('scroll', scheduleHeader, { passive: true });
  window.addEventListener('resize', scheduleHeader, { passive: true });
  window.addEventListener('pageshow', scheduleHeader);
  header.addEventListener('focusin', scheduleHeader);
  header.addEventListener('focusout', scheduleHeader);
  menu?.addEventListener('toggle', scheduleHeader);
  updateHeader();
})();
