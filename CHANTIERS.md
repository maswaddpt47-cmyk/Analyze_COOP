# CHANTIERS — Analyze_COOP

État du travail entre deux sessions. Une session ne transmet rien à la suivante :
seul ce qui est commité survit. À relire au démarrage, avec `CLAUDE.md`.

**Référence** : 22/09/2026, sur la branche `claude/quirky-clarke-l9ynxv`.

---

## Points à ne pas défaire

- **`logic.js` ne doit jamais redéclarer les fonctions de `utils.js`.**
  Les deux fichiers partagent le scope global du navigateur : un
  `const { norm } = …` dans `logic.js` entre en collision avec
  `function norm` de `utils.js` et lève une SyntaxError qui empêche
  **tout** `logic.js` de s'exécuter. Les tests Node ne voient rien (chaque
  fichier y a son propre scope de module). Le test
  « chargement navigateur (utils.js + logic.js dans un scope commun) » de
  `logic.test.js` tient cette contrainte — ne pas le supprimer.
- **Le squelette mensuel se dérive des données, il ne se code pas en dur.**
  Il était figé à 30 mois (01/24 → 06/26) : un export allant jusqu'à 09/26
  perdait 3 mois sans aucun signal (mesuré le 22/09/2026 : 660
  accompagnements lus, 591 affichés). `rebuildMonthlyLabels()` étend la
  période au dernier mois réellement importé.
- **`apexMake()` retire le `.empty-placeholder` avant de dessiner.**
  ApexCharts ajoute son canvas à la suite du contenu existant au lieu de le
  remplacer : sans ce retrait, le message « Importe des données… » reste
  visible et le graphique déborde de sa carte. Ne se voyait que sur les
  graphiques rendus une seule fois, les autres étant nettoyés par
  `apexDestroy`.
- **Les librairies restent locales** (`xlsx.full.min.js`, `apexcharts.min.js`).
  Le passage au CDN rendait l'import impossible dès que le réseau filtrait
  cdnjs — avec un message qui accusait le fichier de l'usager.
- **Les messages d'erreur d'import distinguent les causes.** Le message
  générique « format inattendu » a fait chercher pendant un temps un problème
  de fichier alors que la cause était `getValue is not defined`.

---

## Chantiers ouverts, par priorité

### 1. Leaflet est encore en CDN, sans copie locale

`dashboard-stats.html` charge Leaflet 1.9.4 (JS + CSS) depuis `unpkg.com`.
Si unpkg est filtré ou que le poste est hors-ligne, la carte des communes
casse (`L is not defined`) — constaté le 22/09/2026 en test navigateur avec
les CDN bloqués.

Contrairement à ApexCharts et SheetJS, **il n'y a pas de copie locale dans le
dépôt** : il faut télécharger `leaflet.js`, `leaflet.css` et le dossier
`images/` (les icônes de marqueurs sont référencées en relatif depuis le CSS),
puis basculer les deux balises.

À faire quand le réseau le permet. Non bloquant : le reste du dashboard
fonctionne sans Leaflet.

### 2. `conum-multi-agents.html` charge aussi ApexCharts en CDN

Même exposition que le dashboard avant correction (`ligne 7`). Non traité
le 22/09/2026 : hors du périmètre demandé, et ce fichier n'est pas le
dashboard principal. À aligner sur la copie locale si ce fichier reste utilisé.

### 3. Deux écarts entre `CLAUDE.md` et le code réel

À corriger dans `CLAUDE.md` lors d'une prochaine passe documentaire :

- la clé `localStorage` est `coopDashboard_yearData` (et
  `coopDashboard_annotations`), pas `yearData` / `annotations` ;
- la branche de développement annoncée est `claude/stats-optimization-thl4rq`,
  alors que la plateforme impose une branche de session
  (`claude/quirky-clarke-l9ynxv` le 22/09/2026). Dire laquelle fait foi.

---

## Décisions à trancher

*(aucune en cours)*
