# Structure des fichiers d'exercices

Chaque exercice utilise des emojis pour guider les étudiants :

- 👩‍🎓 Instruction spécifique à suivre
- 🤓 Conseil précis ou snippet de code
- 📜 Lien vers la documentation
- 💣 Avertissement de suppression de code

# Deploiement & monitoring

```bash
cd backend
docker compose up --build
```

Simuler un traffic en production

```bash
cd traffic_simulator
npm run start
```

Monitorer à l'aide de Grafana: http://localhost:3001/

# Instructions

## Etapes

- définir les schema prisma dans `./backend/monolith/schema.prisma`
- générer les types prisma `npx prisma generate`
- Vérifier que les types `SubscriptionKind` et `User` sont définis dans `./backend/monolith/src/repositories/UserRepository.ts`
- Compléter le repository (data layer) dans `./backend/monolith/src/repositories/UserRepository.ts`
- Compléter le service (domain layer) dans `./backend/monolith/src/services/AuthService.ts`
- Compléter le handler (presentation layer) dans `./backend/monolith/src/routes/auth.ts`

## Validation

- commiter les changements
- npm run test
- envoyer du traffic et monitorer (cf Deploiement & monitoring)

## Etapes optionnelles

- Ajouter tes tests unitaires au `AuthService`
  - fichier: `./backend/monolith/src/__tests__/unit/services/AuthService.unit.test.ts`
  - commiter

- Migrer le auth middleware vers `AuthService` et ajuster les tests unitaires
  - fichier: `./backend/monolith/src/middleware/auth.ts`
  - commiter

- Isolser le user & auth service et repository un contexte dédié
  - créer `./backend/monolith/src/auth` et déplacer les fichers associés (creer la meme arborescence pour les tests)
  - créer `./backend/monolith/src/users` et déplacer les fichers associés (creer la meme arborescence pour les tests)
  - commiter

- Créer `./backend/monolith/src/accounts` et y ajouter les couches domaine et data (repo + ORM)
  - `./backend/monolith/src/routes/accounts.ts` doit appeler la couche domaine
  - ajouter des tests unitaires s'il y a de la logique métier à tester

- Créer `./backend/monolith/src/courses` et y ajouter les couches domaine et data (repo + ORM)
  - `./backend/monolith/src/routes/courses.ts` doit appeler la couche domaine
  - ajouter des tests unitaires s'il y a de la logique métier à tester
