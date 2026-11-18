// Vérifie le site EN LIGNE (ou une adresse donnée) dans Chrome au format téléphone (cahier des charges § 13) :
//  - aucune erreur dans la console ;
//  - l'écran d'une phrase tient sans défiler à 7 tailles de téléphone, boîte à outils ouverte,
//    phrases les plus longues comprises (et après une erreur, à la fin, dans Assembler et Couper) ;
//  - la toute première visite ouvre la leçon 0, puis l'accueil ;
//  - une séance du jour complète jouée (via window.__phrases), avec une phrase simple, une complexe,
//    une erreur corrigée et un « Assembler » ou « Couper » ;
//  - les messages de correction du § 8 (une erreur volontaire de chaque sorte) ;
//  - révisions : une phrase ratée revient à J+1, puis J+3, puis J+7 ;
//  - passage de niveau : 5 parfaites sur 6, sur 2 jours ;
//  - l'appli marche hors ligne après une première visite ;
//  - l'appli apparaît sur « Mes applis ».
// Usage : node tests/telephone.cjs [url]   (captures dans captures/)
const { chromium } = require('playwright');
const fs = require('fs');

const URL = process.argv[2] || 'https://lechampdelaurore-boop.github.io/simple-ou-complexe/';
const LIVE = !process.argv[2];
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 664], [390, 844], [412, 780], [430, 932]];
const expectedCache = (fs.readFileSync(__dirname + '/../sw.js', 'utf8').match(/simple-ou-complexe-v\d+/) || [])[0];
const PREFS = JSON.stringify({ son: false, anim: false, vibre: false, voixAuto: false, lecon0: true });

const lignes = [];
let echec = false;
function note(ok, texte) { if (!ok) echec = true; lignes.push(`| ${ok ? '✅' : '❌'} | ${texte} |`); console.log((ok ? 'OK   ' : 'ÉCHEC ') + texte); }

async function nouvellePage(browser, w, h, erreurs, o = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  if (!o.vierge) await page.addInitScript(([p, st]) => {
    if (!sessionStorage.getItem('pret')) {
      sessionStorage.setItem('pret', '1');
      localStorage.setItem('marc.phrases.prefs', p);
      Object.keys(st).forEach(k => localStorage.setItem(k, JSON.stringify(st[k])));
    }
  }, [PREFS, o.stockage || {}]);
  await page.goto(URL + '?nocache=' + Date.now());
  await page.waitForFunction(() => window.__phrases);
  return page;
}
const etat = page => page.evaluate(() => __phrases.etat());
const jeu = (page, f, a) => page.evaluate(f, a);
// Combien l'écran déborde : la page entière, puis la carte de la phrase
async function debord(page) {
  return page.evaluate(() => { const z = document.querySelector('#jZone'); return Math.max(document.documentElement.scrollHeight - innerHeight, z && z.offsetParent ? z.scrollHeight - z.clientHeight - 2 : 0); });
}
// Joue jusqu'à la fin de la série ; faux(e, n) dit si on se trompe à cette étape
async function jouerSerie(page, faux = () => false) {
  const vus = [];
  for (let n = 0; n < 400; n++) {
    const e = await etat(page);
    if (e.vue !== 'vJeu' && e.vue !== 'vLecon') return { e, vus };
    if (e.q) vus.push(e.q);
    if (e.vue === 'vJeu' && e.q && !e.q.apres && !e.q.fin && faux(e, n)) await page.evaluate(() => __phrases.faux());
    else await page.evaluate(() => __phrases.juste());
  }
  return { e: await etat(page), vus };
}

