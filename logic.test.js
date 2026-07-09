const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { rowsBetween, getValue, mergeArraysSum, sumDatasets, SECTION_ORDER_N } = require('./logic.js');

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
