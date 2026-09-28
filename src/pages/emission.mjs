import { esc, media, linkPill, monthLabel } from '../lib.mjs';
import { blob, player } from '../components.mjs';

const ALL_DOT = 'conic-gradient(#7cf0c8,#b9f56a,#f7d774,#ff8ad1,#8f7cff,#6de0ff,#7cf0c8)';

export function emission({ site, styles, episodes, findDj }) {
  const groups = styles
    .map((st) => ({
      ...st,
      eps: episodes.filter((e) => e.style === st.id).sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .filter((g) => g.eps.length);

  const filters = [
    `<li><a class="pill is-active" href="#episodes" data-filter="all" aria-current="true"><span class="dot" style="background:${ALL_DOT}" aria-hidden="true"></span>Tous<span class="count">${episodes.length}</span></a></li>`,
    ...groups.map(
      (g) =>
        `<li><a class="pill" href="#${g.id}" data-filter="${g.id}"><span class="dot" style="background:${g.color}" aria-hidden="true"></span>${esc(g.label)}<span class="count">${g.eps.length}</span></a></li>`
    ),
  ].join('\n');

  const groupHtml = groups
    .map((g) => {
      const cards = g.eps
        .map((e) => {
          const dj = findDj(e.dj);
          const title = `Visual Rhythms #${e.number}`;
          return player({
            compact: true,
            title,
            dj: dj ? dj.name : e.dj,
            djHref: dj ? `djs/${dj.slug}.html` : '',
            src: monthLabel(e.date),
            srcDatetime: e.date,
            duration: e.duration,
            url: e.url,
            artwork: e.artwork,
            tint: g.tint,
            seed: e.number,
            left: 'Podcast',
            todoKey: `${title} (${e.dj})`,
          });
        })
        .join('\n');
      const n = g.eps.length;
      return `<section class="section group" id="${g.id}" data-group="${g.id}" aria-labelledby="g-${g.id}">
<div class="section-head"><h2 class="section-title group-title" id="g-${g.id}"><span class="dot dot--lg" style="background:${g.color}" aria-hidden="true"></span>${esc(g.label)}</h2><span class="label muted">${n} ${n > 1 ? 'épisodes' : 'épisode'}</span></div>
<ul class="eps">
${cards}
</ul>
</section>`;
    })
    .join('\n\n');

  return `
<section class="row g-hero" data-reveal aria-labelledby="em-title">
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
<nav class="card filters" data-filters aria-label="Filtrer par style">
<span class="label">Styles</span>
<ul>
${filters}
</ul>
</nav>
</div>

${groupHtml}

<section class="section row--last" aria-label="Toute l'émission">
<div class="card tint tint-b outro">
<p>Sélection d'épisodes. L'intégralité de l'émission est sur Soundcloud.</p>
${linkPill({ href: site.links.showSoundcloud, label: 'Tous les épisodes sur Soundcloud', cls: 'btn-ink', todoKey: ['Lien Soundcloud : profil', "page de l'émission"] })}
</div>
</section>
`;
}
