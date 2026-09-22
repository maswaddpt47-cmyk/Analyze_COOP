const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { rowsBetween, getValue, mergeArraysSum, sumDatasets, SECTION_ORDER_N,
        isCurrentMonth, monthlySeriesStats, sumYearUpTo, buildMonthlyLabels, topNAvecReste, parseEquipeRows, serieExcelVersDate } = require('./logic.js');

const ROWS_FIXTURE = [
  ['Statistiques générales', null, null],
  ['Accompagnements au total', 527, '100%'],
  ['Nouveaux bénéficiaires', 312, '59,2%'],
  ['Thématiques Médiation numérique', null, null],
  ['Accès internet', 180, '34,2%'],
  ['Messagerie', 95, '18%'],
  ['Statistiques sur vos bénéficiaires', null, null],
  ['Genre', null, null],
  ['Homme', 210, '39,8%'],
  ['Femme', 317, '60,2%'],
];

describe('rowsBetween', () => {
  it("extrait les lignes entre deux en-tetes de section", () => {
    const result = rowsBetween(ROWS_FIXTURE, 'Thématiques Médiation numérique');
    assert.equal(result.length, 2);
    assert.equal(result[0].label, 'Accès internet');
    assert.equal(result[0].val, 180);
    assert.equal(result[1].label, 'Messagerie');
    assert.equal(result[1].val, 95);
  });

  it("retourne [] si en-tete introuvable", () => {
    const result = rowsBetween(ROWS_FIXTURE, 'Section inexistante');
    assert.deepEqual(result, []);
  });

  it("parse les pourcentages correctement", () => {
    const result = rowsBetween(ROWS_FIXTURE, 'Genre');
    assert.equal(result[0].pct, 39.8);
  });

  it("exclut les lignes sans valeur numerique", () => {
    const rows = [
      ['Ma Section', null],
      ['Sous-titre', 'texte non numerique'],
      ['Valeur valide', 42, '10%'],
    ];
    const result = rowsBetween(rows, 'Ma Section');
    assert.equal(result.length, 1);
    assert.equal(result[0].val, 42);
  });
});

describe('getValue', () => {
  it("trouve une valeur par label exact", () => {
    assert.equal(getValue(ROWS_FIXTURE, 'Accompagnements au total'), 527);
  });

  it("normalise le label (insensible aux apostrophes)", () => {
    const rows = [["Nombre d'activités", 15]];
    assert.equal(getValue(rows, "Nombre d'activités"), 15);
  });

  it("label introuvable retourne 0", () => {
    assert.equal(getValue(ROWS_FIXTURE, 'Label inexistant'), 0);
  });

  it("tableau vide retourne 0", () => {
    assert.equal(getValue([], 'Quoi que ce soit'), 0);
  });
});

describe('mergeArraysSum', () => {
  it("additionne les valeurs par label", () => {
    const a = [{ label: 'A', val: 10 }, { label: 'B', val: 5 }];
    const b = [{ label: 'A', val: 15 }, { label: 'C', val: 20 }];
    const result = mergeArraysSum([a, b]);
    const A = result.find(r => r.label === 'A');
    assert.equal(A.val, 25);
  });

  it("recalcule les pourcentages", () => {
    const a = [{ label: 'X', val: 30 }];
    const b = [{ label: 'Y', val: 70 }];
    const result = mergeArraysSum([a, b]);
    const X = result.find(r => r.label === 'X');
    const Y = result.find(r => r.label === 'Y');
    assert.equal(X.pct, 30);
    assert.equal(Y.pct, 70);
  });

  it("trie par valeur decroissante", () => {
    const arr = [{ label: 'Faible', val: 5 }, { label: 'Fort', val: 50 }];
    const result = mergeArraysSum([arr]);
    assert.equal(result[0].label, 'Fort');
  });

  it("tableau vide retourne tableau vide", () => {
    const result = mergeArraysSum([[]]);
    assert.deepEqual(result, []);
  });

  it("pas de division par zero si total = 0", () => {
    const arr = [{ label: 'A', val: 0 }];
    const result = mergeArraysSum([arr]);
    assert.equal(result[0].pct, 0);
  });
});

