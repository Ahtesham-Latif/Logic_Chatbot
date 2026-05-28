

---

# 🧠 Project Technical Documentation

This document covers system configurations and data flow between the user interface, custom validation checks, and the AI completion endpoint.

---

## 📋 Project Configuration (`package.json`)

Manages project metadata, npm scripts, and external packages.

### ⚙️ Core Setup

* **Module System (`"type": "module"`)**: Enables modern ES Modules (`import`/`export`) instead of CommonJS (`require`).
* **Start Script (`npm start`)**: Runs the production backend server via `node server.js`.
* **Test Script (`npm test`)**: Executes the automated Jest test suite.

### 📡 Production Dependencies (`dependencies`)

Packages required for the application to run live.

* **`express` (v4.18.2)**: Web framework that handles HTTP routing, endpoints, and serves static files from the `/public` directory.
* **`node-fetch` (v3.3.1)**: Adds window `fetch` support to Node.js for making API requests to OpenRouter.
* **`dotenv` (v16.0.3)**: Loads configuration variables securely from a local `.env` file into `process.env`.

### 🧪 Development Dependencies (`devDependencies`)

Packages used only for local testing and code validation.

* **`jest` (v30.4.2)**: Core testing framework providing runners, assertions, and mock timers.
* **`jest-environment-jsdom` (v30.4.1)**: Simulates a browser environment for headless frontend testing inside the console.

---

## 💻 Backend Logic (`server.js`)

Sets up server middleware, runs input validation rules, and manages AI prompts.

### ⚙️ Server Setup & Environment

* **ESM Path Resolving**: Uses `fileURLToPath` and `dirname` to handle absolute file paths under native ES Modules.
* **Static File Serving**: Serves frontend assets directly from the `/public` folder to keep backend source files hidden.
* **Port Assignment**: Binds to `process.env.PORT` with a fallback to local port `3030`.

### 📡 Data Validation & Sanitization

Because LLMs are probabilistic, these functions explicitly check and clean data objects before sending them to the user:

* **`validateLogicResponse()`**: Enforces a strict data contract. Checks data types, status booleans, and array structures to prevent layout crashes.
* **`normalizeLogicResponse()`**: Scrubs unneeded or empty properties (like clearing categorical variables from a propositional proof output) to keep formats identical.
* **`isIntruderDetectedResponse()`**: Scans incoming text payloads for active security anomaly flags.

### 🛡️ Core Prompt Engineering (`SYSTEM_PROMPT`)

Instructs the `arcee-ai/trinity-large-thinking:free` model to return structured, highly consistent formatting:

* **Logic Reference Table**: Includes a built-in lookup index of 10 Rules of Inference, 8 Rules of Replacement, and 6 Categorical Fallacies.
* **Strict JSON Formatting**: Explicitly forbids the model from writing conversational text or markdown chatter, demanding a raw object back.
* **Injection Guards**: Instructs the AI to isolate prompt injections or system overrides by returning a `"threat": true` flag and a custom warning.

### ⚡ Route Processing (`/chat`)

* **Consistency Control**: Fixes `temperature: 0` to limit completion randomness and ensure reproducible logic derivations.
* **JSON Extraction**: Uses a regex boundary matcher (`/\{[\s\S]*\}/`) to extract JSON safely from raw model text outputs.
* **Error Handling**: Wraps the API pipeline in nested `try/catch` blocks to turn network drops, timeouts, or rate limits into stable error messages instead of server crashes.

---

## 📋 Frontend Interface (`public/index.html`)

Defines the core page layout, CSS styling links, and script triggers.

### ⚙️ Head Setup & Optimization

* **SEO & Social Metadata**: Embeds standard OpenGraph tags (`og:title`, `og:description`) to populate clean preview cards when shared.
* **Non-Blocking JavaScript**: Defers `app.js` and analytics scripts so the browser loads the visual page layout without freezing.

### 💬 UI Components

* **`#chat-container`**: Main viewport showing interactive message bubbles and proof cards.
* **`#symbol-bar`**: Toolbar shortcut buttons to insert logical operators ($\rightarrow$, $\therefore$, $\neg$) straight into the input, avoiding manual copy-pasting.
* **`#example-bar`**: Starter example chips that paste sample arguments into the input for new users.
* **`#chat-form`**: Connects the main text field (`#user-input`) directly to the form submission trigger.

### 🎨 Modals & Popups

* **`#welcomeModal`**: Onboarding splash overlay that introduces app capabilities and records a closing click event.
* **`#purposeModal`**: Help menu explaining logic rules, syntax guidelines, and project use cases.

### ♿ Accessibility (ARIA Rules)

* **Popup Modifiers**: Applies `role="dialog"` and `aria-modal="true"` to active windows to signal focus boundaries to screen readers.
* **Live Updates**: Uses `aria-live="polite"` inside the chat log to read out newly generated proof steps automatically without disrupting user focus.

---

## 🎨 Layout Styling (`public/styles.css`)

Handles dimensions, color schemes, responsive breakpoints, and user interface states.

### ⚙️ Variables & Theme Management

* **Design Tokens (`:root`)**: Centralizes border properties, canvas colors, and semantic states into uniform CSS variables.
* **Dark Mode Swapping**: Targets the `body.dark-mode` class to map colors to dark slate indices across a smooth `0.3s` ease transition.

