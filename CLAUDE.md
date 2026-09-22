# Instructions permanentes pour Claude Code

## PRIORITÉ ABSOLUE — À faire au début de chaque session

**Avant toute lecture ou modification de fichier, toujours exécuter :**

```bash
git fetch origin && git pull origin main
git log --oneline -5   # voir ce qui a changé depuis la dernière session
```

Ce repo est modifié activement entre les sessions (uploads GitHub directs, autres outils).
Ne jamais travailler sur une version potentiellement périmée — l'oubli est une cause directe d'écrasement de travail.

---

## Règles de collaboration — Côté Claude

**Priorité haute**

1. Ne jamais présenter une explication technique plausible comme un fait : marquer explicitement "hypothèse non vérifiée" dans le code, les commits et les messages, tant qu'aucune preuve (log, capture, test réel) ne la confirme.
2. Ne jamais déclarer "c'est réparé", "c'est en ligne" ou "testé" sans vérification réelle du chemin critique — pas une lecture de code qui "devrait marcher". Dans ce projet : l'app se charge, les graphiques s'affichent.
3. Sur toute demande d'audit ou de correction de bug, livrer un audit systématique (tous les points d'impact) avant la première correction — pas des trouvailles ponctuelles au fil des questions.
4. Signaler explicitement toute déviation d'une spec fournie ou toute décision de design prise seul, au moment où elle est prise — jamais en note après coup.
5. Poser une question de clarification dès qu'une demande est ambiguë ou sous-spécifiée (contenu non précisé, "adapte" vs "applique", référence absente) plutôt que de trancher en silence.
5bis. Utiliser des dates explicites (JJ/MM ou JJ/MM/AAAA) plutôt que des termes relatifs ("hier", "aujourd'hui", "la semaine dernière") — la perception du temps vient d'un contexte injecté en début de session, pas d'une horloge en temps réel, et devient peu fiable sur une session qui s'étale sur plusieurs jours ou plusieurs reprises.
6. Toujours faire `git pull` avant de lire ou modifier le moindre fichier, même si le repo semble à jour. Respecter la politique de push définie ici (travailler sur la branche imposée par la session, puis merger dans `main` ; push direct sur `main` admis pour la doc/config et les correctifs courts déjà validés) et signaler tout conflit avec les instructions de session avant d'agir.
7. Après toute reprise de session ou résumé de contexte, relire l'état réel du fichier concerné avant de le modifier — ne jamais présumer qu'un correctif précédent est encore en place.
8. Avant de pousser un changement visuel (CSS/layout), vérifier mentalement les interactions à risque (stacking context, overflow, position sticky/fixed) sur les zones sensibles existantes.
9. Ne jamais modifier un fichier sans avoir d'abord lu sa version actuelle dans le repo.
10. En cas de conflit de fusion, lire les deux versions avant de choisir — ne jamais utiliser `--strategy-option=ours` sans vérifier ce que chaque côté contient.
11. Ne jamais remplacer une librairie locale (JS, CSS) par un CDN sans autorisation explicite.

**Bonnes pratiques à maintenir**

- Demander l'avis avant toute action à fort impact (déploiement, architecture, migration de données) et exécuter vite dès validation reçue.
- Privilégier la preuve concrète (logs, captures, console) sur la déduction théorique pour tout diagnostic.

---

## Règles de collaboration — Côté utilisateur

**Priorité haute**

1. Donner le contexte temporel et les tentatives déjà faites dès le premier message ("ça marchait hier", "j'ai déjà testé X") plutôt qu'après coup.
1bis. Utiliser des dates explicites (JJ/MM ou JJ/MM/AAAA) plutôt que des termes relatifs ("hier", "la semaine dernière", "demain") — Claude n'a pas d'horloge en temps réel et sa perception du temps devient peu fiable sur une session longue.
2. Pour un bug visuel ou "bizarre", ajouter une description du symptôme précis (ou une capture annotée) plutôt qu'une formule vague.
3. Signaler explicitement en début de message tout changement d'état fait hors session (redéploiement, fichier uploadé, branche renommée, settings modifiés).
4. Pour les demandes ouvertes ("plus", "mieux", "améliore"), préciser le critère de succès attendu.
5. Donner un retour de validation réelle après test terrain, même court ("testé, ça marche" / "ça casse en fait").

