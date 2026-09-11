# Movato — coming soon

A coming-soon page built around `Preview.mp4`: a teal block at the top — a
header band carrying "coming soon" and the language switcher, then the clip
full-bleed — meeting a deep-teal page that holds the sign-up form. The switcher
changes the video's subtitle language.

It is built to fit one viewport with **no scrolling, in any of the three
languages** — see "Fitting one screen" below.

```
index.html
assets/
  css/style.css
  js/config.js        API base URL  ← set this before deploying
  js/subtitles.js     cue text + timings + UI copy  ← edit this to add a language
  js/main.js          switcher + caption overlay
  js/subscribe.js     sign-up capture
  video/preview.mp4   the teaser (9.53 s, 1920×1080, no audio track)
  video/poster.jpg    first frame, used as the video poster
subtitles/
  preview.hy.vtt      WebVTT exports of the same cues, for editors and players
  preview.en.vtt
  preview.ru.vtt
```

Open `index.html` directly, or serve it:

```sh
python3 -m http.server 8000     # → http://localhost:8000
```

## How the language switch works

The Armenian caption in `Preview.mp4` is **burned into the pixels** — the file
has one video track, no audio and no subtitle track — so there is nothing to
switch at the video level.

Instead the page:

1. **Covers** the caption band (61.8 %–71.8 % of the frame height, flat teal in
   every frame) with a patch of that same teal, and
2. **Redraws** the caption as HTML on top, in the selected language, on the same
   timings as the original.

The two lines behave differently, so they are modelled differently:

- **Lead line** — fixed copy. It is painted once and never animates, so it is on
  screen for the whole clip and cannot flicker at a cue boundary or at the loop
  point.
- **Accent line** — a timed track: three brand names, then the closing word,
  with a gap at 6.02–6.40 s where it leaves the screen entirely.

Note this deliberately departs from the original render, which rewords its lead
line at 6.02 s (`Բերում ենք նոր` → `Եվ բերելու նոր`). Holding one fixed lead
line means it never disappears — but it also has to read correctly against all
four accent words, which is why the Russian lead uses the neuter `новое` and
leaves the accent line in the nominative.

### Why the patch is a `<video>`, and why it is `preview.mp4`

Browsers colour-manage video, and `preview.mp4` carries **no colour tags at
all**, so what lands on screen is a guess that differs by rendering path. In
Chrome the same file paints:

| path | on-screen colour |
| --- | --- |
| GPU compositing (normal) | `rgb(0,158,174)` |
| software rendering | `rgb(1,147,162)` |

So no CSS colour can match it everywhere — a `#019eae` patch is invisible on one
path and a visible band on the other. A re-encoded colour swatch does not work
either: the encoder writes colour signalling the original lacks, and the two
files then diverge under GPU compositing.

The fix is to paint every surface that must match **from `preview.mp4` itself**.
`.ground` and `.frame__mask` are `<video>` elements pointing at the same file,
zoomed into a patch of frame (x 40–60 %, y 90–96 %) that is flat teal in every
frame. Same file, same decoder, same colour handling — so they match on every
path by construction. Both are parked on their first frame rather than playing.

`--video-bg` in `style.css` is only the fallback shown before the clip decodes.

## Layout

Three blocks stacked: the teal `.hero` (header band + clip), the `.seam`, and
the `.page` holding the form.

### Why the form side is navy, not teal

The form side is `#1E2945`. It is deliberately *not* in the clip's colour
family: the two halves are meant to read as brand and action rather than one
surface shading down, so the edge between them is a real boundary. (An earlier
pass used a deep teal, `#03414c`, for continuity — the current colour is a
deliberate reversal of that.)

Contrast against it was checked rather than assumed: the selected switcher pill
blends to `rgb(221,223,227)` over navy and its `#01606c` label holds 5.44:1;
field text 12.03:1; the subtitle 8.17:1; field labels 4.74:1. All clear AA.

The header band is painted **from `preview.mp4` itself**, not from
`--video-bg`. This is the same constraint the caption mask has: a CSS teal
matches the decoded video on one rendering path and shows as a visible band on
another, so a CSS-coloured band would have a seam across it exactly where the
clip starts. See "Why the patch is a `<video>`" above.

### The header band

"Coming soon" sits above the wordmark, in a band above the clip rather than
inside it — carving the space out of the video would have meant widening the
crop and re-deriving every measurement below.

The band spans the full width rather than the content measure, so the switcher
sits ~24 px from the edge of the screen instead of ~200 px in from it.

It is a three-column grid, `1fr auto 1fr`, with the title in the middle column
and the switcher in the third. Centring the title with `justify-content` instead
would let the two overlap on a narrow screen; with the grid the title is centred
by the columns and wraps or shrinks before it can ever reach the switcher. At
360 px the gap between them is 12 px, which is the tightest case.

### Fitting one screen

