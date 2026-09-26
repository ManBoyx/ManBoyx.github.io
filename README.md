# Manboyxv4

Ma page personnelle : https://manboyx.github.io

Une page simple : un fond uni, mon nom et le logo de Minebed en haut, puis trois blocs côte à côte (mes repositories, mon activité GitHub, ma musique) et un lecteur en bas. Un fichier HTML, une feuille de style et un script. Aucune bibliothèque, aucun traceur.

La page ne contacte aucun autre site, sauf le lecteur de musique (YouTube sans cookies, ou Vimeo sans suivi), qui ne se charge qu'à l'entrée avec la musique ou quand on appuie sur une piste.

## Mettre à jour les repositories et l'activité GitHub

```bash
python3 tools/actualiser.py      # il faut l'outil `gh`, connecté au compte
git add data/github.json && git commit -m "Actualise les dépôts et l'activité" && git push
```

Seuls les dépôts **publics** sont listés. Pour l'activité, le script ne garde que le nombre de contributions par jour.

## Avant chaque envoi

```bash
python3 tools/versions.py   # met à jour les numéros de version de style.css et page.js dans index.html
```

GitHub Pages laisse les fichiers 10 minutes dans les navigateurs : sans ces numéros, une page mise à jour peut s'afficher avec l'ancienne feuille de style ou l'ancien script.

## La musique

Un menu déroulant « Toutes les musiques » liste tout : les trois morceaux écrits dans `index.html` et ceux de ma playlist.

- **La playlist :** `python3 tools/playlist.py` relit ma playlist Spotify (titres, artistes, durées), cherche pour chaque morceau la vidéo YouTube officielle qui a la même durée (chaîne de l'artiste, chaîne « Topic » ou clip officiel), écrit `data/playlist.json`, puis (si `node` et Playwright sont installés, voir `tools/verifier.cjs`) vérifie dans un vrai navigateur, avec l'adresse du site, que chaque vidéo se laisse intégrer. Ne pas tester en local : YouTube refuse l'intégration de certaines vidéos sur `localhost`, ce qui donne de fausses erreurs. Les morceaux sans vidéo sûre sont listés dans le fichier (`introuvables`) ; pour en forcer un, l'ajouter au tableau `MANUEL` du script. Aucun fichier audio n'est copié : tout passe par le lecteur officiel de YouTube.
- **Spotify n'est pas utilisé pour la lecture :** son lecteur intégré ne démarre pas tout seul dans Firefox et ne joue qu'un extrait de 30 secondes sans connexion.

## Modifier

- Un lien : ajouter un `<a>` dans le paragraphe `.liens` de `index.html`.
- Le texte sous le nom : paragraphe `.role` de `index.html`.

## Crédits

- Polices : [Lilita One](https://github.com/google/fonts/tree/main/ofl/lilitaone) et [Fredoka](https://github.com/google/fonts/tree/main/ofl/fredoka), licence SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
- Le logo et l'icône viennent du site de Minebed (minebed.fr).
- La photo est mon avatar GitHub. Le logo GitHub appartient à GitHub. Minecraft est une marque de Mojang / Microsoft ; cette page n'est ni affiliée ni approuvée par eux.
- Musique : lecteurs officiels de YouTube (Megalovania et Hammer of Justice, Toby Fox), de Vimeo (Pas de Panique à bord, Les Ratz) ; la playlist passe aussi par YouTube.