### 💬 Chat Layout & Positioning

* **Height Constraints**: Uses a flexbox structure capped at `76vh` to keep the app neat and compact without forcing page scrolling.
* **Bubble Alignment**: Uses `align-self` rules to float user bubbles right and system logic evaluations left.
* **Horizontal Swipe rows**: Sets `overflow-x: auto` on the symbol shortcut bar to ensure it can swipe horizontally on compact mobile layouts.

### 🚨 Component Styling States

* **Security Error Boxes (`.threat-box`)**: Uses thick crimson borders and dark red gradients to instantly flag input sanitization events.
* **Background Blurring**: Applies `backdrop-filter: blur(4px)` to freeze and blur background page text while a popup window is active.

### 📱 Mobile Adjustations (`@media`)

Overwrites styles for screens under `768px` to maximize mobile usability:

* **Form Layout Stacking**: Changes horizontal inputs and validation buttons into simple vertical stacks for larger touch target areas.
* **Grid Flattening**: Packs multi-column feature lists down into a clean single-column list.
* **Bottom Sheets**: Converts centered modal windows into slide-up bottom sheets optimized for thumb controls.

---

## 📜 Client JavaScript Controls (`public/app.js`)

Manages frontend UI states, client-side data persistence, and browser communication.

### ⚙️ State Persistence & Storage

* **Theme Syncing**: Evaluates system settings and syncs choices with `localStorage` keys so styles survive page reloads.
* **Popup Tracking**: Checks local storage data to skip rendering the welcome popup on returning visits.

### 🛡️ Modal Locks & Focus Control

* **Focus Trapping (`trapFocus`)**: Hooks into the keyboard `Tab` sequence during active modals to loop focus inside the box, stopping users from hitting hidden links behind the popup.
* **Focus Restoration**: Caches active browser elements before popups open, restoring your cursor placement when you close them. Maps the `Escape` key to close all modals.

### 📡 Network Handling & DOM Generation

* **`sendMessage()`**: Instantly appends your entries to the screen, clears out the text field, and injects the loading bar placeholder.
* **Simulated Progress States**: Displays simulated progress states (*"Choosing Type..."*, *"Validating..."*) while awaiting API responses.
* **`normalizeLogicResponse()`**: Defensive utility that strips out markdown wrappers (```json ... ```) to safely parse pure object schemas.

### 🎨 Proof Rendering Utilities

* **Dynamic HTML Generation**: Translates successful API payloads into clean layout nodes—handling safety flags, displaying variables, and rendering proof trees.
* **Clipboard Copy Utilities**: Combines verified logical proof arrays into structured plain-text files and handles clipboard copy functions.

---

## 🌐 SEO & Crawler Optimization (`robots.txt` & `sitemap.xml`)

Controls how search engine crawlers discover, prioritize, and rank website links.

### 🤖 Web Crawler Rules (`robots.txt`)

* **Global Access Boundaries**: Targets all index bots (`User-agent: *`) and allows full platform indexing (`Allow: /`).
* **Sitemap Pointer**: Directs search engine bots straight to our sitemap link file.

### 🗺️ Index Site Mapping (`sitemap.xml`)

* **Url Declarations**: Maps the primary Vercel production routing domain.
* **Crawl Scheduling**: Requests search engines to re-evaluate the code on a `weekly` basis, prioritizing the primary route target at a maximum `1.0` indexing score.

---

## 🧪 Automated Testing Suite (`public/ui.test.js`)

A functional unit test file that checks frontend components headlessly in a virtual environment.

### ⚙️ Setup Lifecycle Rules (`bootstrapApp`)

* **JSDOM Integration**: Employs headless testing parameters to mock native browser schemas inside a local terminal pipeline.
* **DOM Reset Isolation**: Injects fresh page data reads from `index.html` before every assertion block to avoid variable leaks.
* **Network Mocking**: Intercepts `fetch()` calls to return a static Modus Ponens validation dataset, eliminating latency and API credit use.

### 🎨 Test Category 1: Base Containers & Color Classes

* **Node Verification**: Scans root components to check if form modules, shortcuts, and modal containers exist without failure.
* **Theme Switching**: Simulates click metrics on the toggle button to check class additions and `localStorage` caching logic.
* **Accessibility Assertions**: Checks key elements for explicit ARIA labels and tags.

### 📥 Test Category 2: Modal Switching & Key Events

* **Overlay Toggles**: Verifies the welcome popup displays at start and hides cleanly when a user selects the entry action button.
* **Persistence Checks**: Pre-fills simulation metrics inside virtual storage to confirm returning user criteria bypass onboarding.
* **Hotkey Escapes**: Fires artificial `Escape` keyboard events to confirm all open modals drop out of visibility.

### ⚡ Test Category 3: Inputs & Exception Paths

* **Symbol Transfers**: Simulates structural clicks on the character utility menu to ensure symbols paste smoothly directly inside text field boundaries.
* **Animation Time Management**: Employs `jest.useFakeTimers()` to skip animation delays, running multi-second milestone assertions instantly.
* **Validation Failure Triage**:
* Simulates a threat response payload (`threat: true`) to verify the UI drops normal processing and displays the security alert box.
* Inputs regular text strings to verify the application catches non-argument inputs safely by showing standard failure fields instead of crashing.
