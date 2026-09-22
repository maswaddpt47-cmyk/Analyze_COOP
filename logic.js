// logic.js — logique métier (parsing XLSX, agrégation de données)
// Chargé par le navigateur (<script src>) ET par Node.js (require) pour les tests.

// Sous Node, les fonctions bas niveau viennent du module utils.js. Dans le
// navigateur elles sont déjà globales (utils.js est chargé avant ce fichier) :
// ne surtout pas les redéclarer ici. Un `const norm` au scope global alors que
// utils.js y a posé `function norm` lève une SyntaxError qui empêche TOUT ce
// fichier de s'exécuter — les tests Node n'en voient rien, chaque fichier y
// ayant son propre scope de module.
if (typeof require !== 'undefined') {
  var _utils = require('./utils.js');
  var norm = _utils.norm, parsePct = _utils.parsePct, parseNum = _utils.parseNum;
}

const SECTION_ORDER = [
  "Statistiques générales",
  "Statistiques sur vos accompagnements",
  "Thématiques Médiation numérique",
  "Thématiques Démarches administratives",
  "Tags",
  "Matériel utilisés",
  "Canaux des activités",
  "Durées des activités",
  "Nombre d'activités par lieux",
  "Statistiques sur vos bénéficiaires",
  "Genre",
  "Tranches d'âge",
  "Statuts",
  "Commune de résidence des bénéficiaires"
];
const SECTION_ORDER_N = SECTION_ORDER.map(norm);

function rowsBetween(rows, header){
  const h = norm(header);
  const idx = rows.findIndex(r => norm(r[0]) === h);
  if(idx === -1) return [];
  let endIdx = rows.length;
  for(let j=idx+1;j<rows.length;j++){
    const label = norm(rows[j][0]);
    if(SECTION_ORDER_N.includes(label)){ endIdx = j; break; }
  }
  const out = [];
  for(let j=idx+1;j<endIdx;j++){
    const r = rows[j];
    const label = norm(r[0]);
    if(!label) continue;
    if(typeof r[1] !== 'number' && isNaN(parseFloat(r[1]))) continue;
    out.push({ label, val: parseNum(r[1]), pct: parsePct(r[2]) });
  }
  return out;
}

function getValue(rows, label){
  const l = norm(label);
  const r = rows.find(r => norm(r[0]) === l);
  return r ? parseNum(r[1]) : 0;
}

function mergeArraysSum(arrays){
  const map = new Map();
  arrays.forEach(arr=>{
    arr.forEach(item=>{
      const cur = map.get(item.label) || { label:item.label, val:0, color:item.color };
      cur.val += item.val;
      map.set(item.label, cur);
    });
  });
  const merged = [...map.values()];
  const total = merged.reduce((a,b)=>a+b.val,0) || 1;
  merged.forEach(m=> m.pct = Math.round((m.val/total)*1000)/10);
  return merged.sort((a,b)=>b.val-a.val);
}

// Garde les `n` premieres entrees d'un classement et agrege tout le reste
// dans une ligne « Autres (N ...) », pour ne rien perdre du total. Sert aux
// palmares ou le nombre d'entrees n'est pas borne par la source : un agent
// intervenant sur une quarantaine de lieux rendait le graphique illisible,
// etiquettes superposees (constate le 22/09/2026).
// Les pourcentages sont recalcules sur le total d'origine, reste compris.
function topNAvecReste(items, n, nomReste){
  const liste = (items || []).filter(x => x && x.val > 0).sort((a,b) => b.val - a.val);
  if(liste.length <= n) return liste;
  const tete = liste.slice(0, n);
  const reste = liste.slice(n);
  const valReste = reste.reduce((a,b) => a + b.val, 0);
  if(valReste <= 0) return tete;
  const total = liste.reduce((a,b) => a + b.val, 0) || 1;
  const sortie = tete.concat([{
    label: (nomReste || 'Autres') + ' (' + reste.length + ')',
    val: valReste,
    pct: Math.round((valReste / total) * 1000) / 10,
    _reste: true
  }]);
  return sortie;
}

