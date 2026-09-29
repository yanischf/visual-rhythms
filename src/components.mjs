// Blocs réutilisés entre les pages.
import { esc, media, playButton, waveform } from './lib.mjs';

// Blob irisé + voile optionnel. `style` porte taille/position propres à chaque carte.
export function blob(style, { veil = null } = {}) {
  const v = veil === 'tl' ? '<div class="veil veil--tl" aria-hidden="true"></div>' : veil ? '<div class="veil" aria-hidden="true"></div>' : '';
  return `<div class="blob" style="${style}" aria-hidden="true"></div>${v}`;
}

// Lecteur Soundcloud habillé. Sans JS, le bouton play ouvre la piste sur Soundcloud.
export function player({ title, dj, djHref, src, srcDatetime, duration, url, artwork, tint, seed, rel, compact = false, left, todoKey }) {
  const djHtml = dj ? (djHref ? `<a href="${esc(djHref)}">${esc(dj)}</a>` : esc(dj)) : '';
  const srcHtml = srcDatetime ? `<time datetime="${esc(srcDatetime)}">${esc(src)}</time>` : esc(src || '');
  const wave = compact
    ? waveform({ seed, bars: 300, barW: 2, gap: 2, height: 34 })
    : waveform({ seed, bars: 280, barW: 3, gap: 2, height: 60 });
  const leftHtml = left ? esc(left) : '<span data-elapsed>0:00</span>';
  return `<li class="card tint player${compact ? ' player--sm' : ''}" style="--t1:${tint[0]};--t2:${tint[1]}" data-player>
<div class="player-art">${media({ src: artwork, alt: `Artwork — ${title}`, placeholder: 'Artwork', rel, todoKey: todoKey ? ['Image : artwork', todoKey] : undefined })}</div>
<div class="player-body">
<div class="player-head">
${playButton({ url, title, todoKey: todoKey ? ['Lien Soundcloud : piste', todoKey] : undefined })}
<div class="player-titles"><p class="player-dj">${djHtml}</p><h3 class="player-title">${esc(title)}</h3></div>
<span class="player-src">${srcHtml}</span>
</div>
<div class="wave">${wave}</div>
<div class="player-times"><span>${leftHtml}</span><span data-total>${esc(duration || '')}</span></div>
</div>
</li>`;
}

// Carte « Écrivez-nous » + carte contact.
export function bookingRow({ site, kicker, pills, artist = false }) {
  const style = artist
    ? 'width:700px;height:440px;left:50%;bottom:-290px;margin-left:-350px;--from:300deg;--dur:21s'
    : 'width:700px;height:460px;left:50%;bottom:-300px;margin-left:-350px;--from:300deg;--dur:21s;opacity:.7';
  return `<section class="row g-book ${artist ? 'row--gap-lg ' : ''}row--last" data-reveal aria-labelledby="booking-title">
<div class="card book-card${artist ? ' book-card--artist' : ''}">
${blob(style, { veil: artist ? 'br' : null })}
<p class="z label ${artist ? 'muted' : 'label--wide o85'}">${esc(kicker)}</p>
<h2 class="z book-title" id="booking-title">Écrivez-nous</h2>
</div>
<div class="card contact-card${artist ? ' contact-card--artist' : ''}">
<a class="contact-mail" href="mailto:${esc(site.email)}">${site.email.split('@').map(esc).join('@<br>')}</a>
<div class="pills">${pills}</div>
</div>
</section>`;
}
