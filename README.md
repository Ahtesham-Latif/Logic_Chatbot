# 🧠 Logic Chatbot – Formal Logic Validation Agent

## 🚀 Live Demo

**Try it now:**
https://ahteshamlatiflogicchatbot.vercel.app/

A **web-based AI chatbot** that validates logical arguments using **formal logic systems**.
The system analyzes arguments using **Rules of Inference**, **Rules of Replacement**, and **Categorical Logic**, and determines whether a conclusion logically follows from the premises.

It can also identify the **Mood and Figure of categorical syllogisms** (e.g., `AAA-1`, `AAI-2`) and generate **step-by-step proofs** for valid arguments while explaining **why invalid arguments fail**.

---

# ✨ Features

## Propositional Logic Validation

Supports classical **Rules of Inference** including:

* Modus Ponens
* Modus Tollens
* Hypothetical Syllogism
* Disjunctive Syllogism
* Addition
* Simplification
* Conjunction

---

## Rules of Replacement

Recognizes logical equivalence transformations such as:

* De Morgan’s Laws
* Double Negation
* Commutation
* Association
* Distribution
* Material Implication
* Biconditional Replacement

---

## Categorical Logic

The system can analyze **categorical syllogisms** and automatically determine:

* Proposition types (**A, E, I, O**)
* **Mood of the syllogism**
* **Figure of the syllogism**
* Overall logical validity

Example mood output:

```
AAA-1
```

---

## AI-Powered Reasoning

The backend integrates an **LLM through the OpenRouter API** to reason about logical arguments while enforcing a **strict JSON output format**.

Output structure includes:

* verdict
* proof steps
* mood and figure
* explanation of reasoning

Example response format:

```json
{
  "verdict": "valid",
  "proof": [
    { "step": 1, "statement": "P → Q", "rule": "Premise" },
    { "step": 2, "statement": "P", "rule": "Premise" },
    { "step": 3, "statement": "Q", "rule": "Modus Ponens" }
  ],
  "mood": "AAA-1",
  "explanation": "Conclusion follows logically via Modus Ponens."
}
```

---

# 🛠 Tech Stack

### Frontend

* HTML
* CSS
* Vanilla JavaScript

### Backend

* Node.js
* Express.js

### AI Integration

* OpenRouter API
* LLM-based reasoning

### Deployment

* Vercel

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/Ahtesham-Latif/Logic_Chatbot.git
cd Logic_Chatbot
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Create Environment Variables

Create a `.env` file in the root directory:

```
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
```

---

## 4. Start the Server

```bash
node server.js
```

---

## 5. Access the Chatbot

Open your browser and go to:

```
http://localhost:3030
```

---

# 🎓 Project Purpose

This project was created to help students understand and practice **formal logical reasoning**.

It is useful for:

* Philosophy and logic students
* Debate preparation
* Critical thinking exercises
* Demonstrations of **AI-assisted reasoning systems**

The chatbot is designed to **strictly follow formal logic rules** and avoid informal reasoning.

---

# 👨‍💻 Author

**Ahtesham Latif**

GitHub
https://github.com/Ahtesham-Latif

LinkedIn
https://www.linkedin.com/in/ahtesham-latif

---

# 📜 License

This project is licensed for **educational and academic use**.
