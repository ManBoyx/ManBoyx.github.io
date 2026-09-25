# Manboyxv4

Ma page personnelle : https://manboyx.github.io

Une page dans le style des menus de Minecraft : un fond de terre, des listes façon « choisir un monde », des boutons de pierre. Un fichier HTML, une feuille de style et deux petits scripts. Aucune bibliothèque, aucun traceur. La page ne contacte aucun autre site, sauf le lecteur de musique (YouTube sans cookies, ou Vimeo sans suivi), qui ne se charge qu'à l'entrée avec la musique ou quand on appuie sur un disque.

## Mettre à jour les dépôts et l'activité GitHub

```bash
python3 tools/actualiser.py      # il faut l'outil `gh`, connecté au compte
git add data/github.json && git commit -m "Actualise les dépôts et l'activité" && git push
```

Seuls les dépôts **publics** sont listés. Pour l'activité, le script ne garde que le nombre de contributions par jour.

## Modifier

- Un lien : copier un bloc `<li>…</li>` dans la liste `.links` de `index.html`.
- Une piste : copier un bloc `<li>…</li>` de la section « Musique » de `index.html`, puis changer `data-provider` (`youtube` ou `vimeo`), `data-id` (l'identifiant de la vidéo), `data-titre` et `data-par`.

## Crédits

- Police [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans), licence SIL Open Font License 1.1 (`fonts/OFL.txt`).
- La texture de terre, le nom en pixels, les cubes et les disques sont dessinés pour cette page.
- Le logo GitHub appartient à GitHub. Minecraft est une marque de Mojang / Microsoft ; cette page n'est ni affiliée ni approuvée par eux.
- Musique : lecteurs officiels de YouTube (Megalovania, Toby Fox) et de Vimeo (Pas de Panique à bord, Les Ratz), chargés seulement quand on entre avec la musique.
