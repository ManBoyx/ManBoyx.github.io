#!/usr/bin/env python3
"""Ajoute à style.css et page.js, dans index.html, un numéro de version tiré de leur contenu (?v=…).
GitHub Pages garde les fichiers 10 minutes dans les navigateurs : sans ce numéro, une page toute neuve peut s'afficher avec
l'ancienne feuille de style ou l'ancien script (boutons mal habillés, clics sans effet). À lancer avant chaque envoi.
Usage : python3 tools/versions.py"""
import hashlib, os, re

racine = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
html = os.path.join(racine, 'index.html')
texte = open(html, encoding='utf-8').read()
for fichier in ('style.css', 'page.js'):
    empreinte = hashlib.sha1(open(os.path.join(racine, fichier), 'rb').read()).hexdigest()[:8]
    motif = re.compile(rf'(["\']){re.escape(fichier)}(\?v=[0-9a-f]+)?(["\'])')
    texte, n = motif.subn(rf'\g<1>{fichier}?v={empreinte}\g<3>', texte)
    print(f'{fichier} -> ?v={empreinte} ({n} référence)')
open(html, 'w', encoding='utf-8').write(texte)
