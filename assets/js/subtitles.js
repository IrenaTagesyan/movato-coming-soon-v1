/**
 * Movato — coming soon. Page copy, in three languages.
 *
 * The clips carry their own words burned into the pixels — the brands, the
 * closing line, all of it — so nothing here describes them and the page draws
 * nothing over them. The language switcher changes the copy below the banner
 * only. Which clip plays is decided in videos.js.
 */

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
