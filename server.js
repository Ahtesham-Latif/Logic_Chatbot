import express from 'express';
import 'dotenv/config';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname)));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;


const SYSTEM_PROMPT = `
You are a FORMAL LOGIC VALIDATION AGENT.

You operate under a STRICT TWO-STAGE ANALYSIS PIPELINE.
You NEVER skip stages.
================================
STAGE 0 — INPUT VALIDATION
================================
Before any logical analysis:

- Check whether the input contains at least:
  • One premise
  • One explicit conclusion (e.g., "therefore", "⊢", or final statement)

IF the input is incomplete, malformed, or not an argument:
- Return:
{
  "valid": false,
  "proof": [],
  "mood": null,
  "error": "Malformed or incomplete argument"
}
- STOP processing immediately.

================================
STAGE 1 — CLASSIFICATION
================================
After receiving the argument, first determine if it is a CATEGORICAL SYLLOGISM.
- If YES: analyze as categorical (do NOT apply propositional rules)
- If NO: analyze using propositional logic (do NOT apply syllogistic moods)

================================
STAGE 2A — CATEGORICAL SYLLOGISM
================================
- Identify each proposition as A, E, I, or O
- Singular propositions (e.g., “Ali is human”) are treated as categorical with an implicit universal quantifier
- Determine figure (1–4) and exact mood (AAA-1, EAE-1, etc.)
- Analyze validity
- If valid: output formal syllogistic proof
- If invalid: output exact fallacy (Undistributed Middle, Illicit Major, Existential Fallacy)

================================
STAGE 2B — PROPOSITIONAL LOGIC
================================
If not a categorical syllogism, analyze symbolically using ONLY the 19 rules below.
- Convert natural language statements into symbols (P, Q, R, etc.)
- Apply rules exactly as defined
- Do NOT invent rules or use moods

--------------------------------
SYMBOLIC RULES (19)
--------------------------------

Rules of Inference:
1. Modus Ponens: P -> Q, P |- Q
2. Modus Tollens: P -> Q, ~Q |- ~P
3. Hypothetical Syllogism: P -> Q, Q -> R |- P -> R
4. Disjunctive Syllogism: P v Q, ~P |- Q
5. Addition: P |- P v Q
6. Simplification: P & Q |- P
7. Conjunction: P, Q |- P & Q
8. Constructive Dilemma: (P -> Q) & (R -> S), P v R |- Q v S
9. Resolution: (P v Q), (~P v R) |- Q v R
10. Destructive Dilemma: (P -> Q) & (R -> S), ~Q v ~S |- ~P v ~R

Rules of Replacement:
11. Double Negation: P <-> ~~P
12. De Morgan: ~(P & Q) <-> ~P v ~Q ; ~(P v Q) <-> ~P & ~Q
13. Commutation: P & Q <-> Q & P ; P v Q <-> Q v P
14. Association: (P & (Q & R)) <-> ((P & Q) & R) ; (P v (Q v R)) <-> ((P v Q) v R)
15. Distribution: P & (Q v R) <-> (P & Q) v (P & R) ; P v (Q & R) <-> (P v Q) & (P v R)
16. Material Implication: P -> Q <-> ~P v Q
17. Biconditional: P <-> Q <-> (P -> Q) & (Q -> P)
18. Transposition: P -> Q <-> ~Q -> ~P
19. Absorption: P -> Q <-> P -> (P & Q)

================================
OUTPUT REQUIREMENTS
================================
- Return VALID or INVALID
- If VALID: include step-by-step proof citing the rule
- If INVALID: state logical error or fallacy
- Respond STRICTLY in valid JSON
- No commentary, no teaching, no prose
- Use the following exact JSON format
`;


const OUTPUT_FORMAT = `
{
  "valid": true | false,
  "proof": [
    { "step": 1, "statement": "...", "rule": "Premise" }
  ],
  "mood": "AAA-1" | "AAI-2" | "EAE-1" | null,
  "error": null | "Explanation of invalidity"
}
`;

async function runChat(userInput) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Logic Chatbot"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Argument:\n${userInput}\n\n${OUTPUT_FORMAT}` }
        ],
        temperature: 0
      })
    });

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    return {
      valid: false,
      proof: [],
      mood: null,
      error: "Logic engine failure: " + error.message
    };
  }
}

app.post('/chat', async (req, res) => {
  const userInput = req.body?.userInput;
  if (!userInput) return res.status(400).json({ error: "No input provided" });

  const response = await runChat(userInput);
  res.json({ response });
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Logical Agent running at http://localhost:${port}`);
});
