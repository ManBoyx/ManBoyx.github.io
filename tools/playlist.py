#!/usr/bin/env python3
"""Met à jour data/playlist.json : les morceaux d'une playlist Spotify publique, chacun avec la vidéo YouTube qui le joue.

Usage :  python3 tools/playlist.py [identifiant-de-playlist-spotify]
1. La liste (titre, artistes, durée) vient de la page d'intégration publique de la playlist Spotify : aucun compte, aucune clé.
2. Pour chaque morceau, on cherche sur YouTube la vidéo dont le titre, l'artiste et surtout la DURÉE correspondent, on écarte les
   versions accélérées, ralenties, remixées ou en direct, et on vérifie que la vidéo peut être intégrée à un site.
Aucun fichier audio n'est copié : le site joue les vidéos avec le lecteur officiel de YouTube. Les morceaux introuvables sont
listés à la fin, à ajouter à la main si besoin."""
import json, re, sys, time, unicodedata, urllib.parse, urllib.request
from datetime import datetime, timezone

PLAYLIST = sys.argv[1] if len(sys.argv) > 1 else '5qGCgnapqLHvKGFKDoGq66'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'


def lire(url, entetes=None):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9', **(entetes or {})})
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')


def morceaux_spotify():
    page = lire(f'https://open.spotify.com/embed/playlist/{PLAYLIST}')
    brut = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', page, re.S)
    if not brut:
        sys.exit("La page de la playlist n'a pas la forme attendue (playlist privée, ou Spotify a changé sa page).")
    entite = json.loads(brut.group(1))['props']['pageProps']['state']['data']['entity']
    pistes = []
    for p in entite.get('trackList', []):
        if p.get('uri', '').startswith('spotify:track:') and p.get('isPlayable', True):
            pistes.append({'titre': p['title'].strip(), 'artistes': re.sub(r'\s+', ' ', p.get('subtitle', '').replace('\xa0', ' ')).strip(), 'duree_ms': p.get('duration', 0)})
    return entite.get('name', ''), pistes


