# Instructions permanentes pour Claude Code

## PRIORITÉ ABSOLUE — À faire au début de chaque session

**Avant toute modification de code, toujours exécuter :**

```bash
git fetch origin && git pull origin main
```

Ce repo est modifié activement entre les sessions (uploads GitHub directs). Ne jamais travailler sur une version potentiellement périmée.

## Règles de comportement

- Ne jamais modifier un fichier sans avoir d'abord lu sa version actuelle dans le repo.
- En cas de conflit de fusion, lire les deux versions avant de choisir — ne jamais
  utiliser `--strategy-option=ours` sans vérifier ce que chaque côté contient.
- Ne jamais remplacer une librairie locale (JS, CSS) par un CDN sans autorisation
  explicite.
- Toujours travailler sur la branche de développement désignée, jamais directement
  sur `main` sauf instruction explicite contraire.
- Avant de déclarer une tâche terminée, vérifier que le fichier modifié correspond
  bien à ce qui était demandé (pas d'écrasement accidentel).

## En cas de doute

Poser la question plutôt qu'agir sur une hypothèse.
Si une version plus récente du fichier existe sur le remote, la récupérer avant
de continuer.

## Contexte du projet

Tableau de bord HTML unique (`dashboard-stats.html`) pour un conseiller en médiation numérique à La Coop.

- **Fichier principal** : `dashboard-stats.html` (toute l'app en un seul fichier)
- **Librairies locales** (ne pas remplacer par CDN) :
  - `chart.umd.min.js` — Chart.js v4 (chargé en `<head>`)
  - `xlsx.full.min.js` — SheetJS pour parser les exports XLSX de La Coop
- **Données** : stockées en `localStorage` (`yearData`, `annotations`)
- **Branche de développement** : `claude/stats-optimization-thl4rq`

## Règles importantes

1. `chart.umd.min.js` doit être chargé **localement** dans le `<head>`, avant tout autre script. Ne jamais le remplacer par un CDN ApexCharts ou autre.
2. Ne jamais utiliser `git merge --strategy-option=ours` sans vérifier ce que chaque side contient.
3. Toujours vérifier `git log --oneline -10` après le pull pour voir ce qui a changé avant de modifier quoi que ce soit.
4. En cas de conflit de fusion, lire les deux versions avant de choisir.

## Workflow recommandé

```bash
# Début de session
git fetch origin
git pull origin main
git log --oneline -5   # vérifier ce qui est arrivé depuis la dernière session

# Développement
git checkout claude/stats-optimization-thl4rq   # ou créer la branche si nécessaire
# ... modifications ...
git add dashboard-stats.html
git commit -m "description claire"
git push -u origin <branche>
```
