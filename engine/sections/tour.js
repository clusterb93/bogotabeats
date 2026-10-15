// Dates (content/dates.json + flyers du Drive) : carte « prochaine date », à venir, passées.
// Le tri à venir / passé se fait tout seul selon la date du jour (heure locale du visiteur).
// Options : "pastVisible" (dates passées affichées avant « Voir tout », défaut 6).
import { $, esc, drive } from '../core.js';

// Flyers : dossier Drive "Flyers" (ou "Affiches"). Un fichier nommé "2026-10-16 ....jpg" est associé
// automatiquement à la date du même jour ; s'il n'y a pas encore de date ce jour-là, le flyer en crée une,
// lue dans son nom : "AAAA-MM-JJ - Soirée - Lieu - Ville.jpg".
function collectDates(ctx) {
  const flyers = ctx.filesOf('flyers', 'image');
  const list = ctx.dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)).map((d) => ({ ...d }));
  for (const f of flyers) {
    const day = f.name.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (!day) continue;
    const match = list.find((d) => d.date === day);
    if (match) { match.flyerFile ??= f; continue; }
    const [, event = '', venue = '', city = ''] = f.name.replace(/\.[a-z0-9]+$/i, '').split(/\s+[-–]\s+/);
    list.push({ date: day, event: event || ctx.artist, venue, city, type: 'club', flyerFile: f });
  }
  for (const d of list) if (d.flyer && !d.flyerFile) d.flyerFile = ctx.byName(flyers, d.flyer) || (/^https?:/.test(d.flyer) ? { url: d.flyer } : null);
  return list;
}
const flyerSrc = (f, w) => (f?.url ? f.url : f ? drive.img(f.id, w) : '');

function gigRow(ctx, d) {
  const { t, fmt } = ctx;
  const where = [d.venue, d.city].filter(Boolean).join(' · ');
  const type = (d.type || 'club').toLowerCase().replace(/[\s_-]+/g, ''); // "open air" → "openair"
  const badge = d.link
    ? `<a class="btn btn--ghost btn--sm" href="${esc(d.link)}" target="_blank" rel="noopener">${t('dates.info')}</a>`
    : `<span class="gig__type gig__type--${esc(type)}">${esc(t(`type.${type}`) === `type.${type}` ? type : t(`type.${type}`))}</span>`;
  return `<li class="gig reveal">
    <div class="gig__date"><span class="gig__day">${fmt(d.date, { day: '2-digit' })}</span><span class="gig__month">${fmt(d.date, { month: 'short' }).replace('.', '')}</span><span class="gig__year">${d.date.slice(0, 4)}</span></div>
    <div><p class="gig__event">${esc(ctx.tr(d.event))}</p>${where ? `<p class="gig__where">${esc(where)}${d.time ? ` · ${esc(d.time)}` : ''}</p>` : ''}</div>
    ${badge}
  </li>`;
}

// Compte à rebours lisible : "Tonight", "Tomorrow", "In 3 days"…
function countdown(ctx, day, today) {
  const diff = Math.round((new Date(`${day}T12:00:00`) - new Date(`${today}T12:00:00`)) / 864e5);
  if (diff === 0) return ctx.t('dates.tonight');
  if (diff === 1) return ctx.t('dates.tomorrow');
  return new Intl.RelativeTimeFormat(ctx.locale(), { numeric: 'auto' }).format(diff, diff > 60 ? 'month' : 'day')
    .replace(/^./, (c) => c.toUpperCase());
}

// Fichier .ics pour "Ajouter au calendrier" (heure de début lue dans "time" : "20:45–00:45")
function icsUrl(ctx, d) {
  const { artist, slug, tr } = ctx;
  const tz = ctx.site.timezone || 'Europe/Paris';
  const [start, end] = (d.time || '').split(/[–-]/).map((s) => s.trim().replace('h', ':'));
  const ymd = d.date.replace(/-/g, '');
  const hm = (s) => (s && /^\d{1,2}:\d{2}$/.test(s) ? s.padStart(5, '0').replace(':', '') + '00' : null);
  const s = hm(start), e = hm(end);
  const endDay = e && s && e < s ? new Date(new Date(`${d.date}T12:00:00`).getTime() + 864e5).toLocaleDateString('sv').replace(/-/g, '') : ymd;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${artist}//Tour//EN`, 'BEGIN:VEVENT',
    `UID:${ymd}-${encodeURIComponent(tr(d.event)).slice(0, 40)}@${slug}`,
    s ? `DTSTART;TZID=${tz}:${ymd}T${s}` : `DTSTART;VALUE=DATE:${ymd}`,
    s && e ? `DTEND;TZID=${tz}:${endDay}T${e}` : null,
    `SUMMARY:${artist} @ ${tr(d.event)}`, `LOCATION:${[d.venue, d.city].filter(Boolean).join(', ')}`,
    d.link ? `URL:${d.link}` : null, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean);
  return URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
}

