# Rebrand Diversibebs

## Audit UI/UX initial

- Architecture : app React/Vite mobile-first avec routes Accueil, Aliments, Journal, Decouvertes et Reglages. Le parcours est clair et les fonctionnalites sont deja bien separees.
- Navigation : bottom nav adaptee au mobile, mais le shell manque d'identite et de repere affectif. Les libelles sont comprehensibles, les cibles tactiles sont globalement suffisantes.
- Hierarchie visuelle : les titres et cartes sont lisibles, mais beaucoup d'ecrans utilisent les memes surfaces et la meme densite. Les actions principales pourraient ressortir davantage.
- Composants : base shadcn/ui coherente. Les cartes, badges, boutons, filtres et drawers sont reutilises, mais les variantes visuelles restent proches d'un tableau de bord generique.
- Responsive : priorite mobile correcte avec max-width central. Desktop volontairement contenu, compatible avec une app compagnon.
- Etats vides : presents, mais peu incarnes. Ils doivent rassurer et proposer une action claire.
- Formulaires : labels visibles, bons types d'input, drawer de test efficace. Le bloc reaction est absent du drawer de saisie rapide ; la fonctionnalite existante conserve donc la reaction par defaut.
- Listes et filtres : recherche et filtres pertinents. Les chips rapides meritent des styles plus tactiles et plus differencies.
- Progression/gamification : ton doux deja present. Les cartes peuvent mieux rejoindre l'identite "carnet de decouvertes" sans competition.
- Couleurs : palette creme/sauge deja amorcee. Manque de tokens semantiques pour les statuts alimentaire et reactions.
- Accessibilite : focus states et reduced motion presents. A renforcer : contrastes des badges pastel, labels aria sur boutons icon-only, et ne pas s'appuyer uniquement sur la couleur.

## Direction artistique

Identite : "Carnet de decouverte alimentaire doux, moderne et joyeux pour bebe".

- Ambiance : creme chaud, peche, sauge, abricot, myrtille douce.
- Style : shadcn/ui arrondi et premium, surfaces papier, contours subtils, ombres moelleuses mais sobres.
- Interaction : micro-feedback sur press/hover, animations courtes et respect de `prefers-reduced-motion`.
- Iconographie : lucide pour les actions et pictogrammes de categories afin d'eviter un rendu emoji/kitsch.
- Typographie : system rounded, lisible, titres denses mais doux, textes courts.
- UX parent-friendly : prochaines actions visibles, microcopy rassurante, pas de jargon medical, rappel explicite que l'app ne remplace pas un avis medical.

## Tokens proposes

- `background` : creme lumineux.
- `card` / `popover` : papier chaud.
- `primary` : sauge profonde.
- `secondary` : peche lactee.
- `accent` : myrtille douce.
- `muted` : avoine.
- Etats :
  - teste : sauge positive.
  - a tester : surface creme bordee.
  - reaction : abricot/rouge doux mais contraste.
  - saison : vert feuille.
  - attention : ambre.
- Rayons : 12px pour les composants, cartes plus douces via classes utilitaires.
- Ombres : une ombre douce de carte, une ombre de navigation inferieure.

## Garde-fous

- Ne pas modifier le modele de donnees ni les cles de persistence.
- Ne pas supprimer les routes ni les fonctionnalites existantes.
- Garder l'app compatible GitHub Pages/Vite/PWA.
- Pas de nouvelle dependance lourde.
- Verifier `npm install`, `npm run build`; `npm run lint` n'existe pas dans ce projet.