**Bonnes pratiques à maintenir**

- Valider court et vite sur le travail bien cadré ("ok", "la totale") — ça marche bien tant que la portée est claire.
- Recadrer immédiatement dès qu'une mauvaise direction est repérée.

---

## Tests unitaires — règle obligatoire

| Fichier source | Fichier de tests | Runner |
|---|---|---|
| `utils.js` — fonctions bas niveau | `utils.test.js` | `node --test utils.test.js` |
| `logic.js` — logique métier | `logic.test.js` | `node --test logic.test.js` |

Ces fichiers sont chargés dans le navigateur ET testés sous Node (aucune dépendance externe).
Une seule source de vérité — ne jamais dupliquer une fonction entre ces fichiers et `dashboard-stats.html`.

Après toute modification de `utils.js` ou `logic.js` :
1. Modifier la fonction
2. Exécuter le runner correspondant
3. Commiter source + tests ensemble si un test a été mis à jour

Règles :
- Bug corrigé → corriger le code, pas le test
- Ne jamais supprimer un test pour faire passer le commit
- La CI bloque le déploiement si un test échoue

---

## État du travail en cours

**`CHANTIERS.md` à la racine** — à lire au démarrage, en même temps que ce
fichier. Il porte les chantiers ouverts, les décisions en attente et les
points à ne pas défaire. Le tenir à jour à chaque avancée, pas en fin de
session.

---

## Contexte du projet

Tableau de bord HTML unique (`dashboard-stats.html`) pour un conseiller en médiation numérique à La Coop.

- **Fichier principal** : `dashboard-stats.html`
- **Fonctions extraites** (chargées avant le script inline) :
  - `utils.js` — fonctions pures bas niveau (norm, parsePct, hexToRgba, growthBadge…)
  - `logic.js` — logique métier (rowsBetween, getValue, mergeArraysSum, sumDatasets…)
- **Librairies locales** (ne pas remplacer par CDN) :
  - `apexcharts.min.js` — ApexCharts (chargé en `<head>`)
  - `xlsx.full.min.js` — SheetJS pour parser les exports XLSX de La Coop
  - `leaflet.js` / `leaflet.css` + `images/` — Leaflet 1.9.4 pour la carte des
    communes. Fonds de carte : Géoplateforme IGN (`data.geopf.fr`), gratuite et
    sans clé, avec repli sur OpenStreetMap — **ne pas revenir à CARTO**
- **Données** : stockées en `localStorage`, clés `coopDashboard_yearData` et
  `coopDashboard_annotations` (constantes `STORAGE_KEY` / `ANNOT_KEY`)
- **Autres fichiers HTML** : `conum-multi-agents.html`, `conum-pptx.html` — ne pas confondre avec le dashboard principal
- **Branche de développement** : celle que la plateforme impose à la session en
  cours. Son nom change à chaque session (`claude/…`), il ne peut donc pas être
  écrit en dur ici — ne pas chercher à réutiliser une branche d'une session
  passée. **Tout doit finir mergé dans `main`** : le déploiement GitHub Pages
  ne part que de là, une branche de session ne déploie rien.

---

## Workflow recommandé

```bash
# Début de session (OBLIGATOIRE)
git fetch origin && git pull origin main
git log --oneline -5

# Développement (code applicatif)
# La branche est celle imposée par la session en cours — ne pas en inventer une.
git checkout -b <branche-de-session>        # si elle n'existe pas déjà
# ... modifications ...
node --test utils.test.js && node --test logic.test.js   # vérifier avant de commiter
git add <fichiers>
git commit -m "description claire"
git push -u origin <branche-de-session>

# OBLIGATOIRE en fin de session — sinon rien n'est déployé
git checkout main && git pull origin main
git merge <branche-de-session> --no-ff
node --test utils.test.js && node --test logic.test.js   # la CI bloque sinon
git push origin main

# Configuration / docs (CLAUDE.md, deploy.yml, etc.)
# → push direct sur main autorisé
```

**Branches obsolètes** : `claude/stats-optimization-thl4rq` date du 14/09/2026.
Son unique commit non mergé (`b7c1557`) est déjà présent dans `main` sous un
autre SHA (`86096b9`) — rien à récupérer, la branche peut être supprimée.
