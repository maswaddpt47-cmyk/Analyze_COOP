// logic.js — logique métier (parsing XLSX, agrégation de données)
// Chargé par le navigateur (<script src>) ET par Node.js (require) pour les tests.

const _utils = typeof require !== 'undefined' ? require('./utils.js') : window;
const { norm, parsePct, parseNum } = _utils;

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
    lieux: mergeArraysSum(list.map(d=>d.lieux)).slice(0,10),
    genre: mergeArraysSum(list.map(d=>d.genre)),
    age: mergeArraysSum(list.map(d=>d.age)),
    statut: mergeArraysSum(list.map(d=>d.statut)),
    communes: mergeArraysSum(list.map(d=>d.communes)).slice(0,10)
  };
}

if (typeof module !== 'undefined') {
  module.exports = { rowsBetween, getValue, mergeArraysSum, sumDatasets, SECTION_ORDER, SECTION_ORDER_N };
}