// Carte "Prochaine date" : la date à venir la plus proche, mise en avant
function nextGigCard(ctx, d, today) {
  const { t, fmt, tr } = ctx;
  const where = [d.venue, d.city].filter(Boolean).join(' · ');
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([d.venue, d.city].filter(Boolean).join(' '))}`;
  const flyer = flyerSrc(d.flyerFile, 900);
  if (flyer) ctx.galleries[`flyer-${d.date}`] = [d.flyerFile];
  return `<article class="next-gig reveal${flyer ? ' next-gig--flyer' : ''}">
    ${flyer
      ? `<button type="button" class="next-gig__flyer" data-lb="flyer-${d.date}" data-i="0" aria-label="Flyer"><img src="${flyer}" alt="Flyer — ${esc(tr(d.event))}" referrerpolicy="no-referrer"></button>`
      : `<div class="next-gig__date"><span class="next-gig__day">${fmt(d.date, { day: '2-digit' })}</span><span class="next-gig__month">${fmt(d.date, { month: 'long' })}</span><span class="next-gig__wd">${fmt(d.date, { weekday: 'long' })}</span></div>`}
    <div class="next-gig__body">
      <p class="next-gig__kicker"><span class="next-gig__pulse"></span>${t('dates.next')} · <b>${esc(countdown(ctx, d.date, today))}</b></p>
      <h3 class="next-gig__event">${esc(tr(d.event))}</h3>
      <p class="next-gig__meta">${fmt(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}${d.time ? ` · ${esc(d.time)}` : ''}</p>
      ${where ? `<p class="next-gig__where">${esc(where)}</p>` : ''}
      <div class="next-gig__cta">
        ${d.link ? `<a class="btn btn--accent btn--sm" href="${esc(d.link)}" target="_blank" rel="noopener">${t('dates.event')}</a>` : ''}
        <a class="btn btn--ghost btn--sm" href="${icsUrl(ctx, d)}" download="${ctx.slug}-${d.date}.ics">${t('dates.ics')}</a>
        ${where ? `<a class="btn btn--ghost btn--sm" href="${maps}" target="_blank" rel="noopener">${t('dates.map')}</a>` : ''}
      </div>
    </div>
  </article>`;
}

const state = { all: [], showAllPast: false };

export default {
  id: 'dates',
  nav: 'nav.dates',
  className: 'section',

  html: () => `
    <div class="wrap">
      <h2 class="h2" data-i18n="dates.title">Tour dates</h2>
      <div id="upcoming"></div>
      <h3 class="h3" data-i18n="dates.past">Past gigs</h3>
      <ol class="gigs gigs--past" id="past"></ol>
      <button class="btn btn--ghost btn--sm" id="morePast" hidden data-i18n="dates.more">See all dates</button>
    </div>`,

  setup(ctx, el, cfg) {
    state.all = collectDates(ctx);
    $('#morePast', el).addEventListener('click', () => { state.showAllPast = true; this.render(ctx, el, cfg); ctx.observeReveal(); });
  },

  render(ctx, el, cfg) {
    const pastVisible = cfg.pastVisible ?? 6;
    const today = new Date().toLocaleDateString('sv');
    const upcoming = state.all.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = state.all.filter((d) => d.date < today).sort((a, b) => b.date.localeCompare(a.date));
    const row = (d) => gigRow(ctx, d);

    $('#upcoming', el).innerHTML = upcoming.length
      ? nextGigCard(ctx, upcoming[0], today) + (upcoming.length > 1
        ? `<h3 class="h3">${ctx.t('dates.upcoming')}</h3><ol class="gigs">${upcoming.slice(1).map(row).join('')}</ol>` : '')
      : `<div class="empty-upcoming reveal"><p>${ctx.t('dates.none')}</p><a class="btn btn--accent btn--sm" href="#contact">${ctx.t('dates.book')}</a></div>`;

    $('#past', el).innerHTML = (state.showAllPast ? past : past.slice(0, pastVisible)).map(row).join('');
    $('#morePast', el).hidden = state.showAllPast || past.length <= pastVisible;
  },
};
