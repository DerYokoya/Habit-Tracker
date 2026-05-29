**Français** | [English](./README.md)

# Habit Tracker

Une extension Chrome permettant de créer et de suivre des habitudes quotidiennes grâce à des séries de jours consécutifs, au réordonnancement par glisser-déposer, à des vues quotidiennes/hebdomadaires/mensuelles et à des statistiques par habitude. Développée avec React + TypeScript et distribuée sous forme d'extension Chrome Manifest V3.

---

## Captures d'écran

<div align="center">
  <table>
    <tr>
      <td align="center" valign="top">
        <img width="350" alt="Vue du jour" src="https://github.com/user-attachments/assets/fd149f2b-0cbb-49cc-9fe7-b4701e879f08" /><br />
        <sub><b>Vue du jour</b></sub>
      </td>
      <td align="center" valign="top">
        <img width="350" alt="Statistiques" src="https://github.com/user-attachments/assets/fe3369ef-adce-4b3a-9aed-e177bf730adb" /><br />
        <sub><b>Statistiques</b></sub>
      </td>
    </tr>
    <tr>
      <td align="center" valign="top">
        <img width="350" alt="Vue hebdomadaire" src="https://github.com/user-attachments/assets/f35b00a1-bc2a-49b9-9afa-e6de5709191f" /><br />
        <sub><b>Vue hebdomadaire</b></sub>
      </td>
      <td align="center" valign="top">
        <img width="350" alt="Vue mensuelle" src="https://github.com/user-attachments/assets/75e1684e-8a8d-44c8-b610-0c369cd4cec8" /><br />
        <sub><b>Vue mensuelle</b></sub>
      </td>
    </tr>
    <tr>
      <td align="center" valign="top">
        <img width="350" alt="Notifications" src="https://github.com/user-attachments/assets/898f5ccf-cf12-4a19-94c5-caa4bdf66f2d" /><br />
        <sub><b>Notifications</b></sub>
      </td>
      <td align="center" valign="top">
        <img width="350" alt="Tests" src="https://github.com/user-attachments/assets/feeaffed-1281-45d7-bcbd-642c729793bf" /><br />
        <sub><b>Tests</b></sub>
      </td>
    </tr>
  </table>
</div>

---

## Présentation

Une extension de navigateur qui s'intègre à la barre d'outils de Chrome, permettant de suivre ses habitudes en un seul clic. Elle stocke toutes les données localement à l'aide de l'API Chrome Storage afin que les progrès restent privés et soient conservés d'une session à l'autre.

L'objectif était de créer un outil de productivité véritablement utile tout en explorant comment une application moderne React + TypeScript peut être packagée et déployée en tant qu'extension Chrome.

---

## Problème résolu

La plupart des applications de suivi des habitudes obligent les utilisateurs à sortir leur téléphone, ouvrir une application, se connecter et accéder à la vue du jour. Le temps qu'ils y parviennent, le moment est déjà passé. L'habitude n'est pas enregistrée. Cet outil de suivi des habitudes réside dans la barre d'outils du navigateur de l'utilisateur : un clic suffit, sans aucune friction. Comme la plupart des gens passent la majeure partie de leur journée sur leur navigateur, le fait de garder l'outil de suivi à cet endroit signifie qu'il est toujours visible et accessible. Pas de compte, pas d'abonnement, pas d'application à télécharger. Les données restent sur l'appareil.

Le deuxième problème concerne la responsabilisation au fil du temps. Cocher une case est satisfaisant ; voir une série s'allonger est motivant. Les séries et les progrès sont visibles à tous les niveaux, avec des enregistrements quotidiens, des tendances hebdomadaires et un historique mensuel.

---

## Fonctionnalités

### Gestion des habitudes
- Ajoutez et supprimez des habitudes grâce à une interface modale épurée
- Réorganisez par glisser-déposer via `@hello-pangea/dnd`
- Lignes d'habitudes codées par couleur pour une identification visuelle rapide

### Vues
- **Quotidien** — Concentrez-vous sur les habitudes du jour grâce à un bouton bascule à une seule colonne
- **Hebdomadaire** — Visualisez la semaine entière d'un seul coup d'œil grâce aux étiquettes de jour
- **Mensuel** — Grille de type calendrier affichant le mois entier

