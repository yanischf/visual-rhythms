// Gabarit commun : <head>, en-tête, pied de page.
import { esc, relRoot, jsonLd } from './lib.mjs';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..600&family=Space+Grotesk:wght@300;400;500&display=swap';

// Appliqué avant le rendu pour éviter le flash de thème ; sans JS, le thème suit le système.
const THEME_BOOT =
  "(function(d){d.className=d.className.replace('no-js','js');try{var t=localStorage.getItem('vr-theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t)}catch(e){}})(document.documentElement)";

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${rel}css/site.css?v=${assets.css}">
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