Nothing scrolls, in any language. That is a real constraint rather than a
by-product, and it is checked by measurement: 9 viewports × 3 languages, all 27
combinations verified for vertical fit, horizontal overflow, caption clipping
and title/switcher collision.

Two things make it work:

- `.page` is `justify-content: center`, so the form sits in the middle of
  whatever height is left rather than hanging under the banner.
- A `@media (max-height: 900px)` rule trims the form — tighter fields, smaller
  labels, less air between rows. The threshold is 900 px, **not** a phone-sized
  number, because a 1366×768 or 1280×800 laptop is exactly where this bites: the
  banner scales with *width* while the form does not, so a wide-but-short window
  gives the banner the most room and the form the least. Measured, those two
  overflowed by 81 px and 32 px in Armenian before the rule existed.

One gotcha worth knowing if you touch the layout: `html` is `height: 100%`, not
`min-height`. A percentage `min-height` on `body` resolves against its parent's
*computed* height, and if that is `auto` the percentage is ignored — `body` then
never stretches to the viewport, `.page` has nothing to fill, and centring it
silently does nothing.

### The crop

Measured off the render rather than eyeballed: sampling every frame of the clip
and looking for non-teal pixels, **all content falls between 40.0 % and 71.9 %
of the frame height**, and the top edge does not move for the whole 9.53 s. The
bottom edge moves only with the caption line.

So the window is **27 %–80 %**, with the content band (40.0 %–71.9 %) and
the burned-in caption band (58.5 %–77 %) both well inside it. Everything outside
them is flat teal carrying nothing.

It was 37 %–79.5 %. The widening was symmetric about that window's centre of
58.25 %, so nothing that fitted before can be cropped — including the caption on
a narrow screen, where it stops scaling with the frame and sits on its 12 px
floor.

The slice is sized so the banner is the taller of the page's two blocks —
1.30× the sign-up block at 1440×900, 1.53× at 1920×1080. It was the *smaller*
one before, at 0.89× and 1.00×. Because banner height follows *width* while the
form does not, a wide-but-short window is where this bites: past roughly
`--crop-keep: 0.56` the form stops fitting a laptop screen at all.

The crop is done by the banner, not by the video element, and the pull-up is a
`translateY` rather than `top`: a percentage in `top` resolves against the
*container's* height, while a percentage in `translateY` resolves against the
element's own — which is the one the 37 % is measured in. Both details exist
for the same reason: the mask and the caption are positioned in percentages *of
the frame*, so anything that resized or rebased the frame would invalidate every
measured number in the table at the end of this file.

There are no player controls: the clip autoplays muted and loops. If autoplay is
refused, it starts on the first tap or keypress.

## Sign-up capture

The form collects an email address and posts to
`${API_BASE_URL}/v1/user-subscriptions`. Set `API_BASE_URL` in
`assets/js/config.js` — leave it empty to post to the page's own origin.

```http
POST {API_BASE_URL}/v1/user-subscriptions
Content-Type: application/json

{ "email": "a@b.com", "language": "hy", "source": "coming-soon" }
```

`language` is whichever subtitle language is selected at submit time.

Client-side validation is deliberately loose — the server is the authority on
deliverability, and a strict pattern's only real effect is rejecting valid
addresses. A failed check marks the field, says why, and focuses it; typing in
the field clears the mark.

Responses the page reacts to:

| Status | Shown |
| --- | --- |
| `2xx` | success — the field is replaced by the confirmation |
| `409` | "already on the list" — also treated as success, since the visitor is |
| `400`, `422` | the invalid-address message, field stays open |
| anything else, network failure, 12 s timeout | the generic retry message |

If the API is on another origin it must send CORS headers
(`Access-Control-Allow-Origin`) and answer the preflight `OPTIONS` — the
`Content-Type: application/json` header makes this a non-simple request.

A hidden `website` field is a honeypot: if it arrives filled, the page shows the
success state and sends nothing.

## Typography

`Geologica` for Latin and Cyrillic, `Noto Sans Armenian` behind it for Armenian.

That pairing is not a preference — **Geologica ships no Armenian subset**. Its
faces cover latin, latin-ext, Cyrillic, Cyrillic-ext, Greek and Vietnamese, and
nothing in U+0530–058F. Left alone it would drop Armenian to whatever the
system serves, which on an Armenian-first page is the most important script on
the site.

Google serves every face with a `unicode-range`, so the browser resolves this
per character: Latin and Cyrillic take Geologica, Armenian falls through to
Noto. Nothing has to switch fonts by language. Verified in the browser — the
Armenian-range face (U+530–58F) downloads, and `document.fonts.check()` returns
true for Armenian text.

If you want one typeface across all three scripts, Geologica cannot be it; that
needs a family with Armenian coverage (Noto Sans Armenian itself, Arian AMU,
Mardoto).

## Default language

