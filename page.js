// Repositories et activité (lus dans data/github.json, mis à jour par tools/actualiser.py), écran d'entrée et lecteur de musique.
// Rien ne part vers un autre site tant qu'on n'est pas entré avec la musique (ou qu'on n'a pas appuyé sur un disque).
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  var COULEURS = { Rust: '#dea584', TypeScript: '#3178c6', JavaScript: '#f1e05a', Java: '#b07219', CSS: '#8a6bd1', Python: '#4b8bbe', HTML: '#e34c26' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function plural(n, un, plusieurs) { return n + ' ' + (n > 1 ? plusieurs : un); }

  // Un cube de la couleur du langage : l'icône du repository
  function cube(couleur) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icone');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    [['1,5 8,1 15,5 8,9', 'top'], ['1,5 8,9 8,15 1,11', 'left'], ['15,5 8,9 8,15 15,11', 'right']].forEach(function (f) {
      var p = document.createElementNS(NS, 'polygon');
      p.setAttribute('points', f[0]);
      p.setAttribute('fill', f[1] === 'top' ? shade(couleur, 0.35) : f[1] === 'left' ? couleur : shade(couleur, -0.35));
      svg.appendChild(p);
    });
    return svg;
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return '#' + c.map(function (v) {
      var w = k > 0 ? v + (255 - v) * k : v * (1 + k);
      return Math.round(w).toString(16).padStart(2, '0');
    }).join('');
  }

  // ---- Repositories
  function showRepos(repos) {
    var list = document.getElementById('repos');
    var section = document.getElementById('repos-bloc');
    if (!list || !section || !repos.length) return;
    repos.forEach(function (r) {
      var li = el('li');
      var a = el('a', 'ligne');
      a.href = r.url;
      a.rel = 'noopener';
      a.appendChild(cube(COULEURS[r.language] || '#7d8492'));
      a.appendChild(el('span', 't', r.name));
      a.appendChild(el('span', 'd', r.description || 'Pas de description.'));
      var infos = [];
      if (r.language) infos.push(r.language);
      if (r.stars > 0) infos.push(plural(r.stars, 'étoile', 'étoiles'));
      infos.push('mis à jour le ' + date.format(new Date(r.pushed_at)));
      a.appendChild(el('span', 'm', infos.join(', ')));
      li.appendChild(a);
      list.appendChild(li);
    });
    document.getElementById('nb-repos').textContent = '(' + repos.length + ')';
    section.hidden = false;
  }

  // ---- Activité : un bloc par jour, sept lignes, une colonne par semaine
  function showActivity(activity) {
    var grid = document.getElementById('heat');
    var section = document.getElementById('activite');
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
    var resume = plural(activity.total, 'contribution', 'contributions') + ' sur les ' + weeks.length + ' dernières semaines';
    grid.setAttribute('aria-label', resume);
    document.getElementById('activite-texte').textContent = resume + '.';
    section.hidden = false;
  }

  fetch('data/github.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) { showRepos(data.repos || []); showActivity(data.activity); })
    .catch(function () { /* pas de données : ces deux blocs restent cachés */ });

  // ---- Lecteur : YouTube et Vimeo, une piste après l'autre
  var ORIGINES = { youtube: 'https://www.youtube-nocookie.com', vimeo: 'https://player.vimeo.com' };
  var disques = Array.prototype.slice.call(document.querySelectorAll('.disque'));
  var pistes = disques.map(function (a) {
    return { lien: a, fournisseur: a.dataset.provider, id: a.dataset.id, titre: a.dataset.titre, par: a.dataset.par };
  });
  var lecteur = document.getElementById('lecteur');
  var barre = document.getElementById('barre');
  var barreTexte = document.getElementById('barre-texte');
  var btnLecture = document.getElementById('btn-lecture');
  var btnPause = document.getElementById('btn-pause');
  var btnSuivant = document.getElementById('btn-suivant');
  var courante = -1, cadre = null, etat = null; // etat : null (inconnu), 'lecture' ou 'pause'
  var recu = false; // le lecteur a-t-il déjà répondu ?

  function adresse(p) {
    if (p.fournisseur === 'youtube') {
      var q = '?autoplay=1&enablejsapi=1&rel=0&playsinline=1';
      if (location.origin && location.origin !== 'null') q += '&origin=' + encodeURIComponent(location.origin);
      return ORIGINES.youtube + '/embed/' + encodeURIComponent(p.id) + q;
    }
    return ORIGINES.vimeo + '/video/' + encodeURIComponent(p.id) + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0&playsinline=1';
  }
  function envoyer(message) {
    if (!cadre || !cadre.contentWindow) return;
    cadre.contentWindow.postMessage(JSON.stringify(message), ORIGINES[pistes[courante].fournisseur]);
  }
  function abonner() {
    var p = pistes[courante];
    if (p.fournisseur === 'youtube') {
      envoyer({ event: 'listening', id: 1, channel: 'widget' });
    } else {
      ['play', 'pause', 'ended', 'finish'].forEach(function (nom) { envoyer({ method: 'addEventListener', value: nom }); });
    }
  }
  function afficherBarre() {
    var p = pistes[courante];
    if (!p) return;
    var debut = etat === 'lecture' ? 'En lecture : ' : etat === 'pause' ? 'En pause : ' : 'Musique : ';
    barreTexte.textContent = debut + p.titre + ' (' + p.par + ')';
    barre.hidden = false;
  }
  function changerEtat(nouveau) {
    if (nouveau === etat) return;
    etat = nouveau;
    afficherBarre();
  }

  function charger(i) {
    var p = pistes[i];
    courante = i;
    etat = null;
    lecteur.textContent = '';
    cadre = document.createElement('iframe');
    cadre.src = adresse(p);
    cadre.title = 'Lecteur : ' + p.titre + ', ' + p.par;
    cadre.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    cadre.referrerPolicy = 'strict-origin-when-cross-origin';
    cadre.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
    var mine = cadre;
    recu = false;
    // Le lecteur met un moment à démarrer : on lui demande de nous tenir au courant toutes les demi-secondes, jusqu'à sa première réponse.
    cadre.addEventListener('load', function () {
      var essais = 0;
      var minuterie = setInterval(function () {
        if (cadre !== mine || recu || ++essais > 30) { clearInterval(minuterie); return; }
        abonner();
      }, 500);
    });
    lecteur.appendChild(cadre);
    pistes.forEach(function (x, k) { if (k === i) x.lien.setAttribute('aria-current', 'true'); else x.lien.removeAttribute('aria-current'); });
    afficherBarre();
  }
  function suivante() { if (pistes.length) charger((courante + 1) % pistes.length); }

  // Les messages du lecteur : 1 = lecture, 2 = pause, 0 = fin (YouTube) ; play / pause / ended (Vimeo).
  var dernierEtat = null;
  window.addEventListener('message', function (e) {
    if (!cadre || e.source !== cadre.contentWindow) return;
    var d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { return; } }
    if (!d || typeof d !== 'object') return;
    // Vimeo envoie aussi des messages de son propre contrôle anti-robot : seuls ceux du lecteur comptent.
    if (d.channel === 'widget' || d.event === 'ready' || d.event === 'play' || d.event === 'pause' || d.event === 'ended' || d.event === 'finish') recu = true;
    if (d.event === 'ready' && pistes[courante].fournisseur === 'vimeo') abonner();
    var code = null;
    if (pistes[courante].fournisseur === 'youtube') {
      if (d.event === 'onStateChange') code = d.info;
      else if (d.event === 'infoDelivery' && d.info && typeof d.info.playerState === 'number') code = d.info.playerState;
    } else if (d.event === 'play') code = 1;
    else if (d.event === 'pause') code = 2;
    else if (d.event === 'ended' || d.event === 'finish') code = 0;
    if (code === null || code === dernierEtat) return;
    dernierEtat = code;
    if (code === 1) changerEtat('lecture');
    else if (code === 2) changerEtat('pause');
    else if (code === 0) { dernierEtat = null; suivante(); }
  });

  function commande(nom) {
    if (courante < 0) return;
    var yt = pistes[courante].fournisseur === 'youtube';
    if (nom === 'pause') envoyer(yt ? { event: 'command', func: 'pauseVideo', args: [] } : { method: 'pause' });
    else envoyer(yt ? { event: 'command', func: 'playVideo', args: [] } : { method: 'play' });
  }
  btnPause.addEventListener('click', function () { commande('pause'); });
  btnLecture.addEventListener('click', function () { commande('lecture'); });
  btnSuivant.addEventListener('click', function () { dernierEtat = null; suivante(); });

  disques.forEach(function (lien, i) {
    lien.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return; // ouvrir dans un onglet reste possible
      event.preventDefault();
      dernierEtat = null;
      charger(i);
    });
  });

  // ---- Écran d'entrée : un clic, et la musique démarre (un navigateur ne lance le son qu'après un geste)
  var entree = document.getElementById('entree');
  var page = document.getElementById('page');
  var boutonEntrer = document.getElementById('entrer');
  if (entree && page) {
    page.setAttribute('inert', '');
    boutonEntrer.focus();
    var entrer = function (avecMusique) {
      page.removeAttribute('inert');
      document.body.classList.add('entre');
      entree.classList.add('sortie');
      setTimeout(function () { entree.hidden = true; }, 450);
      if (avecMusique && pistes.length) charger(0); // dans le même geste que le clic : le son est autorisé
    };
    boutonEntrer.addEventListener('click', function () { entrer(true); });
    document.getElementById('entrer-muet').addEventListener('click', function () { entrer(false); });
  }
})();
