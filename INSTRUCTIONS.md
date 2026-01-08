# Exercice 1 : Ajouter une GATEWAY devant le service Monolithique

## Objectif

Créer une API Gateway qui agit comme point d'entrée unique pour toutes les requêtes vers notre plateforme. Pour l'instant, la gateway va simplement rediriger (proxy) toutes les requêtes vers le monolithe existant.

- Reçoit toutes les requêtes des clients (Internet)
- Les redirige vers les services appropriés

```
[Client] → [API Gateway] → [Monolithe]
```

## Découverte

📣 Remarquez qu'il y a deux dashboards dans Grafana http://localhost:3001/

📣 Remarquez que le code a maintenant deux services:

- gateway
- monolith

📣 Examiner le code de la Gateway

Points importants:

- le code est incomplet
- les tests "end to end" ont été déplacés dans gateway et testent l'intégration `[API Gateway] → [Monolithe]`

Les tests nécessitent que les services Docker soient démarrés :

**Démarrer les services**

```bash
cd backend
docker-compose up -d
```

**Exécuter les tests**

```bash
cd gateway
npm install
npm test
```

## Instructions

1. Compléter le fichier docker-compose.xml
1. Compléter le code dans backend/gateway/src/index.ts

Valider que les tests passent

### Structure des fichiers d'exercices

Chaque exercice utilise des emojis pour guider les étudiants :

- 👩‍🎓 Instruction spécifique à suivre
- 🤓 Conseil précis ou snippet de code
- 📜 Lien vers la documentation
- 💣 Avertissement de suppression de code

## Deploiement & monitoring

Le service est déployé automatiquement.

Simuler un traffic en production

```bash
cd traffic_simulator
npm run start
```

Monitorer à l'aide de Grafana: http://localhost:3001/
