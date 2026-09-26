#!/usr/bin/env python3
"""Met à jour data/spotify.json : la liste des morceaux d'une playlist Spotify publique (titre, artistes, identifiant, durée).

Usage :  python3 tools/spotify.py [identifiant-de-playlist]
Les données viennent de la page d'intégration publique de la playlist (celle que Spotify propose pour l'afficher sur un site) :
aucun compte ni clé n'est nécessaire, et aucun fichier audio n'est copié. Le lecteur du site joue les morceaux avec le lecteur
officiel de Spotify."""
import json, re, sys, urllib.request
from datetime import datetime, timezone

PLAYLIST = sys.argv[1] if len(sys.argv) > 1 else '5qGCgnapqLHvKGFKDoGq66'
requete = urllib.request.Request(f'https://open.spotify.com/embed/playlist/{PLAYLIST}',
                                 headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'})
page = urllib.request.urlopen(requete, timeout=30).read().decode('utf-8', 'replace')
brut = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', page, re.S)
if not brut:
    sys.exit("La page de la playlist n'a pas la forme attendue (playlist privée, ou Spotify a changé sa page).")
entite = json.loads(brut.group(1))['props']['pageProps']['state']['data']['entity']
pistes = []
for p in entite.get('trackList', []):
    uri = p.get('uri', '')
    if not uri.startswith('spotify:track:') or not p.get('isPlayable', True):
        continue
    pistes.append({
        'id': uri.split(':')[2],
        'titre': p['title'].strip(),
        'artistes': re.sub(r'\s+', ' ', p.get('subtitle', '').replace('\xa0', ' ')).strip(),
        'duree_ms': p.get('duration', 0),
    })
donnees = {
    'genere': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'playlist': {'id': PLAYLIST, 'nom': entite.get('name', ''), 'url': f'https://open.spotify.com/playlist/{PLAYLIST}'},
    'pistes': pistes,
}
with open('data/spotify.json', 'w', encoding='utf-8') as f:
    json.dump(donnees, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(f"{len(pistes)} morceau(x) dans « {donnees['playlist']['nom']} » : data/spotify.json")
