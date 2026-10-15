// Booking & contact : e-mail, téléphone, réseaux (site.json → contact, socials) sur une photo de fond.
import { $, esc, drive } from '../core.js';

export default {
  id: 'contact',
  nav: 'nav.contact',
  className: 'contact',

  html: () => `
    <div class="contact__bg" id="contactBg"></div>
    <div class="wrap contact__inner">
      <h2 class="h2" data-i18n="contact.title">Booking & contact</h2>
      <p class="contact__lead" data-i18n="contact.lead"></p>
      <a class="contact__mail" id="mailLink"></a>
      <a class="contact__phone" id="phoneLink"></a>
      <div class="socials" id="socials"></div>
    </div>`,

  render(ctx, el) {
    const c = ctx.site.contact || {};
    $('#mailLink', el).href = `mailto:${c.email}?subject=${encodeURIComponent(`Booking ${ctx.artist}`)}`;
    $('#mailLink', el).textContent = c.email || '';
    if (c.phone) { $('#phoneLink', el).href = `tel:${c.phoneIntl || c.phone}`; $('#phoneLink', el).textContent = c.phone; }
    $('#socials', el).innerHTML = (ctx.site.socials || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join('');
  },

  theme(ctx, el) {
    const booking = ctx.photo('bookingPhoto', 1);
    if (booking) $('#contactBg', el).innerHTML = `<img src="${drive.img(booking.id, 1800)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  },

  track(target) {
    if (target.closest('#mailLink')) return ['contact', { method: 'email' }];
    if (target.closest('#phoneLink')) return ['contact', { method: 'phone' }];
    const x = target.closest('#socials a');
    if (x) return ['social_click', { network: x.textContent }];
  },
};
