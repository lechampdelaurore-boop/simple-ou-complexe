# Simple ou complexe ?

Reconnaître une **phrase simple** et une **phrase complexe** au CM2, sur téléphone ou tablette, 5 à 10 minutes par jour.

👉 **[Ouvrir l'appli](https://lechampdelaurore-boop.github.io/simple-ou-complexe/)**

Chaque phrase se fait en **3 gestes** :

1. **Toucher les verbes conjugués.** Une boîte à outils 🧰 aide à les trouver, toujours dans la phrase entière : *⏪ Hier…* (la phrase passe au passé, les mots qui changent brillent), *🚫 ne… pas* et, parfois, *👥 Autre sujet*.
2. **Dire si la phrase est simple** (1 verbe conjugué) **ou complexe** (2 verbes ou plus).
3. **Toucher le séparateur** : ce qui est **entre** les deux parties (une virgule, *et*, *mais*, *quand*…). Dans *Quand il pleut, je lis*, le séparateur est la virgule.

Une bonne réponse découpe la phrase en blocs, une partie par verbe. Une erreur reçoit une explication en une phrase, avec le test dans la phrase quand c'est utile ; ce qui était juste reste en place. Les phrases ratées reviennent le lendemain, puis 3 jours et 7 jours après.

La 2e activité, **Assembler**, relie deux phrases simples avec un séparateur qui va avec le sens (*mais* = le contraire, *car* = la cause, *donc* = la conséquence…). Sa variante **Couper** fait l'inverse.

Les progrès restent sur l'appareil. Seul un compteur de visites anonyme (GoatCounter) compte les ouvertures de l'appli : pas de cookie, pas de nom, rien sur les progrès. L'appli marche hors ligne et s'installe sur l'écran d'accueil.

## Les niveaux

| | Contenu | Phrases |
|---|---|---|
| Leçon 0 | Le verbe conjugué, la boîte à outils | – |
| 1 · Le verbe | Trouver le verbe dans des phrases simples | 30 |
| 2 · Les signes | Simple ou complexe ; séparateurs *, ; :* | 40 |
| 3 · Les petits mots | *et, mais, ou, car, donc, or, puis, ensuite, alors* | 50 |
| 4 · Les pièges | un à la fois : *et* entre deux noms, liste, infinitif, verbe en 2 morceaux, mot en *-ant*, petits mots collés au verbe ; puis mélangés | 50 |
| 5 · Quand, parce que, si… | au milieu de la phrase (séparateur) ou au début (le séparateur est alors la virgule) | 50 |
| 6 · 3 verbes | 3 parties, 2 séparateurs | 30 |
| Bonus 6e · Phrase dans la phrase | *Le chien qui aboie est à moi* ; nommer les parties (juxtaposées, coordonnées, subordonnée) | 30 |

Plus 40 exercices « Assembler » et des phrases à « Couper ». Un niveau est réussi après 5 phrases parfaites sur les 6 dernières, sur 2 jours au moins. Aucun niveau n'est verrouillé.

La **séance du jour** enchaîne les révisions dues, 1 ou 2 phrases d'un niveau déjà réussi, les phrases nouvelles du niveau conseillé (avec sa leçon au début) et un exercice « Assembler » ou « Couper ». Le bouton **Je me teste** propose 8 phrases sans aide.

## Réglages ⚙

Sons, animations, vibrations ; la voix lit chaque phrase (oui ou non), voix lente ; texte plus grand ; 6, 8 ou 12 phrases par séance ; revoir la leçon 0. Les animations respectent aussi le réglage « réduire les animations » du téléphone.

Le **carnet du parent** (lien en bas de l'accueil) montre les niveaux, les 14 derniers jours, la réussite du premier coup pour chaque geste, les pièges et les séparateurs les plus ratés de la semaine. Il permet de choisir le degré d'aide (automatique, toujours guidé, toujours seul), de marquer un niveau comme réussi, de copier un résumé et de tout remettre à zéro.

## Fichiers

- `index.html` : toute l'appli (HTML, CSS et JavaScript, sans bibliothèque), phrases, moteur de correction et personnages compris. Les phrases sont entre `// DÉBUT PHRASES` et `// FIN PHRASES`, les exercices « Assembler » entre `// DÉBUT ASSEMBLER` et `// FIN ASSEMBLER`. Leurs marques sont expliquées dans la [méthode](docs/methode-et-sources.md#écrire-une-phrase).
- `sw.js` et `manifest.webmanifest` : mode hors ligne et installation. Après une modification des fichiers de l'appli, changer la valeur de `CACHE` dans `sw.js`.
- `icons/` : icône de l'appli ; `fonts/` : polices Fredoka et Nunito (licence SIL Open Font License, voir les fichiers `OFL-*.txt`).
- `docs/` : le [guide des parents](docs/guide-parents.md) et la [méthode et les sources](docs/methode-et-sources.md).
- `tests/phrases.cjs` : vérifie chaque phrase (marques, nombre de verbes et de séparateurs, place du séparateur, longueur par niveau, phrases « Hier… » et « ne… pas » où seuls les verbes changent, paires, exercices « Assembler »). `node tests/phrases.cjs`
- `tests/moteur.cjs` : vérifie la correction sur toutes les phrases (bons choix acceptés, chaque sorte d'erreur reconnue). `node tests/moteur.cjs`
- `tests/telephone.cjs` et `.github/workflows/test-telephone.yml` : après chaque mise en ligne, GitHub ouvre le site publié dans Chrome au format téléphone (7 tailles d'écran), vérifie que l'écran d'une phrase tient sans défiler (boîte à outils ouverte, phrases les plus longues), joue une séance du jour, vérifie les messages de correction, les révisions à J+1, J+3 et J+7, le passage de niveau, le mode hors ligne, la présence sur « Mes applis » et l'absence d'erreur dans la console. Résultat et captures dans l'onglet Actions. Lancement local : `npm install --no-save playwright && node tests/telephone.cjs http://localhost:8000/`.

## Plus tard

- Les dialogues (*« Viens ! » dit-il.*), *ni*, l'impératif et le subjonctif.
- Plus de phrases tirées de vrais livres.
