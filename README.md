# Petitbout

Web app mobile-first de suivi de diversification alimentaire pour bébé.

L’app est une PWA installable, compatible GitHub Pages, utilisable hors ligne après une première visite, avec cache local `localStorage`, export/import JSON et synchronisation Supabase déjà prévue par le projet.

## Développement

```bash
npm install
npm run dev
```

## Build et preview

```bash
npm run build
npm run preview
```

Le build génère aussi le service worker PWA via `vite-plugin-pwa`.

## GitHub Pages

Le repo est prévu pour être servi depuis :

```txt
https://<user>.github.io/petitbout/
```

La configuration importante est dans `vite.config.ts` :

```ts
base: "/petitbout/"
```

Si le dépôt change de nom, adaptez `base` au nouveau sous-chemin, par exemple `"/mon-repo/"`.

Le manifest utilise des chemins relatifs (`start_url: "."`, `scope: "."`) pour rester compatible avec ce sous-chemin. Le service worker utilise le fallback SPA `/petitbout/index.html`.

## PWA

Fichiers PWA principaux :

- `public/manifest.webmanifest`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/icon-maskable-192.png`
- `public/icon-maskable-512.png`
- `public/apple-touch-icon.png`
- `public/favicon.svg`

Installation :

- Android / Chrome : le navigateur peut proposer l’installation, et l’app affiche une invitation discrète si l’événement est disponible.
- iOS / iPadOS : ouvrir Safari, bouton Partager, puis “Ajouter à l’écran d’accueil”.
- Après une première visite en ligne, l’app peut se relancer hors ligne avec les assets en cache et les dernières données locales.

## Données et sauvegardes

Les données sont conservées localement dans `localStorage` et peuvent être exportées depuis `Réglages > Sauvegarde locale`.

L’export produit un fichier JSON versionné. L’import demande confirmation avant de remplacer les données locales de l’appareil.

## Supabase

L'app utilise Supabase comme stockage partagé quand il est configuré et garde `localStorage` comme cache local.

1. Créer un projet Supabase.
2. Exécuter le SQL dans `supabase/schema.sql` depuis l'éditeur SQL Supabase.
   Réexécuter ce fichier après chaque mise à jour du schéma : il utilise des `if not exists`
   et conserve les données existantes.
3. Créer `.env.local` à partir de `.env.example`.
4. Renseigner :

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

5. Redémarrer `npm run dev`.

Le code famille n'est pas envoyé en clair : l'app envoie uniquement son hash SHA-256. Ce code reste toutefois un secret partagé : toute personne qui le connaît peut accéder au même suivi. Utilisez un code long, non devinable, et ne le partagez qu’avec les personnes qui doivent gérer le carnet.

Le schéma Supabase garde les tables derrière RLS sans policy publique et expose uniquement des fonctions RPC limitées. Ces RPC valident les hashes famille, réactions, dates et tailles de champs avant écriture.

## Checklist de validation

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- Chrome desktop : ouvrir l’app, vérifier manifest et service worker dans DevTools.
- Android Chrome : installer l’app, lancer en standalone, couper le réseau après une première visite.
- iOS Safari : “Ajouter à l’écran d’accueil”, lancer en standalone, vérifier les safe areas.
- Vérifier que les données restent après reload.
- Vérifier que les données restent après une mise à jour.
- Exporter un JSON depuis Réglages.
- Importer ce JSON sur un autre navigateur/appareil et confirmer que les données apparaissent.
- Tester une première visite en ligne, puis un relancement hors ligne.

## Déploiement Docker sur VPS

L'app peut aussi être déployée comme image Docker. L'image construit l'app Vite, puis la sert avec Nginx sous le chemin `/petitbout/`, cohérent avec `base: "/petitbout/"` dans `vite.config.ts`.

Avec Docker Compose en local, créer un fichier `.env.docker` à partir de `.env.docker.example`, puis lancer :

```bash
docker compose --env-file .env.docker up --build
```

Variables disponibles :

- `PETITBOUT_IMAGE` : nom de l'image locale, par défaut `petitbout:local`
- `PETITBOUT_CONTAINER_NAME` : nom du conteneur, par défaut `petitbout`
- `PETITBOUT_HOST` : adresse d'écoute côté machine hôte, par défaut `127.0.0.1`
- `PETITBOUT_PORT` : port exposé côté machine hôte, par défaut `8080`
- `VITE_SUPABASE_URL` : URL publique du projet Supabase, lue au démarrage du conteneur
- `VITE_SUPABASE_ANON_KEY` : clé publique `anon` Supabase, lue au démarrage du conteneur

Les variables `VITE_SUPABASE_*` ne sont pas figées dans l'image Docker. Au démarrage, le conteneur génère `/petitbout/env-config.js` depuis l'environnement Docker, ce qui permet de réutiliser la même image avec plusieurs projets Supabase.

Build local :

```bash
docker build \
  -t petitbout .
```

Test local :

```bash
docker run --rm -p 8080:80 petitbout
```

Puis ouvrir :

```txt
http://localhost:8080/petitbout/
```

Sur le VPS, `compose.prod.yml` utilise une image déjà construite et attend au minimum `PETITBOUT_IMAGE` dans le fichier `.env` du dossier de déploiement :

```bash
PETITBOUT_IMAGE=ghcr.io/<owner>/<repo>:latest
PETITBOUT_HOST=127.0.0.1
PETITBOUT_PORT=8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Puis :

```bash
docker compose -f compose.prod.yml up -d
```

Par défaut, le conteneur est exposé localement sur `127.0.0.1:8080`. Exemple de reverse proxy Nginx côté VPS :

```nginx
server {
  server_name ton-domaine.com;

  location = / {
    return 302 /petitbout/;
  }

  location /petitbout/ {
    proxy_pass http://127.0.0.1:8080/petitbout/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Le workflow GitHub Actions construit et publie l'image sur GitHub Container Registry, puis redémarre le service sur le VPS. Secrets GitHub requis :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`

Si le package GHCR est privé, ajouter aussi :

- `GHCR_USER`
- `GHCR_PAT`
