# Habit Tracker

A Chrome extension for building and tracking daily habits with streaks, drag-and-drop reordering, daily/weekly/monthly views, and per-habit statistics. Built with React + TypeScript and packaged as a Manifest V3 Chrome extension.

---

## Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center" valign="top">
        <img width="350" alt="Today-view" src="https://github.com/user-attachments/assets/fd149f2b-0cbb-49cc-9fe7-b4701e879f08" /><br />
        <sub><b>Today view</b></sub>
      </td>
      <td align="center" valign="top">
        <img width="350" alt="Statistics" src="https://github.com/user-attachments/assets/fe3369ef-adce-4b3a-9aed-e177bf730adb" /><br />
        <sub><b>Statistics</b></sub>
      </td>
    </tr>
    <tr>
      <td align="center" valign="top">
        <img width="350" alt="Weekly-view" src="https://github.com/user-attachments/assets/f35b00a1-bc2a-49b9-9afa-e6de5709191f" /><br />
        <sub><b>Weekly view</b></sub>
      </td>
      <td align="center" valign="top">
        <img width="350" alt="Monthly-view" src="https://github.com/user-attachments/assets/75e1684e-8a8d-44c8-b610-0c369cd4cec8" /><br />
        <sub><b>Monthly view</b></sub>
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

## Overview

A browser extension that lives in the Chrome toolbar, making habit tracking always one click away. It stores all data locally using the Chrome Storage API so progress is private and persists across sessions.

The goal was to build a genuinely useful productivity tool while exploring how a modern React + TypeScript app can be packaged and deployed as a Chrome extension.

---

## What Problem This Solves

Most habit tracking apps require users to pull out their phones, open an app, log in, and navigate to today's view. By the time they get there, the moment has passed. The habit doesn't get logged. This Habit Tracker lives in the user's browser toolbar, one click and zero friction. Since most people spend the majority of their day in their browser, keeping the tracker there means it's always visible and accessible. No account, no subscription, no app to download. The data stays on the machine.

The secondary problem is accountability over time. Checking off a box is satisfying; watching a streak grow is motivating. Streaks and progress are made visible at every level, with daily check-ins, weekly patterns, and monthly history.

---

## Features

### Habit Management
- Add and delete habits with a clean modal interface
- Drag-and-drop reordering via `@hello-pangea/dnd`
- Color-coded habit rows for quick visual identification

### Views
- **Daily** — Focus on today's habits with a single-column toggle
- **Weekly** — See the full week at a glance with day labels
- **Monthly** — Calendar-style grid showing the entire month

### Streaks & Stats
- Live current streak displayed per habit with a 🔥 badge
- Per-habit statistics modal showing:
  - Current streak
  - Longest streak
  - Total completions
  - 30-day bar chart powered by Recharts
- Header summary showing active habits, total check-ins, and total streak across all habits

### Data & Persistence
- All data stored locally with the Chrome Storage API (`chrome.storage.local`)
- Falls back to `localStorage` for local development
- No account required, no data leaves your browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 |
| **Language** | TypeScript 5 |
| **Extension Platform** | Chrome Manifest V3 |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | Recharts |
| **Date Logic** | date-fns |
| **Icons** | lucide-react |
| **Build Tool** | Vite |
| **Testing** | Vitest + Testing Library |

---

## Architecture

The app is a single-page React + TypeScript application bundled by Vite and loaded as a Chrome extension popup.

```
[Chrome Toolbar Click]
        ↓
[popup (build/index.html)]
        ↓
[React App (App.tsx)]
        ↓
    ├─→ useChromeStorage  — load/save habits via chrome.storage.local
    ├─→ useStreakCalculator — current & longest streak per habit
    ├─→ Habit state (add / delete / reorder)
    ├─→ Completion toggles per habit per day
    └─→ View navigation (daily / weekly / monthly)
        ↓
[chrome.storage.local]
```

State is managed entirely with React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`). There is no external state library. Types are shared across the app via `src/types/index.ts`.

---

## Installation

### From Source

**Requirements:** Node.js 18+, npm, Google Chrome

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/habit-tracker.git
cd habit-tracker

# Install dependencies
npm install

# Build the extension
npm run build
```

Then load it into Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `build/` folder

The extension will appear in your toolbar. Pin it for quick access.

---

## Development

