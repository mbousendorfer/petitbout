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
http://127.0.0.1:1337/petitbout/
```

Si le package GitHub Container Registry est prive, se connecter une fois au registry depuis le VPS avant `docker compose pull` :

```bash
docker login ghcr.io
```
