# Exercice 2 : Découpler l'authentification de la logique métier

## Objectif

Déplacer la logique d'authentification dans la gateway et transformer le monolithe en "zone de confiance".

La gateway devient le point d'entrée unique qui :
- Vérifie les tokens JWT
- Transmet l'identité de l'utilisateur au monolithe via le header `X-User-ID`

Le monolithe fait confiance à la gateway et :
- Ne vérifie PLUS les tokens JWT
- Lit simplement le header `X-User-ID` pour identifier l'utilisateur
- Effectue les requêtes en base de données pour récupérer les données complètes

```
[Client] → [API Gateway] → [Monolithe (Trusted Zone)]
                ↓
         Authentication
         Token Validation
                ↓
         Forward Header:
         - X-User-ID
```

## Découverte

📣 Examinez le code dans `backend/gateway/src/index.ts`

Points importants :
- Une fonction `getAuthLevel()` classe les routes selon leur besoin d'authentification
- Un middleware d'authentification est partiellement implémenté
- Vous devez compléter la vérification JWT et l'ajout du header `X-User-ID`

📣 Examinez le code dans `backend/monolith/src/middleware/auth.ts`

Points importants :
- Le code actuel vérifie encore les tokens JWT (ancien comportement)
- Vous devez remplacer cette logique par la lecture du header `X-User-ID`
- Les requêtes en base de données doivent être conservées

## Instructions

### 1. Ajouter les dépendances JWT à la gateway

```bash
cd backend/gateway
npm install jsonwebtoken @types/jsonwebtoken
```

📣 Cette dépendance est déjà listée dans `package.json`, l'installation la rendra disponible.

### 2. Compléter le middleware d'authentification dans la gateway

**Fichier:** `backend/gateway/src/index.ts`

👩‍🎓 Suivez les instructions dans le code pour :
- Décoder le token JWT avec `jwt.verify()`
- Ajouter le header `X-User-ID` avec l'ID de l'utilisateur

🤓 Recherchez les commentaires `👩‍🎓 TODO` dans le fichier pour savoir quoi implémenter.

### 3. Modifier le middleware d'authentification dans le monolithe

**Fichier:** `backend/monolith/src/middleware/auth.ts`

👩‍🎓 Suivez les instructions dans le code pour :
- Supprimer l'ancien code de vérification JWT (marqué avec 💣)
- Lire l'ID utilisateur depuis le header `X-User-ID`
- Remplacer `decoded.userId` par votre nouvelle variable `userId`

🤓 Le code à supprimer est clairement marqué avec 💣

### 4. Ajouter JWT_SECRET à la configuration Docker

**Fichier:** `backend/docker-compose.yml`

👩‍🎓 Ajoutez la variable d'environnement `JWT_SECRET` au service `gateway` :

```yaml
gateway:
  environment:
    - JWT_SECRET=workshop_fake_secret_key
```

📣 Cette variable existe déjà pour le service `monolith`, vous devez l'ajouter pour `gateway`.

## Validation

**Redémarrer les services :**

```bash
cd backend
docker compose down
docker compose up --build -d
```

**Vérifier que les services sont healthy :**

```bash
docker compose ps
```

📣 Les services `gateway` et `monolith` doivent être marqués comme `(healthy)`.

**Exécuter les tests :**

```bash
cd gateway
npm test
```

🤓 Tous les tests doivent passer. Si des tests échouent, vérifiez :
- Que vous avez bien ajouté le header `X-User-ID` dans la gateway
- Que vous lisez correctement ce header dans le monolithe
- Que vous avez supprimé tout le code de vérification JWT du monolithe

**Test manuel avec curl :**

```bash
# 1. S'inscrire
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test"}' \
  | jq -r '.token')

# 2. Tester un endpoint protégé (doit fonctionner)
curl -s http://localhost:3000/api/accounts/me \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Tester sans token (doit retourner 401)
curl -s http://localhost:3000/api/accounts/me | jq

# 4. Tester avec un token invalide (doit retourner 401)
curl -s http://localhost:3000/api/accounts/me \
  -H "Authorization: Bearer invalid_token" | jq
```

## Points clés à comprendre

🎯 **Séparation des responsabilités :**
- La gateway vérifie l'identité (JWT)
- Le monolithe gère la logique métier (données utilisateur, abonnements)

🎯 **Zone de confiance :**
- Le monolithe ne doit PAS être exposé publiquement
- Il fait confiance aux headers envoyés par la gateway
- Seule la gateway est accessible depuis Internet

🎯 **Scalabilité :**
- Ce pattern permet de créer d'autres microservices facilement
- Tous les futurs microservices liront le même header `X-User-ID`
- L'authentification reste centralisée dans la gateway

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
