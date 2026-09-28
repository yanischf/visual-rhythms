# CMS — plan retenu (en pause)

Statut : mis en pause le 28/09/2026, à reprendre plus tard.
Maquettes de référence : `CMS Visual Rhythms.dc.html` du handoff Claude Design.

## Besoin exprimé
- Au plus simple : **un seul compte admin**, pas de gestion d'utilisateurs.
- **Un seul lien** (`visual-rhythms.net/admin`) et modification du contenu **en direct**.
- Pas de formulaire de booking sur le site (on garde le mailto) → **écran Booking du CMS supprimé**.

## Architecture proposée
- Même dépôt, dossier dédié `cms/` (interface admin) + `server.mjs` à la racine (remplace `serve.mjs`).
- Un seul serveur Node, **zéro dépendance, pas de base de données** :
  - sert le site public (`dist/`) et l'admin (`/admin`) ;
  - l'API écrit `content/*.json`, dépose les images dans `static/img/`, relance le build → site à jour en ~1 s ;
  - build dans un dossier temporaire puis bascule, pour ne jamais servir un site à moitié généré.
- Connexion : mot de passe unique stocké haché dans une variable d'environnement, cookie de session signé (HttpOnly, Secure, SameSite), limitation des tentatives.
- Images : redimensionnées dans le navigateur (canvas, 2400 px max) avant envoi.
- Import Soundcloud : oEmbed côté serveur (`https://soundcloud.com/oembed?url=…&format=json`) → titre + artwork ; durée saisie à la main.
- Sauvegarde automatique du contenu avant chaque enregistrement (historique pour revenir en arrière).

## Écrans à reprendre des maquettes
Tableau de bord · Podcasts (liste + édition) · Dates · Médiathèque · DJs · Page DJ (édition).
Question restée ouverte : ajouter un écran « Textes de l'accueil » (accroche, citation, chiffres, saisons), absent des maquettes.

## Conséquence sur l'hébergement
Il faut un hébergeur qui fait tourner Node avec disque persistant : petit VPS (OVH, Scaleway ~5 €/mois), Render ou Railway.
Les hébergeurs purement statiques (Netlify, GitHub Pages) ne suffisent pas pour l'admin.

## Alternatives écartées
- Supabase : plus de pièces (base, stockage, hébergeur statique, rebuild à distance), publication en 1–2 min.
- CMS via GitHub : un compte GitHub par personne.
