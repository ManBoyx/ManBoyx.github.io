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
python3 tools/versions.py   # met à jour les numéros de version de style.css, page.js, spotify.html et spotify.js
```

GitHub Pages laisse les fichiers 10 minutes dans les navigateurs : sans ces numéros, une page mise à jour peut s'afficher avec l'ancienne feuille de style ou l'ancien script.

## La musique

Un menu déroulant « Toutes les musiques » liste tout : les trois morceaux écrits dans `index.html` et ceux de ma playlist Spotify.

- **Playlist Spotify :** `python3 tools/spotify.py` relit la playlist (titres, artistes) dans `data/spotify.json`, puis on envoie le fichier comme d'habitude. Aucun fichier audio n'est copié : les morceaux passent par le lecteur officiel de Spotify, qui joue un extrait d'environ 30 secondes, ou le morceau entier si le visiteur est connecté à Spotify dans son navigateur.
- **`spotify.html` et `spotify.js` :** une petite page à part qui héberge le lecteur de Spotify et dialogue avec la page principale. Le script de Spotify exige `unsafe-eval` : on l'isole donc dans ce cadre, et la page principale garde une politique de sécurité stricte.

Le lecteur (barre en bas : lecture, pause, précédent, suivant, position, volume) pilote quatre sortes de pistes, écrites dans la section « Musique » de `index.html` (ou venues de `data/spotify.json`) :

- `data-provider="youtube"` ou `"vimeo"` avec `data-id` : le lecteur officiel de la vidéo, chargé à la demande. C'est ce qui est utilisé pour Megalovania, Pas de Panique à bord et Hammer of Justice : leurs fichiers audio sont protégés par le droit d'auteur, ils ne sont donc pas copiés sur ce site.
- `data-provider="spotify"` avec `data-uri` : un morceau Spotify (voir plus haut).
- `data-provider="local"` avec `data-src="musique/mon-fichier.mp3"` : un fichier audio hébergé sur le site. Ne mettre ici que de la musique dont on a les droits (compositions personnelles, licences libres avec les crédits).

Chaque piste est un bloc `<li>` à copier, avec `data-titre` et `data-par` pour l'affichage.

## Modifier

- Un lien : ajouter un `<a>` dans le paragraphe `.liens` de `index.html`.
- Le texte sous le nom : paragraphe `.role` de `index.html`.

## Crédits

- Polices : [Lilita One](https://github.com/google/fonts/tree/main/ofl/lilitaone) et [Fredoka](https://github.com/google/fonts/tree/main/ofl/fredoka), licence SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
- Le logo et l'icône viennent du site de Minebed (minebed.fr).
- La photo est mon avatar GitHub. Le logo GitHub appartient à GitHub. Minecraft est une marque de Mojang / Microsoft ; cette page n'est ni affiliée ni approuvée par eux.
- Musique : lecteurs officiels de YouTube (Megalovania et Hammer of Justice, Toby Fox), de Vimeo (Pas de Panique à bord, Les Ratz) et de Spotify (ma playlist).