describe('sumDatasets', () => {
  const ds1 = {
    totals: { accompagnements: 527, beneficiaires: 400, nouveaux: 300, suivis: 100, anonymes: 0, participants: 50, activites: 120, individuelsVal: 450, ateliersVal: 77 },
    benefIds: ['id1', 'id2', 'id3'],
    types: [{ label: 'Accompagnement individuel', val: 450 }],
    themMed: [], themAdmin: [], materiel: [], canaux: [], durees: [], lieux: [], genre: [], age: [], statut: [], communes: [],
    agentName: 'Marie Dupont'
  };
  const ds2 = {
    totals: { accompagnements: 850, beneficiaires: 650, nouveaux: 500, suivis: 150, anonymes: 10, participants: 80, activites: 200, individuelsVal: 720, ateliersVal: 130 },
    benefIds: ['id2', 'id3', 'id4', 'id5'],
    types: [{ label: 'Accompagnement individuel', val: 720 }],
    themMed: [], themAdmin: [], materiel: [], canaux: [], durees: [], lieux: [], genre: [], age: [], statut: [], communes: [],
    agentName: 'Marie Dupont'
  };

  it("additionne les totaux", () => {
    const result = sumDatasets([ds1, ds2]);
    assert.equal(result.totals.accompagnements, 1377);
    assert.equal(result.totals.nouveaux, 800);
  });

  it("dedoublonne les beneficiaires quand les IDs sont disponibles", () => {
    const result = sumDatasets([ds1, ds2]);
    assert.equal(result.totals.beneficiaires, 5);
    assert.equal(result.totals._deduplicated, true);
  });

  it("sans IDs : somme brute des beneficiaires", () => {
    const d1 = { ...ds1, benefIds: [] };
    const d2 = { ...ds2, benefIds: [] };
    const result = sumDatasets([d1, d2]);
    assert.equal(result.totals.beneficiaires, 1050);
    assert.equal(result.totals._deduplicated, undefined);
  });

  it("conserve le nom du premier dataset", () => {
    const result = sumDatasets([ds1, ds2]);
    assert.equal(result.agentName, 'Marie Dupont');
  });
});

describe('SECTION_ORDER_N', () => {
  it("contient des en-tetes normalises", () => {
    assert.ok(SECTION_ORDER_N.some(s => s.includes('Statistiques')));
  });

  it("a 14 entrees", () => {
    assert.equal(SECTION_ORDER_N.length, 14);
  });
});

// Ce test reproduit le chargement NAVIGATEUR : utils.js puis logic.js evalues
// dans un seul et meme scope global, sans `require`. C'est le seul scenario qui
// voit une redeclaration entre les deux fichiers — sous `require`, chacun a son
// propre scope de module et la collision reste invisible.
// Bug du 22/09/2026 : `const { norm } = _utils` dans logic.js entrait en
// collision avec `function norm` de utils.js -> SyntaxError -> logic.js ne
// s'executait pas -> l'import XLSX echouait avec "format inattendu".
describe('chargement navigateur (utils.js + logic.js dans un scope commun)', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');

  function loadInBrowserLikeScope(){
    const sandbox = { window: {}, console };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    for(const f of ['utils.js', 'logic.js']){
      vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8'), sandbox, { filename: f });
    }
    return sandbox;
  }

  it("s'evalue sans SyntaxError de redeclaration", () => {
    assert.doesNotThrow(loadInBrowserLikeScope);
  });

  it("expose les fonctions de logic.js en global", () => {
    const g = loadInBrowserLikeScope();
    for(const fn of ['rowsBetween', 'getValue', 'mergeArraysSum', 'sumDatasets']){
      assert.equal(typeof g[fn], 'function', fn + ' doit etre defini globalement');
    }
  });

  it("logic.js utilise bien les fonctions de utils.js une fois charge ainsi", () => {
    const g = loadInBrowserLikeScope();
    assert.equal(g.getValue([['Accompagnements au total', 660, null]], 'Accompagnements au total'), 660);
  });
});


