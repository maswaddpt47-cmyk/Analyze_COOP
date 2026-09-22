# CHANTIERS — Analyze_COOP

État du travail entre deux sessions. Une session ne transmet rien à la suivante :
seul ce qui est commité survit. À relire au démarrage, avec `CLAUDE.md`.

**Référence** : 22/09/2026, `main` à `de559e6`.

**Validé en conditions réelles le 22/09/2026** par l'utilisateur, sur la version
déployée : import de l'export XLSX et carte des communes fonctionnels. Les
points ci-dessous ne sont donc pas seulement vérifiés en test, ils le sont en
production.

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
- **Les librairies restent locales** (`xlsx.full.min.js`, `apexcharts.min.js`,
  `leaflet.js`/`leaflet.css` + `images/`).
  Le passage au CDN rendait l'import impossible dès que le réseau filtrait
  cdnjs — avec un message qui accusait le fichier de l'usager.
- **Les fonds de carte viennent de la Géoplateforme de l'IGN**
  (`data.geopf.fr`), service public gratuit et **sans clé API**, avec repli
  automatique sur OpenStreetMap si une tuile ne répond pas. Ne pas revenir aux
  tuiles CARTO (`basemaps.cartocdn.com`) : leur version raster exige désormais
  une clé et est en cours de retrait (constaté le 22/09/2026). L'IGN ne
  publiant pas de style sombre, le rendu est obtenu par un filtre CSS sur
  `#communeMap .leaflet-tile-pane`, neutralisé en mode clair — ne pas le poser
  sur le conteneur entier, marqueurs et popups y perdraient leurs couleurs.
  L'attribution IGN/OSM est obligatoire, ne pas la masquer.
- **Ne pas nommer une branche de développement en dur dans `CLAUDE.md`.** La
  plateforme en impose une nouvelle à chaque session ; une branche écrite en
  dur devient morte et fait chercher du travail là où il n'y en a plus
  (`claude/stats-optimization-thl4rq`, corrigé le 22/09/2026). Ce qui compte
  est que tout finisse mergé dans `main`, seule source du déploiement.
- **Les messages d'erreur d'import distinguent les causes.** Le message
  générique « format inattendu » a fait chercher pendant un temps un problème
  de fichier alors que la cause était `getValue is not defined`.

---

## Chantiers ouverts, par priorité

### 1. `conum-multi-agents.html` charge aussi ApexCharts en CDN

Même exposition que le dashboard avant correction (`ligne 7`). Non traité
le 22/09/2026 : hors du périmètre demandé, et ce fichier n'est pas le
dashboard principal. À aligner sur la copie locale si ce fichier reste utilisé.

## Décisions à trancher

*(aucune en cours)*
