# Diversibebs

Web app statique de suivi de diversification alimentaire, compatible GitHub Pages.

## Développement

```bash
npm install
npm run dev
```

## Supabase

L'app utilise Supabase comme stockage partagé et garde `localStorage` comme cache local.

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

## Build

```bash
npm run build
```
