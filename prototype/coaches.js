// «Тренеры» (#coaches): оборот карточки «Ещё о…» → «Назад к фото».
// Без скрипта обратная сторона показана списком под карточкой (см. coaches.css).
(() => {
  const section = document.getElementById('coaches');
  if (!section) return;

  section.querySelectorAll('.coaches__card').forEach((card) => {
    const front = card.querySelector('.coaches__front');
    const back = card.querySelector('.coaches__back');
    const open = front.querySelector('.coaches__turn');
    const ret = back.querySelector('.coaches__return');
    if (!front || !back || !open || !ret) return;

    open.hidden = false;
    ret.hidden = false;
    back.inert = true;

    const flip = (on) => {
      card.classList.toggle('is-flipped', on);
      open.setAttribute('aria-expanded', String(on));
      front.inert = on;
      back.inert = !on;
      (on ? ret : open).focus({ preventScroll: true });
    };
    open.addEventListener('click', () => flip(true));
    ret.addEventListener('click', () => flip(false));
    back.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') flip(false);
    });
  });

  section.classList.add('is-flip-ready');
})();
