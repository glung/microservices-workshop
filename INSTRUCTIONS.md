# Instructions

- Extraire users, accounts, courses dans des micro-services

Pour chaque service:

- Utiliser le service `__template__` comme modèle
- Definir les modèles (prisma)
- Extraire la service/repo/routes dans le nouveau service. Penser a deplacer les tests
- Configurer docker-compose
- Rediriger le traffic de Gateway vers le nouveau service
- Supprimer du monolith le code qui a été extrait dans un service
