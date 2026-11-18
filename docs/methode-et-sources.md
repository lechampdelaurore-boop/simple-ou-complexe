# Méthode et sources : Simple ou complexe ?

## Ce que demande le programme

Le programme de français du cycle 3 (2025, en vigueur au CM2 depuis la rentrée 2026) demande de « **distinguer phrase simple et phrase complexe à partir du repérage des verbes conjugués** » et d'« identifier et nommer les **conjonctions de subordination** ». Les conjonctions de coordination (*mais, ou, et, or, ni, car*, et *donc* à l'école) sont vues au CM1. Les mots *proposition, juxtaposée, coordonnée, subordonnée* sont approfondis en 6e : l'appli ne les montre qu'au niveau bonus.

La grammaire est la partie du français la moins bien réussie du CE2 au CM2 aux évaluations nationales 2025 (DEPP, 2026).

## Les choix de l'appli, et pourquoi

**1. Trouver les verbes conjugués d'abord.** Tout le reste en découle. « Le verbe, c'est l'action » ne suffit pas (Éduscol, fiche « Reconnaître le verbe ») : *être, aimer, rester* ne sont pas des actions, et *la course* en est une sans être un verbe. L'appli apprend des **tests** : ajouter *Hier,* (ou *Demain,*) au début de la phrase, mettre *ne… pas* autour, changer le sujet. C'est la routine proposée par Éduscol pour le cycle 3.

**2. Les tests toujours dans la phrase entière.** Dans les classes filmées par Gauvin et Boivin (2012), les tests faits dans la phrase font avancer l'élève (12 cas sur 12) ; faits sur le mot tout seul, ils le font piétiner ou reculer (36 cas sur 36). La boîte à outils montre donc toujours la phrase entière transformée, jamais un mot isolé. Les phrases transformées sont écrites à la main et vérifiées : seuls les verbes y changent.

**3. Une phrase, 3 gestes.** Toucher les verbes, dire simple ou complexe, toucher le séparateur. Le séparateur est toujours **ce qui est entre** les deux parties : dans *Quand il pleut, je lis*, c'est la virgule (*quand* ouvre la phrase, il n'est pas entre les parties).

**4. Les pièges un par un.** Les erreurs sur l'infinitif, le participe passé ou un nom qui ressemble à un verbe sont des erreurs « intelligentes » (Sautot et coll. 2021) : elles méritent une explication, pas un « faux ». L'appli les présente une à une au niveau 4 (*et* entre deux noms, virgule de liste, infinitif, verbe en 2 morceaux, mot en *-ant*, petits mots collés au verbe), avec des **paires** de phrases presque pareilles (*Léo et Tom jouent.* / *Léo joue et Tom lit.*). La phrase dans la phrase (*Le chien qui aboie est à moi*), difficile même pour de futurs enseignants (Sardier et Vergne 2024), est gardée pour le bonus.

**5. Assembler et couper des phrases.** Relier deux phrases simples avec un petit mot choisi selon le sens améliore l'écriture (*sentence combining* : effet moyen de 0,50 dans *Writing Next*, Graham et Perin 2007 ; Saddler et Graham 2005 ; réplication de Tavsanli et coll. 2023). Une grammaire reliée au sens marche mieux que l'étiquetage seul (Myhill et coll. 2012). Couper une phrase longue autour de chaque verbe aide aussi à ponctuer (Paolacci et Rossi-Gensane 2012).

**6. De moins en moins d'aide.** Exemples guidés au début de chaque niveau, puis l'aide seulement à la demande, puis sans aide (*fading*, Renkl et Atkinson 2003). Une correction immédiate qui dit quel test aurait marché. Les phrases ratées reviennent à J+1, J+3 et J+7. Des séances courtes, sans chronomètre. On compte les réussites, jamais les fautes.

## Les phrases

