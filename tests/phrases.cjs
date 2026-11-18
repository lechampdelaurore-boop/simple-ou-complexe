// Vérifie les phrases et les exercices « Assembler » (cahier des charges § 13).
// Usage : node tests/phrases.cjs [index.html]   (lit les phrases et le moteur dans index.html)
const fs = require('fs');
const path = require('path');
let src, mot;
const a1 = process.argv[2] || path.join(__dirname, '../index.html');
if (/\.html$/.test(a1)) { src = mot = fs.readFileSync(a1, 'utf8'); }
else { src = fs.readFileSync(a1, 'utf8'); mot = fs.readFileSync(process.argv[3] || path.join(__dirname, 'moteur.js'), 'utf8'); }
const bloc = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const PHRASES = new Function(bloc(src, '// DÉBUT PHRASES', '// FIN PHRASES') + '; return PHRASES;')();
const ASSEMBLER = new Function(bloc(src, '// DÉBUT ASSEMBLER', '// FIN ASSEMBLER') + '; return ASSEMBLER;')();
const M = new Function(bloc(mot, '// === MOTEUR (début)', '// === MOTEUR (fin)') + '; return M;')();

let erreurs = 0, avis = 0;
const non = (id, m) => { erreurs++; console.log('✗ ' + id + ' : ' + m); };
const voir = (id, m) => { avis++; if (process.env.AVIS) console.log('· ' + id + ' : ' + m); };
const bas = s => s.toLowerCase();