def norm(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()


def secondes(texte):
    parts = [int(x) for x in texte.split(':') if x.isdigit()]
    total = 0
    for x in parts:
        total = total * 60 + x
    return total


def recherche(requete):
    page = lire('https://www.youtube.com/results?search_query=' + urllib.parse.quote(requete) + '&hl=fr', {'Cookie': 'CONSENT=YES+cb; SOCS=CAI'})
    m = re.search(r'var ytInitialData = (\{.*?\});</script>', page, re.S)
    if not m:
        return []
    trouves = []

    def marcher(o):
        if isinstance(o, dict):
            v = o.get('videoRenderer')
            if v and v.get('lengthText'):
                titre = ''.join(r.get('text', '') for r in v.get('title', {}).get('runs', []))
                chaine = ''.join(r.get('text', '') for r in v.get('ownerText', {}).get('runs', []))
                trouves.append({'id': v['videoId'], 'titre': titre, 'chaine': chaine, 'duree': secondes(v['lengthText'].get('simpleText', ''))})
            for x in o.values():
                marcher(x)
        elif isinstance(o, list):
            for x in o:
                marcher(x)
    marcher(json.loads(m.group(1)))
    return trouves


# Vidéos choisies à la main quand la recherche automatique ne trouve pas (par exemple un clip plus long que le morceau).
MANUEL = {'Rock & Roll': '4GJp-fJJsIY'}  # Oliver Malcolm, clip officiel

MAUVAIS = ('sped up', 'speed up', 'slowed', 'reverb', 'nightcore', '8d', 'karaoke', 'cover', 'instrumental', '1 hour', '10 hour', 'live', 'tiktok version', 'mashup', 'bass boosted', 'legendado', 'traduc', 'sub espa', 'paroles', 'letra')


def note(candidat, piste, duree):
    titre_v, chaine = norm(candidat['titre']), norm(candidat['chaine'])
    # la durée est le critère décisif : la vidéo doit durer comme le morceau
    ecart = abs(candidat['duree'] - duree)
    if ecart > 4:
        return None
    artistes = [norm(a) for a in piste['artistes'].split(',') if a.strip()]
    dans_chaine = any(a and a in chaine for a in artistes)
    officielle = dans_chaine or chaine.endswith('topic') or 'official' in titre_v
    # Une vidéo d'une chaîne inconnue (traduction, paroles, remise en ligne) n'est pas l'enregistrement : on ne la garde pas.
    if not officielle:
        return None
    titre_piste = norm(re.sub(r'\(.*?\)|\[.*?\]', '', piste['titre']))
    if titre_piste and titre_piste not in titre_v:
        # titre écrit un peu autrement (« Rock & Roll » / « Rock n Roll ») : accepté si la chaîne est celle de l'artiste et la durée quasi exacte
        mots = set(titre_piste.split())
        commun = len(mots & set(titre_v.split())) / max(1, len(mots))
        if not (dans_chaine and ecart <= 2 and commun >= 0.5):
            return None
    original = norm(piste['titre'])
    if any(mot in titre_v and mot not in original for mot in MAUVAIS):
        return None
    s = 0
    if artistes and artistes[0] in titre_v + ' ' + chaine:
        s += 3
    if any(a in titre_v + ' ' + chaine for a in artistes[1:]):
        s += 1
    if chaine.endswith('topic'):
        s += 3            # chaîne « artiste - Topic » : l'enregistrement officiel
    if dans_chaine:
        s += 2
    if 'official' in titre_v or 'audio' in titre_v:
        s += 2
    if 'lyric' in titre_v:
        s -= 1
    s -= ecart * 0.3
    return s


def integrable(video):
    try:
        lire('https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote('https://www.youtube.com/watch?v=' + video))
        return True
    except Exception:
        return False


nom, pistes = morceaux_spotify()
resultat, manquants = [], []
for p in pistes:
    duree = round(p['duree_ms'] / 1000)
    candidats = {}
    for requete in (f"{p['artistes'].split(',')[0]} {p['titre']}", f"{p['titre']} {p['artistes']}"):
        for c in recherche(requete):
            candidats.setdefault(c['id'], c)
        time.sleep(1)
    classes = sorted(((note(c, p, duree), c) for c in candidats.values() if note(c, p, duree) is not None), key=lambda x: -x[0])
    choisi = next((c for _, c in classes if integrable(c['id'])), None)
    if not choisi and p['titre'] in MANUEL and integrable(MANUEL[p['titre']]):
        choisi = {'id': MANUEL[p['titre']], 'chaine': '(choisie à la main)', 'titre': p['titre']}
    if choisi:
        resultat.append({**p, 'youtube': choisi['id'], 'chaine': choisi['chaine']})
        print(f"  ok  {p['titre']} -> {choisi['id']} ({choisi['chaine']} : {choisi['titre'][:50]})")
    else:
        manquants.append(p)
        print(f"  ??  {p['titre']} ({p['artistes']}) : aucune vidéo sûre trouvée")

donnees = {
    'genere': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'playlist': {'id': PLAYLIST, 'nom': nom, 'url': f'https://open.spotify.com/playlist/{PLAYLIST}'},
    'pistes': resultat,
    'introuvables': [{'titre': p['titre'], 'artistes': p['artistes']} for p in manquants],
}
with open('data/playlist.json', 'w', encoding='utf-8') as f:
    json.dump(donnees, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(f"{len(resultat)} morceau(x) avec vidéo, {len(manquants)} introuvable(s) : data/playlist.json")

# Dernier contrôle, dans un vrai navigateur, avec l'adresse du site : certaines vidéos refusent l'intégration (erreur 150) et
# le seul moyen sûr de le savoir est de les charger. Ce contrôle a besoin de node et de Playwright (voir tools/verifier.cjs).
import shutil, subprocess
if shutil.which('node'):
    sortie = subprocess.run(['node', 'tools/verifier.cjs'] + [p['youtube'] for p in resultat], capture_output=True, text=True)
    try:
        verdicts = json.loads(sortie.stdout.strip().splitlines()[-1])
        mauvais = [(p['titre'], verdicts.get(p['youtube'])) for p in resultat if verdicts.get(p['youtube']) != 'ok']
        print('Contrôle dans le navigateur :', 'toutes les vidéos se laissent intégrer' if not mauvais else f'{len(mauvais)} problème(s) : {mauvais}')
    except Exception:
        print('Contrôle dans le navigateur non fait :', (sortie.stderr or sortie.stdout).strip()[:200])
else:
    print("Contrôle dans le navigateur non fait (node est absent).")
