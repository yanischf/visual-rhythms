# Visual Rhythms — site vitrine

Site 100 % HTML statique, généré à partir de fichiers JSON par un script Node **sans aucune dépendance**.
Tout le contenu est dans le HTML servi (lisible par les moteurs de recherche et les IA, même sans JavaScript).
Le JavaScript (`static/js/site.js`, ~7 Ko non minifié) n'ajoute que du confort : switch clair/sombre, apparitions au scroll, filtres de la page Émission, lecteur Soundcloud habillé.

## Démarrer

```bash
node build.mjs     # génère dist/
node serve.mjs     # http://localhost:4321
```

Node 18+ suffit. Pas de `npm install`. Le dossier `dist/` se dépose tel quel sur n'importe quel hébergeur statique (Netlify, Cloudflare Pages, OVH, GitHub Pages…).

## Structure

```
content/          ← le contenu (c'est ici qu'on édite, puis on relance le build)
  site.json         textes de l'accueil, email, réseaux, émission, saisons
  djs.json          roster : bio, styles, podcasts, photos, liens
  episodes.json     épisodes de l'émission (page Émission)
  events.json       prochaines dates (vide = emplacements « À compléter »)
  styles.json       styles musicaux + couleurs
src/              ← gabarits HTML (layout, composants, pages)
static/           ← CSS, JS, favicon, images (copiés dans dist/)
build.mjs         ← génère dist/ + sitemap.xml, robots.txt, llms.txt
serve.mjs         ← serveur local de prévisualisation
```

## Mise en ligne

Chaque push sur `main` régénère et publie le site via GitHub Pages (`.github/workflows/deploy.yml`).
Adresse provisoire : https://yanischf.github.io/visual-rhythms/ (non indexée par les moteurs).

Pour brancher `visual-rhythms.net` : ajouter un fichier `static/CNAME` contenant `visual-rhythms.net`, retirer `SITE_URL` et `NOINDEX` du workflow, puis configurer le DNS chez le registrar (voir la doc GitHub Pages « custom domain »).

## Ajouter les images

1. Déposer les fichiers dans `static/img/` (ex. `static/img/djs/stepanov-hero.jpg`), JPG/WebP, ~2400 px de large max.
2. Renseigner le chemin **sans** `static/` dans le JSON : `"photo": "img/djs/stepanov-hero.jpg"`.
3. `node build.mjs`

Tant qu'un champ image est vide, un emplacement en pointillés s'affiche (comme dans la maquette).
À la fin de chaque build, la console liste tout ce qui reste à compléter (images, liens Soundcloud, rider, presskit…).

Champs image : `site.hero.image`, `site.gallery.photos[].src`, `site.show.image`, `djs[].photo` (hero), `djs[].portrait` (carte du roster, sinon `photo`), `djs[].photos[]` (`{ "src", "alt" }`, mosaïque), `tracks[].artwork`, `episodes[].artwork`.

## Liens Soundcloud

- Piste : champ `url` d'un épisode ou d'un `track` (URL publique, ex. `https://soundcloud.com/visual-rhythms/vr-32`).
  Sans JS, le bouton play ouvre Soundcloud ; avec JS, la piste se joue sur place via le Widget API officiel, et la forme d'onde affiche la progression.
- Profils : `site.links.*` (collectif, page Soundcloud de l'émission) et `djs[].links.*`.
- Si `tracks` est vide pour un DJ, sa page reprend automatiquement ses épisodes de l'émission.

## Dates

```json
{ "date": "2026-10-17", "title": "Visual Rhythms × Le Sucre", "venue": "Le Sucre", "city": "Lyon",
  "lineup": ["stepanov", "d3"], "status": "En vente", "ticketUrl": "https://…" }
```

Seules les dates à venir (au moment du build) sont affichées : relancer le build après une soirée, ou le programmer (cron / hook de déploiement).

## Référencement & IA

- Balises `title`, `description`, `canonical`, Open Graph sur chaque page.
- Données structurées JSON-LD : `MusicGroup` (collectif + membres), `Person` (DJ), `PodcastSeries` / `PodcastEpisode`, `MusicEvent`.
- `sitemap.xml`, `robots.txt` (ouvert à tous les robots, IA comprises) et `llms.txt` (résumé texte du site pour les assistants IA).
- Domaine configuré dans `content/site.json` → `url`.

## Polices

Bricolage Grotesque et Space Grotesk (licence SIL Open Font License) sont hébergées dans `static/fonts/` (sous-ensemble latin, ~100 Ko), sans appel à Google Fonts.

## Thème

Clair / sombre selon la préférence système par défaut ; le switch mémorise le choix (localStorage). Sans JS, le thème suit le système et le switch est masqué.

## Suite : CMS

Les JSON de `content/` reprennent le modèle de données prévu pour le CMS (DJ, Podcast, Event, Settings). Le CMS n'aura qu'à écrire ces données puis relancer `build.mjs`.
En pause pour l'instant : le plan retenu est dans [docs/CMS-plan.md](docs/CMS-plan.md).
