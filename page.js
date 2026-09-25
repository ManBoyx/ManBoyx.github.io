// Les dépôts et l'activité (lus dans data/github.json, mis à jour par tools/actualiser.py) et le lecteur de musique.
// Rien ne part vers un autre site tant que personne n'appuie sur une piste : alors seulement, le lecteur YouTube (sans cookies) se charge.
(function () {
  'use strict';

  var LOCALE = 'fr-FR';
  var date = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }

  // ---- Dépôts
  function showRepos(repos) {
    var list = document.getElementById('repos');
    var section = document.getElementById('projets');
    if (!list || !section || !repos.length) return;
    repos.forEach(function (r) {
      var li = el('li');
      var a = el('a', 'repo');
      a.href = r.url;
      a.rel = 'noopener';
      a.appendChild(el('span', 'rname', r.name));
      if (r.description) a.appendChild(el('span', 'rdesc', r.description));
      var meta = el('span', 'rmeta');
      if (r.language) {
        var lang = el('span', 'lang', r.language);
        lang.dataset.lang = r.language;
        meta.appendChild(lang);
      }
      if (r.stars > 0) meta.appendChild(el('span', 'stars', plural(r.stars, 'étoile', 'étoiles')));
      meta.appendChild(el('span', 'maj', 'Mis à jour le ' + date.format(new Date(r.pushed_at))));
      a.appendChild(meta);
      li.appendChild(a);
      list.appendChild(li);
    });
    section.hidden = false;
  }

  // ---- Activité : un bloc par jour, sept lignes (lundi en haut), une colonne par semaine
  function showActivity(activity) {
    var grid = document.getElementById('heat');
    var section = document.getElementById('activite');
    var text = document.getElementById('activite-texte');
    if (!grid || !section || !activity || !activity.weeks.length) return;
    var weeks = activity.weeks;
    grid.style.setProperty('grid-template-columns', 'repeat(' + weeks.length + ', 1fr)');
    weeks.forEach(function (week) {
      week.forEach(function (day) {
        var d = el('i', 'd l' + day.level);
        d.title = plural(day.count, 'contribution', 'contributions') + ', le ' + date.format(new Date(day.date + 'T12:00:00'));
        grid.appendChild(d);
      });
    });
    var summary = plural(activity.total, 'contribution', 'contributions') + ' sur les ' + weeks.length + ' dernières semaines';
    grid.setAttribute('aria-label', summary);
    text.textContent = summary + '.';
    section.hidden = false;
  }

  fetch('data/github.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      showRepos(data.repos || []);
      showActivity(data.activity);
    })
    .catch(function () { /* pas de données : les sections restent cachées, la page reste complète */ });

  // ---- Musique
  var player = document.getElementById('player');
  var tracks = Array.prototype.slice.call(document.querySelectorAll('.track'));

  function stop() {
    player.textContent = '';
    tracks.forEach(function (t) { t.removeAttribute('aria-current'); });
  }

  tracks.forEach(function (track) {
    track.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return; // ouvrir dans un onglet reste possible
      event.preventDefault();
      if (track.getAttribute('aria-current') === 'true') { stop(); return; }
      stop();
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(track.dataset.id) + '?autoplay=1&rel=0&playsinline=1';
      frame.title = 'Lecteur : ' + track.dataset.title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
      player.appendChild(frame);
      track.setAttribute('aria-current', 'true');
    });
  });
})();
