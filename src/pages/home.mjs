import { esc, media, linkPill, dayLabel } from '../lib.mjs';
import { blob, bookingRow } from '../components.mjs';

function datesCard({ events, djsBySlug }) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  let rows;
  if (upcoming.length) {
    rows = upcoming
      .map((e) => {
        const lineup = (e.lineup || []).map((s) => djsBySlug[s]?.name || s).join(', ');
        const place = [e.venue, e.city].filter(Boolean).join(', ');
        const meta = [lineup, place, e.status].filter(Boolean).join(' · ');
        const inner = `<time datetime="${esc(e.date)}">${esc(dayLabel(e.date))}</time><span><span class="date-name">${esc(e.title)}</span>${meta ? `<span class="date-meta">${esc(meta)}</span>` : ''}</span>`;
        return e.ticketUrl
          ? `<li><a class="date-row date-row--real" href="${esc(e.ticketUrl)}" target="_blank" rel="noopener">${inner}</a></li>`
          : `<li><div class="date-row date-row--real">${inner}</div></li>`;
      })
      .join('\n');
  } else {
    const ph = '<li class="date-row date-row--ph"><span>JJ.MM.AAAA</span><span class="date-name">Nom de la soirée — line-up · Lieu, ville</span></li>';
    rows = ph + '\n' + ph;
  }
  return `<div class="card dates">
<div class="dates-head"><h2 class="dates-title">Prochaines dates</h2><span class="label o6">${upcoming.length ? 'Agenda' : 'À compléter'}</span></div>
<ul class="dates-list">
${rows}
</ul>
</div>`;
}

export function home({ site, djs, events, latestUrl }) {
  const djsBySlug = Object.fromEntries(djs.map((d) => [d.slug, d]));
  const g = site.gallery;

  const gallery = g.photos
    .slice(0, 3)
    .map((p, i) => `<div class="card card--media">${media({ src: p.src, alt: p.alt, placeholder: 'Photo soirée', todoKey: ['Image : galerie accueil', `photo ${i + 1}`] })}</div>`)
    .join('\n');

  const stats = site.stats
    .map(
      (s, i) => `<div class="card tint tint-${'abc'[i % 3]} stat">
<p class="label">${esc(s.label)}</p>
<p class="stat-value">${esc(s.value)}</p>
<p class="stat-text">${esc(s.text)}</p>
</div>`
    )
    .join('\n');

  const seasons = site.show.seasons
    .map((s) => {
      const href = s.url || 'emission.html';
      const ext = s.url ? ' target="_blank" rel="noopener"' : '';
      return `<a class="season" href="${esc(href)}"${ext}><span aria-hidden="true">▶</span><span class="season-title">${esc(s.title)}</span><span class="season-meta">${esc(s.years)}</span><span class="season-meta">${esc(s.tracks)}</span></a>`;
    })
    .join('\n');

  const roster = djs
    .map(
      (d) => `<li><a class="card dj-card" href="djs/${d.slug}.html">
<div class="dj-thumb">${media({ src: d.portrait || d.photo, alt: `Portrait de ${d.name}`, placeholder: d.name, todoKey: ['Image : portrait roster', d.name] })}</div>
<div class="dj-meta"><span class="dj-name">${esc(d.name)}</span><span class="dj-tag">${esc(d.tagline)}</span></div>
</a></li>`
    )
    .join('\n');

  const latestExt = /^https?:/.test(latestUrl) ? ' target="_blank" rel="noopener"' : '';

  return `
<section class="row g-hero" data-reveal aria-labelledby="hero-title">
<div class="card hero-card">
${blob('width:620px;height:620px;left:-180px;top:-240px;opacity:.75;--dur:17s', { veil: 'tl' })}
<p class="z label label--wide o8">${esc(site.hero.kicker)}</p>
<h1 class="z hero-title" id="hero-title">${esc(site.hero.title)}</h1>
<a class="z btn-ghost" href="${esc(latestUrl)}"${latestExt}><span aria-hidden="true">▶</span><span>Écouter le dernier podcast</span></a>
</div>
<div class="card card--media hero-media">${media({ src: site.hero.image, alt: site.hero.imageAlt, placeholder: site.hero.imagePlaceholder, eager: true, todoKey: ['Image : visuel', 'hero accueil'] })}</div>
</section>

<section class="row g-half" data-reveal aria-label="Dates et galerie">
${datesCard({ events, djsBySlug })}
<div class="gallery">
${gallery}
<div class="card gallery-note"><strong>Galerie</strong><span>${g.venues.map(esc).join(' · ')}</span></div>
</div>
</section>

<section class="row g-quote" data-reveal aria-labelledby="approach-title">
<div class="card quote-card"><blockquote><p>${esc(site.quote)}</p></blockquote></div>
<div class="card approach">
<p class="label">Notre approche</p>
<h2 id="approach-title">${esc(site.approach.title)}</h2>
<p class="approach-text">${esc(site.approach.text)}</p>
</div>
</section>

<section class="row g-three" data-reveal aria-label="Visual Rhythms en chiffres">
${stats}
</section>

<section class="row g-show" data-reveal aria-labelledby="show-title">
<div class="card show-card">
${blob('width:420px;height:420px;right:-130px;bottom:-200px;opacity:.55;--from:90deg;--dur:19s')}
<p class="z label show-top"><span>Podcast</span><span>${esc(site.show.frequency)}</span></p>
<div class="z">
<h2 class="show-name" id="show-title"><a href="emission.html">${esc(site.show.name)}</a></h2>
<p class="show-text">${esc(site.show.text)}</p>
</div>
</div>
<div class="card seasons">
<p class="label">Saisons</p>
${seasons}
</div>
</section>

<section class="section" id="djs" data-reveal aria-labelledby="roster-title">
<div class="section-head roster-head"><h2 class="display" id="roster-title">Notre roster de DJs</h2><span class="label">${djs.length} artistes · ${esc(site.city)}</span></div>
<ul class="roster">
${roster}
</ul>
</section>

${bookingRow({
  site,
  kicker: 'Booking · Programmation',
  pills: [
    linkPill({ href: site.links.instagram, label: 'Instagram', todoKey: ['Lien Instagram', 'collectif'] }),
    linkPill({ href: site.links.soundcloud, label: 'Soundcloud', todoKey: ['Lien Soundcloud : profil', 'collectif'] }),
    linkPill({ href: site.links.facebook, label: 'Facebook', todoKey: ['Lien Facebook', 'collectif'] }),
  ].join(''),
})}
`;
}
