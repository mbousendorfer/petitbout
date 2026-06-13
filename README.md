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

Le code famille n'est pas envoyé en clair : l'app envoie uniquement son hash. Toute personne ayant le code famille peut accéder au même suivi.

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