To run the app in a regular browser tab during development:

```bash
npm run dev
```

> Note: `chrome.storage` is not available outside the extension context. The app automatically falls back to `localStorage` when running in the browser.

---

## Testing

The project uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/) and jsdom. All tests run against real utility logic and the `HabitRow` component.

```bash
# Run all tests once
npm run test:run

# Watch mode (reruns on file changes)
npm test

# Generate coverage report
npm run test:coverage
```

### Test Coverage

| File | What's tested |
|---|---|
| `streakUtils.test.ts` | `calculateCurrentStreak`, `calculateLongestStreak` — gaps, consecutive days, unsorted dates |
| `dateUtils.test.ts` | `getDateKey`, `getDaysForView`, `navigateDate`, `getViewTitle` across all three views |
| `useStreakCalculator.test.ts` | Hook output — zero state, consecutive streaks, gaps, longest streak across multiple streaks |
| `HabitRow.test.tsx` | Renders name and streak badge, triggers `onShowStats`, shows delete confirmation before calling `onDelete` |

The Chrome API (`chrome.storage`, `chrome.alarms`, `chrome.notifications`, `chrome.runtime`) and `window.matchMedia` are mocked in `src/test/setup.ts` so tests run without a browser extension context.

---

## Project Structure

```
habit-tracker/
├── public/
│   ├── index.html
│   ├── manifest.json           # Chrome extension manifest (MV3)
│   ├── logo16.png
│   ├── logo48.png
│   └── logo192.png
├── src/
│   ├── components/
│   │   ├── HabitRow.tsx        # Per-habit row with daily/weekly/monthly cells
│   │   ├── HabitCard.tsx       # Draggable habit card
│   │   ├── HabitList.tsx       # Drag-and-drop list wrapper
│   │   ├── Header.tsx          # Top bar with summary stats
│   │   ├── StatsModal.tsx      # Per-habit stats and 30-day chart
│   │   └── ViewSwitcher.tsx    # Daily / weekly / monthly tab controls
│   ├── hooks/
│   │   ├── useChromeStorage.ts # Chrome storage read/write with localStorage fallback
│   │   ├── useHabits.ts        # Habit CRUD and reorder logic
│   │   ├── useStorage.ts       # Generic storage hook
│   │   └── useStreakCalculator.ts # Current and longest streak computation
│   ├── pages/
│   │   └── Dashboard.tsx       # Main view — layout, navigation, modals
│   ├── services/
│   │   └── storageService.ts   # Low-level chrome.storage / localStorage adapter
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces (Habit, HabitStats, ViewType…)
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── HabitRow.test.tsx       # Component render and interaction tests
│   │   │   ├── dateUtils.test.ts       # Date formatting and view range tests
│   │   │   ├── streakUtils.test.ts     # Streak calculation unit tests
│   │   │   └── useStreakCalculator.test.ts # Hook output tests
│   │   ├── dateUtils.ts        # Date key formatting and view range helpers
│   │   ├── statsUtils.ts       # Completion rate and overall stats
│   │   └── streakUtils.ts      # Streak calculation utilities
│   ├── test/
│   │   └── setup.ts            # Vitest setup — Chrome API and matchMedia mocks
│   ├── App.tsx                 # Root component
│   ├── App.css                 # Global styles
│   └── index.tsx               # React entry point
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## What This Project Demonstrates

- Packaging a **React + TypeScript app as a Chrome Manifest V3 extension**
- Working with the **Chrome Storage API** for persistent local data
- Building a **drag-and-drop UI** with reorder state management
- Computing **streak logic** from sparse date-keyed records
- Structuring a **multi-view app** (daily / weekly / monthly) with shared state
- Integrating **Recharts** for lightweight in-extension data visualization
- Using **TypeScript** with strict mode for type safety across hooks, components, and utilities
- Writing **unit and component tests** with Vitest and Testing Library, including mocking the Chrome extension API

---

## Future Improvements

- **Habit categories and tags** — grouping related habits and filtering by category
- **Goal setting** — defining a weekly target per habit (e.g. 5 out of 7 days) and tracking progress toward it
- **Dark mode** — matching the extension to the system theme
- **Habit archive** — hiding completed or retired habits without losing their history
- **Chrome Web Store release** — packaging and publishing so anyone can install with one click