function sumDatasets(list){
  const t = list.reduce((acc, ds)=>{
    Object.keys(ds.totals).forEach(k=>{
      if(k.endsWith('Pct')) return;
      acc[k] = (acc[k]||0) + ds.totals[k];
    });
    return acc;
  }, {});

  // Dédoublonnage bénéficiaires si les IDs sont disponibles dans tous les datasets
  const allHaveIds = list.every(ds => ds.benefIds && ds.benefIds.length > 0);
  if(allHaveIds){
    const mergedIds = new Set(list.flatMap(ds => ds.benefIds));
    t.beneficiaires = mergedIds.size;
    t._deduplicated = true;
  }

  const indivTotal = (t.individuelsVal||0) + (t.ateliersVal||0) || 1;
  t.individuelsPct = Math.round((t.individuelsVal/indivTotal)*1000)/10;
  t.ateliersPct = Math.round((t.ateliersVal/indivTotal)*1000)/10;

  return {
    totals: t,
    agentName: list[0] && list[0].agentName,
    types: mergeArraysSum(list.map(d=>d.types)),
    themMed: mergeArraysSum(list.map(d=>d.themMed)),
    themAdmin: mergeArraysSum(list.map(d=>d.themAdmin)),
    materiel: mergeArraysSum(list.map(d=>d.materiel)),
    canaux: mergeArraysSum(list.map(d=>d.canaux)),
    durees: mergeArraysSum(list.map(d=>d.durees)),
    lieux: mergeArraysSum(list.map(d=>d.lieux)),
    genre: mergeArraysSum(list.map(d=>d.genre)),
    age: mergeArraysSum(list.map(d=>d.age)),
    statut: mergeArraysSum(list.map(d=>d.statut)),
    communes: mergeArraysSum(list.map(d=>d.communes)).slice(0,10)
  };
}

// ===== SERIES MENSUELLES =====
// Le mois en cours est incomplet par construction : l'export s'arrete au jour
// de son edition. L'inclure dans une moyenne ou une projection tire les deux
// vers le bas — mesure du 22/09/2026 : 5 accompagnements au 22 du mois, contre
// une moyenne de 82 sur les mois complets. On l'exclut donc des CALCULS, tout
// en le gardant a l'AFFICHAGE (le total et le graphique le montrent).

function isCurrentMonth(label, now){
  const parts = String(label == null ? '' : label).split('/');
  if(parts.length !== 2) return false;
  const m = parseInt(parts[0], 10), y = 2000 + parseInt(parts[1], 10);
  if(isNaN(m) || isNaN(y)) return false;
  const d = now || new Date();
  return m === (d.getMonth() + 1) && y === d.getFullYear();
}

// Agrege une serie mensuelle sur une annee ('2026') ou sur tout ('all').
// `total` inclut tout ce qui est connu ; `moyenne` et `projection` ne reposent
// que sur les mois complets et non nuls.
function monthlySeriesStats(labels, values, year, now){
  const idx = [];
  for(let i = 0; i < labels.length; i++){
    if(year && year !== 'all'){
      const y = '20' + String(labels[i]).split('/')[1];
      if(y !== year) continue;
    }
    idx.push(i);
  }
  const total = idx.reduce((a,i) => a + (values[i] || 0), 0);
  const enCours = idx.filter(i => isCurrentMonth(labels[i], now));
  const retenus = idx.filter(i => !isCurrentMonth(labels[i], now) && values[i] > 0);
  const totalComplet = retenus.reduce((a,i) => a + (values[i] || 0), 0);
  const moisComplets = retenus.length;
  return {
    total,
    totalComplet,
    moisComplets,
    moyenne: moisComplets ? totalComplet / moisComplets : 0,
    projection: moisComplets ? Math.round((totalComplet / moisComplets) * 12) : 0,
    moisEnCoursExclu: enCours.length > 0,
    dernierMoisComplet: retenus.length ? labels[retenus[retenus.length - 1]] : null
  };
}

