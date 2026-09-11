/**
 * The animations, and the rule for choosing which one plays.
 *
 * Each clip is a complete render: the brands and every word are burned into its
 * pixels, so the page draws nothing over them. Add a file here and it joins the
 * rotation — nothing else needs touching.
 *
 * All four are 1920×1080, ~12 s, no audio track. A clip of another shape will
 * still play, but the banner crop in style.css is measured against 16:9, so
 * anything else gets letterboxed by `object-fit: fill`.
 */
const VIDEOS = [
  'assets/video/ALO-Rhode-Whoop-com.mp4',
  'assets/video/Jacquemus-Gentle-Monster-Adidas-com.mp4',
  'assets/video/Nike-Lego-Ray-Ban-com.mp4',
  'assets/video/ON-Marshall-Ikea-com.mp4',
];

/**
 * Pick a clip at random, never the one already on screen.
 *
 * Excluding the current clip is the whole point: with four files, uniform
 * random repeats itself back-to-back about a quarter of the time, and a visitor
 * who sees the same animation twice in a row reads it as a stuck video rather
 * than as chance. Passing nothing (the first pick of a visit) draws from all of
 * them, so which animation a visitor opens on is genuinely random.
 */
function pickVideo(current) {
  const pool = VIDEOS.filter((src) => src !== current);
  if (pool.length === 0) return current || VIDEOS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
