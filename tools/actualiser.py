#!/usr/bin/env python3
"""Met à jour data/github.json : les dépôts PUBLICS et l'activité GitHub (le calendrier de contributions).

Usage :  python3 tools/actualiser.py           (il faut l'outil `gh`, connecté au compte)
Ne sont écrits que : le nom, l'adresse, la description, le langage, les étoiles et la date des dépôts publics, et, pour chaque jour,
le nombre de contributions et son niveau. Jamais le nom d'un dépôt privé, ni ce qui a été fait dedans.
"""
import json, os, shutil, subprocess, sys
from datetime import datetime, timezone

SEMAINES = 20  # combien de semaines montrer dans la grille d'activité


def gh(*args):
    exe = shutil.which('gh') or os.path.expanduser('~/bin/gh')
    out = subprocess.run([exe, *args], capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"gh a échoué : {out.stderr.strip()}")
    return json.loads(out.stdout)


login = gh('api', 'user')['login']

repos = []
for r in gh('api', f'users/{login}/repos?per_page=100&type=owner&sort=pushed'):
    # Seulement le public, ni les copies (forks), ni les archives, ni cette page elle-même.
    if r['private'] or r['fork'] or r['archived'] or r['name'].lower() == f'{login.lower()}.github.io':
        continue
    desc = (r.get('description') or '').strip()
    # « EGC Launcher : lanceur… » devient « lanceur… » : le nom est déjà affiché à côté.
    norm = lambda t: t.lower().replace('-', ' ')
    prefix = norm(r['name']) + ' :'
    if norm(desc).startswith(prefix):
        desc = desc[len(prefix):].strip()
    repos.append({
        'name': r['name'], 'url': r['html_url'], 'description': desc, 'language': r.get('language') or '',
        'stars': r['stargazers_count'], 'pushed_at': r['pushed_at'],
    })

query = '''query($login:String!){ user(login:$login){ contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }'''
cal = gh('api', 'graphql', '-f', f'query={query}', '-F', f'login={login}')['data']['user']['contributionsCollection']['contributionCalendar']
niveaux = {'NONE': 0, 'FIRST_QUARTILE': 1, 'SECOND_QUARTILE': 2, 'THIRD_QUARTILE': 3, 'FOURTH_QUARTILE': 4}
semaines = cal['weeks'][-SEMAINES:]
jours = [[{'date': d['date'], 'count': d['contributionCount'], 'level': niveaux[d['contributionLevel']]} for d in w['contributionDays']] for w in semaines]

data = {
    'generated_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'login': login,
    'repos': repos,
    'activity': {'weeks': jours, 'total': sum(d['count'] for w in jours for d in w)},
}
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'github.json')
with open(dest, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(f"{len(repos)} dépôt(s) public(s), {data['activity']['total']} contribution(s) sur {len(jours)} semaines : {os.path.normpath(dest)}")