// Serie reelle de l'export du 22/09/2026 : septembre n'a que 5 accompagnements
// parce que le mois etait en cours au moment de l'export.
const LAB_2026 = ['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26'];
const VAL_2026 = [75, 117, 132, 110, 81, 76, 39, 25, 5];
const LE_22_SEPT = new Date('2026-09-22T12:00:00Z');

describe('isCurrentMonth', () => {
  it("reconnait le mois en cours", () => {
    assert.equal(isCurrentMonth('09/26', LE_22_SEPT), true);
  });
  it("ne confond pas avec un mois passe ni une autre annee", () => {
    assert.equal(isCurrentMonth('08/26', LE_22_SEPT), false);
    assert.equal(isCurrentMonth('09/25', LE_22_SEPT), false);
  });
  it("tolere une etiquette invalide", () => {
    assert.equal(isCurrentMonth('', LE_22_SEPT), false);
    assert.equal(isCurrentMonth(null, LE_22_SEPT), false);
    assert.equal(isCurrentMonth('septembre', LE_22_SEPT), false);
  });
});

describe('monthlySeriesStats', () => {
  const s = monthlySeriesStats(LAB_2026, VAL_2026, '2026', LE_22_SEPT);

  it("garde le mois en cours dans le total affiche", () => {
    assert.equal(s.total, 660);
  });

  it("exclut le mois en cours des mois retenus pour les moyennes", () => {
    assert.equal(s.moisComplets, 8);
    assert.equal(s.totalComplet, 655);
    assert.equal(s.moisEnCoursExclu, true);
    assert.equal(s.dernierMoisComplet, '08/26');
  });

  it("calcule la moyenne sur les seuls mois complets", () => {
    assert.equal(Math.round(s.moyenne * 10) / 10, 81.9);
  });

  // Regression du 22/09/2026 : la projection divisait le total de janvier-juin
  // (591, 6 mois) par le nombre de mois renseignes (9), puis multipliait par 12.
  it("ne melange pas une fenetre de 6 mois avec un diviseur de 9", () => {
    assert.notEqual(s.projection, Math.round(591 / 9 * 12)); // 788, l'ancien resultat
    assert.equal(s.projection, Math.round(655 / 8 * 12));
  });

  it("une fois le mois termine, plus rien n'est exclu", () => {
    const enOctobre = monthlySeriesStats(LAB_2026, VAL_2026, '2026', new Date('2026-10-05T12:00:00Z'));
    assert.equal(enOctobre.moisComplets, 9);
    assert.equal(enOctobre.totalComplet, 660);
    assert.equal(enOctobre.moisEnCoursExclu, false);
  });

  it("ne retient pas les mois a zero", () => {
    const avecZero = monthlySeriesStats(['01/26','02/26'], [100, 0], '2026', LE_22_SEPT);
    assert.equal(avecZero.moisComplets, 1);
    assert.equal(avecZero.moyenne, 100);
  });

  it("ne plante pas sur une serie vide", () => {
    const vide = monthlySeriesStats([], [], '2026', LE_22_SEPT);
    assert.equal(vide.moisComplets, 0);
    assert.equal(vide.moyenne, 0);
    assert.equal(vide.projection, 0);
  });
});

describe('sumYearUpTo', () => {
  it("borne la somme au mois demande", () => {
    assert.equal(sumYearUpTo(LAB_2026, VAL_2026, '2026', 6), 591);
    assert.equal(sumYearUpTo(LAB_2026, VAL_2026, '2026', 8), 655);
    assert.equal(sumYearUpTo(LAB_2026, VAL_2026, '2026', 12), 660);
  });
  it("ignore les autres annees", () => {
    assert.equal(sumYearUpTo(['01/25','01/26'], [50, 75], '2026', 12), 75);
  });
});


