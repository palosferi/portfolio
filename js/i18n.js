/* Pálos Ferenc — portfolio
   Bilingual layer (English / Hungarian). No dependencies, no build step.

   The pages are authored in English; Hungarian is applied over the top, so if a
   key is ever missing the English text simply stays put.

   A page opts in like this:

     1. <script src="js/i18n.js"></script>      in <head>, NOT deferred
     2. <script>I18n.use({ en: {...}, hu: {...} });</script>   right after it
     3. mark the text up:
          <h2 data-i18n="about.h">About</h2>
          <p data-i18n-html="about.lead">text with <a href="#">a link</a></p>
          <input data-i18n-attr="placeholder:search.placeholder">
          <meta name="description" data-i18n-attr="content:meta.description" content="…">
     4. drop <div class="lang-switch" data-lang-switch></div> where the toggle goes.

   Which language wins, in order: ?lang= in the URL, the visitor's last choice,
   the browser's own languages, then English.
*/

window.I18n = (function () {
  'use strict';

  var DEFAULT   = 'en';
  var SUPPORTED = ['en', 'hu'];
  var NAMES     = { en: 'English', hu: 'Magyar' };
  var STORE     = 'pf-lang';

  var dict      = { en: {}, hu: {} };
  var listeners = [];
  var started   = false;
  var lang      = resolve();

  /* ---------- choosing a language ---------- */

  function known(value) {
    return SUPPORTED.indexOf(value) > -1 ? value : null;
  }

  function fromUrl() {
    try { return new URLSearchParams(location.search).get('lang'); }
    catch (e) { return null; }
  }

  function fromStore() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }

  function fromBrowser() {
    var tags = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < tags.length; i++) {
      var code = String(tags[i]).slice(0, 2).toLowerCase();
      if (known(code)) return code;
    }
    return null;
  }

  function resolve() {
    return known(fromUrl()) || known(fromStore()) || fromBrowser() || DEFAULT;
  }

  /* ---------- hide the page for the split second it reads the wrong language ---------- */

  var veil = null;

  if (lang !== DEFAULT && document.head) {
    veil = document.createElement('style');
    veil.textContent = 'body{visibility:hidden}';
    document.head.appendChild(veil);
    setTimeout(unveil, 700);   /* never leave the page hidden, whatever happens */
  }

  function unveil() {
    if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
    veil = null;
  }

  document.documentElement.lang = lang;

  /* ---------- looking strings up ---------- */

  function use(tables) {
    SUPPORTED.forEach(function (code) {
      var add = tables[code];
      if (!add) return;
      for (var key in add) {
        if (Object.prototype.hasOwnProperty.call(add, key)) dict[code][key] = add[key];
      }
    });
    if (started) refresh();
  }

  function t(key) {
    if (key in dict[lang]) return dict[lang][key];
    if (key in dict[DEFAULT]) return dict[DEFAULT][key];
    return null;
  }

  /* Data can carry both languages inline: { en: '…', hu: '…' }. A plain string
     is a value that is the same in both — a title, a name, a year. */
  function pick(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value[lang] != null ? value[lang] : value[DEFAULT];
    }
    return value;
  }

  /* ---------- putting them on the page ---------- */

  function apply(root) {
    var scope = root || document;
    var i, nodes;

    nodes = scope.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      var text = t(nodes[i].getAttribute('data-i18n'));
      if (text != null) nodes[i].textContent = text;
    }

    nodes = scope.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < nodes.length; i++) {
      var html = t(nodes[i].getAttribute('data-i18n-html'));
      if (html != null) nodes[i].innerHTML = html;
    }

    /* data-i18n-attr="placeholder:search.placeholder, aria-label:filters.label" */
    nodes = scope.querySelectorAll('[data-i18n-attr]');
    for (i = 0; i < nodes.length; i++) {
      applyAttrs(nodes[i], nodes[i].getAttribute('data-i18n-attr'));
    }
  }

  function applyAttrs(el, spec) {
    spec.split(',').forEach(function (pair) {
      var at = pair.indexOf(':');
      if (at < 0) return;
      var attr  = pair.slice(0, at).trim();
      var value = t(pair.slice(at + 1).trim());
      if (attr && value != null) el.setAttribute(attr, value);
    });
  }

  /* ---------- the toggle itself ---------- */

  function mount(root) {
    var hosts = (root || document).querySelectorAll('[data-lang-switch]');
    for (var i = 0; i < hosts.length; i++) build(hosts[i]);
  }

  function build(host) {
    host.textContent = '';
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', t('lang.label') || 'Language');

    SUPPORTED.forEach(function (code) {
      var button = document.createElement('button');
      button.type      = 'button';
      button.className = 'lang-btn';
      button.lang      = code;
      button.textContent = code.toUpperCase();
      button.setAttribute('aria-label', NAMES[code]);
      button.setAttribute('aria-pressed', String(code === lang));
      button.addEventListener('click', function () { set(code); });
      host.appendChild(button);
    });
  }

  /* ---------- switching ---------- */

  function set(next) {
    next = known(next);
    if (!next || next === lang) return;

    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    try {
      var url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url.toString());
    } catch (e) {}

    refresh();
  }

  function refresh() {
    apply();
    mount();
    listeners.forEach(function (fn) { fn(lang); });
  }

  /* Registered before the page is ready: called once on start, then on every
     switch. Registered afterwards: called straight away. */
  function onChange(fn) {
    listeners.push(fn);
    if (started) fn(lang);
  }

  function start() {
    started = true;
    refresh();
    unveil();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  var api = { use: use, t: t, pick: pick, apply: apply, mount: mount,
              set: set, onChange: onChange,
              SUPPORTED: SUPPORTED, DEFAULT: DEFAULT, NAMES: NAMES };

  Object.defineProperty(api, 'lang', { get: function () { return lang; } });

  return api;
})();