280 phrases originales (dont quelques-unes adaptées des histoires des autres applis) et 40 exercices « Assembler ». Pour éviter les cas discutables, elles n'ont pas de dialogue, pas d'impératif ni de subjonctif, pas de *ni*, pas de verbes qui partagent un même sujet (*Il mange et boit*), et *donc* ou *ensuite* seulement entre deux parties. *puis, ensuite, alors* et *donc* sont des adverbes pour les grammairiens ; l'appli les accepte comme séparateurs (« mots de liaison ») mais ne leur pose pas la question du bonus (juxtaposées, coordonnées ou subordonnée).

Longueur : 5 à 12 mots aux niveaux 1 à 3 (sans temps composé, infinitif ni mot en *-ant*), 16 mots au plus aux niveaux 4 et 5, 22 au plus au niveau 6 et au bonus.

## Écrire une phrase

Chaque phrase est une ligne de `index.html`, entre `// DÉBUT PHRASES` et `// FIN PHRASES` :

```js
{id:"n5-026", niv:5, p:"<Quand|tete> il [pleut] {,} je [lis].", hier:"Hier, quand il pleuvait, je lisais.", nepas:["Quand il ne pleut pas, je lis.","Quand il pleut, je ne lis pas."]},
```

| Marque | Sens | Exemple |
|---|---|---|
| `[mot]` | verbe conjugué | `il [pleut]` |
| `[a mangé]` | verbe en 2 morceaux | `Elle [a mangé] une pomme.` |
| `[a] … [+mangé]` | 2e morceau plus loin | `Il [a] bien [+mangé].` |
| `{mot}` | séparateur entre la 1re et la 2e partie | `{,}` `{mais}` `{parce que}` |
| `{mot#2}` | séparateur entre la 2e et la 3e partie | `{et#2}` |
| `( … )` | partie rangée dans une autre (bonus) | `Le chien ( qui [aboie] ) [est] à moi.` |
| `<mot\|code>` | mot-piège : `inf` infinitif, `ant` mot en -ant, `nom`, `pro` petit mot collé au verbe, `et` entre deux noms, `liste` virgule de liste, `tete` mot du début (*quand*…) | `Il [veut] <jouer\|inf> dehors.` |

Champs : `hier` (toute la phrase avec *Hier,* au début, ou *Demain,* si elle est déjà au passé : seuls les verbes changent, leur 1er morceau pour un verbe en 2 morceaux), `nepas` (une ligne par verbe), `sujet` (facultatif, autre sujet), `paire` (la phrase presque pareille), `pieges`, `etape` (niveau 4), `coupe` (les 2 phrases simples pour « Couper »). Les espaces sont recalculés par l'appli (typographie française).

Après une modification : `node tests/phrases.cjs` et `node tests/moteur.cjs` doivent répondre « aucune erreur ».

## Sources

**Textes officiels**
- Ministère de l'Éducation nationale (2025). *Programme de français pour le cycle 3*, BO n° 16 du 17 avril 2025. https://www.education.gouv.fr/sites/default/files/programme-de-fran-ais-pour-le-cycle-3-439824.pdf
- Monneret, P. et Poli, F. (dir.) (2020). *La grammaire du français : terminologie grammaticale*. Éduscol, « Les guides fondamentaux pour enseigner ». https://eduscol.education.fr/media/1872/download
- Éduscol. *Une séance d'identification des verbes conjugués* (ressources cycle 3). https://eduscol.education.gouv.fr/sites/default/files/document/ra16c2c3fra4presentation-seance-identification-verbes-conjugues636319pdf-76878.pdf
- Éduscol. *Reconnaître le verbe, son fonctionnement et sa morphologie* (fiche 6, cycle 3). https://eduscol.education.gouv.fr/sites/default/files/document/ev19c3francaisfiche6-reconnaitre-verbe-fonctionnement-morphologie1144823pdf-90432.pdf
- DEPP (2026). Note d'information n° 26.18, *Repères 2025 en français, CP à CM2*. https://www.education.gouv.fr/sites/default/files/document/depp-ni-2618-eval-1d-francaispdf-516875.pdf

