const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { hexToRgba, norm, parsePct, parseNum, colorKey, monthYear, growthBadge, rpBar, rpKpi, slBar, delta } = require('./utils.js');

describe('hexToRgba', () => {
  it('convertit un hex 6 chiffres en rgba', () => {
    assert.equal(hexToRgba('#3b82f6', 0.5), 'rgba(59,130,246,0.5)');
  });
  it('fonctionne sans dièse', () => {
    assert.equal(hexToRgba('ffffff', 1), 'rgba(255,255,255,1)');
  });
  it('alpha 0', () => {
    assert.equal(hexToRgba('#000000', 0), 'rgba(0,0,0,0)');
  });
});

describe('norm', () => {
  it('cas nominal : trim et espaces multiples', () => {
    assert.equal(norm('  hello   world  '), 'hello world');
  });
  it('null → chaîne vide', () => {
    assert.equal(norm(null), '');
  });
  it('undefined → chaîne vide', () => {
    assert.equal(norm(undefined), '');
  });
  it('remplace l’apostrophe courbe par apostrophe droite', () => {
    assert.equal(norm('Nombre d’activités'), "Nombre d'activités");
  });
  it('remplace l espace insécable par espace normale', () => {
    assert.equal(norm('a b'), 'a b');
  });
  it('nombre converti en chaîne', () => {
    assert.equal(norm(42), '42');
  });
});

describe('parsePct', () => {
  it('parse un pourcentage avec virgule', () => {
    assert.equal(parsePct('12,5%'), 12.5);
  });
  it('parse un pourcentage avec point', () => {
    assert.equal(parsePct('8.3%'), 8.3);
  });
  it('null → 0', () => {
    assert.equal(parsePct(null), 0);
  });
  it('chaîne vide → 0', () => {
    assert.equal(parsePct(''), 0);
  });
  it('valeur numérique directe', () => {
    assert.equal(parsePct(75), 75);
  });
  it('texte non numérique → 0', () => {
    assert.equal(parsePct('abc'), 0);
  });
});

describe('parseNum', () => {
  it('parse un entier', () => {
    assert.equal(parseNum('42'), 42);
  });
  it('parse un flottant', () => {
    assert.equal(parseNum(3.14), 3.14);
  });
  it('null → 0', () => {
    assert.equal(parseNum(null), 0);
  });
  it('chaîne vide → 0', () => {
    assert.equal(parseNum(''), 0);
  });
  it('undefined → 0', () => {
    assert.equal(parseNum(undefined), 0);
  });
  it('0 est valide (pas de faux positif)', () => {
    assert.equal(parseNum(0), 0);
  });
});

describe('colorKey', () => {
  it('minuscule et supprime les espaces', () => {
    assert.equal(colorKey('Mon Label'), 'monlabel');
  });
  it('normalise les apostrophes courbes', () => {
    assert.equal(colorKey('Accès internet'), 'accèsinternet');
  });
  it('chaîne vide → chaîne vide', () => {
    assert.equal(colorKey(''), '');
  });
});

describe('monthYear', () => {
  it('extrait l’année depuis un label MM/YY', () => {
    assert.equal(monthYear('01/24'), '2024');
    assert.equal(monthYear('12/25'), '2025');
    assert.equal(monthYear('06/26'), '2026');
  });
});

describe('growthBadge', () => {
  it('affiche + pour une valeur positive', () => {
    const html = growthBadge(12.5);
    assert.ok(html.includes('+12.5%'));
    assert.ok(html.includes('var(--green)'));
  });
  it('affiche - pour une valeur négative', () => {
    const html = growthBadge(-5.3);
    assert.ok(html.includes('-5.3%'));
    assert.ok(html.includes('var(--red)'));
  });
  it('zéro → positif', () => {
    const html = growthBadge(0);
    assert.ok(html.includes('+0.0%'));
    assert.ok(html.includes('var(--green)'));
  });
});

describe('rpBar', () => {
  it('contient le label et la valeur', () => {
    const html = rpBar('Thème A', 42, 35, '#3b82f6');
    assert.ok(html.includes('Thème A'));
    assert.ok(html.includes('42'));
    assert.ok(html.includes('35%'));
    assert.ok(html.includes('#3b82f6'));
  });
  it('couleur par défaut si non fournie', () => {
    const html = rpBar('Label', 10, 50, null);
    assert.ok(html.includes('#3b82f6'));
  });
});

describe('slBar', () => {
  it('limite le pourcentage à 100', () => {
    const html = slBar('Test', 5, 120, '#fff');
    assert.ok(html.includes('width:100%'));
  });
  it('pourcentage normal', () => {
    const html = slBar('Test', 5, 60, '#fff');
    assert.ok(html.includes('width:60%'));
  });
});

describe('delta', () => {
  it('calcule un delta positif', () => {
    const html = delta(100, 150);
    assert.ok(html.includes('+50.0%'));
    assert.ok(html.includes('up'));
  });
  it('calcule un delta négatif', () => {
    const html = delta(200, 100);
    assert.ok(html.includes('-50.0%'));
    assert.ok(html.includes('down'));
  });
  it('a = 0 → chaîne vide', () => {
    assert.equal(delta(0, 100), '');
  });
  it('b = 0 → chaîne vide', () => {
    assert.equal(delta(100, 0), '');
  });
  it('valeurs nulles → chaîne vide', () => {
    assert.equal(delta(null, null), '');
  });
});
