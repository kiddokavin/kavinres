# Aegis DSS - AI-Powered Business Decision Support System

Aegis DSS is a premium, client-side decision analysis tool that empowers executives and business managers to structure complex decision problems, calculate weighted comparisons mathematically, and stress-test options under simulated market states. It features an interactive **AI Strategic Consultant** powered by Gemini to help critique weights, generate SWOT/PESTLE matrices, and suggest mitigation policies.

## 🚀 Key Features

* **Analytic Hierarchy Process (AHP) / MCDA**: Structured evaluation matrix utilizing normalized criteria weights and interactive score matrices to produce objective rankings.
* **Dual Visualization Engines**: Real-time rankings and score breakdowns driven by interactive `Chart.js` graphs.
* **AI SWOT & PESTLE Generator**: Automatic generation of quadrant-based internal SWOT and macro-environmental PESTLE assessments.
* **Stress Test Scenarios**: Model-aware simulations that stress-test your alternatives against hyper-growth or recession states, computing risk levels and mitigations.
* **Strategic Chat Consultant**: A context-aware McKinsey-style advisor sidebar that analyzes the current decision model and critiques criteria or weights.
* **Demo/Offline Mode**: A rich offline capability that preloads structured metrics so users can test every feature immediately without setting up API keys.

---

## 🛠️ Setup & Running

Aegis DSS is built as a portable, single-page application using modern HTML5, CSS3, and JavaScript, meaning it runs directly inside any browser with no server installations or dependencies.

### Running Locally
1. Clone or copy the project files to your folder.
2. Locate `index.html` in your directory.
3. Double-click `index.html` to open it instantly in your web browser.

### Configuring Gemini AI
To enable live AI insights and conversational consultations:
1. Click **System Settings** in the left navigation sidebar.
2. Paste your Google Gemini API Key. (You can generate a free developer key at the [Google AI Studio](https://aistudio.google.com/)).
3. Toggle off **Enable Demo / Offline Mode**.
4. Click **Save Configuration**. The API indicator status on the bottom-left will light up green.

---

## 📐 Mathematical Framework (MCDA)

Aegis DSS evaluates options using a standard Multi-Criteria Decision Analysis weighted score:

1. **Criteria Weight Normalization**:
   For any criteria $j$, its normalized weight $W_j$ is calculated relative to the sum of all criteria weights:
   $$W_j = \frac{\text{Weight}_j}{\sum_{k=1}^{n} \text{Weight}_k}$$

2. **Weighted Alternative Scoring**:
   The final performance score $S_i$ for alternative option $i$ is calculated by summing the products of the normalized criteria weights and their raw rating score $R_{ij}$ (from 1 to 10) assigned by you:
   $$S_i = \sum_{j=1}^{n} (W_j \times R_{ij})$$

---

## 📂 File Architecture

* **[`index.html`](file:///c:/antigravity/business%20decision/index.html)**: Semantic layout, dashboard cards, matrix tables, and collapsible floating advisor drawer.
* **[`style.css`](file:///c:/antigravity/business%20decision/style.css)**: Glassmorphic theme styling, custom ranges, responsive sidebar, animations.
* **[`app.js`](file:///c:/antigravity/business%20decision/app.js)**: Controller module handling calculations, storage state, DOM updates, and Chart.js renders.
* **[`api.js`](file:///c:/antigravity/business%20decision/api.js)**: Network layer for browser-to-Gemini requests, system instructions, and mock fallback engines.
* **[`logo.svg`](file:///c:/antigravity/business%20decision/logo.svg)**: Custom SVG logo graphic representing path-branching decisions.
