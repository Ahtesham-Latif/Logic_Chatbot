# 🧠 Logic Validation Agent

[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://ahteshamlatiflogicchatbot.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)

**🚀 Try it Live:** https://ahteshamlatiflogicchatbot.vercel.app/

<p align="center">
  <video src="./DEMO_TestResults//demodesktop.mp4" width="100%" max-width="600px" controls autoplay loop muted></video>
</p>

A web-based, deterministic AI engine designed to validate natural-language arguments using formal **Rules of Inference**, **Rules of Replacement**, and **Categorical Logic**.

---

# ⚙️ Architecture & Engineering Focus

Unlike general-purpose LLMs that are prone to hallucination when handling discrete mathematics, this system forces the AI into a strict, rule-bound state machine.

- **Deterministic Output:** The core reasoning engine (`arcee-ai/trinity-large-thinking`) is clamped at `temperature: 0` to ensure reproducible mathematical proofs.
- **Defensive JSON Parsing:** Implemented server-side regex boundary tracking (`/\{[\s\S]*\}/`) to strictly extract and sanitize the JSON payload, preventing UI crashes from markdown leaks or conversational filler.
- **Edge-Case Resilience:** Gracefully handles unstructured noise (typos, empty inputs) by yielding formal schema errors rather than wasting pipeline bandwidth.

---

# ✨ Core Capabilities

## 1. Propositional Logic Validation

Transforms plain-English arguments into symbolic representations and validates them against classical Rules of Inference & Replacement:

- Modus Ponens & Modus Tollens
- Hypothetical & Disjunctive Syllogism
- Addition, Simplification, & Conjunction
- De Morgan’s Laws, Double Negation, Commutation, & Distribution

## 2. Categorical Logic

Automatically extracts and analyzes complex categorical syllogisms to determine:

- Proposition types (**A, E, I, O**)
- **Mood** and **Figure** (e.g., `AAA-1`)
- Exact logical fallacies (e.g., `Illicit Major`, `Qualitative Balance`)

## 3. Step-by-Step Proof Generation

Returns a strict JSON array containing the step-by-step mathematical proof, clearly citing the rules applied at each derivation step while explaining why invalid arguments fail.

### Example Backend JSON Output

```json
{
  "valid": true,
  "type": "Propositional Logic",
  "mood": null,
  "details": null,
  "proof": [
    { "step": 1, "statement": "R → W", "rule": "Premise" },
    { "step": 2, "statement": "R", "rule": "Premise" },
    { "step": 3, "statement": "W", "rule": "Modus Ponens" }
  ],
  "error": null
}
```

---

# 🛠 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **AI Integration:** OpenRouter API
- **Deployment:** Vercel

---

# 💻 Local Installation

## 1. Clone the Repository

```bash
git clone https://github.com/Ahtesham-Latif/Logic_Chatbot.git
cd Logic_Chatbot
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add the following values inside `.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=3030
NODE_ENV=development
```

## 4. Start the Development Server

```bash
npm start
```

The application will be available at:

```text
http://localhost:3030
```

---

# 🎓 Project Purpose

This project was created to help students understand and practice **formal logical reasoning**.

It is useful for:

- Philosophy and logic students
- Debate preparation
- Critical thinking exercises
- Demonstrations of AI-assisted reasoning systems

The chatbot is intentionally designed to follow strict formal logic rules while avoiding informal or probabilistic reasoning patterns.

---

# 👨‍💻 Author

## Ahtesham Latif

- **GitHub:** https://github.com/Ahtesham-Latif
- **LinkedIn:** https://www.linkedin.com/in/ahtesham-latif

---

# 📜 License

This project is licensed for **educational and academic use**.