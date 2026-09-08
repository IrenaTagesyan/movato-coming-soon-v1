/**
 * Movato — coming soon.
 * Sign-up capture. POSTs the visitor's email to
 * `${API_BASE_URL}${SUBSCRIBE_PATH}` — see config.js.
 */
(function () {
  'use strict';

  const form = document.getElementById('subscribeForm');
  if (!form) return;

  const email = document.getElementById('email');
  const trap = document.getElementById('website');
  const button = form.querySelector('.signup__btn');
  const message = document.getElementById('subscribeMsg');

  const ENDPOINT = (API_BASE_URL || '').replace(/\/+$/, '') + SUBSCRIBE_PATH;
  const TIMEOUT_MS = 12000;

  // Deliberately loose. The server is the authority on deliverability; a strict
  // client-side pattern's only real effect is rejecting valid addresses.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let busy = false;
  let messageKey = null; // remembered so the message can follow a language switch

  function strings() {
    return UI_STRINGS[document.documentElement.lang] || UI_STRINGS.hy;
  }

  function say(key, tone) {
    messageKey = key;
    message.textContent = key ? strings()[key] || '' : '';
    message.classList.toggle('is-ok', tone === 'ok');
    message.classList.toggle('is-error', tone === 'error');
  }

  function setBusy(state) {
    busy = state;
    button.disabled = state;
    button.textContent = state ? strings().sending : strings().submit;
    email.readOnly = state;
  }

  /** Mark the field, say why, and put the caret in it. */
  function reject(key) {
    email.classList.add('is-invalid');
    say(key, 'error');
    email.focus();
  }

  /**
   * fetch() has no timeout of its own, so a request that never resolves would
   * strand the button disabled with no way back.
   */
  function post(payload) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => window.clearTimeout(timer));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const value = email.value.trim();

    if (!value) return reject('incomplete');
    if (!EMAIL_RE.test(value)) return reject('invalid');
    email.classList.remove('is-invalid');

    // Honeypot: a bot filled the field no human can see. Show the success state
    // rather than an error, so the bot learns nothing about why it failed.
    if (trap && trap.value) {
      form.classList.add('is-done');
      say('success', 'ok');
      return;
    }

    setBusy(true);
    say(null);

    try {
      const response = await post({
        email: value,
        language: document.documentElement.lang,
        source: 'coming-soon',
      });

      if (response.ok) {
        form.classList.add('is-done');
        say('success', 'ok');
        return;
      }

      // Already subscribed is a success from the visitor's point of view —
      // they are on the list, which is all they asked for.
      if (response.status === 409) {
        form.classList.add('is-done');
        say('duplicate', 'ok');
        return;
      }

      // 400/422 means the server rejected the address itself, so keep the field
      // open and point at it rather than showing a generic error.
      if (response.status === 400 || response.status === 422) {
        reject('invalid');
        return;
      }

      say('failure', 'error');
    } catch (err) {
      // Network down, CORS refused, or the timeout above fired.
      say('failure', 'error');
    } finally {
      // Every exit path, including the ones that return above — otherwise a
      // submit that succeeded would leave the form permanently busy.
      setBusy(false);
    }
  });

  // Clear a validation error as the visitor corrects it. Leaving it up while
  // they retype reads as though the new value was rejected too.
  email.addEventListener('input', () => {
    if (!email.classList.contains('is-invalid')) return;
    email.classList.remove('is-invalid');
    if (messageKey && messageKey !== 'failure') say(null);
  });

  document.addEventListener('movato:languagechange', () => {
    // applyStrings() has already reset the button from its data-i18n, so this
    // has to reassert the busy label rather than only fix the idle one.
    button.textContent = busy ? strings().sending : strings().submit;
    if (messageKey) message.textContent = strings()[messageKey] || '';
  });
})();
