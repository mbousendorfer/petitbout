# Deploiement VPS Petitbout

Le workflow GitHub Actions de production construit et publie uniquement l'image Docker sur GitHub Container Registry. Il ne copie plus de fichiers sur le VPS et ne redemarre plus le service.

Ce dossier est prevu pour etre copie dans :

```txt
/home/edenpulse/webserver/domains/petitbout.app/
```

Sur le VPS, creer le fichier `.env`, puis renseigner l'image GHCR, les vraies valeurs Supabase et l'email de feedback.

```bash
PETITBOUT_IMAGE=ghcr.io/<owner>/<repo>:latest
PETITBOUT_CONTAINER_NAME=petitbout
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_FEEDBACK_EMAIL=feedback@example.com
VITE_PLAUSIBLE_DOMAIN=
VITE_PLAUSIBLE_SCRIPT_URL=
VITE_PLAUSIBLE_API_URL=
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=change-me
```

Apres publication d'une nouvelle image par GitHub Actions, mettre a jour le service depuis ce dossier :

```bash
docker compose pull
docker compose up -d
```

L'application ecoute en local sur :

```txt
127.0.0.1:1337
```

Le reverse proxy doit pointer vers :

```txt
http://127.0.0.1:1337/
```

## Admin aliments

L'editeur du catalogue est disponible sur :

```txt
https://app.petitbout.app/#/admin
```

Il est actif uniquement si `VITE_ADMIN_USERNAME` et `VITE_ADMIN_PASSWORD` sont renseignes dans le `.env` du service.

Le processus de mise a jour reste volontairement statique :

1. se connecter a `/#/admin` ;
2. modifier les aliments ;
3. exporter `FoodCatalog.csv` ;
4. remplacer `src/data/FoodCatalog.csv` dans le depot ;
5. commit, push, attendre la nouvelle image GHCR ;
6. lancer `docker compose pull` puis `docker compose up -d` sur le VPS.

Ces identifiants sont disponibles dans le bundle navigateur via `/env-config.js`. Pour une protection forte en production, ajouter aussi un controle d'acces au niveau du reverse proxy ou du reseau.

Si le package GitHub Container Registry est prive, se connecter une fois au registry depuis le VPS avant `docker compose pull` :

```bash
docker login ghcr.io
```