### Séries et statistiques
- Affichage en temps réel de la série actuelle par habitude avec un badge 🔥
- Fenêtre modale de statistiques par habitude affichant :
  - La série actuelle
  - La plus longue série
  - Le nombre total d'accomplissements
  - Un graphique à barres sur 30 jours alimenté par Recharts
- Résumé en en-tête affichant les habitudes actives, le nombre total de check-ins et la série totale pour toutes les habitudes

### Données et persistance
- Toutes les données sont stockées localement avec l'API Chrome Storage (`chrome.storage.local`)
- Recourt à `localStorage` pour le développement local
- Aucun compte requis, aucune donnée ne quitte votre navigateur

---

## Pile technologique

| Couche | Technologie |
|---|---|
| **Framework UI** | React 18 |
| **Langage** | TypeScript 5 |
| **Plateforme d'extension** | Chrome Manifest V3 |
| **Glisser-déposer** | @hello-pangea/dnd |
| **Graphiques** | Recharts |
| **Logique de date** | date-fns |
| **Icônes** | lucide-react |
| **Outil de build** | Vite |
| **Tests** | Vitest + Testing Library |

---

## Architecture

L'application est une application React + TypeScript à page unique, packagée par Vite et chargée sous forme de fenêtre contextuelle d'extension Chrome.

```
[Clic sur la barre d'outils Chrome]
        ↓
[fenêtre contextuelle (build/index.html)]
        ↓
[Application React (App.tsx)]
        ↓
    ├─→ useChromeStorage  — chargement/enregistrement des habitudes via chrome.storage.local
    ├─→ useStreakCalculator — série actuelle et plus longue par habitude
    ├─→ État des habitudes (ajouter / supprimer / réorganiser)
    ├─→ Boutons d'achèvement par habitude et par jour
    └─→ Navigation dans les vues (quotidienne / hebdomadaire / mensuelle)
        ↓
[chrome.storage.local]
```

---

## Installation

### À partir du code source

**Prérequis :** Node.js 18 ou version ultérieure, npm, Google Chrome

```bash
# Cloner le dépôt
git clone https://github.com/YOUR_USERNAME/habit-tracker.git
cd habit-tracker

# Installer les dépendances
npm install

# Compiler l'extension
npm run build
```

Chargez-la ensuite dans Chrome :

1. Rendez-vous sur `chrome://extensions`
2. Activez le **mode développeur** (bouton en haut à droite)
3. Cliquez sur **Charger sans emballage**
4. Sélectionnez le dossier `build/`

L'extension apparaîtra dans votre barre d'outils. Épinglez-la pour y accéder rapidement.

---

## Développement

Pour exécuter l'application dans un onglet de navigateur standard pendant le développement :

```bash
npm run dev
```

> Remarque : `chrome.storage` n'est pas disponible en dehors du contexte de l'extension. L'application utilise automatiquement `localStorage` lorsqu'elle s'exécute dans le navigateur.

---

## Tests

