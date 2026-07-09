// utils.js — fonctions pures bas niveau
// Chargé par le navigateur (<script src>) ET par Node.js (require) pour les tests.

function hexToRgba(hex, alpha){
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function norm(s){
  return String(s==null?'':s)
    .replace(/[‘’ʼ]/g, "'")
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function parsePct(v){
  if(v==null) return 0;
  const c = String(v).replace(/ /g,' ').replace('%','').replace(',','.').trim();
  const n = parseFloat(c);
  return isNaN(n) ? 0 : n;
}
function parseNum(v){
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function colorKey(label){
  return norm(label).toLowerCase().replace(/\s/g,'');
}

function monthYear(label){ return '20'+label.split('/')[1]; }

function growthBadge(pct){
  const sign = pct >= 0 ? '+' : '';
  const cls = pct >= 0 ? 'color:var(--green)' : 'color:var(--red)';
  return `<span style="${cls};font-size:12px;font-weight:700;margin-left:6px;">${sign}${pct.toFixed(1)}%</span>`;
}
function rpBar(label, val, pct, color){
  return `<div class="rp-bar-row">
    <div class="rp-bar-top"><span>${label}</span><span>${val} · ${pct}%</span></div>
    <div class="rp-bar-track"><div class="rp-bar-fill" style="width:${pct}%;background:${color||'#3b82f6'}"></div></div>
  </div>`;
}

function rpKpi(label, val, sub, accent){
  return `<div class="rp-kpi-card accent-${accent||'blue'}">
    <div class="rk-label">${label}</div>
    <div class="rk-val">${val}</div>
    ${sub ? `<div class="rk-sub">${sub}</div>` : ''}
  </div>`;
}

function slBar(label, val, pct, color){
  return `<div class="sl-bar-row">
    <div class="sl-bar-top"><span>${label}</span><span>${val} · ${pct}%</span></div>
    <div class="sl-bar-track"><div class="sl-bar-fill" style="width:${Math.min(pct,100)}%;background:${color||'#3b82f6'}"></div></div>
  </div>`;
}

function delta(a, b){
  if(!a || !b) return '';
  const pct = ((b-a)/a*100);
  const sign = pct >= 0 ? '+' : '';
  const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  return `<span class="delta-badge ${cls}">${sign}${pct.toFixed(1)}%</span>`;
}

if (typeof module !== 'undefined') {
  module.exports = { hexToRgba, norm, parsePct, parseNum, colorKey, monthYear, growthBadge, rpBar, rpKpi, slBar, delta };
}
