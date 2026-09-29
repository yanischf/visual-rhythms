#!/usr/bin/env node
// Génère le site statique dans dist/ à partir de content/*.json.
// Aucune dépendance : `node build.mjs`.
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { layout } from './src/layout.mjs';
import { home } from './src/pages/home.mjs';
import { djPage } from './src/pages/dj.mjs';
import { emission } from './src/pages/emission.mjs';
import { dateLabel, isoDuration, todo } from './src/lib.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'dist');

const readJson = async (name) => JSON.parse(await readFile(join(ROOT, 'content', name), 'utf8'));
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

async function write(rel, content) {
  const file = join(OUT, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

const [site, djs, episodes, events, styles] = await Promise.all([
  readJson('site.json'),
  readJson('djs.json'),
  readJson('episodes.json'),
  readJson('events.json'),
  readJson('styles.json'),
]);

// Surcharges de déploiement : SITE_URL (ex. prévisualisation GitHub Pages) et NOINDEX=1
// pour qu'une adresse provisoire ne soit pas indexée à la place du vrai domaine.
if (process.env.SITE_URL) site.url = process.env.SITE_URL.replace(/\/+$/, '');
site.noindex = process.env.NOINDEX === '1';

const djsBySlug = Object.fromEntries(djs.map((d) => [d.slug, d]));
const seasonTitle = Object.fromEntries(site.show.seasons.map((s) => [s.id, s.title]));
const latest = [...episodes].sort((a, b) => b.date.localeCompare(a.date))[0];
const latestUrl = latest?.url || 'emission.html';

const css = await readFile(join(ROOT, 'static/css/site.css'), 'utf8');
const js = await readFile(join(ROOT, 'static/js/site.js'), 'utf8');
const assets = { css: hash(css), js: hash(js) };

await rm(OUT, { recursive: true, force: true });
await cp(join(ROOT, 'static'), OUT, { recursive: true });

// ---------- Données structurées ----------
const ORG_ID = `${site.url}/#collectif`;
const SERIES_ID = `${site.url}/emission.html#serie`;
const sameAs = (links) => [...new Set(Object.values(links || {}).filter((v) => /^https?:/.test(v)))];

const orgSchema = {
  '@type': 'MusicGroup',
  '@id': ORG_ID,
  name: site.name,
  url: `${site.url}/`,
  email: site.email,
  description: site.description,
  genre: styles.map((s) => s.label),
  foundingLocation: { '@type': 'Place', name: site.city },
  member: djs.map((d) => ({ '@type': 'Person', name: d.name, url: `${site.url}/djs/${d.slug}.html` })),
  sameAs: sameAs(site.links),
};

const eventSchemas = events.map((e) => ({
  '@type': 'MusicEvent',
  name: e.title,
  startDate: e.date,
  eventStatus: 'https://schema.org/EventScheduled',
  location: { '@type': 'Place', name: e.venue, address: e.city },
  organizer: { '@id': ORG_ID },
  performer: (e.lineup || []).map((s) => {
    const d = djs.find((x) => x.slug === s);
    return { '@type': 'Person', name: d ? d.name : s };
  }),
  ...(e.ticketUrl ? { offers: { '@type': 'Offer', url: e.ticketUrl } } : {}),
}));

const pages = [];

// ---------- Accueil ----------
pages.push({
  path: 'index.html',
  priority: '1.0',
  html: layout({
    site,
    assets,
    path: 'index.html',
    active: 'home',
    title: `${site.name} — Collectif de DJs & émission électronique à ${site.city}`,
    description: site.description,
    ogImage: site.hero.image,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': `${site.url}/#site`, url: `${site.url}/`, name: site.name, inLanguage: 'fr-FR', publisher: { '@id': ORG_ID } },
        orgSchema,
        ...eventSchemas,
      ],
    },
    body: home({ site, djs, events, episodes, latestUrl }),
  }),
});

// ---------- Émission ----------
pages.push({
  path: 'emission.html',
  priority: '0.9',
  html: layout({
    site,
    assets,
    path: 'emission.html',
    active: 'emission',
    title: `Émission — ${site.show.name}, podcasts électroniques | ${site.name}`,
    description: `${site.show.intro} ${episodes.length} épisodes sur ${site.show.seasons.length} saisons, à écouter sur Soundcloud.`,
    ogImage: site.show.image,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'PodcastSeries',
          '@id': SERIES_ID,
          name: site.show.name,
          url: `${site.url}/emission.html`,
          description: site.show.intro,
          inLanguage: 'fr-FR',
          author: { '@id': ORG_ID },
          ...(site.links.showSoundcloud ? { sameAs: [site.links.showSoundcloud] } : {}),
        },
        ...episodes.map((e) => ({
          '@type': 'PodcastEpisode',
          name: `${site.show.name} — ${e.title}`,
          datePublished: e.date,
          timeRequired: isoDuration(e.duration),
          partOfSeries: { '@id': SERIES_ID },
          partOfSeason: { '@type': 'CreativeWorkSeason', name: seasonTitle[e.season] },
          ...(e.djs?.length
            ? { actor: e.djs.filter((s) => djsBySlug[s]).map((s) => ({ '@type': 'Person', name: djsBySlug[s].name, url: `${site.url}/djs/${s}.html` })) }
            : {}),
          ...(e.url ? { url: e.url } : {}),
          ...(e.artwork ? { image: e.artwork } : {}),
        })),
      ],
    },
    body: emission({ site, episodes, djsBySlug }),
  }),
});

