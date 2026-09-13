# LiquidText Web Workspace (PWA)

A free, open-source web implementation of the **LiquidText active reading interface**, specifically designed to run seamlessly on iPad without needing a Mac, Xcode, or App Store developer fees.

---

## 📁 Project Structure

Place all of these files inside a single folder named `liquidtext-web`:

```text
liquidtext-web/
├── index.html          # Main HTML structure & dual-pane layout
├── styles.css          # Dark-mode styling, paper rendering & UI animations
├── app.js              # Core logic: gestures, Bezier threads, deep links, PDF engine
├── manifest.json       # PWA manifest for iPad full-screen standalone mode
├── service-worker.js   # Offline caching worker
└── README.md           # Documentation & deployment guide
```

---

## ⚡ Core Features

- **Dual-Pane Adaptive Layout:** Document reader on the left, infinite visual canvas on the right with a draggable splitter.
- **Bidirectional Deep-Linking:** Tap any excerpt card's page badge to auto-scroll the document straight back to the source line with an attention pulse.
- **Accordion Fold Simulation:** Collapse intervening pages to compare distant sections (e.g., introduction and conclusion) side-by-side.
- **Dynamic Bezier Connector Threads:** Link excerpt cards with flexible cubic Bezier curves by dragging card ports.
- **Apple Pencil & Stylus Support:** Pressure-responsive freehand inking layer for sketching diagrams, margin notes, and circling concepts.
- **Local PDF Support via PDF.js:** Load local PDF documents entirely client-side with no remote server uploads required.
- **100% Free & Zero Mac Needed:** No Xcode, macOS, or Apple Developer accounts required.

---

## 🚀 Free Deployment Guide (No Mac Required)

You can host this folder in under 2 minutes using any standard web browser on Windows, Linux, Android, or directly on your iPad.

### Option 1: Netlify Drop (Easiest — No CLI / No Git)
1. Visit **[Netlify Drop](https://app.netlify.com/drop)** in your browser.
2. Sign up or log in (completely free).
3. Drag and drop the `liquidtext-web` folder onto the browser window.
4. Netlify will instantly provide a live HTTPS URL (e.g., `https://liquid-notes-123.netlify.app`).

---

### Option 2: GitHub Pages (Free Permanent Hosting)
1. Go to **[GitHub](https://github.com)** and create a new public repository (e.g., `liquidtext-web`).
2. Click **Add file > Upload files** and drag the contents of `liquidtext-web/` into the repo.
3. Commit the changes.
4. In your repository, go to **Settings > Pages**.
5. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
6. Your app will be live at `https://<your-username>.github.io/liquidtext-web/`.

---

### Option 3: Vercel
1. Go to **[Vercel](https://vercel.com)** and sign in.
2. Select **Add New > Project**.
3. Import your GitHub repository or use the Vercel web drag-and-drop dashboard.
4. Click **Deploy** to receive your production URL.

---

## 📱 iPad Installation (Full-Screen Native App Experience)

To run the app in **standalone full-screen mode** (removing Safari's URL address bar and navigation buttons):

1. On your iPad, open **Safari** and visit your deployed URL.
2. Tap the **Share** button (the square icon with an upward arrow) in the Safari toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm by tapping **Add**.
5. Return to your iPad home screen and tap the **LiquidText** icon.
6. The app will launch in an isolated full-screen window with full touch, gesture, and Apple Pencil support.

---

## 🛠️ Usage Guide

| Action | How to Perform |
|---|---|
| **Extract Excerpt** | Highlight any text passage in the document pane and tap **Extract to Workspace ➔** on the popup menu. |
| **Jump to Source** | Tap the **PAGE [N]** badge at the top of any card on the workspace. The reader will auto-scroll and pulse-highlight the original passage. |
| **Pan Workspace** | Touch and drag on any empty section of the workspace grid. |
| **Connect Cards** | Drag the small circular dot (port) on the right edge of a card and drop it onto another card to draw a Bezier connector. |
| **Toggle Ink Mode** | Tap the **Pen Ink** button on the top toolbar to switch between card manipulation and Apple Pencil freehand drawing. |
| **Fold/Accordion** | Tap **Accordion Fold** to collapse intermediate pages and bring distant paragraphs into direct alignment. |
| **Load Custom PDF** | Tap **Open PDF** in the top bar and select any PDF document from your Files app or local storage. |

---

## 🔒 Privacy & Data

- **Client-Side Only:** All PDFs and excerpt cards are processed directly in your device's browser sandbox using Mozilla PDF.js.
- **Zero Telemetry:** No documents or excerpts are uploaded to external databases or servers.