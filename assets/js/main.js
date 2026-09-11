/**
 * Movato — coming soon.
 * Drives the language switcher and the HTML caption overlay.
 * Cue data lives in subtitles.js.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'movato.subtitle-lang'; // legacy key, cleared on load
  const SWAP_MS = 170; // fade-out before a caption line swaps text

  const video = document.getElementById('video');
  const caption = document.getElementById('caption');
  const lead = document.getElementById('captionLead');
  const accent = document.getElementById('captionAccent');
  const switcher = document.querySelector('.switcher');
  const fills = document.querySelectorAll('.fill');

  let lang = initialLanguage();
  let cues = cuesFor(lang);
  let accentIndex = -2; // -2 = nothing rendered yet, -1 = between cues

  /* ------------------------------------------------------------ language -- */

  /**
   * Always Armenian, on every load. Two things are deliberately ignored here:
   *
   *   the browser's Accept-Language — this is an Armenian business opening in
   *   Armenia, so a visitor arriving with an en-US or ru-RU browser should
   *   still land on Armenian and switch if they want to;
   *
   *   any previously stored choice — an earlier version remembered the last
   *   language across visits, which meant anyone who had ever clicked ENG kept
   *   getting an English page and the "default" was effectively whatever they
   *   last touched. The switch now lasts for the visit, not beyond it.
   */
  function initialLanguage() {
    const supported = SUBTITLE_LANGUAGES.map((l) => l.code);
    return supported.includes(DEFAULT_LANGUAGE) ? DEFAULT_LANGUAGE : supported[0];
  }

  function buildSwitcher() {
    SUBTITLE_LANGUAGES.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lang';
      button.textContent = entry.label;
      button.lang = entry.code;
      button.title = entry.name;
      button.setAttribute('aria-label', entry.name);
      button.dataset.lang = entry.code;
      button.addEventListener('click', () => setLanguage(entry.code));
      switcher.appendChild(button);
    });
  }

  function setLanguage(code) {
    lang = code;
    cues = cuesFor(code);
    document.documentElement.lang = code;

    switcher.querySelectorAll('.lang').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === code));
    });

    applyStrings();
    lead.textContent = cues.lead; // fixed line: swapped outright, never animated
    render(true); // instant re-render: switching language shouldn't re-animate

    // Deliberately not persisted — see initialLanguage(). Clearing the key an
    // earlier version wrote stops a stale value lingering in browsers that
    // already have one.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* private mode / blocked storage — nothing to clear */
    }

    // Lets modules loaded after this one (subscribe.js) retranslate their own
    // runtime strings, which applyStrings() cannot reach — it only walks
    // attributes, and a status message's text is chosen in JS.
    document.dispatchEvent(
      new CustomEvent('movato:languagechange', { detail: { lang: code } })
    );
  }

  function applyStrings() {
    const strings = UI_STRINGS[lang] || UI_STRINGS.hy;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = strings[el.dataset.i18n];
      if (value) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const value = strings[el.dataset.i18nAria];
      if (value) el.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const value = strings[el.dataset.i18nPlaceholder];
      if (value) el.placeholder = value;
    });
  }

  /* ------------------------------------------------------------- caption -- */

  function textAt(track, time) {
    for (let i = 0; i < track.length; i += 1) {
      if (time >= track[i].start && time < track[i].end) return i;
    }
    return -1;
  }

  /**
   * Animate one caption part. Fading out keeps the old glyphs in place until
   * they are invisible, so nothing around them reflows mid-fade.
   */
  function setPart(el, text, instant) {
    if (el.dataset.text === text) return;
    el.dataset.text = text;

    if (!text) {
      el.classList.remove('is-visible');
      return;
    }

    const swapIn = () => {
      el.textContent = text;
      if (instant) {
        el.classList.add('is-visible');
      } else {
        // Let the browser paint the offset state before transitioning in.
        requestAnimationFrame(() => {
          if (el.dataset.text === text) el.classList.add('is-visible');
        });
      }
    };

    window.clearTimeout(el.swapTimer);

    if (instant || !el.classList.contains('is-visible')) {
      swapIn();
    } else {
      el.classList.remove('is-visible');
      el.swapTimer = window.setTimeout(swapIn, SWAP_MS);
    }
  }

  function render(force) {
    const index = textAt(cues.accent, video.currentTime);
    if (index !== accentIndex || force) {
      accentIndex = index;
      setPart(accent, index >= 0 ? cues.accent[index].text : '', Boolean(force));
    }
  }

  function tick() {
    render(false);
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------- fills -- */

  /**
   * The ground and the caption patch only ever show a flat corner of the frame,
   * so they need exactly one frame each — but they point at the same 6MB file
   * as the visible clip. Loading all three at once made them race for
   * bandwidth: measured cold, the file came down twice and the banner did not
   * move until ~1s after navigation.
   *
   * So they start with no src at all and are given one only once the visible
   * video is playing. Until then the mask and the ground fall back to
   * --video-bg, which is the right colour to within a rendering path — and the
   * visible clip is showing its poster over that same span anyway.
   */
  let fillsStarted = false;

  function startFills() {
    if (fillsStarted) return;
    fillsStarted = true;

    fills.forEach((fill) => {
      const park = () => fill.pause();
      fill.addEventListener('loadeddata', park, { once: true });
      if (!fill.src && fill.dataset.src) {
        fill.preload = 'auto';
        fill.src = fill.dataset.src;
      }
      if (fill.readyState >= 2) park();
    });
  }

  video.addEventListener('playing', startFills, { once: true });
  // Autoplay can be refused, and a stalled network should not strand the
  // background colour on its CSS fallback for ever.
  window.setTimeout(startFills, 2500);

  /* ---------------------------------------------------------------- boot -- */

  buildSwitcher();
  setLanguage(lang);
  requestAnimationFrame(tick);

  // There are no controls, so if autoplay is refused (low-power mode, strict
  // settings) start on the first interaction instead of leaving a dead frame.
  function start() {
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        const kick = () => {
          video.play().catch(() => {});
          document.removeEventListener('pointerdown', kick);
          document.removeEventListener('keydown', kick);
        };
        document.addEventListener('pointerdown', kick);
        document.addEventListener('keydown', kick);
      });
    }
  }
  start();
})();