// ---------- Pages DJ ----------
for (const dj of djs) {
  // Sans pistes renseignées, la page reprend les épisodes de l'émission où le DJ joue.
  const own = episodes
    .filter((e) => e.djs?.includes(dj.slug))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => ({
      title: e.title,
      source: `${site.show.name} · ${dateLabel(e.date)}`,
      duration: e.duration,
      url: e.url,
      artwork: e.artwork,
    }));
  const tracks = dj.tracks.length ? dj.tracks : own;
  const path = `djs/${dj.slug}.html`;
  const desc = dj.lead
    ? dj.lead
    : `${dj.name}, DJ résident du collectif ${site.name} à ${site.city} (${dj.styles.join(', ')}). Podcasts, photos, biographie et booking.`;

  pages.push({
    path,
    priority: '0.8',
    html: layout({
      site,
      assets,
      depth: 1,
      path,
      active: 'djs',
      title: `${dj.name} — DJ ${dj.styles.slice(0, 3).join(', ')} | ${site.name}`,
      description: desc,
      ogImage: dj.photo,
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Person',
            '@id': `${site.url}/${path}#dj`,
            name: dj.name,
            url: `${site.url}/${path}`,
            jobTitle: 'DJ',
            description: [dj.lead, ...dj.bio].filter(Boolean).join(' ') || desc,
            genre: dj.styles,
            homeLocation: { '@type': 'Place', name: site.city },
            memberOf: { '@id': ORG_ID, '@type': 'MusicGroup', name: site.name },
            ...(dj.photo ? { image: `${site.url}/${dj.photo.replace(/^\/+/, '')}` } : {}),
            sameAs: sameAs(dj.links),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${site.url}/` },
              { '@type': 'ListItem', position: 2, name: 'Djs', item: `${site.url}/#djs` },
              { '@type': 'ListItem', position: 3, name: dj.name, item: `${site.url}/${path}` },
            ],
          },
        ],
      },
      body: djPage({ site, dj, tracks }),
    }),
  });
}

for (const p of pages) await write(p.path, p.html);

// ---------- SEO / IA ----------
const today = new Date().toISOString().slice(0, 10);
await write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((p) => `  <url><loc>${site.url}/${p.path.replace(/index\.html$/, '')}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`)
  .join('\n')}
</urlset>
`
);

await write(
  'robots.txt',
  `# Le site est ouvert à tous les robots, moteurs de recherche et IA compris.
User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`
);

// llms.txt : résumé en texte brut, lisible directement par les assistants IA.
const llms = `# ${site.name}

> ${site.description}

Contact et booking : ${site.email}

## Pages

- [Accueil](${site.url}/) : présentation du collectif, prochaines dates, chiffres clés, émission, roster, booking.
- [Émission](${site.url}/emission.html) : ${site.show.name}, émission de podcasts (${site.show.frequency.toLowerCase()}). ${episodes.length} épisodes sur ${site.show.seasons.length} saisons.
${djs.map((d) => `- [${d.name}](${site.url}/djs/${d.slug}.html) : DJ résident (${d.styles.join(', ')}).`).join('\n')}

## Le collectif

${site.approach.text}

${site.stats.map((s) => `- ${s.label} : ${s.value}. ${s.text}`).join('\n')}

## Émission — ${site.show.name}

${site.show.text}

${site.show.seasons
  .map((s) => {
    const eps = episodes.filter((e) => e.season === s.id).sort((a, b) => b.date.localeCompare(a.date));
    if (!eps.length) return '';
    return `### ${s.title} (${s.years})${s.url ? ` : ${s.url}` : ''}\n${eps.map((e) => `- ${e.title} (${dateLabel(e.date)}, ${e.duration})${e.url ? ` : ${e.url}` : ''}`).join('\n')}`;
  })
  .filter(Boolean)
  .join('\n\n')}

## Formats

${site.formats.intro}

${site.formats.items.map((f) => `- ${f}`).join('\n')}

## Projets

${[...site.projects.current, ...site.projects.past].map((p) => `- ${p.name}${p.years ? ` (${p.years})` : ''} : ${p.text}`).join('\n')}

Lieux : ${site.gallery.venues.map((v) => v.name).join(', ')}.

## DJs

${djs
  .map((d) => `### ${d.name}\nStyles : ${d.styles.join(', ')}.\n${[d.lead, ...d.bio].filter(Boolean).join('\n\n') || 'Biographie à venir.'}`)
  .join('\n\n')}
`;
await write('llms.txt', llms);

// ---------- Rapport ----------
console.log(`✓ ${pages.length} pages générées dans dist/`);
pages.forEach((p) => console.log(`  - ${p.path}`));
if (todo.size) {
  console.log('\nÀ compléter :');
  for (const [category, items] of [...todo].sort()) console.log(`  · ${category} (${items.size}) — ${[...items].join(', ')}`);
}
