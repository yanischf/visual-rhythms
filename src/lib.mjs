// Helpers de rendu partagés par toutes les pages.

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Préfixe relatif vers la racine du site (les pages de /djs/ sont un niveau plus bas).
export function relRoot(depth) {
  return depth > 0 ? '../'.repeat(depth) : '';
}

// Chemin d'asset : URL absolue gardée telle quelle, sinon relatif à la racine du site.
export function assetUrl(src, rel) {
  if (!src) return '';
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return rel + src.replace(/^\/+/, '');
}

export function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

// "2026-03" -> "Mars 2026"
export function monthLabel(iso) {
  const [y, m] = String(iso || '').split('-');
  if (!y || !m) return iso || '';
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

// "2026-10-17" -> "17.10.2026"
export function dayLabel(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return d ? `${d}.${m}.${y}` : iso;
}

// Date complète -> "10.01.2024", mois seul -> "Janv. 2024".
export function dateLabel(iso) {
  return String(iso || '').split('-').length === 3 ? dayLabel(iso) : monthLabel(iso);
}

export function weekday(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : DAYS[d.getDay()];
}

// "64:12" -> "PT64M12S"
export function isoDuration(dur) {
  const parts = String(dur || '').split(':').map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2) return undefined;
  const [a, b, c] = parts;
  return parts.length === 3 ? `PT${a}H${b}M${c}S` : `PT${a}M${b}S`;
}

// Registre des éléments manquants (images, liens) affiché à la fin du build : catégorie -> éléments.
export const todo = new Map();
function need([category, item]) {
  if (!todo.has(category)) todo.set(category, new Set());
  todo.get(category).add(item);
}

const ICON_IMAGE =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>';

// Image réelle si `src` est renseigné, sinon emplacement réservé (même rendu que la maquette).
export function media({ src, alt = '', placeholder = 'Image', rel = '', eager = false, sizes, position, todoKey }) {
  if (src) {
    const loading = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    const style = position ? ` style="object-position:${esc(position)}"` : '';
    return `<img class="media" src="${esc(assetUrl(src, rel))}" alt="${esc(alt)}" ${loading} decoding="async"${sizes ? ` sizes="${esc(sizes)}"` : ''}${style}>`;
  }
  if (todoKey) need(todoKey);
  return `<div class="ph" role="img" aria-label="${esc(alt || placeholder)}">${ICON_IMAGE}<span>${esc(placeholder)}</span></div>`;
}

// Lien si l'URL existe, sinon même pastille non cliquable (et note dans le rapport).
export function linkPill({ href, label, cls = 'pill', external = true, todoKey }) {
  if (href) {
    const ext = external && /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
    return `<a class="${cls}" href="${esc(href)}"${ext}>${esc(label)}</a>`;
  }
  if (todoKey) need(todoKey);
  return `<span class="${cls}">${esc(label)}</span>`;
}

// Générateur pseudo-aléatoire déterministe (même forme d'onde à chaque build).
function seeded(seed) {
  let s = seed % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

let waveId = 0;
// Forme d'onde décorative en SVG (un seul <path>, léger).
export function waveform({ seed = 7, bars = 92, barW = 3, gap = 2, height = 60 }) {
  const rnd = seeded(seed * 131 + 7);
  const step = barW + gap;
  const width = bars * step - gap;
  const half = barW / 2;
  let d = '';
  for (let i = 0; i < bars; i++) {
    const v = (0.35 + 0.65 * rnd()) * (0.55 + 0.45 * Math.abs(Math.sin(i / 7 + seed)));
    const h = Math.max(barW + 2, Math.round(height * 0.18 + height * 0.82 * v * 0.98));
    const x = +(i * step + half).toFixed(1);
    d += `M${x} ${height - half}V${+(height - h + half).toFixed(1)}`;
  }
  const id = ++waveId;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><defs><path id="w${id}" d="${d}" fill="none" stroke-width="${barW}" stroke-linecap="round"/><clipPath id="c${id}"><rect width="0" height="${height}"/></clipPath></defs><use href="#w${id}" class="w-bg"/><use href="#w${id}" class="w-fg" clip-path="url(#c${id})"/></svg>`;
}

const ICON_PLAY = '<svg class="i-play" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 1.2v9.6L10.5 6z"/></svg>';
const ICON_PAUSE = '<svg class="i-pause" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z"/></svg>';

export function playButton({ url, title, todoKey }) {
  if (url) {
    // Soundcloud se joue sur place (site.js) ; les autres plateformes (Mixcloud…) s'ouvrent dans un onglet.
    const sc = /soundcloud\.com\//.test(url);
    const platform = sc ? 'Soundcloud' : /mixcloud\.com\//.test(url) ? 'Mixcloud' : 'la plateforme';
    return `<a class="play" href="${esc(url)}"${sc ? ` data-sc="${esc(url)}"` : ''} target="_blank" rel="noopener" aria-label="Écouter « ${esc(title)} » sur ${platform}">${ICON_PLAY}${ICON_PAUSE}</a>`;
  }
  if (todoKey) need(todoKey);
  return `<span class="play" aria-disabled="true" title="Lien Soundcloud à venir">${ICON_PLAY}</span>`;
}

export function jsonLd(data) {
  // Échappe "<" pour qu'aucune chaîne ne puisse fermer la balise script.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
