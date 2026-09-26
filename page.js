// Repositories et activité (lus dans data/github.json, mis à jour par tools/actualiser.py) et lecteur de musique.
// Le lecteur pilote les lecteurs officiels de YouTube et de Vimeo, ou un fichier audio du site (fournisseur « local »).
// Rien ne part vers un autre site tant qu'on n'est pas entré avec la musique (ou qu'on n'a pas appuyé sur une piste).
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  var COULEURS = { Rust: '#dea584', HTML: '#e34c26', CSS: '#663399', Java: '#b07219', JavaScript: '#f1e05a', PHP: '#4F5D95', Python: '#3572A5', TypeScript: '#3178c6', Assembly: '#6E4C13', Lua: '#000080', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600', Shell: '#89e051' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function plural(n, un, plusieurs) { return n + ' ' + (n > 1 ? plusieurs : un); }
  function $(id) { return document.getElementById(id); }

  // ---- Repositories : un cube de la couleur du langage sert d'icône
  function eclaircir(hex, k) {
    var n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return '#' + c.map(function (v) {
      var w = k > 0 ? v + (255 - v) * k : v * (1 + k);
      return Math.round(w).toString(16).padStart(2, '0');
    }).join('');
  }
  function cube(couleur) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icone');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    [['1,5 8,1 15,5 8,9', -0.1], ['1,5 8,9 8,15 1,11', -0.3], ['15,5 8,9 8,15 15,11', -0.5]].forEach(function (f) {
      var p = document.createElementNS(NS, 'polygon');
      p.setAttribute('points', f[0]);
      p.setAttribute('fill', eclaircir(couleur, f[1]));
      svg.appendChild(p);
    });
    return svg;
  }
  function showRepos(repos) {
    var list = $('repos'), section = $('repos-bloc');
    if (!list || !section) return;
    if (!repos.length) {
      // Aucun repository public : le bloc reste là, avec une phrase, pour garder les trois blocs côte à côte.
      list.appendChild(el('li', 'vide-liste', 'Aucun repository public pour le moment.'));
      $('nb-repos').textContent = '(0)';
      section.hidden = false;
      return;
    }
    repos.forEach(function (r) {
      var li = el('li'), a = el('a', 'ligne');
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
    $('nb-repos').textContent = '(' + repos.length + ')';
    section.hidden = false;
  }

  // ---- Activité : un bloc par jour, sept lignes, une colonne par semaine
  function showActivity(activity) {
    var grid = $('heat'), section = $('activite');
    if (!grid || !section || !activity || !activity.weeks.length) return;
    grid.style.setProperty('grid-template-columns', 'repeat(' + activity.weeks.length + ', 1fr)');
    activity.weeks.forEach(function (week) {
      week.forEach(function (day) {
        var d = el('i', 'd l' + day.level);
        d.title = plural(day.count, 'contribution', 'contributions') + ', le ' + date.format(new Date(day.date + 'T12:00:00'));
        grid.appendChild(d);
      });
    });
    var resume = plural(activity.total, 'contribution', 'contributions') + ' sur les ' + activity.weeks.length + ' dernières semaines';
    grid.setAttribute('aria-label', resume);
    $('activite-texte').textContent = resume + '.';
    section.hidden = false;
  }

  fetch('data/github.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) { showRepos(data.repos || []); showActivity(data.activity); })
    .catch(function () { /* pas de données : ces deux blocs restent cachés */ });

  // ---- Compétences : un clic sur un langage affiche sa description, un second clic la referme
  var langues = Array.prototype.slice.call(document.querySelectorAll('.langue'));
  var panneau = $('langue-panneau'), astuce = $('langue-astuce');
  function fermerLangue() {
    langues.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    panneau.hidden = true;
    astuce.hidden = false;
  }
  langues.forEach(function (bouton) {
    bouton.addEventListener('click', function () {
      if (bouton.getAttribute('aria-expanded') === 'true') { fermerLangue(); return; }
      langues.forEach(function (b) { b.setAttribute('aria-expanded', b === bouton ? 'true' : 'false'); });
      panneau.textContent = '';
      var titre = el('h3');
      var pastille = el('i', 'pastille p-' + bouton.dataset.cle);
      pastille.setAttribute('aria-hidden', 'true');
      titre.appendChild(pastille);
      titre.appendChild(document.createTextNode(bouton.dataset.nom));
      panneau.appendChild(titre);
      panneau.appendChild(el('p', '', bouton.dataset.desc));
      panneau.hidden = false;
      astuce.hidden = true;
    });
  });
  if (panneau) panneau.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerLangue(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panneau.hidden) fermerLangue(); });

  // ---- Lecteur
  var ORIGINES = { youtube: 'https://www.youtube-nocookie.com', vimeo: 'https://player.vimeo.com' };
  var pistes = [];
  var ecran = $('ecran'), barre = $('barre'), progres = $('b-progres'), volume = $('b-vol'), boutonJouer = $('b-jouer');
  // L'état du lecteur : quelle piste, l'élément qui joue, et ce que le lecteur nous a dit (lecture, temps, durée)
  var s = { i: -1, cadre: null, audio: null, lecture: false, temps: 0, duree: 0, glisse: false, recu: false, dernier: null, volume: 1 };

  function minsec(t) {
    t = Math.max(0, Math.floor(t || 0));
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  }
  function afficher() {
    var p = pistes[s.i];
    if (!p) return;
    $('b-titre').textContent = p.titre;
    $('b-par').textContent = p.par;
    boutonJouer.classList.toggle('est-lecture', s.lecture);
    barre.classList.toggle('est-lecture', s.lecture);
    boutonJouer.setAttribute('aria-label', s.lecture ? 'Pause' : 'Lecture');
    if (!s.glisse) {
      var part = s.duree > 0 ? Math.min(1, s.temps / s.duree) : 0;
      progres.value = Math.round(part * 1000);
      progres.style.setProperty('--p', (part * 100).toFixed(1) + '%');
      $('b-temps').textContent = minsec(s.temps);
    }
    $('b-duree').textContent = minsec(s.duree);
    progres.setAttribute('aria-valuetext', minsec(s.temps) + ' sur ' + minsec(s.duree));
    barre.hidden = false;
  }

  function envoyer(message) {
    var p = pistes[s.i];
    if (!s.cadre || !s.cadre.contentWindow || !p) return;
    s.cadre.contentWindow.postMessage(JSON.stringify(message), ORIGINES[p.fournisseur]);
  }
  function commande(nom, valeur) {
    var p = pistes[s.i];
    if (!p) return;
    if (p.fournisseur === 'local') {
      if (!s.audio) return;
      if (nom === 'lire') s.audio.play(); else if (nom === 'pause') s.audio.pause();
      else if (nom === 'aller') s.audio.currentTime = valeur; else if (nom === 'volume') s.audio.volume = valeur;
    } else if (p.fournisseur === 'youtube') {
      var f = { lire: 'playVideo', pause: 'pauseVideo', aller: 'seekTo', volume: 'setVolume' }[nom];
      var args = nom === 'aller' ? [valeur, true] : nom === 'volume' ? [Math.round(valeur * 100)] : [];
      envoyer({ event: 'command', func: f, args: args });
    } else {
      var m = { lire: 'play', pause: 'pause', aller: 'setCurrentTime', volume: 'setVolume' }[nom];
      envoyer(valeur === undefined ? { method: m } : { method: m, value: valeur });
    }
  }
  function abonner() {
    var p = pistes[s.i];
    if (p.fournisseur === 'youtube') envoyer({ event: 'listening', id: 1, channel: 'widget' });
    else if (p.fournisseur === 'vimeo') ['play', 'pause', 'ended', 'finish', 'timeupdate'].forEach(function (nom) { envoyer({ method: 'addEventListener', value: nom }); });
  }

  function nettoyer() {
    if (s.audio) { s.audio.pause(); s.audio.removeAttribute('src'); s.audio.load(); s.audio = null; }
    ecran.textContent = '';
    s.cadre = null;
  }

  function charger(i) {
    var p = pistes[i];
    nettoyer();
    s.i = i; s.lecture = false; s.temps = 0; s.duree = 0; s.recu = false; s.dernier = null;
    pistes.forEach(function (x, k) { if (k === i) x.lien.setAttribute('aria-current', 'true'); else x.lien.removeAttribute('aria-current'); });

    if (p.fournisseur === 'local') {
      var audio = new Audio(p.src);
      s.audio = audio;
      audio.volume = s.volume;
      audio.addEventListener('play', function () { s.lecture = true; afficher(); });
      audio.addEventListener('pause', function () { s.lecture = false; afficher(); });
      audio.addEventListener('timeupdate', function () { s.temps = audio.currentTime; afficher(); });
      audio.addEventListener('durationchange', function () { s.duree = isFinite(audio.duration) ? audio.duration : 0; afficher(); });
      audio.addEventListener('ended', suivante);
      ecran.appendChild(el('p', 'vide', p.titre + ', ' + p.par));
      audio.play().catch(function () { /* le navigateur a refusé : il faudra appuyer sur lecture */ });
    } else {
      var cadre = document.createElement('iframe');
      var q = p.fournisseur === 'youtube'
        ? '?autoplay=1&enablejsapi=1&rel=0&playsinline=1' + (location.origin && location.origin !== 'null' ? '&origin=' + encodeURIComponent(location.origin) : '')
        : '?autoplay=1&dnt=1&title=0&byline=0&portrait=0&playsinline=1';
      cadre.src = ORIGINES[p.fournisseur] + (p.fournisseur === 'youtube' ? '/embed/' : '/video/') + encodeURIComponent(p.id) + q;
      cadre.title = 'Lecteur : ' + p.titre + ', ' + p.par;
      cadre.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      cadre.referrerPolicy = 'strict-origin-when-cross-origin';
      cadre.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
      s.cadre = cadre;
      // Le lecteur met un moment à démarrer : on lui demande de nous tenir au courant toutes les demi-secondes, jusqu'à sa première réponse.
      cadre.addEventListener('load', function () {
        var essais = 0;
        var minuterie = setInterval(function () {
          if (s.cadre !== cadre || s.recu || ++essais > 30) { clearInterval(minuterie); return; }
          abonner();
        }, 500);
      });
      ecran.appendChild(cadre);
    }
    afficher();
  }
  function suivante() { if (pistes.length) charger((s.i + 1) % pistes.length); }
  function precedente() { if (pistes.length) charger((s.i - 1 + pistes.length) % pistes.length); }

  // Ce que dit le lecteur : 1 = lecture, 2 = pause, 0 = fin (codes de YouTube ; ceux de Vimeo sont traduits)
  function etat(code) {
    if ((code !== 0 && code !== 1 && code !== 2) || code === s.dernier) return;
    s.dernier = code;
    if (code === 1) s.lecture = true;
    else if (code === 2) s.lecture = false;
    else { s.lecture = false; s.dernier = null; suivante(); }
  }
  window.addEventListener('message', function (e) {
    var p = pistes[s.i];
    if (!p || !s.cadre || e.source !== s.cadre.contentWindow) return;
    var d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { return; } }
    if (!d || typeof d !== 'object') return;
    if (p.fournisseur === 'youtube') {
      if (d.channel === 'widget') s.recu = true;
      var info = d.info;
      // Dès que le lecteur répond, on lui demande de signaler les changements d'état (lecture, pause, fin).
      if (d.event === 'initialDelivery' || d.event === 'onReady') envoyer({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: 1, channel: 'widget' });
      if (d.event === 'infoDelivery' && info) {
        // Le temps qui avance prouve que ça joue, même si on a raté l'annonce du démarrage.
        if (typeof info.currentTime === 'number' && info.currentTime > s.temps + 0.05 && s.dernier !== 2 && !s.lecture) { s.lecture = true; s.dernier = 1; }
        if (typeof info.currentTime === 'number') s.temps = info.currentTime;
        if (typeof info.duration === 'number' && info.duration > 0) s.duree = info.duration;
        if (typeof info.playerState === 'number') etat(info.playerState);
      } else if (d.event === 'onStateChange') etat(info);
    } else {
      // Vimeo envoie aussi les messages de son contrôle anti-robot : seuls ceux du lecteur comptent.
      if (['ready', 'play', 'pause', 'ended', 'finish', 'timeupdate', 'playProgress'].indexOf(d.event) >= 0) s.recu = true;
      if (d.event === 'ready') abonner();
      else if (d.event === 'play') { etat(1); if (d.data && d.data.duration) s.duree = d.data.duration; }
      else if (d.event === 'pause') etat(2);
      else if (d.event === 'ended' || d.event === 'finish') etat(0);
      else if ((d.event === 'timeupdate' || d.event === 'playProgress') && d.data) { s.temps = d.data.seconds; s.duree = d.data.duration; }
    }
    afficher();
  });

  // Les commandes de la barre
  boutonJouer.addEventListener('click', function () { commande(s.lecture ? 'pause' : 'lire'); });
  $('b-suiv').addEventListener('click', suivante);
  $('b-prec').addEventListener('click', precedente);
  progres.addEventListener('input', function () {
    s.glisse = true;
    var t = (progres.value / 1000) * s.duree;
    $('b-temps').textContent = minsec(t);
    progres.style.setProperty('--p', (progres.value / 10).toFixed(1) + '%');
  });
  progres.addEventListener('change', function () {
    commande('aller', (progres.value / 1000) * s.duree);
    s.temps = (progres.value / 1000) * s.duree;
    s.glisse = false;
    afficher();
  });
  volume.addEventListener('input', function () {
    s.volume = volume.value / 100;
    commande('volume', s.volume);
  });
  // Chaque piste (fixe dans la page, ou venue de la playlist) est enregistrée ici, avec son clic
  function ajouterPiste(a) {
    var p = { lien: a, fournisseur: a.dataset.provider, id: a.dataset.id, src: a.dataset.src, titre: a.dataset.titre, par: a.dataset.par };
    pistes.push(p);
    a.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return; // ouvrir dans un onglet reste possible
      event.preventDefault();
      charger(pistes.indexOf(p));
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.disque'), ajouterPiste);

  // Le menu déroulant : toutes les musiques
  var menuBouton = $('menu-bouton'), menuListe = $('menu-liste');
  menuBouton.addEventListener('click', function () {
    var ouvert = menuBouton.getAttribute('aria-expanded') === 'true';
    menuBouton.setAttribute('aria-expanded', String(!ouvert));
    menuListe.hidden = ouvert;
    var courant = menuListe.querySelector('[aria-current="true"]');
    if (!ouvert && courant) menuListe.scrollTop = Math.max(0, courant.offsetTop - menuListe.offsetTop - 8);
  });
  function disque(couleur) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icone');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    [['7.5', '#0b0b0d'], ['5.5', '#2a2b31'], ['3', couleur], ['1', '#0b0b0d']].forEach(function (c) {
      var cercle = document.createElementNS(NS, 'circle');
      cercle.setAttribute('cx', '8'); cercle.setAttribute('cy', '8'); cercle.setAttribute('r', c[0]); cercle.setAttribute('fill', c[1]);
      svg.appendChild(cercle);
    });
    return svg;
  }
  // La playlist : chaque morceau est joué par sa vidéo YouTube (data/playlist.json, fait par tools/playlist.py)
  fetch('data/playlist.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (donnees) {
      if (!donnees.pistes || !donnees.pistes.length) return;
      menuListe.appendChild(el('li', 'separateur', 'Ma playlist : ' + donnees.playlist.nom));
      donnees.pistes.forEach(function (t) {
        var li = el('li'), a = el('a', 'ligne disque');
        a.href = 'https://www.youtube.com/watch?v=' + t.youtube;
        a.rel = 'noopener';
        a.dataset.provider = 'youtube';
        a.dataset.id = t.youtube;
        a.dataset.titre = t.titre;
        a.dataset.par = t.artistes;
        a.appendChild(disque('#4a8a63'));
        a.appendChild(el('span', 't', t.titre));
        a.appendChild(el('span', 'd', t.artistes));
        li.appendChild(a);
        menuListe.appendChild(li);
        ajouterPiste(a);
      });
      $('menu-nb').textContent = '(' + pistes.length + ')';
    })
    .catch(function () { /* pas de playlist : le menu garde les morceaux de la page */ });

  // ---- Écran d'entrée : un clic, et la musique démarre (un navigateur ne lance le son qu'après un geste)
  var entree = $('entree'), page = $('page');
  if (entree && page) {
    page.setAttribute('inert', '');
    $('entrer').focus();
    var entrer = function (avecMusique) {
      page.removeAttribute('inert');
      entree.hidden = true;
      if (avecMusique && pistes.length) charger(0); // dans le même geste que le clic : le son est autorisé
    };
    $('entrer').addEventListener('click', function () { entrer(true); });
    $('entrer-muet').addEventListener('click', function () { entrer(false); });
  }
})();