**Didactique de la grammaire (français)**
- Gauvin, I. et Boivin, M.-C. (2012). Transposition didactique interne et aspects clés de l'apprentissage de l'accord du verbe en français. *Revue canadienne de linguistique appliquée*, 15(1), 146-166. https://journals.lib.unb.ca/index.php/CJAL/article/download/19951/21841/26552
- Gauvin, I. et Boivin, M.-C. (2012). La théorie de la transposition didactique : un outil conceptuel pour décrire les savoirs grammaticaux élaborés en classe par les élèves. *Bellaterra Journal of Teaching & Learning Language & Literature*, 5(3), 10-24. https://revistes.uab.cat/jtl3/article/download/v5-n3-gauvin-boivin/538/2371
- Sautot, J.-P., Beaumanoir-Secq, M. et Gourdet, P. (2021). Enjeux et choix méthodologiques pour l'étude des rendements des classes dans la recherche REAlang. *Scolagram*, 8. https://scolagram.u-cergy.fr/index.php/content_page/download/44/326/33
- Sardier, A. et Vergne, D. (2024). De la constitution à la mobilisation d'un corpus scolaire en formation initiale d'enseignants : l'exemple de la phrase complexe. *Scolagram*, 9. https://scolagram.u-cergy.fr/index.php/content_page/download/97/1353/33
- Paolacci, V. et Rossi-Gensane, N. (2012). Quelles images de la phrase dans les écrits d'élèves de fin d'école primaire française ? *Actes du CMLF 2012*, SHS Web of Conferences 1. https://www.shs-conferences.org/articles/shsconf/pdf/2012/01/shsconf_cmlf12_000143.pdf
- Lefrançois, P., Anctil, D., Montesinos-Gelet, I. et coll. *Enseigner et apprendre la notion de phrase pour améliorer la compétence à écrire des élèves du primaire*. Rapport FRQSC 2011-ER-144254. https://frq.gouv.qc.ca/pt_lefrancoisp_rapport-2014_enseigner-notion-phrase

**Études internationales**
- Graham, S. et Perin, D. (2007). *Writing Next*. Carnegie Corporation / Alliance for Excellent Education. Synthèse : https://www.oregon.gov/ode/educator-resources/essentialskills/Documents/essentialskillwriting_hs_level2_writing_next_synopsis.pdf
- Saddler, B. et Graham, S. (2005). The effects of peer-assisted sentence-combining instruction on the writing performance of more and less skilled young writers. *Journal of Educational Psychology*, 97(1), 43-54. Fiche WWC : https://ies.ed.gov/ncee/WWC/Study/74410
- Tavsanli, O. F., Graham, S., Kaldirim, A. et coll. (2023). The effect of sentence combining instruction with second- to fourth-grade children: a replication study in Turkey. *Educational Psychology Review*, 35, 93. https://link.springer.com/article/10.1007/s10648-023-09806-5
- Myhill, D., Jones, S., Lines, H. et Watson, A. (2012). Re-thinking grammar: the impact of embedded grammar teaching on students' writing and students' metalinguistic understanding. *Research Papers in Education*, 27(2). Résumé : https://education.exeter.ac.uk/v8media/facultysites/hass/docs/Research_Summary_for_Teachers.pdf
- Shanahan, T. (2022). *What teachers need to know about sentence comprehension* (synthèse d'une trentaine d'études, dont Cain 2007, Deacon et Kieffer 2018, Brimo et coll. 2017). https://www.readingrockets.org/blogs/shanahan-on-literacy/what-teachers-need-know-about-sentence-comprehension
- Renkl, A. et Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition: a cognitive load perspective. *Educational Psychologist*, 38(1), 15-22.

**Non lus en entier** (page protégée contre les robots) : l'article « Identifier le verbe : élaboration des connaissances par les élèves en classe » (*Revue des sciences de l'éducation*, 39(3), 2013) et le chapitre « L'identification du verbe à l'école élémentaire » (Artois Presses Université). Les mêmes équipes de recherche sont citées ci-dessus.
