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

- définir les schema prisma dans `./backend/monolith/schema.prisma`
- générer les types prisma `npx prisma generate`
- Vérifier que les types `SubscriptionKind` et `User` sont définis dans `./backend/monolith/src/repositories/UserRepository.ts`
- Compléter le repository (data layer) dans `./backend/monolith/src/repositories/UserRepository.ts`
- Compléter le service (domain layer) dans `./backend/monolith/src/services/AuthService.ts`
- Compléter le handler (presentation layer) dans `./backend/monolith/src/routes/auth.ts`

options:

- Ajouter tes tests unitaires au `AuthService`
