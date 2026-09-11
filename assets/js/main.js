/**
 * Movato — coming soon.
 * Drives the language switcher and the rotating banner clip.
 *
 * The clips carry their own words in their pixels, so nothing is drawn over
 * them: this file picks one, plays it, and picks another when it ends. Copy
 * lives in subtitles.js, the clip list in videos.js.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'movato.subtitle-lang'; // legacy key, cleared on load

  const switcher = document.querySelector('.switcher');
  const fills = document.querySelectorAll('.fill');

  // Two buffers: one plays while the next clip decodes in the other.
  let active = document.getElementById('videoA');
  let standby = document.getElementById('videoB');

  // Read from the stylesheet so the duration lives in one place — CSS runs the
  // fade, and prefers-reduced-motion shortens it there.
  const FADE_MS = fadeMs();

  /**
   * Start fetching the next clip once the current one is this far through.
   * Not on load: a visitor who leaves after a few seconds should cost one clip,
   * not two. Not at the very end either — ~7s of a 12s clip is enough headroom
   * to pull ~9MB on a normal connection, and if it is not ready in time the
   * rotation waits rather than cutting to a blank frame.
   */
  const PRELOAD_AT = 0.4;

  let lang = initialLanguage();
  let current = null; // the clip on screen
  let queued = null; // the clip decoding in `standby`
  let swapping = false;

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
    document.documentElement.lang = code;

    switcher.querySelectorAll('.lang').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === code));
    });

    applyStrings();

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

  /* ---------------------------------------------------------------- clip -- */

  function fadeMs() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--clip-fade').trim();
    const n = parseFloat(raw);
    if (!n) return 550;
    return raw.endsWith('ms') ? n : n * 1000;
  }

  /** Load `src` into the idle buffer so it is decoded before it is needed. */
  function queue(src) {
    if (queued === src) return;
    queued = src;
    standby.src = src;
    standby.load();
  }

  /**
   * Crossfade to the queued clip.
   *
   * The outgoing element is the one that fades — the incoming one is already
   * opaque beneath it. Fading both would dip the middle of the transition
   * toward --video-bg, the one teal that does not match the clip.
   *
   * If the queued clip has not buffered yet the swap waits for it. A finished
   * video holds its last frame, so waiting shows a still rather than a gap.
   */
  function swap() {
    if (swapping || !queued) return;
    swapping = true;

    const run = () => {
      const outgoing = active;
      const incoming = standby;

      incoming.currentTime = 0;
      const attempt = incoming.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});

      // Claim the role now, so the outgoing clip's own `ended` — which lands
      // mid-dissolve now — cannot start a second swap.
      active = incoming;
      standby = outgoing;
      current = queued;
      queued = null;

      // Begin the dissolve only once the incoming clip is really rendering.
      // play() resolves before the first frame is composited, so starting on
      // it alone spent the first ~100ms dissolving into a still.
      let started = false;
      const beginFade = () => {
        if (started) return;
        started = true;
        dissolve(outgoing, incoming);
      };
      incoming.addEventListener('playing', beginFade, { once: true });
      // Autoplay refused, or a decoder that never reports playing: dissolve
      // anyway rather than leaving the finished clip on screen for ever.
      window.setTimeout(beginFade, 400);
    };

    // readyState 3 = HAVE_FUTURE_DATA: enough decoded to paint and keep going.
    if (standby.readyState >= 3) run();
    else standby.addEventListener('canplay', run, { once: true });
  }

  /** Hand the frame from `outgoing` to `incoming` over --clip-fade. */
  function dissolve(outgoing, incoming) {
    incoming.classList.add('is-active');
    incoming.removeAttribute('aria-hidden');
    incoming.removeAttribute('tabindex');
    outgoing.classList.remove('is-active');
    outgoing.classList.add('is-leaving');
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.tabIndex = -1;

    // Only once the fade has finished: pausing the outgoing element while it
    // is still visible would freeze it mid-dissolve. Its src is left in place —
    // queue() overwrites it next rotation, and clearing it here would run the
    // resource-selection algorithm on a source-less element, which the error
    // handler would then have to ignore.
    window.setTimeout(() => {
      outgoing.classList.remove('is-leaving');
      outgoing.pause();
      swapping = false;
    }, FADE_MS);

    showFill(current);
  }

  /**
   * Put the first clip on screen. Only used once — every later change goes
   * through queue() and swap().
   */
  function begin(src) {
    current = src;
    active.src = src;
    active.load();
    start(active);
    showFill(src);
  }

  function bind(el) {
    // Fallback only. With the handover above, a clip normally passes the frame
    // on before it ends; this catches one whose timeupdate never lands inside
    // the last --clip-fade, and the first rotation if the next clip was still
    // downloading by then.
    el.addEventListener('ended', () => {
      if (el === active) swap();
    });

    el.addEventListener('timeupdate', () => {
      if (el !== active || swapping || !el.duration) return;

      // Preload the next clip partway through this one.
      if (!queued) {
        if (el.currentTime / el.duration >= PRELOAD_AT) queue(pickVideo(current));
        return;
      }

      // Hand over while this clip is still running, so the dissolve is between
      // two moving images. Waiting for `ended` faded out of a frozen last
      // frame, which reads as a stall however long the fade is — the single
      // biggest thing that made the swap noticeable.
      if (el.duration - el.currentTime <= FADE_MS / 1000) swap();
    });

    // A clip that fails to load would otherwise end the rotation for the visit.
    el.addEventListener('error', () => {
      if (el !== active) {
        queued = null;
        return;
      }
      const next = pickVideo(current);
      if (next !== current) {
        current = next;
        el.src = next;
        el.load();
        start(el);
      }
    });
  }

  /**
   * There are no controls, so if autoplay is refused (low-power mode, strict
   * settings) start on the first interaction instead of leaving a dead frame.
   */
  function start(el) {
    const attempt = el.play();
    if (!attempt || typeof attempt.catch !== 'function') return;
    attempt.catch(() => {
      const kick = () => {
        el.play().catch(() => {});
        document.removeEventListener('pointerdown', kick);
        document.removeEventListener('keydown', kick);
      };
      document.addEventListener('pointerdown', kick);
      document.addEventListener('keydown', kick);
    });
  }

  /* ---------------------------------------------------------------- fills -- */

  /**
   * The fills only ever show a flat corner of the frame, so they need exactly
   * one frame each — but they point at the same multi-megabyte file as the
   * visible clip. Loading all three at once made them race for bandwidth:
   * measured cold, the file came down twice and the banner did not move until
   * ~1s after navigation.
   *
   * So they start with no src at all and are given one only once the visible
   * video is playing. Until then they fall back to --video-bg, which is the
   * right colour to within a rendering path.
   */
  let fillsStarted = false;
  let fillSrc = null;

  /**
   * Give the fills a clip to paint the header band from — once per visit.
   *
   * They are deliberately NOT re-pointed on each rotation. A <video> shows
   * through to its parent's background until a new source decodes, so
   * reloading them mid-rotation flashed the band to --video-bg — the one teal
   * that does not match a decoded clip, and the entire reason these elements
   * exist. A flash every twelve seconds is far more noticeable than any
   * difference between the clips, which are four renders of the same piece at
   * the same brand teal.
   *
   * If a future clip is graded differently its band will not match, and the
   * fix is to crossfade a second pair of fills, not to reload these.
   */
  function showFill(src) {
    if (fillSrc) return;
    fillSrc = src;
    if (!fillsStarted) return;
    fills.forEach((fill) => {
      fill.src = src;
      fill.load();
    });
  }

  function startFills() {
    if (fillsStarted) return;
    fillsStarted = true;

    fills.forEach((fill) => {
      const park = () => fill.pause();
      fill.addEventListener('loadeddata', park, { once: true });
      if (!fill.src && fillSrc) {
        fill.preload = 'auto';
        fill.src = fillSrc;
      }
      if (fill.readyState >= 2) park();
    });
  }

  active.addEventListener('playing', startFills, { once: true });
  // Autoplay can be refused, and a stalled network should not strand the
  // background colour on its CSS fallback for ever.
  window.setTimeout(startFills, 2500);

  /* ---------------------------------------------------------------- boot -- */

  buildSwitcher();
  setLanguage(lang);

  bind(document.getElementById('videoA'));
  bind(document.getElementById('videoB'));

  // Nothing is preloaded in the markup, so a visitor who leaves early fetches
  // exactly one clip, and which one they open on is genuinely random.
  begin(pickVideo(null));
})();
