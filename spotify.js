// Le pont entre la page et le lecteur officiel de Spotify. La page principale lui envoie des ordres (charger, lire, pause, aller),
// et il lui renvoie où en est la lecture. Seuls les messages de la page qui contient ce cadre, sur le même site, sont acceptés.
(function () {
  'use strict';

  var pere = window.parent, origine = location.origin;
  var api = null, ctrl = null, enAttente = null, pret = false;

  function dire(message) {
    message.source = 'egc-spotify';
    pere.postMessage(JSON.stringify(message), origine);
  }

  function charger(uri) {
    if (ctrl) { ctrl.loadUri(uri); ctrl.play(); return; }
    if (!api) { enAttente = uri; return; } // le script de Spotify n'est pas encore arrivé
    enAttente = null;
    api.createController(document.getElementById('cible'), { uri: uri, width: '100%', height: 152 }, function (c) {
      ctrl = c;
      c.addListener('ready', function () { pret = true; c.play(); });
      // Un bloqueur de publicités peut laisser le cadre vide : sans « prêt » au bout de 12 s, on prévient la page.
      setTimeout(function () { if (!pret) dire({ evt: 'bloque' }); }, 12000);
      c.addListener('playback_update', function (e) {
        var d = e.data || {};
        dire({ evt: 'maj', uri: d.playingURI, position: d.position, duree: d.duration, pause: d.isPaused, tampon: d.isBuffering });
      });
    });
  }

  window.onSpotifyIframeApiReady = function (a) {
    api = a;
    if (enAttente) charger(enAttente);
  };

  window.addEventListener('message', function (e) {
    if (e.source !== pere || e.origin !== origine) return;
    var m;
    try { m = JSON.parse(e.data); } catch (_) { return; }
    if (m.cmd === 'charger' && typeof m.uri === 'string' && /^spotify:track:[A-Za-z0-9]+$/.test(m.uri)) charger(m.uri);
    else if (!ctrl) return;
    else if (m.cmd === 'lire') ctrl.resume();
    else if (m.cmd === 'pause') ctrl.pause();
    else if (m.cmd === 'aller' && typeof m.valeur === 'number') ctrl.seek(m.valeur);
  });

  var script = document.createElement('script');
  script.src = 'https://open.spotify.com/embed/iframe-api/v1';
  script.async = true;
  document.head.appendChild(script);

  // Le script de Spotify n'est pas arrivé au bout de 10 s : bloqué (bloqueur de publicités, réseau).
  setTimeout(function () { if (!api) dire({ evt: 'bloque' }); }, 10000);

  dire({ evt: 'pret' });
})();