The page opens in **Armenian**, set by `DEFAULT_LANGUAGE` in `subtitles.js`.

Two things are deliberately ignored. `Accept-Language`, so a visitor arriving
with an en-US or ru-RU browser still lands on Armenian and switches if they want
to. And any previously stored choice — an earlier version remembered the last
language across visits, which meant anyone who had ever clicked ENG kept getting
an English page and the "default" was in practice whatever they last touched.

**The switch lasts for the visit, not beyond it.** Reloading returns to
Armenian. `main.js` also clears the `movato.subtitle-lang` key that the older
version wrote, so a stale value cannot linger in a browser that already has one.

To make the choice stick across visits again, restore the `localStorage` read in
`initialLanguage()` — but note that is exactly what made the default look like
English.

## How fast the clip starts

The banner shows `poster.jpg` immediately and the clip takes over when it can
play. Two things were making that later than it needed to be.

**All three video elements requested the file at once.** The visible clip and
the two `.fill` elements point at the same 6 MB file, so they raced each other
for bandwidth — measured on a cold cache, the file came down *twice* and the
banner did not move until ~1 s after navigation. The fills now start with no
`src` at all (`data-src` + `preload="none"`); `main.js` gives them one only once
the visible video fires `playing`, with a 2.5 s fallback in case autoplay is
refused. One download instead of two, and first motion moved from **980 ms to
715 ms** locally. Until the fills load, the mask and the ground sit on
`--video-bg`, which is the right colour to within a rendering path — and the
visible clip is showing its poster over the same span anyway.

**The file itself is the remaining limit**, and it is the bigger one:

| connection | clip download | banner starts moving |
| --- | --- | --- |
| localhost | 0.45 s | 0.7 s |
| 25 Mbps | 2.1 s | 0.4 s |
| 10 Mbps | 5.1 s | 0.3 s |
| 4 Mbps | 12.5 s | **9.3 s** |

`preview.mp4` is 6.04 MB for 9.53 s of silent 1080p — an average of
**5.3 Mbps**. That number is the cliff: a connection faster than it streams the
clip in real time and playback starts almost at once, while anything slower
cannot keep up and has to buffer first. At 4 Mbps that is a nine-second wait.

For flat-colour motion graphics this bitrate is roughly an order of magnitude
higher than it needs to be. Re-encoding is the fix; macOS's built-in
`avconvert` cannot do it (its presets are fixed-bitrate — measured 3 % saving at
720p, none at 1080p), so it needs `ffmpeg` or a smaller export from whatever
produced the clip. All three elements read the same file, so re-encoding does
not break the colour-matching technique — but `--video-bg` should be re-checked
against the new file afterwards.

## Adding a language

Everything is driven by `assets/js/subtitles.js`. Add one entry to
`SUBTITLE_LANGUAGES`, one block to `SUBTITLE_CUES`, and one to `UI_STRINGS`:

```js
const SUBTITLE_LANGUAGES = [
  // …
  { code: 'fr', label: 'FRA', name: 'Français' },
];

const SUBTITLE_CUES = {
  // …
  fr: {
    lead: 'Nous vous apportons le nouveau',
    accent: ['ON', 'Marshall', 'Ikea', 'Élan'],
  },
};
```

The switcher button, `<html lang>`, the stored preference, the caption and the
form copy all follow — `UI_STRINGS` carries every form label, placeholder and
status message alongside the tagline. Timings live once in `ACCENT_TIMINGS` and are shared by every language.
Check that the `lead` line reads correctly against every `accent` word — it is
fixed, so it has to work with all of them.

The page opens in `DEFAULT_LANGUAGE` (Armenian) on every load. See "Default
language" above.

## Replacing the video

The measurements below are specific to this render. If the clip is re-exported,
re-check them:

| What | Value | Where |
| --- | --- | --- |
| Burned caption band | 61.8 %–71.8 % of frame height | `--band-top`, `--band-height` |
| Caption position | line 1 at 62.6 %, line 2 at 67.7 % | `--caption-top` |
| Caption size | ≈45 px at 1080p (4.2 % of height) | `--caption-size` |
| Lead line | fixed, always on screen | `SUBTITLE_CUES[lang].lead` |
| Accent line on screen | 0.5–2.38, 2.38–4.28, 4.28–6.02, 6.40–9.18 s | `ACCENT_TIMINGS` |
| Flat patch used by the fills | x 40–60 %, y 90–96 % | `.fill` |
| Content bounds (measured) | 40.0 %–71.9 % of frame height | — |
| Banner crop window | 27 %–80 % of frame height | `--crop-top`, `--crop-keep` |
| Banner aspect ratio | 16 / (9 × `--crop-keep`) = 16 / 4.77 | `.showcase` |

If you can get a **clean render with no burned-in text**, drop `.frame__mask`
from `index.html` — everything else keeps working unchanged.
