Habit Tracker

A Chrome extension for building and tracking daily habits with streaks, drag-and-drop reordering, daily/weekly/monthly views, and per-habit statistics. Built with React and packaged as a Manifest V3 Chrome extension.

---

## Screenshots

<img width="2560" height="1447" alt="react-1" src="https://github.com/user-attachments/assets/fd149f2b-0cbb-49cc-9fe7-b4701e879f08" />
<img width="2560" height="1458" alt="react-2" src="https://github.com/user-attachments/assets/fe3369ef-adce-4b3a-9aed-e177bf730adb" />
<img width="2560" height="1441" alt="react-3" src="https://github.com/user-attachments/assets/f35b00a1-bc2a-49b9-9afa-e6de5709191f" />
<img width="2560" height="1444" alt="react-4" src="https://github.com/user-attachments/assets/75e1684e-8a8d-44c8-b610-0c369cd4cec8" />

---

## Overview

A browser extension that lives in the Chrome toolbar, making habit tracking always one click away. It stores all data locally using the Chrome Storage API so progress is private and persists across sessions.

The goal was to build a genuinely useful productivity tool while exploring how a modern React app can be packaged and deployed as a Chrome extension.

---

## What Problem This Solves
 
Most habit tracking apps require users to pull out their phones, open an app, log in, and navigate to today's view. By the time they get there, the moment has passed. The habit doesn't get logged. This Habit Tracker lives in the user's browser toolbar, in one click and zero friction. Since most people spend the majority of their day in their browser, keeping the tracker there means it's always visible and accessible. No account, no subscription, no app to download. The data stays on the machine.
 
The secondary problem is accountability over time. Checking off a box is satisfying; watching a streak grow is motivating. Habit Flow makes streaks and progress visible at every level, with daily check-ins, weekly patterns, and monthly history.

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
- Header summary showing today's completion count across all habits

### Data & Persistence
- All data stored locally with the Chrome Storage API (`chrome.storage.local`)
- Falls back to `localStorage` for local development
- No account required, no data leaves your browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 |
| **Extension Platform** | Chrome Manifest V3 |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | Recharts |
| **Date Logic** | date-fns |
| **Icons** | lucide-react |
| **Build Tool** | Create React App |

---

## Architecture

The app is a single-page React application bundled by Create React App and loaded as a Chrome extension popup.

```
[Chrome Toolbar Click]
        ↓
[popup (build/index.html)]
        ↓
[React App (App.js)]
        ↓
    ├─→ Habit state (add / delete / reorder)
    ├─→ Completion toggles per habit per day
    ├─→ Streak & stats calculation
    └─→ View navigation (daily / weekly / monthly)
        ↓
[chrome.storage.local]
```

State is managed entirely with React hooks (`useState`, `useEffect`, `useCallback`). There is no external state library. The data shape is simple enough that local component state and `chrome.storage` are sufficient.

---

## Installation

### From Source

**Requirements:** Node.js 16+, npm, Google Chrome

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
npm start
```

> Note: `chrome.storage` is not available outside the extension context. The app automatically falls back to `localStorage` when running in the browser.

---

## Project Structure

```
habit-tracker/
├── public/
│   ├── index.html
│   ├── manifest.json        # Chrome extension manifest (MV3)
│   ├── logo16.png
│   ├── logo48.png
│   └── logo192.png
├── src/
│   ├── App.js               # Main component (all state, views, and logic)
│   ├── App.css              # Styles
│   └── index.js             # React entry point
└── package.json
```

---

## What This Project Demonstrates

- Packaging a **React app as a Chrome Manifest V3 extension**
- Working with the **Chrome Storage API** for persistent local data
- Building a **drag-and-drop UI** with reorder state management
- Computing **streak logic** from sparse date-keyed records
- Structuring a **multi-view app** (daily / weekly / monthly) with shared state
- Integrating **Recharts** for lightweight in-extension data visualization

---

## Future Improvements
 
- **Reminder notifications** — using the Chrome Alarms API to remind the user at a set time each day
- **Habit categories and tags** — grouping related habits and filter by category
- **Goal setting** — defining a weekly target per habit (e.g. 5 out of 7 days) and tracking progress toward it
- **Export** — downloading history as CSV or JSON
- **Dark mode** — matching the extension to the system theme
- **Habit archive** — hiding completed or retired habits without losing their history
- **Chrome Web Store release** — packaging and publishing so anyone can install with one click
