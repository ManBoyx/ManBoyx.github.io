# Manboyxv4

Ma page personnelle : https://manboyx.github.io

Une page de profil dans l'esprit de guns.lol : les images du serveur Minebed en fond, une carte de verre au centre, mes repositories et mon activité GitHub, et un lecteur de musique qui flotte en bas. Un fichier HTML, une feuille de style et un script. Aucune bibliothèque, aucun traceur.

La page ne contacte aucun autre site, sauf le lecteur de musique (YouTube sans cookies, ou Vimeo sans suivi), qui ne se charge qu'à l'entrée avec la musique ou quand on appuie sur une piste.

## Mettre à jour les repositories et l'activité GitHub

```bash
python3 tools/actualiser.py      # il faut l'outil `gh`, connecté au compte
git add data/github.json && git commit -m "Actualise les dépôts et l'activité" && git push
```

Seuls les dépôts **publics** sont listés. Pour l'activité, le script ne garde que le nombre de contributions par jour.

## La musique

Le lecteur (barre flottante : lecture, pause, précédent, suivant, position, volume) pilote trois sortes de pistes, écrites dans la section « Musique » de `index.html` :

- `data-provider="youtube"` ou `"vimeo"` avec `data-id` : le lecteur officiel de la vidéo, chargé à la demande. C'est ce qui est utilisé pour Megalovania, Pas de Panique à bord et Hammer of Justice : leurs fichiers audio sont protégés par le droit d'auteur, ils ne sont donc pas copiés sur ce site.
- `data-provider="local"` avec `data-src="musique/mon-fichier.mp3"` : un fichier audio hébergé sur le site. Ne mettre ici que de la musique dont on a les droits (compositions personnelles, licences libres avec les crédits).

Chaque piste est un bloc `<li>` à copier, avec `data-titre` et `data-par` pour l'affichage.

## Modifier

- Un lien : copier un bloc `<li>` de la liste `.reseaux` de `index.html`.
- Les phrases qui s'écrivent sous le nom : tableau `phrases` de `page.js`.

## Crédits

- Polices : [Lilita One](https://github.com/google/fonts/tree/main/ofl/lilitaone) et [Fredoka](https://github.com/google/fonts/tree/main/ofl/fredoka), licence SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
- Le logo, l'icône et les images de fond viennent du site de Minebed (minebed.fr).
- La photo est mon avatar GitHub. Le logo GitHub appartient à GitHub. Minecraft est une marque de Mojang / Microsoft ; cette page n'est ni affiliée ni approuvée par eux.
- Musique : lecteurs officiels de YouTube (Megalovania et Hammer of Justice, Toby Fox) et de Vimeo (Pas de Panique à bord, Les Ratz).
