// Vérifie le moteur de correction sur toutes les phrases (cahier des charges § 8 et § 13) :
//  - les bons choix sont acceptés à chaque geste ;
//  - un mot-piège touché comme verbe donne la bonne sorte d'erreur (infinitif, -ant, nom, petit mot collé) ;
//  - un mot ordinaire touché donne « autre », un verbe oublié est signalé ;
//  - au geste ③ : le mot du début (quand…), un « et » entre deux noms, une virgule de liste, un mot au milieu
//    d'une partie et un séparateur oublié donnent chacun la bonne sorte d'erreur ;
//  - les morceaux d'un verbe s'allument ensemble ; le geste ④ (bonus) a toujours une réponse.
// Usage : node tests/moteur.cjs
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const bloc = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const PHRASES = new Function(bloc('// DÉBUT PHRASES', '// FIN PHRASES') + '; return PHRASES;')();
const M = new Function(bloc('// === MOTEUR (début)', '// === MOTEUR (fin)') + '; return M;')();

let erreurs = 0;
const compte = {};
function non(id, m) { erreurs++; console.log('✗ ' + id + ' : ' + m); }
function vu(k) { compte[k] = (compte[k] || 0) + 1; }
const tousVerbes = ph => ph.verbes.reduce((l, v) => l.concat(v.i), []);
const tousSeps = ph => Object.keys(ph.limites).reduce((l, k) => l.concat(ph.limites[k]), []);
const GENRE = { inf: 'inf', ant: 'ant', nom: 'nom', pro: 'pro' };

PHRASES.forEach(f => {
  const ph = M.lire(f.p), id = f.id, V = tousVerbes(ph);
  // Geste ① juste
  if (!M.verifVerbes(ph, V).ok) non(id, 'les bons verbes ne sont pas acceptés');
  // Les morceaux d'un verbe s'allument ensemble
  ph.verbes.forEach(v => { const g = M.groupe(ph, v.i[0]); if (v.i.some(n => g.indexOf(n) < 0)) non(id, 'les morceaux du verbe ne s\'allument pas ensemble'); else if (v.i.length > 1) vu('verbe en 2 morceaux'); });
  // Mots-pièges pris pour un verbe
  ph.mots.forEach(w => {
    if (!GENRE[w.code]) return;
    const r = M.verifVerbes(ph, V.concat([w.n]));
    if (r.ok || !r.trop.length || r.trop[0].genre !== GENRE[w.code]) non(id, '« ' + w.t + ' » devrait donner ' + GENRE[w.code] + ', donne ' + JSON.stringify(r.trop));
    else vu('geste ① : ' + w.code);
  });
  // Un mot ordinaire
  const ord = ph.mots.find(w => w.k === 'mot' && w.v < 0 && !w.code && !w.s);
  if (ord) {
    const r = M.verifVerbes(ph, V.concat([ord.n]));
    if (r.ok || r.trop[0].genre !== 'autre') non(id, '« ' + ord.t + ' » devrait donner « autre » : ' + JSON.stringify(r.trop)); else vu('geste ① : autre');
  }
  // Un verbe oublié
  const sans = V.filter(n => ph.verbes[0].i.indexOf(n) < 0), r1 = M.verifVerbes(ph, sans);
  if (r1.ok || r1.oublies[0] !== 0) non(id, 'le 1er verbe oublié n\'est pas signalé'); else vu('geste ① : verbe oublié');

  if (ph.nb < 2 || ph.range) {
    if (ph.nbLimites) non(id, 'phrase sans partie séparée mais avec un séparateur');
    if (f.niv === 7 && ph.range) vu('bonus : partie rangée');
    return;
  }
  // Geste ③ juste
  const S = tousSeps(ph);
  if (!M.verifSep(ph, S).ok) non(id, 'les bons séparateurs ne sont pas acceptés');
  // Chaque signe ou petit mot du séparateur suffit seul (deux séparateurs collés)
  Object.keys(ph.limites).forEach(l => ph.limites[l].forEach(n => {
    const autres = S.filter(x => ph.limites[l].indexOf(x) < 0);
    if (!M.verifSep(ph, autres.concat(M.groupe(ph, n))).ok) non(id, 'le séparateur « ' + ph.mots[n].t + ' » seul n\'est pas accepté');
  }));
  // Erreurs du geste ③
  ph.mots.forEach(w => {
    if (w.code === 'tete') {
      const r = M.verifSep(ph, S.concat(M.groupe(ph, w.n)));
      if (r.ok || r.erreurs[0].genre !== 'tete') non(id, '« ' + w.t + ' » (début) devrait donner « tete »'); else vu('geste ③ : mot du début');
    }
    if (w.code === 'et' || w.code === 'liste') {
      const r = M.verifSep(ph, S.concat([w.n]));
      if (r.ok || r.erreurs[0].genre !== 'piege') non(id, '« ' + w.t + ' » (' + w.code + ') devrait donner « piege »'); else vu('geste ③ : ' + w.code);
    }
  });
  const dedans = ph.mots.find(w => w.k === 'mot' && !w.s && !w.code && w.prof === 0 && w.v < 0 && w.n > 0);
  if (dedans) {
    const r = M.verifSep(ph, [dedans.n]);
    if (r.ok || r.erreurs[0].genre !== 'dedans') non(id, '« ' + dedans.t + ' » devrait donner « dedans »'); else vu('geste ③ : au milieu d\'une partie');
  }
  if (ph.nbLimites > 1) {
    const r = M.verifSep(ph, ph.limites[1]);
    if (r.ok || r.erreurs.length || !r.manque.length) non(id, 'un séparateur oublié n\'est pas signalé'); else vu('geste ③ : séparateur oublié');
  }
  if (f.niv === 7) { const rel = M.relation(ph); if (rel) vu('geste ④ : ' + rel); }
});

const attendus = ['geste ① : inf', 'geste ① : ant', 'geste ① : nom', 'geste ① : pro', 'geste ① : autre', 'geste ① : verbe oublié', 'verbe en 2 morceaux',
  'geste ③ : mot du début', 'geste ③ : et', 'geste ③ : liste', 'geste ③ : au milieu d\'une partie', 'geste ③ : séparateur oublié',
  'geste ④ : juxtaposees', 'geste ④ : coordonnees', 'geste ④ : subordonnee', 'bonus : partie rangée'];
attendus.forEach(k => { if (!compte[k]) non('ensemble', 'aucun cas « ' + k + ' » testé'); });
Object.keys(compte).sort().forEach(k => console.log('  ' + k + ' : ' + compte[k]));
console.log(PHRASES.length + ' phrases : ' + (erreurs ? erreurs + ' erreur(s)' : 'moteur de correction sans erreur'));
process.exit(erreurs ? 1 : 0);