describe('buildMonthlyLabels', () => {
  const an = (...mois) => ({ monthly: { labels: mois, values: mois.map(()=>1) } });

  // Regression du 22/09/2026 : le squelette partait de janvier 2024 quoi qu'il
  // arrive. Avec la seule annee 2026 importee, 24 colonnes vides sur 33
  // ecrasaient l'axe du graphique mensuel.
  it("ne produit aucune colonne pour une annee non importee", () => {
    const labels = buildMonthlyLabels({ '2026': an('01/26','02/26','03/26') });
    assert.deepEqual(labels, ['01/26','02/26','03/26']);
    assert.equal(labels.some(l => l.endsWith('/24') || l.endsWith('/25')), false);
  });

  it("garde les mois a zero A L'INTERIEUR d'une annee importee", () => {
    // aout absent de l'export mais encadre par juillet et septembre :
    // « aucune activite en aout » est une information, pas un trou.
    const labels = buildMonthlyLabels({ '2026': an('07/26','09/26') });
    assert.deepEqual(labels, ['07/26','08/26','09/26']);
  });

  it("enchaine plusieurs annees dans l'ordre", () => {
    const labels = buildMonthlyLabels({
      '2026': an('01/26','02/26'),
      '2025': an('11/25','12/25')
    });
    assert.deepEqual(labels, ['11/25','12/25','01/26','02/26']);
  });

  it("ne relie pas deux annees par des mois inexistants", () => {
    const labels = buildMonthlyLabels({ '2024': an('12/24'), '2026': an('01/26') });
    assert.deepEqual(labels, ['12/24','01/26']);
  });

  it("rend une liste vide quand rien n'est importe", () => {
    assert.deepEqual(buildMonthlyLabels({}), []);
    assert.deepEqual(buildMonthlyLabels(null), []);
  });

  it("ignore une annee sans serie mensuelle exploitable", () => {
    assert.deepEqual(buildMonthlyLabels({ '2026': { monthly: { labels: [] } } }), []);
    assert.deepEqual(buildMonthlyLabels({ '2026': {} }), []);
    assert.deepEqual(buildMonthlyLabels({ '2026': an('nimporte quoi') }), []);
  });
});


describe('topNAvecReste', () => {
  const faux = n => Array.from({length:n}, (_,i) => ({ label:'Lieu '+(i+1), val: n-i, pct:0 }));

  // Regression du 22/09/2026 : une quarantaine de lieux rendait le graphique
  // « par lieu » illisible, toutes les etiquettes superposees.
  it("plafonne le nombre de barres", () => {
    const r = topNAvecReste(faux(40), 15, 'Autres lieux');
    assert.equal(r.length, 16); // 15 + la ligne de reste
  });

  it("ne perd aucune valeur dans le regroupement", () => {
    const src = faux(40);
    const total = src.reduce((a,b)=>a+b.val,0);
    const r = topNAvecReste(src, 15, 'Autres lieux');
    assert.equal(r.reduce((a,b)=>a+b.val,0), total);
  });

  it("annonce combien d'entrees sont regroupees", () => {
    const r = topNAvecReste(faux(40), 15, 'Autres lieux');
    assert.equal(r[r.length-1].label, 'Autres lieux (25)');
    assert.equal(r[r.length-1]._reste, true);
  });

  it("ne regroupe rien quand la liste tient deja", () => {
    const r = topNAvecReste(faux(5), 15, 'Autres lieux');
    assert.equal(r.length, 5);
    assert.equal(r.some(x => x._reste), false);
  });

  it("trie par valeur decroissante", () => {
    const r = topNAvecReste([{label:'a',val:1},{label:'b',val:9},{label:'c',val:5}], 15);
    assert.deepEqual(r.map(x=>x.label), ['b','c','a']);
  });

  it("ecarte les valeurs nulles et resiste a une liste vide", () => {
    assert.deepEqual(topNAvecReste([{label:'a',val:0}], 15), []);
    assert.deepEqual(topNAvecReste([], 15), []);
    assert.deepEqual(topNAvecReste(null, 15), []);
  });
});


