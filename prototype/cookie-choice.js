/* Consent choice stays on this origin; no analytics request is made here. */
(() => {
  'use strict';
  const key = 'lime.analytics-consent.v1';
  const version = 1;
  const duration = 180 * 86400000;
  let memory = null;
  let returnFocus = null;
  let banner;
  function read() {
    let item;
    try { const raw = localStorage.getItem(key); item = raw ? JSON.parse(raw) : memory; } catch { item = memory; }
    return item && item.version === version && ['accepted', 'necessary'].includes(item.choice) && Number.isFinite(item.expires) && item.expires > Date.now() ? item : null;
  }
  function clearAnalyticsCookies() {
    // Only this counter's first-party identifiers; third-party Yandex cookies are inaccessible.
    for (const name of document.cookie.split(';').map(x => x.trim().split('=')[0]).filter(x => x.startsWith('_ym_'))) {
      for (const domain of ['', location.hostname, '.lime-padel.ru']) {
        for (const path of ['/', '/prototype', '/prototype/', '/privacy', '/privacy/']) {
          document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax${domain ? '; Domain=' + domain : ''}`;
        }
      }
    }
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const name = localStorage.key(i);
        if (name && name.startsWith('_ym')) localStorage.removeItem(name);
      }
    } catch {}
  }
  function apply(item) {
    if (item && item.choice === 'accepted') window.LimeAnalytics?.enable();
    else {
      clearAnalyticsCookies();
      window.LimeAnalytics?.disable();
    }
  }
  function choose(choice) {
    const item = {version, choice, expires: Date.now() + duration};
    memory = item;
    try { localStorage.setItem(key, JSON.stringify(item)); } catch {}
    banner.hidden = true;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    else {
      const main = document.querySelector('main');
      main?.setAttribute('tabindex', '-1');
      main?.focus({preventScroll:true});
    }
    apply(item);
  }
  function open(event) {
    returnFocus = event.currentTarget;
    banner.hidden = false;
    banner.querySelector('button').focus({preventScroll:true});
  }
  function init() {
    const policyLink = document.querySelector('.site-footer__privacy');
    const policyURL = policyLink ? policyLink.getAttribute('href') : '../privacy/index.html';
    banner = document.createElement('section');
    banner.className = 'cookie-choice';
    banner.setAttribute('aria-label', 'Настройки cookie');
    banner.innerHTML = `<div class="cookie-choice__copy"><p>Мы используем cookie для аналитики и улучшения сайта. Подробнее — <a href="${policyURL}#services">Политика обработки персональных данных</a></p></div><div class="cookie-choice__actions"><button type="button" data-cookie-necessary>Только необходимые</button><button type="button" data-cookie-accept>Принять всё</button></div>`;
    document.body.append(banner);
    banner.querySelector('[data-cookie-necessary]').addEventListener('click', () => choose('necessary'));
    banner.querySelector('[data-cookie-accept]').addEventListener('click', () => choose('accepted'));
    const footer = document.querySelector('.site-footer__bottom');
    if (footer) {
      const settings = document.createElement('button');
      settings.type = 'button';
      settings.className = 'cookie-settings';
      settings.setAttribute('data-cookie-settings', '');
      settings.textContent = 'Настройки cookie';
      footer.append(settings);
    }
    document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', open));
    const item = read();
    banner.hidden = Boolean(item);
    apply(item);
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      memory = null;
      const next = read();
      banner.hidden = Boolean(next);
      apply(next);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      const next = read();
      if (!next) banner.hidden = false;
      apply(next);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
