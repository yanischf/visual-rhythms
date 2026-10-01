// Gabarit commun : <head>, en-tête, pied de page.
import { esc, relRoot, jsonLd } from './lib.mjs';

// Polices hébergées sur le site (Bricolage Grotesque et Space Grotesk, licence OFL, sous-ensemble latin).
// Déclarées ici plutôt que dans site.css : le chemin relatif dépend de la profondeur de la page.
const fontFaces = (rel) =>
  `@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 600;font-display:swap;src:url(${rel}fonts/bricolage-grotesque-latin.woff2) format("woff2")}` +
  `@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:300 500;font-display:swap;src:url(${rel}fonts/space-grotesk-latin.woff2) format("woff2")}`;

// Appliqué avant le rendu pour éviter le flash de thème ; sans JS, le thème suit le système.
const THEME_BOOT =
  "(function(d){d.className=d.className.replace('no-js','js');try{var t=localStorage.getItem('vr-theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t)}catch(e){}})(document.documentElement)";

// Icônes des réseaux du collectif (SVG inline, couleur du texte).
const ICONS = {
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
  soundcloud:
    '<svg viewBox="0 1.4 24 24" fill="currentColor"><path d="M10 8.5c.9-.6 2-1 3.2-1 3 0 5.4 2.2 5.7 5.1l.6-.1c1.9 0 3.5 1.5 3.5 3.4s-1.6 3.4-3.5 3.4H10z"/><rect x="7.2" y="9.5" width="1.5" height="9.8" rx=".75"/><rect x="4.5" y="11.3" width="1.5" height="8" rx=".75"/><rect x="1.8" y="13.5" width="1.5" height="5.8" rx=".75"/></svg>',
};

function socials(links = {}) {
  const items = [
    ['instagram', 'Instagram'],
    ['soundcloud', 'Soundcloud'],
  ].filter(([k]) => links[k]);
  if (!items.length) return '';
  return `<ul class="socials">${items
    .map(([k, label]) => `<li><a class="social" href="${esc(links[k])}" target="_blank" rel="noopener" aria-label="${label} de Visual Rhythms" title="${label}">${ICONS[k]}</a></li>`)
    .join('')}</ul>`;
}

function header({ site, active, rel }) {
  const items = [
    { id: 'home', label: 'Accueil', href: `${rel}index.html` },
    { id: 'djs', label: 'Djs', href: `${rel}index.html#djs` },
    { id: 'emission', label: 'Émission', href: `${rel}emission.html` },
  ];
  const nav = items
    .map((it) => `<li><a class="pill" href="${it.href}"${it.id === active ? ' aria-current="page"' : ''}>${it.label}</a></li>`)
    .join('');
  return `<header class="top">
<a class="logo" href="${rel}index.html" aria-label="${esc(site.name)} — accueil"><span class="logo-mark" aria-hidden="true"></span><span class="logo-text">${esc(site.name)}</span></a>
<div class="top-right">
<div class="nav-wrap">
<nav aria-label="Navigation principale"><ul class="nav">${nav}</ul></nav>
<button class="theme-switch" type="button" aria-pressed="false" aria-label="Changer de thème"><span class="ts-light">Light</span><span class="ts-dark">Dark</span></button>
</div>
${socials(site.links)}
<a class="btn-contact" href="mailto:${esc(site.email)}">Contact<span aria-hidden="true">↗</span></a>
</div>
</header>`;
}

export function layout({ site, assets, depth = 0, path, title, description, active, body, schema, ogImage }) {
  const rel = relRoot(depth);
  const canonical = `${site.url}/${path}`.replace(/\/index\.html$/, '/');
  const image = ogImage ? (/^https?:/.test(ogImage) ? ogImage : `${site.url}/${ogImage.replace(/^\/+/, '')}`) : '';
  return `<!doctype html>
<html lang="${site.lang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${site.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">${image ? `\n<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="#f0eeea" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#08060c" media="(prefers-color-scheme: dark)">
<script>${THEME_BOOT}</script>
<link rel="preload" href="${rel}fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${rel}fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>
<style>${fontFaces(rel)}${assets.cssInline}</style>
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="${rel}llms.txt" title="Résumé du site pour les IA">
${schema ? jsonLd(schema) : ''}
<script src="${rel}js/site.js?v=${assets.js}" defer></script>
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<div class="page">
${header({ site, active, rel })}
<main id="contenu">
${body}
</main>
</div>
</body>
</html>
`;
}