describe('parseEquipeRows (export « accompagnements » multi-mediateurs)', () => {
  const ENTETE = ['Date','Prénom du médiateur','Nom du médiateur','Type','Participants',
                  'Thématique(s) d’accompagnement','Durée (min)'];
  // 46000 tombe en 2025, 46400 en 2027 — on reste sur une seule annee ici.
  const L = (d,p,n,t,part,them,duree) => [d,p,n,t,part,them,duree];
  const feuille = (...lignes) => [['Informations export'], [], ENTETE, ...lignes];

  it("agrege par mediateur", () => {
    const r = parseEquipeRows(feuille(
      L(46287,'Michel','Aswad','Accompagnement individuel',1,'E-mail',60),
      L(46287,'Michel','Aswad','Accompagnement individuel',1,'E-mail',30),
      L(46287,'Irène','Séverin','Accompagnement individuel',1,'Santé',45)
    ));
    assert.equal(r.agents.length, 2);
    assert.equal(r.agents[0].nom, 'Michel Aswad'); // trie par volume decroissant
    assert.equal(r.lignes, 3);
  });

  // Calibration du 22/09/2026 : un atelier de 7 personnes occupe 7 lignes.
  // Le compter 7 fois gonflerait le nombre d'ateliers d'un facteur 8.
  it("ne compte un atelier qu'une fois, malgre une ligne par participant", () => {
    const lignes = [];
    for(let i=1;i<=7;i++) lignes.push(L(46287,'Michel','Aswad','Atelier collectif',i+'/7','Culture numérique',90));
    const t = parseEquipeRows(feuille(...lignes)).agents[0].data['2026'].totals;
    assert.equal(t.ateliersVal, 1);
    assert.equal(t.participants, 7);
    assert.equal(t.accompagnements, 7);
  });

  it("compte aussi l'atelier a participant unique, sans denominateur", () => {
    const t = parseEquipeRows(feuille(
      L(46287,'Michel','Aswad','Atelier collectif','1','Culture numérique',90)
    )).agents[0].data['2026'].totals;
    assert.equal(t.ateliersVal, 1);
    assert.equal(t.participants, 1);
  });

  it("separe individuels et ateliers", () => {
    const t = parseEquipeRows(feuille(
      L(46287,'M','A','Accompagnement individuel',1,'E-mail',60),
      L(46287,'M','A','Atelier collectif','1/2','E-mail',60),
      L(46287,'M','A','Atelier collectif','2/2','E-mail',60)
    )).agents[0].data['2026'].totals;
    assert.equal(t.individuelsVal, 1);
    assert.equal(t.ateliersVal, 1);
    assert.equal(t.participants, 2);
    assert.equal(t.accompagnements, 3);
  });

  it("eclate les thematiques multiples d'une meme ligne", () => {
    const th = parseEquipeRows(feuille(
      L(46287,'M','A','Accompagnement individuel',1,'E-mail\nNavigation sur internet',60),
      L(46287,'M','A','Accompagnement individuel',1,'E-mail',60)
    )).agents[0].data['2026'].themMed;
    assert.equal(th[0].label, 'E-mail');
    assert.equal(th[0].val, 2);
    assert.equal(th.find(x=>x.label==='Navigation sur internet').val, 1);
  });

  it("cumule les minutes", () => {
    const t = parseEquipeRows(feuille(
      L(46287,'M','A','Accompagnement individuel',1,'E-mail',60),
      L(46287,'M','A','Accompagnement individuel',1,'E-mail',45)
    )).agents[0].data['2026'].totals;
    assert.equal(t.minutes, 105);
  });

  // Ces totaux n'existent pas dans cet export : les deduire du nombre de
  // lignes donnerait un faux nombre de personnes.
  it("laisse a zero les totaux que l'export ne porte pas", () => {
    const t = parseEquipeRows(feuille(
      L(46287,'M','A','Accompagnement individuel',1,'E-mail',60)
    )).agents[0].data['2026'].totals;
    assert.equal(t.beneficiaires, 0);
    assert.equal(t.nouveaux, 0);
    assert.equal(t.suivis, 0);
  });

  it("signale un fichier qui n'est pas cet export", () => {
    assert.equal(parseEquipeRows([['Statistiques générales'],['Accompagnements au total',527]]).erreur,
                 'ENTETE_INTROUVABLE');
  });
});

describe('serieExcelVersDate', () => {
  it("convertit un numero de serie Excel", () => {
    assert.equal(serieExcelVersDate(46287).toISOString().slice(0,10), '2026-09-22');
  });
  it("resiste a une valeur non numerique", () => {
    assert.equal(serieExcelVersDate('bonjour'), null);
  });
});