(async () => {
  fs.mkdirSync('captures', { recursive: true });
  if (LIVE) {
    for (let i = 0; ; i++) {
      const live = await fetch(URL + 'sw.js?nocache=' + Date.now()).then(r => r.text()).catch(() => '');
      if (live.includes(expectedCache)) { console.log('Version en ligne : ' + expectedCache); break; }
      if (i >= 18) { console.log('Version en ligne différente de ' + expectedCache + ' après 3 min'); process.exit(1); }
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  const browser = await chromium.launch();

  // 1. Les 7 tailles : l'écran d'une phrase ne défile pas
  for (const [w, h] of SIZES) {
    const erreurs = [], page = await nouvellePage(browser, w, h, erreurs);
    // les 2 phrases les plus longues de chaque niveau à partir du 4, et la plus longue des niveaux 2-3
    const ids = await jeu(page, () => {
      const L = __phrases.PHRASES.map(f => ({ id: f.id, niv: f.niv, n: __phrases.M.lire(f.p).texte.length }));
      const out = [];
      [[2, 3], [4], [5], [6], [7]].forEach(g => L.filter(x => g.includes(x.niv)).sort((a, b) => b.n - a.n).slice(0, 2).forEach(x => out.push(x.id)));
      return out;
    });
    const pire = { d: 0, ou: '' };
    const mesure = async (ou) => { const d = await debord(page); if (d > pire.d) { pire.d = d; pire.ou = ou; } };
    for (const id of ids) {
      await jeu(page, id => __phrases.phrase(id, 'guide'), id);          // boîte à outils ouverte (Hier…)
      await mesure(id + ' Hier');
      await jeu(page, () => __phrases.outil('nepas')); await mesure(id + ' ne… pas');
      await jeu(page, () => __phrases.faux()); await mesure(id + ' erreur ①');
      await jeu(page, () => __phrases.juste());
      let e = await etat(page);
      if (e.q.geste === 2) { await jeu(page, () => __phrases.faux()); await mesure(id + ' erreur ②'); await jeu(page, () => __phrases.juste()); e = await etat(page); }
      if (e.q.geste === 3) { await jeu(page, () => __phrases.faux()); await mesure(id + ' erreur ③'); }
      for (let k = 0; k < 6 && !(await etat(page)).q.fin; k++) await jeu(page, () => __phrases.juste());
      await mesure(id + ' fin');
    }
    if (w === 320 || w === 390) {
      await jeu(page, ids => __phrases.phrase(ids[ids.length - 1], 'guide'), ids);
      await page.screenshot({ path: `captures/phrase-${w}x${h}.png` });
    }
    // Assembler (phrase la plus longue) et Couper
    const asm = await jeu(page, () => __phrases.ASSEMBLER.slice().sort((a, b) => JSON.stringify(b.ok).length - JSON.stringify(a.ok).length)[0].id);
    await jeu(page, id => __phrases.lancer('assembler', [{ t: 'assembler', id }, { t: 'couper', id: 'n3-013' }]), asm);
    await page.click('.seps button'); await mesure('Assembler choix');
    await jeu(page, () => __phrases.faux()); await mesure('Assembler erreur');
    await jeu(page, () => __phrases.faux()); await mesure('Assembler réponse');
    if (w === 320) await page.screenshot({ path: `captures/assembler-${w}x${h}.png` });
    await jeu(page, () => __phrases.juste()); await mesure('Couper');
    await jeu(page, () => __phrases.faux()); await mesure('Couper erreur');
    note(pire.d <= 0, `${w}×${h} : l'écran d'une phrase ne défile pas (${ids.length} phrases longues, boîte ouverte, erreurs, Assembler, Couper)${pire.d > 0 ? ' : déborde de ' + pire.d + ' px (' + pire.ou + ')' : ''}`);
    note(!erreurs.length, `${w}×${h} : console sans erreur` + (erreurs.length ? ' : ' + erreurs.join(' / ') : ''));
    await page.close();
  }

  // 2. Première visite : leçon 0, puis l'accueil
  {
    const erreurs = [], page = await nouvellePage(browser, 390, 844, erreurs, { vierge: true });
    const e0 = await etat(page);
    await page.screenshot({ path: 'captures/lecon0.png' });
    for (let k = 0; k < 4; k++) await page.click('#lSuivant');
    const e1 = await etat(page);
    await page.screenshot({ path: 'captures/accueil.png', fullPage: true });
    note(e0.vue === 'vLecon' && e0.lecon.n === 0 && e1.vue === 'vAccueil', 'Première visite : la leçon 0 (4 écrans), puis l\'accueil');
    note(!erreurs.length, 'Console sans erreur (première visite)' + (erreurs.length ? ' : ' + erreurs.join(' / ') : ''));
    await page.close();
  }

  // 3. Une séance du jour complète (niveau 1 réussi : séance du niveau 2 avec sa leçon, une erreur, Assembler ou Couper)
  {
    const erreurs = [], page = await nouvellePage(browser, 390, 844, erreurs, { stockage: { 'marc.phrases.niveaux': { 1: { der: [], reussi: true, nb: 6, suite: 0, lecon: true, etapes: {} } } } });
    await page.click('#bJour');
    const debut = await etat(page);
    const { e, vus } = await jouerSerie(page, (x, n) => x.q.t === 'phrase' && x.q.id === 'n2-002' && x.q.geste === 1);
    await page.screenshot({ path: 'captures/fin-seance.png' });
    const ph = vus.filter(q => q.t === 'phrase');
    const nbs = await jeu(page, ids => ids.map(id => __phrases.M.lire(__phrases.PHRASES.find(f => f.id === id).p).nb), [...new Set(ph.map(q => q.id))]);
    const simple = nbs.includes(1), complexe = nbs.some(n => n > 1);
    const err = ph.some(q => q.essais && q.essais[1] > 0);
    const asm = vus.some(q => q.t === 'assembler' || q.t === 'couper');
    const fiches = await jeu(page, () => __phrases.fiches());
    note(debut.run.jobs[0] === 'lecon:2' && e.vue === 'vFin' && simple && complexe && err && asm && fiches['n2-002'] && fiches['n2-002'].b === 1,
      `Séance du jour jouée jusqu'au bout : leçon du niveau 2, ${debut.run.jobs.length - 1} exercices (simple ${simple}, complexe ${complexe}, erreur corrigée ${err}, Assembler/Couper ${asm}), la phrase ratée part en révision`);
    note(!erreurs.length, 'Console sans erreur (séance)' + (erreurs.length ? ' : ' + erreurs.join(' / ') : ''));
    await page.close();
  }

  // 4. Messages de correction (§ 8) : une erreur volontaire de chaque sorte
  {
    const erreurs = [], page = await nouvellePage(browser, 390, 844, erreurs);
    const cas = await jeu(page, () => {
      const M = __phrases.M, out = {};
      __phrases.PHRASES.forEach(f => {
        const ph = M.lire(f.p);
        ph.mots.forEach(w => {
          if (['inf', 'ant', 'nom', 'pro'].includes(w.code) && !out[w.code]) out[w.code] = { id: f.id, n: w.n, g: 1 };
          if (w.code === 'tete' && !out.tete && ph.nb > 1) out.tete = { id: f.id, n: w.n, g: 3 };
          if (w.code === 'et' && ph.nb > 1 && !ph.range && !out.et3) out.et3 = { id: f.id, n: w.n, g: 3 };
          if (w.code === 'liste' && ph.nb > 1 && !ph.range && !out.liste3) out.liste3 = { id: f.id, n: w.n, g: 3 };
        });
        if (ph.nbLimites > 1 && !out.manque) out.manque = { id: f.id, n: ph.limites[1][0], g: 3 };
        if (f.niv === 1 && !out.autre) out.autre = { id: f.id, n: ph.mots.find(w => w.k === 'mot' && w.v < 0).n, g: 1 };
        if (f.niv === 2 && ph.nb === 2 && !out.dedans) out.dedans = { id: f.id, n: ph.mots.find(w => w.k === 'mot' && w.v < 0 && w.n > 0 && !w.s).n, g: 3 };
        if (f.niv === 2 && ph.nb === 2 && !out.sc2) out.sc2 = { id: f.id, g: 2 };
        if (f.niv === 2 && ph.nb === 1 && !out.sc1) out.sc1 = { id: f.id, g: 2 };
      });
      return out;
    });
    const attendu = { inf: 'infinitif', ant: 'ne change pas', nom: 'c\'est un nom', pro: 'petit mot collé au verbe', autre: 'ce n\'est pas un verbe conjugué',
      tete: 'ouvre la 1re partie', et3: 'pas deux parties', liste3: 'sépare une liste', manque: 'il manque un séparateur', dedans: 'Regarde où finit la partie',
      sc2: '2 verbes ou plus → phrase complexe', sc1: '1 seul verbe → phrase simple' };
    for (const k of Object.keys(attendu)) {
      const c = cas[k];
      if (!c) { note(false, `Message « ${k} » : aucune phrase pour le tester`); continue; }
      await jeu(page, id => __phrases.phrase(id, 'loupe'), c.id);
      for (let g = 1; g < c.g; g++) await jeu(page, () => __phrases.juste());
      await jeu(page, n => __phrases.faux(n), c.n);
      const e = await etat(page);
      note(e.q.msg.includes(attendu[k]), `Message « ${k} » (${c.id}) : « ${e.q.msg.slice(0, 90)}… »`);
      if (k === 'tete') await page.screenshot({ path: 'captures/message-tete.png' });
    }
    // Oubli d'un verbe : il reste un verbe caché, puis au 2e essai la réponse
    await jeu(page, () => __phrases.phrase('n2-006', 'loupe'));
    await page.click('.m.cible[data-n="1"]'); await page.click('#jVerbes');
    let e = await etat(page);
    const m1 = e.q.msg;
    await page.click('#jVerbes'); e = await etat(page);
    note(m1.includes('verbe caché') && e.q.msg.includes('Le voici') && e.q.apres, `Message « verbe oublié », puis la réponse au 2e essai`);
    note(!erreurs.length, 'Console sans erreur (messages)' + (erreurs.length ? ' : ' + erreurs.join(' / ') : ''));
    await page.close();
  }

  // 5. Révisions J+1, J+3, J+7 et 6. passage de niveau sur 2 jours
  {
    const erreurs = [], page = await nouvellePage(browser, 390, 844, erreurs);
    const jouer = async (id, faux) => {
      await jeu(page, id => __phrases.phrase(id, 'seul'), id);
      if (faux) await jeu(page, () => __phrases.faux());
      for (let k = 0; k < 12 && (await etat(page)).vue === 'vJeu'; k++) await jeu(page, () => __phrases.juste());
    };
    const dans = async () => (await jeu(page, () => __phrases.plan())).includes('phrase:n3-005:rev');
    await jouer('n3-005', true);
    const r = [];
    r.push(!(await dans()));                                        // J0 : pas encore
    await jeu(page, () => __phrases.jours(1)); r.push(await dans());  // J+1
    await jouer('n3-005');
    await jeu(page, () => __phrases.jours(2)); r.push(!(await dans()));
    await jeu(page, () => __phrases.jours(1)); r.push(await dans());  // J+3
    await jouer('n3-005');
    await jeu(page, () => __phrases.jours(6)); r.push(!(await dans()));
    await jeu(page, () => __phrases.jours(1)); r.push(await dans());  // J+7
    await jouer('n3-005');
    const f = (await jeu(page, () => __phrases.fiches()))['n3-005'];
    r.push(f.b === 4 && !f.due);
    note(r.every(Boolean), `Révisions : la phrase ratée revient à J+1, J+3, J+7, puis elle est sue (${r.map(x => x ? '✓' : '✗').join(' ')})`);

    const ids = await jeu(page, () => __phrases.PHRASES.filter(f => f.niv === 6).slice(0, 8).map(f => f.id));
    for (const id of ids.slice(0, 6)) await jouer(id);
    const avant = (await jeu(page, () => __phrases.niveaux()))[6];
    await jeu(page, () => __phrases.jours(1));
    await jouer(ids[6]);
    const apres = (await jeu(page, () => __phrases.niveaux()))[6];
    await jeu(page, () => __phrases.aller('accueil'));
    const etoile = await page.evaluate(() => !!document.querySelector('[data-niveau="6"] .etoile'));
    note(!avant.reussi && apres.reussi && etoile, 'Passage de niveau : 6 parfaites le même jour ne suffisent pas, une de plus le lendemain → niveau réussi ⭐');
    await jeu(page, () => __phrases.aller('parent'));
    await page.screenshot({ path: 'captures/carnet.png', fullPage: true });
    note(!erreurs.length, 'Console sans erreur (révisions, niveaux, carnet)' + (erreurs.length ? ' : ' + erreurs.join(' / ') : ''));
    await page.close();
  }

  // 7. Hors ligne après une première visite
  if (URL.startsWith('https:') || URL.includes('localhost')) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(URL);
    await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
    await page.waitForTimeout(1500);
    await ctx.setOffline(true);
    let ok = false;
    try { await page.reload(); ok = await page.evaluate(() => !!window.__phrases && document.title === 'Simple ou complexe ?'); } catch (e) { /* hors ligne raté */ }
    note(ok, 'Fonctionne hors ligne après une première visite');
    await ctx.close();
  }

  // 8. L'appli apparaît sur « Mes applis »
  if (LIVE) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('https://lechampdelaurore-boop.github.io/?nocache=' + Date.now());
    let ok = false;
    // Les thèmes de l'accueil sont repliés au départ : le lien existe sans être visible.
    try { await page.waitForSelector('a[href*="simple-ou-complexe"]', { state: 'attached', timeout: 30000 }); ok = true; } catch (e) { /* pas trouvée */ }
    const theme = ok ? await page.evaluate(() => { const u = document.querySelector('a[href*="simple-ou-complexe"]').closest('ul'); return u ? u.id : ''; }) : '';
    if (ok) await page.evaluate(() => { const u = document.querySelector('a[href*="simple-ou-complexe"]').closest('ul'); if (u) u.hidden = false; });
    await page.screenshot({ path: 'captures/mes-applis.png', fullPage: true });
    note(ok && theme === 'liste-ecrire', `L'appli apparaît sur « Mes applis »${theme ? ' (thème ' + theme.replace('liste-', '') + ')' : ''}`);
    await page.close();
  }

  await browser.close();
  const rapport = '| | Vérification |\n|---|---|\n' + lignes.join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Test téléphone (site en ligne)\n\n' + rapport + '\n');
  process.exit(echec ? 1 : 0);
})();