Le projet utilise [Vitest](https://vitest.dev/) avec [Testing Library](https://testing-library.com/) et jsdom. Tous les tests s'exécutent sur la logique d'utilitaire réelle et le composant `HabitRow`.

```bash
# Exécuter tous les tests une fois
npm run test:run

# Mode surveillance (réexécution en cas de modification des fichiers)
npm test

# Générer un rapport de couverture
npm run test:coverage
```

### Couverture des tests

| Fichier | Ce qui est testé |
|---|---|
| `streakUtils.test.ts` | `calculateCurrentStreak`, `calculateLongestStreak` — interruptions, jours consécutifs, dates non triées |
| `dateUtils.test.ts` | `getDateKey`, `getDaysForView`, `navigateDate`, `getViewTitle` sur les trois vues |
| `useStreakCalculator.test.ts` | Sortie du hook — état zéro, séries consécutives, interruptions, série la plus longue parmi plusieurs séries |
| `HabitRow.test.tsx` | Affiche le nom et le badge de série, déclenche `onShowStats`, affiche une confirmation de suppression avant d'appeler `onDelete` |

L'API Chrome (`chrome.storage`, `chrome.alarms`, `chrome.notifications`, `chrome.runtime`) et `window.matchMedia` sont simulées dans `src/test/setup.ts` afin que les tests s'exécutent sans contexte d'extension de navigateur.

---

## Structure du projet

```
habit-tracker/
├── public/
│   ├── index.html
│   ├── manifest.json           # Manifeste de l'extension Chrome (MV3)
│   ├── logo16.png
│   ├── logo48.png
│   └── logo192.png
├── src/
│   ├── components/
│   │   ├── HabitRow.tsx        # Ligne par habitude avec des cellules quotidiennes/hebdomadaires/mensuelles
│   │   ├── HabitCard.tsx       # Carte d'habitude déplaçable
│   │   ├── HabitList.tsx       # Container de liste par glisser-déposer
│   │   ├── Header.tsx          # Barre supérieure avec statistiques récapitulatives
│   │   ├── StatsModal.tsx      # Statistiques par habitude et graphique sur 30 jours
│   │   └── ViewSwitcher.tsx    # Commandes d'onglets quotidien / hebdomadaire / mensuel
│   ├── hooks/
│   │   ├── useChromeStorage.ts # Lecture/écriture dans le stockage Chrome avec repli sur localStorage
│   │   ├── useHabits.ts        # Logique CRUD et de réorganisation des habitudes
│   │   ├── useStorage.ts       # Hook de stockage générique
│   │   └── useStreakCalculator.ts # Calcul de la série actuelle et de la plus longue série
│   ├── pages/
│   │   └── Dashboard.tsx       # Vue principale — mise en page, navigation, modaux
│   ├── services/
│   │   └── storageService.ts   # Adaptateur de bas niveau pour chrome.storage / localStorage
│   ├── types/
│   │   └── index.ts            # Interfaces TypeScript partagées (Habit, HabitStats, ViewType…)
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── HabitRow.test.tsx       # Tests de rendu et d'interaction des composants
│   │   │   ├── dateUtils.test.ts       # Tests de formatage de date et de plage d'affichage
│   │   │   ├── streakUtils.test.ts     # Tests unitaires de calcul de séries
│   │   │   └── useStreakCalculator.test.ts # Tests de sortie du hook
│   │   ├── dateUtils.ts        # Aides au formatage des clés de date et à la plage d'affichage
│   │   ├── statsUtils.ts       # Taux de réussite et statistiques globales
│   │   └── streakUtils.ts      # Utilitaires de calcul des séries
│   ├── test/
│   │   └── setup.ts            # Configuration de Vitest — API Chrome et simulateurs matchMedia
│   ├── App.tsx                 # Composant racine
│   ├── App.css                 # Styles globaux
│   └── index.tsx               # Point d'entrée React
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Ce que ce projet démontre

- Empaquetage d'une **application React + TypeScript en tant qu'extension Chrome Manifest V3**
- Utilisation de l'**API Chrome Storage** pour les données locales persistantes
- Création d'une **interface utilisateur de type glisser-déposer** avec gestion de l'état de réorganisation
- Calcul de la **logique de série** à partir d'enregistrements clairsemés indexés par date
- Structuration d'une **application multi-vues** (quotidienne / hebdomadaire / mensuelle) avec état partagé
- Intégration de **Recharts** pour une visualisation légère des données au sein de l'extension
- Utilisation de **TypeScript** en mode strict pour la sécurité des types dans les hooks, les composants et les utilitaires
- Rédaction de **tests unitaires et de composants** avec Vitest et Testing Library, y compris la simulation de l'API de l'extension Chrome

---

## Améliorations à venir

- **Catégories et balises d'habitudes** — regroupement d'habitudes connexes et filtrage par catégorie
- **Définition d'objectifs** — définition d'un objectif hebdomadaire par habitude (par exemple, 5 jours sur 7) et suivi des progrès accomplis
- **Mode sombre** — adaptation de l'extension au thème du système
- **Archive des habitudes** — masquage des habitudes terminées ou abandonnées sans perdre leur historique
- **Lancement sur le Chrome Web Store** — packaging et publication pour que tout le monde puisse l'installer en un clic

L'état est entièrement géré à l'aide des hooks React (`useState`, `useEffect`, `useCallback`, `useMemo`). Il n'y a pas de bibliothèque d'état externe. Les types sont partagés dans toute l'application via `src/types/index.ts`.

---
