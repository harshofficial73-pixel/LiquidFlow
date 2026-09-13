# LiquidText Web Clone (iPad PWA)

A fully responsive, client-side implementation of Georgia Tech's Active Reading architecture inspired by LiquidText.

### Core Active Reading Features Implemented:
1. **Pinch-to-Collapse Accordion View:** Compress intervening pages to place distant citations side-by-side.
2. **True PDF TextLayer Highlighting:** Text can be selected, extracted, or searched directly from custom PDF uploads.
3. **Draggable Excerpt Cards:** Pull passages from text into standalone workspace cards.
4. **Card Snapping & Clustering:** Dragging excerpt cards near each other snaps them into structured column outlines.
5. **Bidirectional Deep Linking:** Tapping the `⮐ Page N` button on any excerpt card scrolls the PDF viewport directly to the original passage and highlights it with an animated pulse.
6. **Dynamic Bezier Links:** Drag from the circular port on any card to create interactive linking threads.
7. **Apple Pencil & Ink Drawing:** Toggle Ink Mode to draw diagrams, highlight connections, or sketch freehand with Apple Pencil.

### Deployment (Zero Mac Required)
1. Place all 6 files into a folder named `liquidtext-web`.
2. Visit **[Netlify Drop](https://app.netlify.com/drop)** or **Vercel** in any desktop browser (Windows, Linux, or iPad).
3. Drag and drop the folder to publish the site to a free public URL.
4. On your **iPad**, open the URL in **Safari**.
5. Tap **Share** -> **Add to Home Screen**.
6. Launch the app from the Home Screen for a fullscreen experience with touch gestures and Apple Pencil support.