// Construit le squelette de mois a partir des seules annees REELLEMENT
// importees. Distinction qui fait toute la difference :
//   - une annee absente de yearData ne produit AUCUNE colonne. Le squelette
//     partait auparavant de janvier 2024 quoi qu'il arrive : avec la seule
//     annee 2026 importee, 24 colonnes vides sur 33 ecrasaient l'axe et le
//     rendaient illisible sur mobile (constate le 22/09/2026) ;
//   - un mois a zero DANS une annee importee reste affiche : « aucune
//     activite en aout » est une information, pas un trou.
function buildMonthlyLabels(yearData){
  const labels = [];
  Object.keys(yearData || {})
    .filter(y => {
      const d = yearData[y];
      return d && d.monthly && Array.isArray(d.monthly.labels) && d.monthly.labels.length;
    })
    .sort()
    .forEach(y => {
      const mois = yearData[y].monthly.labels
        .map(l => parseInt(String(l).split('/')[0], 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= 12);
      if(!mois.length) return;
      const min = Math.min(...mois), max = Math.max(...mois);
      for(let m = min; m <= max; m++){
        labels.push(String(m).padStart(2,'0') + '/' + String(y).slice(2));
      }
    });
  return labels;
}

// Somme d'une annee bornee au mois `maxMois` inclus — sert a comparer deux
// annees sur la MEME fenetre, au lieu d'opposer une annee pleine a un semestre.
function sumYearUpTo(labels, values, year, maxMois){
  let t = 0;
  for(let i = 0; i < labels.length; i++){
    const parts = String(labels[i]).split('/');
    if(parts.length !== 2) continue;
    const m = parseInt(parts[0], 10), y = '20' + parts[1];
    if(y === year && m <= maxMois) t += (values[i] || 0);
  }
  return t;
}

// ===== EXPORT EQUIPE (fichier « accompagnements », une ligne par personne) =====
// Ce format n'a rien a voir avec l'export « statistiques » : il est detaille,
// multi-mediateurs, et UNE LIGNE = UN PARTICIPANT. Un atelier de 7 personnes
// occupe 7 lignes, numerotees « 1/7 » a « 7/7 ».
//
// Comptage des ateliers, calibre le 22/09/2026 sur les totaux publies par
// La Coop : lignes « 1/N » (premier participant de chaque atelier) PLUS les
// ateliers a participant unique, dont la cellule ne porte pas de denominateur.
// 755 + 12 = 767, le chiffre annonce. Verifie aussi agent par agent :
// Michel Aswad ressort a 660 accompagnements, 259 individuels, 42 ateliers,
// 401 participants — identique a son export statistiques.
//
// Champs ABSENTS de cet export, laisses a zero : beneficiaires, nouveaux,
// suivis. Aucun identifiant de beneficiaire n'y figure, ces totaux ne sont
// donc pas calculables — ne pas les inventer a partir du nombre de lignes.

function serieExcelVersDate(n){
  const num = Number(n);
  if(!isFinite(num)) return null;
  const d = new Date(Date.UTC(1899, 11, 30));
  d.setUTCDate(d.getUTCDate() + num);
  return d;
}

function parseEquipeRows(rows){
  const iEntete = rows.findIndex(r => Array.isArray(r) && r.indexOf('Nom du médiateur') !== -1);
  if(iEntete === -1) return { agents: [], erreur: 'ENTETE_INTROUVABLE' };
  const H = rows[iEntete];
  const col = nom => H.indexOf(nom);
  const cDate = col('Date'), cPrenom = col('Prénom du médiateur'), cNom = col('Nom du médiateur');
  const cType = col('Type'), cPart = col('Participants'), cThem = col('Thématique(s) d’accompagnement');
  const cDuree = col('Durée (min)');
  if(cPrenom === -1 || cNom === -1 || cType === -1) return { agents: [], erreur: 'COLONNES_MANQUANTES' };

  const parAgent = new Map();
  let lignes = 0;

  for(let i = iEntete + 1; i < rows.length; i++){
    const r = rows[i];
    if(!r || r[cDate] == null) continue;
    lignes++;
    const nom = String((r[cPrenom] || '') + ' ' + (r[cNom] || '')).trim() || 'Sans nom';
    const d = serieExcelVersDate(r[cDate]);
    const annee = d ? String(d.getUTCFullYear()) : 'inconnue';

    if(!parAgent.has(nom)) parAgent.set(nom, new Map());
    const annees = parAgent.get(nom);
    if(!annees.has(annee)){
      annees.set(annee, {
        totals: { accompagnements:0, individuelsVal:0, ateliersVal:0, participants:0,
                  beneficiaires:0, nouveaux:0, suivis:0, minutes:0 },
        them: new Map()
      });
    }
    const a = annees.get(annee);
    a.totals.accompagnements++;

    const part = String(r[cPart] == null ? '' : r[cPart]).trim();
    if(r[cType] === 'Atelier collectif'){
      a.totals.participants++;
      // Un atelier compte une fois : a son premier participant, ou lorsqu'il
      // n'en a qu'un seul (cellule sans denominateur).
      if(/^1\s*\//.test(part) || !part.includes('/')) a.totals.ateliersVal++;
    } else {
      a.totals.individuelsVal++;
    }

    const min = Number(r[cDuree]);
    if(isFinite(min) && min > 0) a.totals.minutes += min;

    if(cThem !== -1 && r[cThem]){
      String(r[cThem]).split(/\r?\n/).forEach(t => {
        const lib = norm(t);
        if(!lib) return;
        a.them.set(lib, (a.them.get(lib) || 0) + 1);
      });
    }
  }

  const agents = [...parAgent.entries()].map(([nom, annees]) => {
    const data = {};
    annees.forEach((a, annee) => {
      const arr = [...a.them.entries()].map(([label, val]) => ({ label, val }));
      const tot = arr.reduce((x,y) => x + y.val, 0) || 1;
      arr.forEach(x => x.pct = Math.round((x.val / tot) * 1000) / 10);
      arr.sort((x,y) => y.val - x.val);
      data[annee] = { totals: a.totals, themMed: arr, themAdmin: [] };
    });
    return { nom, data };
  }).sort((a,b) => {
    const s = o => Object.values(o.data).reduce((x,y) => x + y.totals.accompagnements, 0);
    return s(b) - s(a);
  });

  return { agents, lignes };
}

if (typeof module !== 'undefined') {
  module.exports = { rowsBetween, getValue, mergeArraysSum, sumDatasets, SECTION_ORDER, SECTION_ORDER_N,
                    isCurrentMonth, monthlySeriesStats, sumYearUpTo, buildMonthlyLabels, topNAvecReste,
                    parseEquipeRows, serieExcelVersDate };
}