const SEP_NIV = { 2: M.SEP_SIGNES, 3: M.SEP_N3, 5: M.SEP_N5 };
function sepAutorise(niv, t) {
  for (const n of [2, 3, 5]) if (n <= Math.max(niv, 2) && SEP_NIV[n].indexOf(t) >= 0) return true;
  return false;
}
const LONG = { 1: [5, 12], 2: [5, 12], 3: [5, 12], 4: [3, 16], 5: [3, 16], 6: [3, 22], 7: [3, 22] };
const COMPTE = { 1: [30, 30, 0], 2: [40, 16, 24], 3: [50, 20, 30], 4: [50, 25, 25], 5: [50, 15, 35], 6: [30, 6, 24], 7: [30, 6, 24] };
const INTERDITS = /\b(aujourd'hui|hier|demain|maintenant|toujours|souvent|jamais|chaque|tous les|ce matin|ce soir|avant que|avant qu'|pour que|pour qu'|il faut|ni)\b|[?!«»]/i;
const PIEGE_CODE = { inf: 'P3', ant: 'P5', pro: 'P6', et: 'P1', liste: 'P2' };
const IMPARFAIT = /(ais|ait|ions|iez|aient)$/;
const FUTUR = /(rai|ras|ra|rons|rez|ront)$/;
const PASSE_SIMPLE = ['monta', 'ouvrit', 'cracha', 'traversa', 'quitta', 'combattit', 'cracha'];

const ids = {}, textes = {};
const parNiv = {};
PHRASES.forEach(f => {
  const id = f.id;
  if (ids[id]) non(id, 'id en double'); ids[id] = f;
  if (!/^n[1-7]-\d{3}$/.test(id) || +id[1] !== f.niv) non(id, 'id mal formé ou niveau faux');
  let ph;
  try { ph = M.lire(f.p); } catch (e) { return non(id, e.message); }
  f._ph = ph;
  const niv = f.niv;
  (parNiv[niv] = parNiv[niv] || []).push(f);
  // texte propre
  if (/[\[\]{}<>|#+()\/]/.test(ph.texte)) non(id, 'marque restée : ' + ph.texte);
  if (!/^[A-ZÀÉÈÊÎÔÂ]/.test(ph.texte)) non(id, 'pas de majuscule au début');
  if (!/\.$/.test(ph.texte)) non(id, 'ne finit pas par un point');
  if (INTERDITS.test(ph.texte)) non(id, 'mot interdit (temps, ni, subjonctif, ? !) : ' + ph.texte);
  if (textes[bas(ph.texte)]) non(id, 'même phrase que ' + textes[bas(ph.texte)]); textes[bas(ph.texte)] = id;
  // longueur (mots, élisions collées)
  const nbMots = ph.mots.filter(w => w.k === 'mot' && !/'$/.test(w.t)).length;
  f._mots = nbMots;
  if (nbMots < LONG[niv][0] || nbMots > LONG[niv][1]) non(id, nbMots + ' mots (attendu ' + LONG[niv].join('–') + ')');
  // nombre de verbes par niveau
  if (niv === 1 && ph.nb !== 1) non(id, 'niveau 1 : ' + ph.nb + ' verbes');
  if (niv >= 2 && niv <= 5 && ph.nb > 2) non(id, 'niveaux 2 à 5 : ' + ph.nb + ' verbes');
  if (niv === 7 && ph.nb > 2) non(id, 'bonus : ' + ph.nb + ' verbes');
  if (ph.nb < 1) non(id, 'aucun verbe');
  // verbes : un seul morceau « premier », pas de verbe à l'intérieur d'un séparateur
  ph.verbes.forEach((v, k) => { if (ph.mots[v.premier].v !== k || !ph.mots[v.premier].vp) non(id, 'verbe ' + k + ' mal lu'); });
  // limites et séparateurs
  const hauts = ph.verbes.filter(v => v.prof === 0);
  const ranges = ph.verbes.filter(v => v.prof > 0);
  const nLim = hauts.length - 1;
  const lims = Object.keys(ph.limites).map(Number).sort();
  if (lims.join() !== Array.from({ length: nLim }, (_, k) => k + 1).join()) non(id, 'limites ' + lims.join() + ' pour ' + hauts.length + ' verbes au premier niveau');
  if (ranges.length && ranges.length !== 1) non(id, 'plus d\'une partie rangée');
  if (ranges.length && niv !== 7) non(id, 'partie rangée hors bonus');
  if (ranges.length && lims.length) non(id, 'partie rangée + séparateur (à éviter)');
  lims.forEach(l => {
    const idx = ph.limites[l];
    if (idx[0] === 0) non(id, 'séparateur en premier mot');
    for (let k = 1; k < idx.length; k++) if (idx[k] !== idx[k - 1] + 1) non(id, 'séparateur de la limite ' + l + ' en morceaux');
    const avant = hauts[l - 1], apres = hauts[l];
    if (!(Math.max(...avant.i) < idx[0] && idx[idx.length - 1] < apres.premier)) non(id, 'séparateur ' + l + ' pas entre les verbes ' + l + ' et ' + (l + 1));
    // au plus un signe puis un petit mot ; le petit mot ouvre la 2e partie
    const ws = idx.map(k => ph.mots[k]);
    const signes = ws.filter(w => w.k === 'ponct'), petits = ws.filter(w => w.k === 'mot');
    if (signes.length > 1) non(id, 'deux signes à la même limite');
    if (signes.length && petits.length && ws[0].k !== 'ponct') non(id, 'signe après le petit mot');
    const petit = bas(petits.map(w => w.t).join(' '));
    signes.forEach(w => { if (!sepAutorise(niv, w.t)) non(id, 'signe « ' + w.t + ' » pas permis au niveau ' + niv); });
    if (petit && !sepAutorise(niv, petit)) non(id, 'séparateur « ' + petit + ' » pas permis au niveau ' + niv);
    if (petit === 'or' || petit === 'ni') voir(id, 'séparateur rare : ' + petit);
    if (signes.length && signes[0].t !== ',' && petits.length) non(id, 'point-virgule ou deux-points + petit mot');
    // la partie suivante a son sujet (pas de verbe juste après le séparateur)
    const entre = ph.mots.slice(idx[idx.length - 1] + 1, apres.premier);
    const sujet = entre.filter(w => w.k === 'mot' && !w.code && ['ne', "n'"].indexOf(bas(w.t)) < 0);
    if (!sujet.length) non(id, 'la partie après le séparateur ' + l + ' n\'a pas de sujet');
  });
  // 1re partie : un sujet avant le verbe (pas d'impératif)
  const debut = ph.mots.slice(0, hauts[0].premier).filter(w => w.k === 'mot' && w.code !== 'pro' && w.code !== 'tete' && ['ne', "n'"].indexOf(bas(w.t)) < 0);
  if (!debut.length) non(id, 'pas de sujet avant le 1er verbe');
  // mots en tête
  ph.mots.forEach(w => {
    if (w.code === 'tete') {
      if (niv < 5) non(id, 'tete avant le niveau 5');
      if (w.s) non(id, 'tete aussi séparateur');
      if (ph.mots.filter(x => x.code === 'tete').some(x => x.n > 1)) non(id, 'tete pas au début');
      if (!ph.limites[1] || !ph.limites[1].some(k => ph.mots[k].t === ',')) non(id, 'tete sans virgule à la limite 1');
    }
  });
  const tete = bas(ph.mots.filter(w => w.code === 'tete').map(w => w.t).join(' '));
  if (tete && M.SEP_N5.indexOf(tete) < 0) non(id, 'mot de tête inconnu : ' + tete);
  // petit mot du niveau 5 non marqué au milieu d'une partie
  ph.mots.forEach(w => {
    if (w.s || w.code) return;
    const t = bas(w.t), suiv = ph.mots[w.n + 1] ? bas(ph.mots[w.n + 1].t) : '';
    if (['quand', 'lorsque', "lorsqu'", 'puisque', "puisqu'"].indexOf(t) >= 0) non(id, '« ' + w.t + ' » non marqué');
    if (t === 'parce' || ((t === 'pendant' || t === 'dès') && /^qu/.test(suiv))) non(id, '« ' + w.t + ' ' + suiv + ' » non marqué');
    if (t === 'si' || t === "s'" && suiv === 'il') voir(id, '« si » non marqué (adverbe ?)');
    if (t === 'comme') voir(id, '« comme » sans verbe (comparaison) : ' + ph.texte);
    if (t === 'que' || t === "qu'") voir(id, '« que » non marqué : ' + ph.texte);
    if (['et', 'mais', 'ou', 'car', 'donc', 'or', 'puis', 'ensuite', 'alors'].indexOf(t) >= 0) non(id, '« ' + w.t + ' » non marqué (séparateur ou piège ?)');
    if (w.t === ',' && niv >= 2) voir(id, 'virgule non marquée : ' + ph.texte);
  });
  // pièges
  const codes = ph.mots.map(w => w.code).filter(Boolean);
  codes.forEach(c => { if (['inf', 'ant', 'nom', 'pro', 'et', 'liste', 'tete'].indexOf(c) < 0) non(id, 'code inconnu ' + c); });
  const attendus = new Set(codes.map(c => PIEGE_CODE[c]).filter(Boolean));
  if (ph.verbes.some(v => v.i.length > 1)) attendus.add('P4');
  if (ph.range) attendus.add('P7');
  const donnes = new Set(f.pieges || []);
  if (niv < 4 && (attendus.size || donnes.size)) non(id, 'piège avant le niveau 4 : ' + [...attendus, ...donnes].join(','));
  attendus.forEach(p => { if (!donnes.has(p)) non(id, 'piège ' + p + ' présent mais pas dans pieges'); });
  donnes.forEach(p => { if (!attendus.has(p)) non(id, 'piège ' + p + ' dans pieges mais pas dans la phrase'); });
  if (niv < 4 && ph.mots.some(w => w.t === ',' && !w.s) && niv > 1) non(id, 'virgule qui ne sépare pas avant le niveau 4');
  // petits mots collés au verbe non marqués
  ph.verbes.forEach(v => {
    let k = v.premier - 1;
    while (k >= 0 && ['ne', "n'"].indexOf(bas(ph.mots[k].t)) < 0 && M.SOUDES.indexOf(bas(ph.mots[k].t)) >= 0) {
      const w = ph.mots[k];
      if (w.code !== 'pro' && ['nous', 'vous'].indexOf(bas(w.t)) < 0) non(id, '« ' + w.t + ' » collé au verbe sans marque pro');
      if (['nous', 'vous'].indexOf(bas(w.t)) >= 0 && w.code !== 'pro') break;
      k--;
    }
  });
  // mots qui ressemblent à un infinitif ou à un -ant, non marqués
  ph.mots.forEach(w => {
    if (w.k !== 'mot' || w.v >= 0 || w.code) return;
    if (/(er|ir)$/.test(bas(w.t)) && ['hier', 'fer', 'mer', 'hiver', 'cuiller', 'dîner', 'déjeuner', 'goûter', 'cahier', 'boulanger', 'premier', 'dernier', 'super', 'loisir', 'désir', 'plaisir', 'quartier', 'papier', 'pommier', 'chevalier', 'escalier', 'panier', 'fermier', 'jardinier', 'pâtissier', 'cuisinier', 'grenier', 'tablier', 'collier', 'sentier', 'métier', 'policier', 'pompier', 'portier', 'rocher', 'clocher', 'cher', 'léger', 'étranger', 'danger', 'souvenir', 'avenir', 'saphir', 'élixir', 'vampir', 'radiateur'].indexOf(bas(w.t)) < 0) voir(id, 'mot en -er/-ir non marqué : ' + w.t);
    if (/ant$/.test(bas(w.t)) && ['pendant', 'devant', 'avant', 'enfant', 'géant', 'restaurant', 'éléphant', 'gant', 'instant', 'élégant', 'méchant', 'savant', 'vivant', 'amusant', 'brillant', 'grand', 'volant', 'chant', 'diamant', 'passant', 'passionnant'].indexOf(bas(w.t)) < 0) non(id, 'mot en -ant non marqué : ' + w.t);
  });
  // hier : chaque verbe change (1er morceau), aucun autre mot
  if (!/^(Hier|Demain), /.test(f.hier)) non(id, 'hier ne commence pas par « Hier, » ou « Demain, »');
  const H = M.sansMoment(f.hier), P = M.plats(ph.texte);
  if (H.length !== P.length) non(id, 'hier : ' + H.length + ' mots au lieu de ' + P.length + ' : ' + f.hier);
  else {
    const diff = []; P.forEach((w, k) => { if (bas(w.t) !== bas(H[k].t)) diff.push(k); });
    const prem = ph.verbes.map(v => v.premier).sort((a, b) => a - b);
    if (diff.join() !== prem.join()) non(id, 'hier change ' + diff.map(k => P[k].t + '→' + H[k].t).join(', ') + ' (attendu : ' + prem.map(k => P[k].t).join(', ') + ')');
    const demain = /^Demain/.test(f.hier);
    prem.forEach(k => { const t = bas(H[k].t); if (demain ? !FUTUR.test(t) : !IMPARFAIT.test(t)) non(id, (demain ? 'futur' : 'imparfait') + ' douteux : ' + H[k].t); });
    const passe = prem.some(k => IMPARFAIT.test(bas(P[k].t)) && ['fait', 'sait', 'fais', 'sais', 'plait'].indexOf(bas(P[k].t)) < 0 || PASSE_SIMPLE.indexOf(bas(P[k].t)) >= 0);
    if (passe !== demain) non(id, passe ? 'phrase au passé : il faut « Demain, »' : '« Demain, » alors que la phrase n\'est pas au passé');
    if (H[0].t !== bas(H[0].t) && P[0].t === bas(P[0].t)) non(id, 'majuscule bizarre dans hier');
    if (/^[A-ZÉ]/.test(H[0].t) && !/^(Papa|Maman|Mamie|Tom|Léo|Zoé|Lucas|Léa|Lou|Timéo|Noé|Rose)$/.test(H[0].t)) non(id, 'hier : majuscule après « Hier, » : ' + H[0].t);
  }
  // ne… pas : une ligne par verbe, « pas » juste après le 1er morceau du verbe
  if (!Array.isArray(f.nepas) || f.nepas.length !== ph.nb) non(id, 'nepas : ' + (f.nepas || []).length + ' lignes pour ' + ph.nb + ' verbes');
  else f.nepas.forEach((l, k) => {
    const L = M.plats(l);
    const v = ph.verbes[k], t1 = bas(ph.mots[v.premier].t);
    // position du verbe : n-ième occurrence dans la phrase
    const occ = ph.mots.slice(0, v.premier).filter(w => bas(w.t) === t1).length;
    const pos = L.map((w, j) => bas(w.t) === t1 ? j : -1).filter(j => j >= 0);
    const j = pos[occ];
    if (j === undefined) return non(id, 'nepas ' + (k + 1) + ' : verbe « ' + t1 + ' » introuvable : ' + l);
    if (!L[j + 1] || bas(L[j + 1].t) !== 'pas') non(id, 'nepas ' + (k + 1) + ' : « pas » pas juste après « ' + t1 + ' » : ' + l);
    let a = j - 1;
    while (a >= 0 && M.SOUDES.indexOf(bas(L[a].t)) >= 0 && ['ne', "n'"].indexOf(bas(L[a].t)) < 0) a--;
    if (a < 0 || ['ne', "n'"].indexOf(bas(L[a].t)) < 0) non(id, 'nepas ' + (k + 1) + ' : pas de « ne » devant le verbe : ' + l);
    else {
      if (bas(L[a].t) === "n'" && !/^[aeiouyéèêàâîôûœh]/i.test(L[a + 1].t)) non(id, 'nepas ' + (k + 1) + " : n' devant une consonne : " + l);
      if (bas(L[a].t) === 'ne' && /^[aeiouyéèêàâîôûœ]/i.test(L[a + 1].t)) non(id, 'nepas ' + (k + 1) + ' : ne devant une voyelle : ' + l);
      if (bas(L[a].t) === "n'" && /^h/i.test(L[a + 1].t) && ['habite', 'habitait', 'habitais', 'habitent'].indexOf(bas(L[a + 1].t)) < 0) voir(id, "n'h… : " + l);
    }
    // ce qui change en plus de ne… pas (articles) : à relire
    const d = M.change(P, L).map(x => L[x].t).filter(x => ['ne', "n'", 'pas'].indexOf(bas(x)) < 0);
    const dejaNeg = ph.mots.some(w => bas(w.t) === 'pas');
    if (d.length) voir(id, 'nepas ' + (k + 1) + ' change aussi : ' + d.join(' ') + ' → ' + l);
    if (dejaNeg && ph.mots.slice(v.premier - 2, v.premier + 2).some(w => bas(w.t) === 'pas') && l !== ph.texte.replace(/ /g, ' ')) non(id, 'phrase déjà négative : la ligne doit être la phrase : ' + l);
  });
  // autre sujet : le verbe doit changer
  if (f.sujet) {
    const S = M.plats(f.sujet), ch = M.change(P, S);
    const t1 = ph.mots[ph.verbes[0].premier].t;
    if (!ch.some(x => S[x].t !== t1 && S.length)) non(id, 'sujet : rien ne change');
    voir(id, 'sujet : ' + ch.map(x => S[x].t).join(' ') + ' → ' + f.sujet);
  }
  // paire
  if (f.paire) { /* vérifiée plus bas */ }
  // couper
  if (f.coupe) {
    if (ph.nb !== 2 || niv > 3 && niv !== 4) non(id, 'coupe sur une phrase qui ne s\'y prête pas');
    const lim = ph.limites[1].map(k => ph.mots[k]);
    const motSep = lim.filter(w => w.k === 'mot').map(w => bas(w.t)).join(' ');
    if (motSep && ['et', 'mais', 'ou', 'car', 'donc', 'puis'].indexOf(motSep) < 0) non(id, 'coupe avec « ' + motSep + ' »');
    const p1 = ph.mots.filter(w => w.partie === 0), p2 = ph.mots.filter(w => w.partie === 1 && w.t !== '.');
    const maj = s => s.charAt(0).toUpperCase() + s.slice(1);
    const e1 = M.joindre(p1).trim() + '.', e2raw = M.joindre(p2).trim();
    const e2 = (/^(Papa|Maman|Tom|Léo)\b/.test(e2raw) ? e2raw : maj(e2raw)) + '.';
    if (f.coupe[0] !== e1.replace(/ /g, ' ')) non(id, 'coupe[0] « ' + f.coupe[0] + ' » au lieu de « ' + e1 + ' »');
    if (f.coupe[1] !== e2.replace(/ /g, ' ')) non(id, 'coupe[1] « ' + f.coupe[1] + ' » au lieu de « ' + e2 + ' »');
  }
  if (niv === 4 && !f.etape) non(id, 'niveau 4 sans etape');
});

// paires
PHRASES.forEach(f => {
  if (!f.paire) return;
  const g = ids[f.paire];
  if (!g) return non(f.id, 'paire ' + f.paire + ' introuvable');
  if (g.paire !== f.id) non(f.id, 'paire non réciproque');
  if (f.niv !== 4 || g.niv !== 4) non(f.id, 'paire hors niveau 4');
  const [s, c] = PHRASES.indexOf(f) < PHRASES.indexOf(g) ? [f, g] : [g, f];
  if (s._ph && c._ph && (s._ph.nb !== 1 || c._ph.nb < 2)) non(s.id, 'paire : la 1re doit être simple, la 2e complexe');
  if (Math.abs(PHRASES.indexOf(f) - PHRASES.indexOf(g)) !== 1) non(f.id, 'paire pas à la suite');
});

// comptes par niveau
Object.keys(COMPTE).forEach(n => {
  const L = parNiv[n] || [], [tot, s, c] = COMPTE[n];
  const ns = L.filter(f => f._ph && f._ph.nb === 1).length;
  if (L.length !== tot || ns !== s || L.length - ns !== c) non('niveau ' + n, L.length + ' phrases dont ' + ns + ' simples (attendu ' + tot + ', ' + s + ' simples)');
  if (+n === 6) { const t = L.filter(f => f._ph && f._ph.nb >= 3).length; if (t * 2 < L.length) non('niveau 6', 'seulement ' + t + ' phrases à 3 verbes'); }
});
// niveau 4 : étapes dans l'ordre, 2 paires par piège
const n4 = parNiv[4] || [];
['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].forEach(p => {
  const L = n4.filter(f => f.etape === p);
  if (L.length < 6 || L.length > 8) non('niveau 4', p + ' : ' + L.length + ' phrases');
  if (L.filter(f => f.paire).length < 4) non('niveau 4', p + ' : moins de 2 paires');
});
const etapes = n4.map(f => f.etape); const ord = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'mix'];
for (let k = 1; k < etapes.length; k++) if (ord.indexOf(etapes[k]) < ord.indexOf(etapes[k - 1])) non('niveau 4', 'étapes pas dans l\'ordre');

// Assembler
const aids = {};
ASSEMBLER.forEach(x => {
  const id = x.id;
  if (aids[id]) non(id, 'id en double'); aids[id] = 1;
  if ([3, 5].indexOf(x.niv) < 0) non(id, 'niv ' + x.niv);
  const ok = Object.keys(x.ok || {}), nn = Object.keys(x.non || {});
  if (!ok.length || !nn.length) non(id, 'il faut au moins un séparateur juste et un qui ne colle pas');
  if (ok.length + nn.length < 3 || ok.length + nn.length > 4) non(id, (ok.length + nn.length) + ' séparateurs proposés (3 ou 4)');
  [x.a, x.b].forEach(s => { if (!/^[A-ZÉ].*\.$/.test(s)) non(id, 'phrase mal formée : ' + s); });
  const debut = x.a.replace(/\.$/, '');
  const bMin = /^(Papa|Maman|Tom)\b/.test(x.b) ? x.b : x.b.charAt(0).toLowerCase() + x.b.slice(1);
  [...ok.map(k => [k, x.ok[k]]), ...nn.map(k => [k, x.non[k]])].forEach(([sep, [phrase, msg]]) => {
    if (!sepAutorise(x.niv, sep)) non(id, 'séparateur « ' + sep + ' » pas permis au niveau ' + x.niv);
    if (!msg || msg.length < 10) non(id, 'explication manquante pour ' + sep);
    const virgule = ['mais', 'donc', 'alors', 'puis', 'ensuite', 'or'].indexOf(sep) >= 0 ? ',' : '';
    let mot = sep + ' ';
    if (/^[aeiouéèêh]/i.test(bMin) && /(que|si)$/.test(sep) && !(sep === 'si' && !/^il/.test(bMin))) mot = sep.replace(/e$/, '').replace(/i$/, '') + "'";
    const attendu = debut + virgule + ' ' + mot + bMin;
    if (phrase !== attendu) non(id, sep + ' : « ' + phrase + ' » ≠ « ' + attendu + ' »');
  });
});
console.log(PHRASES.length + ' phrases, ' + ASSEMBLER.length + ' exercices « Assembler » : ' + (erreurs ? erreurs + ' erreur(s)' : 'aucune erreur') + (avis ? ', ' + avis + ' point(s) à relire (AVIS=1 pour les voir)' : ''));
process.exit(erreurs ? 1 : 0);
