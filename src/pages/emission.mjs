import { esc, media, linkPill, dateLabel } from '../lib.mjs';
import { blob, player } from '../components.mjs';

const ALL_DOT = 'conic-gradient(#7cf0c8,#b9f56a,#f7d774,#ff8ad1,#8f7cff,#6de0ff,#7cf0c8)';

// Épisodes regroupés par saison (la plus récente en premier), filtrables.
export function emission({ site, episodes, djsBySlug }) {
  const groups = site.show.seasons
    .map((s) => ({
      ...s,
      eps: episodes.filter((e) => e.season === s.id).sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .filter((g) => g.eps.length);

  const filters = [
    `<li><a class="pill is-active" href="#episodes" data-filter="all" aria-current="true"><span class="dot" style="background:${ALL_DOT}" aria-hidden="true"></span>Toutes<span class="count">${episodes.length}</span></a></li>`,
    ...groups.map(
      (g) =>
        `<li><a class="pill" href="#${g.id}" data-filter="${g.id}"><span class="dot" style="background:${g.color}" aria-hidden="true"></span>${esc(g.title)}<span class="count">${g.eps.length}</span></a></li>`
    ),
  ].join('\n');

  let seed = 0;
  const groupHtml = groups
    .map((g) => {
      const cards = g.eps
        .map((e) => {
          // Ligne du haut : les DJs du roster présents dans l'épisode (liens vers leur page).
          const residents = (e.djs || []).map((s) => djsBySlug[s]).filter(Boolean);
          const names = residents.map((d) => d.name).join(' & ');
          // Épisode solo (titre = nom du DJ) : on évite la répétition en affichant le nom de l'émission.
          const showDjs = names && names !== e.title;
          return player({
            compact: true,
            title: e.title,
            dj: showDjs ? names : site.show.name,
            djHref: showDjs && residents.length === 1 ? `djs/${residents[0].slug}.html` : '',
            src: dateLabel(e.date),
            srcDatetime: e.date,
            duration: e.duration,
            url: e.url,
            artwork: e.artwork,
            tint: g.tint,
            seed: ++seed * 7,
            left: `${site.show.name} · ${g.title}`,
            todoKey: `${g.title} — ${e.title}`,
          });
        })
        .join('\n');
      const n = g.eps.length;
      const playlist = g.url
        ? `<a class="label muted season-link" href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.years)} · ${n} ${n > 1 ? 'épisodes' : 'épisode'} ↗</a>`
        : `<span class="label muted">${esc(g.years)} · ${n} ${n > 1 ? 'épisodes' : 'épisode'}</span>`;
      return `<section class="section group" id="${g.id}" data-group="${g.id}" aria-labelledby="g-${g.id}">
<div class="section-head"><h2 class="section-title group-title" id="g-${g.id}"><span class="dot dot--lg" style="background:${g.color}" aria-hidden="true"></span>${esc(g.title)}</h2>${playlist}</div>
<ul class="eps">
${cards}
</ul>
</section>`;
    })
    .join('\n\n');

  return `
<section class="row g-hero" aria-labelledby="em-title">
<div class="card em-card">
${blob('width:560px;height:560px;left:-200px;bottom:-330px;--from:120deg;--dur:19s', { veil: true })}
<p class="z label muted">Podcast · ${esc(site.show.frequency)}</p>
<div class="z">
<h1 class="em-title" id="em-title">Émission</h1>
<p class="em-intro">${esc(site.show.intro)}</p>
</div>
</div>
<div class="card card--media em-media">${media({ src: site.show.image, alt: site.show.imageAlt, placeholder: "Visuel de l'émission", eager: true, todoKey: ['Image : visuel', 'émission'] })}</div>
</section>

<div class="section section--tight" id="episodes" data-reveal>
<nav class="card filters" data-filters aria-label="Filtrer par saison">
<span class="label">Saisons</span>
<ul>
${filters}
</ul>
</nav>
</div>

${groupHtml}

<section class="section row--last" aria-label="Toute l'émission">
<div class="card tint tint-b outro">
<p>${esc(site.show.text)}</p>
${linkPill({ href: site.links.showSoundcloud, label: 'Visual Rhythms sur Soundcloud', cls: 'btn-ink', todoKey: ['Lien Soundcloud : profil', "page de l'émission"] })}
</div>
</section>
`;
}
