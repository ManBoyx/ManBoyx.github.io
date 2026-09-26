// Vérifie dans un vrai navigateur que des vidéos YouTube se laissent lire dans un lecteur intégré (l'erreur 150 « le propriétaire interdit
// l'intégration » ne se voit qu'à la lecture). Usage : node tools/verifier.cjs <id> [<id>…]  →  écrit un JSON { id: "ok" | "erreur:150" | "inconnu" }
// Playwright est cherché dans le dossier donné par la variable PLAYWRIGHT_MODULE, sinon dans les dossiers habituels.
const fs = require('fs'), path = require('path');
const candidats = [process.env.PLAYWRIGHT_MODULE, path.join(process.cwd(), 'node_modules/@playwright/test'), path.join(process.env.HOME || '', 'EGC-Launcher/apps/electron/node_modules/@playwright/test')].filter(Boolean);
const dossier = candidats.find(d => fs.existsSync(d));
if (!dossier) { console.error("Playwright est introuvable : définissez PLAYWRIGHT_MODULE (dossier du module @playwright/test)."); process.exit(2); }
const { chromium } = require(dossier);

const PAGE = `<!doctype html><meta charset="utf-8"><body><script>
window.verifier = (id) => new Promise((fin) => {
  const f = document.createElement('iframe'); f.width = 320; f.height = 180; f.allow = 'autoplay; encrypted-media';
  f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
  let fini = false, tic, pret = false;
  const conclure = (r) => { if (fini) return; fini = true; clearInterval(tic); f.remove(); fin(r); };
  window.addEventListener('message', (e) => {
    if (e.source !== f.contentWindow || typeof e.data !== 'string') return;
    let d; try { d = JSON.parse(e.data); } catch (_) { return; }
    if (d.event === 'onError') conclure('erreur:' + d.info);
    else if (d.event === 'onReady' || d.event === 'initialDelivery') pret = true;
    else if (d.event === 'infoDelivery' && d.info && (d.info.playerState === 1 || d.info.playerState === 3)) conclure('ok');
    else if (d.event === 'onStateChange' && (d.info === 1 || d.info === 3)) conclure('ok');
  });
  f.onload = () => { tic = setInterval(() => f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'), 400); };
  // Une vidéo qui refuse l'intégration signale l'erreur dans les premières secondes ; un lecteur prêt et sans erreur au bout de 9 s est bon
  // (pendant une publicité, l'état de lecture n'est pas annoncé).
  setTimeout(() => conclure(pret ? 'ok' : 'inconnu'), 9000);
  document.body.appendChild(f);
});
</script>`;

(async () => {
  const ids = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await ctx.route('https://manboyx.github.io/__verifier', r => r.fulfill({ contentType: 'text/html', body: PAGE }));
  const resultat = {};
  const file = ids.slice();
  async function ouvrier() {
    const page = await ctx.newPage();
    await page.goto('https://manboyx.github.io/__verifier');
    await page.mouse.click(200, 200); // un geste réel : sans lui le navigateur peut refuser de démarrer la lecture
    while (file.length) { const id = file.shift(); resultat[id] = await page.evaluate((i) => window.verifier(i), id); }
  }
  await Promise.all(Array.from({ length: Math.min(5, ids.length) }, ouvrier));
  console.log(JSON.stringify(resultat));
  await b.close();
})();
