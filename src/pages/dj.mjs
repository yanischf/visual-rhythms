import { esc, media, linkPill, assetUrl } from '../lib.mjs';
import { blob, bookingRow, player } from '../components.mjs';

const TINTS = [
  ['124,240,200', '143,124,255'],
  ['255,138,209', '109,224,255'],
  ['185,245,106', '247,215,116'],
];

// Disposition des emplacements vides (maquette : 2×2, 1, 1, 2×1, 1, 1, 2×1).
const MOSAIC = [
  { cls: 'span-2x2', ph: 'Photo live' },
  { cls: '', ph: 'Photo' },
  { cls: '', ph: 'Photo' },
  { cls: 'span-2', ph: 'Photo booth' },
  { cls: '', ph: 'Photo' },
  { cls: '', ph: 'Photo' },
  { cls: 'span-2', ph: 'Photo public' },
];

// Dispositions qui remplissent toujours des rangées complètes de 4 colonnes.
const LAYOUTS = {
  1: ['span-4'],
  2: ['span-2', 'span-2'],
  3: ['span-2x2', 'span-2', 'span-2'],
  4: ['span-2x2', '', '', 'span-2'],
  5: ['span-2x2', 'span-2', 'span-2', 'span-2', 'span-2'],
  6: ['span-2x2', '', '', 'span-2', 'span-2', 'span-2'],
  7: MOSAIC.map((m) => m.cls),
};

export function djPage({ site, dj, tracks }) {
  const rel = '../';

  const players = tracks.length
    ? tracks
        .slice(0, 3)
        .map((t, i) =>
          player({
            title: t.title,
            dj: dj.name,
            src: t.source,
            duration: t.duration,
            url: t.url,
            artwork: t.artwork,
            tint: TINTS[i % 3],
            seed: 14 + i,
            rel,
            todoKey: dj.tracks.length ? `${dj.name} — ${t.title}` : undefined,
            left: t.url && !/soundcloud\.com\//.test(t.url) ? 'Mixcloud' : undefined,
          })
        )
        .join('\n')
    : `<li class="card player-note-card"><p class="player-note">Podcasts à venir.</p></li>`;

  // `size` choisit la case selon le format de la photo (portrait -> tall, paysage -> wide…).
  const SIZE = { large: 'span-2x2', tall: 'span-tall', wide: 'span-2', banner: 'span-4', small: '' };
  const layout = LAYOUTS[Math.min(dj.photos.length, 7)];
  const photos = dj.photos.length
    ? dj.photos.map((p, i) => ({ cls: p.size ? SIZE[p.size] : layout[i % layout.length], ph: 'Photo', src: p.src, alt: p.alt, position: p.position }))
    : MOSAIC.map((m) => ({ ...m, src: '', alt: `${m.ph} — ${dj.name}` }));
  const mosaic = photos
    .map(
      (p, i) =>
        `<figure class="card card--media${p.cls ? ' ' + p.cls : ''}">${media({ src: p.src, alt: p.alt, placeholder: p.ph, rel, position: p.position, todoKey: i === 0 ? ['Image : photos (mosaïque)', dj.name] : undefined })}</figure>`
    )
    .join('\n');

  const platforms = [...new Set(tracks.map((t) => (/mixcloud\.com\//.test(t.url) ? 'Mixcloud' : 'Soundcloud')))].join(' · ');

  const lead = dj.lead || `Bio de ${dj.name} à venir.`;
  const bio = dj.bio.map((p) => `<p>${esc(p)}</p>`).join('\n');

  const mail = `mailto:${site.email}?subject=${encodeURIComponent(`Booking ${dj.name}`)}`;
  const listen = [
    linkPill({ href: dj.links.soundcloud, label: 'Soundcloud', todoKey: ['Lien Soundcloud : profil', dj.name] }),
    linkPill({ href: dj.links.instagram, label: 'Instagram', todoKey: ['Lien Instagram', dj.name] }),
    linkPill({ href: mail, label: 'Booking', external: false }),
  ]
    .map((l) => `<li>${l}</li>`)
    .join('');

  return `
<p class="back label"><a href="${rel}index.html#djs">← Retour au roster</a></p>

<section class="row" data-reveal aria-labelledby="artist-name">
<div class="card artist-hero">
${media({ src: dj.photo, alt: `${dj.name} en live`, placeholder: "Photo de l'artiste en pleine largeur (booth, live, portrait)", rel, eager: true, todoKey: ['Image : photo principale DJ', dj.name] })}
<div class="veil-photo" aria-hidden="true"></div>
<div class="artist-hero-text">
<div>
<p class="label">${esc(dj.role)}</p>
<h1 class="artist-name" id="artist-name">${esc(dj.name)}</h1>
</div>
<ul class="artist-tags" aria-label="Styles">${dj.styles.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
</div>
</div>
</section>

<section class="section section--tight" data-reveal aria-labelledby="podcasts-title">
<div class="section-head"><h2 class="section-title" id="podcasts-title">Podcasts</h2><span class="label muted">${platforms}</span></div>
<ul class="players">
${players}
</ul>
</section>

<section class="section" data-reveal aria-labelledby="photos-title">
<div class="section-head"><h2 class="section-title" id="photos-title">Photos</h2><span class="label muted">${photos.length} visuels</span></div>
<div class="mosaic mosaic--photo">
${mosaic}
</div>
</section>

<section class="row g-bio row--gap-lg" data-reveal aria-labelledby="bio-title">
<article class="card bio-card">
${blob('width:520px;height:520px;right:-230px;top:-250px;--dur:18s', { veil: true })}
<h2 class="sr-only" id="bio-title">Biographie de ${esc(dj.name)}</h2>
<p class="z bio-lead">${esc(lead)}</p>
<div class="z bio-body">
${bio}
</div>
</article>
<aside class="aside">
<div class="card tint tint-a listen">
<p class="label">Écouter</p>
<ul>${listen}</ul>
</div>
</aside>
</section>

${bookingRow({
  site,
  artist: true,
  kicker: `Booker ${dj.name}`,
  pills: [
    linkPill({ href: assetUrl(dj.rider, rel), label: 'Rider & tech', cls: 'pill', external: false, todoKey: ['Fichier : rider & tech', dj.name] }),
    linkPill({ href: assetUrl(dj.presskit, rel), label: 'Presskit', cls: 'pill', external: false, todoKey: ['Fichier : presskit', dj.name] }),
  ].join(''),
})}
`;
}
