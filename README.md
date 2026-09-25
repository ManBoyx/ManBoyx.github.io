# Manboyxv4

Ma page personnelle : https://manboyx.github.io

Un fichier HTML, une feuille de style et deux petits scripts. Aucune bibliothèque, aucun traceur. La page ne contacte aucun autre site, sauf le lecteur YouTube (version sans cookies), qui ne se charge que lorsqu'on appuie sur une piste.

## Mettre à jour les dépôts et l'activité GitHub

```bash
python3 tools/actualiser.py      # il faut l'outil `gh`, connecté au compte
git add data/github.json && git commit -m "Actualise les dépôts et l'activité" && git push
```

Seuls les dépôts **publics** sont listés. Pour l'activité, le script ne garde que le nombre de contributions par jour.

## Modifier

- Un lien : copier un bloc `<li>…</li>` dans la liste `.links` de `index.html`.
- Une piste : copier un bloc `<li>…</li>` dans la liste `.tracks` et changer `data-id` (l'identifiant de la vidéo YouTube, après `v=`).
