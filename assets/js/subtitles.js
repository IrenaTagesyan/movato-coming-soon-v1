/**
 * Subtitle data for assets/video/preview.mp4 (9.53 s, 1920×1080, no audio).
 *
 * The Armenian caption is burned into the video pixels, so it cannot be swapped
 * at the video level. The page paints a patch of the clip's own teal over the
 * caption band (see .frame__mask in style.css) and re-renders the caption as
 * HTML from the data below — which is what makes the language switch possible.
 *
 * The two lines behave differently, so they are modelled differently:
 *
 *   lead    fixed copy. It is on screen for the whole clip and never fades, so
 *           nothing about it flickers at the loop point or mid-clip. (The
 *           original render swaps its wording at 6.02 s — this deliberately
 *           does not.)
 *   accent  a timed track: three brand names, then the closing word, with a
 *           gap at 6.02–6.40 s where the line leaves the screen entirely.
 *
 * Timings were measured frame by frame off the original render.
 */

/** Length of the clip, in seconds. Only used when exporting WebVTT. */
const CLIP_DURATION = 9.53;

/** When the accent (second) line is on screen. Note the gap before the last. */
const ACCENT_TIMINGS = [
  { start: 0.5, end: 2.38 }, // ON
  { start: 2.38, end: 4.28 }, // Marshall
  { start: 4.28, end: 6.02 }, // Ikea
  { start: 6.4, end: 9.18 }, // closing word
];

/**
 * The language the page opens in, regardless of the visitor's browser locale.
 * A stored choice from a previous visit still wins over this.
 */
const DEFAULT_LANGUAGE = 'hy';

/** Display order of the language switcher. */
const SUBTITLE_LANGUAGES = [
  { code: 'hy', label: 'ՀԱՅ', name: 'Հայերեն' },
  { code: 'en', label: 'ENG', name: 'English' },
  { code: 'ru', label: 'РУС', name: 'Русский' },
];

/**
 * `lead` is the fixed first line; `accent` matches ACCENT_TIMINGS.
 *
 * Because the lead never changes, it has to read correctly against all four
 * accent words. Armenian and English carry the adjective in the lead
 * ("նոր" / "the new"); Russian cannot agree with both the brand names and
 * "Культура" from a fixed line, so it uses the neuter "новое" and leaves the
 * accent line in the nominative.
 */
const SUBTITLE_CUES = {
  hy: {
    lead: 'Բերում ենք նոր',
    accent: ['ON', 'Marshall', 'Ikea', 'Մշակույթ'],
  },
  en: {
    lead: 'We’re bringing you the new',
    accent: ['ON', 'Marshall', 'Ikea', 'Culture'],
  },
  ru: {
    lead: 'Мы привозим новое',
    accent: ['ON', 'Marshall', 'Ikea', 'Культура'],
  },
};

/** Static page copy, keyed the same way as the cues. */
const UI_STRINGS = {
  hy: {
    tagline: 'Շուտով',
    switcherLabel: 'Ենթագրերի լեզուն',
    captionRegion: 'Տեսանյութի ենթագրեր',
    formTitle: 'ԱՄՆ-ից, Եվրոպայից և Ասիայից առաքումների նոր իրականություն',
    subtitle: 'Լրացրու քո էլ. հասցեն և առաջինն իմացիր Movato-ի մեկնարկի մասին։',
    emailLabel: 'Էլ. հասցե',
    emailPlaceholder: 'you@example.com',
    submit: 'Նախագրանցվել',
    sending: 'Ուղարկվում է…',
    success: 'Շնորհակալություն։ Մենք կտեղեկացնենք ձեզ։',
    duplicate: 'Դուք արդեն բաժանորդագրված եք։',
    incomplete: 'Խնդրում ենք մուտքագրել ձեր էլ. փոստը։',
    invalid: 'Խնդրում ենք մուտքագրել վավեր էլ. փոստ։',
    failure: 'Ինչ-որ բան այն չէ։ Փորձեք կրկին։',
  },
  en: {
    tagline: 'Coming soon',
    switcherLabel: 'Subtitle language',
    captionRegion: 'Video subtitles',
    formTitle: 'A new reality of delivery from USA, Europe and Asia',
    subtitle: 'Leave your email and be the first to know about Movato launch.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    submit: 'Pre-register',
    sending: 'Sending…',
    success: 'Thank you — we’ll be in touch.',
    duplicate: 'You’re already on the list.',
    incomplete: 'Please enter your email address.',
    invalid: 'Please enter a valid email address.',
    failure: 'Something went wrong. Please try again.',
  },
  ru: {
    tagline: 'Скоро',
    switcherLabel: 'Язык субтитров',
    captionRegion: 'Субтитры к видео',
    formTitle: 'Новая реальность доставок из США, Европы и Азии',
    subtitle: 'Заполни свою эл. почту и узнай о запуске Movato первым.',
    emailLabel: 'Эл. почта',
    emailPlaceholder: 'you@example.com',
    submit: 'Предрегистрация',
    sending: 'Отправка…',
    success: 'Спасибо — мы свяжемся с вами.',
    duplicate: 'Вы уже подписаны.',
    incomplete: 'Введите ваш адрес e-mail.',
    invalid: 'Введите корректный адрес e-mail.',
    failure: 'Что-то пошло не так. Попробуйте ещё раз.',
  },
};

/** Build {lead, accent} for one language: a fixed line and a timed track. */
function cuesFor(lang) {
  const copy = SUBTITLE_CUES[lang] || SUBTITLE_CUES.hy;
  return {
    lead: copy.lead,
    accent: ACCENT_TIMINGS.map((t, i) => ({ ...t, text: copy.accent[i] })),
  };
}
