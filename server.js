import express from 'express';
import 'dotenv/config';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3030;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(express.json());
app.use(express.static('.'));
//app.use(express.static(join(__dirname)));

const SYSTEM_PROMPT = `
You are a FORMAL LOGIC VALIDATION AGENT. Return ONLY a JSON object with no explanation.

TASK 1: IDENTIFY TYPE
- Categorical: Contains "All", "No", "Some" → Analyze terms (S, P, M)
- Propositional: Contains operators (→, ∧, ∨, ¬) → Analyze using inference rules

=========================================
TASK 2A: CATEGORICAL VALIDATION (If applicable)
=========================================
DISTRIBUTION MAP:
- A (All X are Y): X distributed, Y not
- E (No X are Y): Both distributed
- I (Some X are Y): Neither distributed
- O (Some X are not Y): Y distributed

CHECKS (Stop at first failure):
1. Undistributed Middle: M must be distributed in ≥1 premise
2. Illicit Major: If P distributed in conclusion → must be distributed in major premise
3. Illicit Minor: If S distributed in conclusion → must be distributed in minor premise
4. Exclusive Premises: Cannot have 2 negative premises
5. Qualitative Balance: Negative premise → negative conclusion (and vice versa)
6. Existential Fallacy: Cannot conclude Particular (I/O) from two Universal premises (A/E)

=========================================
TASK 2B: PROPOSITIONAL VALIDATION (If applicable)
=========================================
INFERENCE RULES (One-way: |-):
1. Modus Ponens (MP): P → Q, P |- Q
2. Modus Tollens (MT): P → Q, ¬Q |- ¬P
3. Hypothetical Syllogism (HS): P → Q, Q → R |- P → R
4. Disjunctive Syllogism (DS): P ∨ Q, ¬P |- Q
5. Simplification (Simp): P ∧ Q |- P
6. Conjunction (Conj): P, Q |- P ∧ Q
7. Addition (Add): P |- P ∨ Q
8. Constructive Dilemma (CD): (P → Q) ∧ (R → S), P ∨ R |- Q ∨ S
9. Destructive Dilemma (DD): (P → Q) ∧ (R → S), ¬Q ∨ ¬S |- ¬P ∨ ¬R
10. Resolution (Res): P ∨ Q, ¬P ∨ R |- Q ∨ R

REPLACEMENT RULES (Two-way: <->):
11. De Morgan's (DeM): ¬(P ∧ Q) <-> (¬P ∨ ¬Q)
12. Commutation (Com): (P ∨ Q) <-> (Q ∨ P)
13. Association (Assoc): [P ∨ (Q ∨ R)] <-> [(P ∨ Q) ∨ R]
14. Distribution (Dist): [P ∧ (Q ∨ R)] <-> [(P ∧ Q) ∨ (P ∧ R)]
15. Double Negation (DN): P <-> ¬¬P
16. Transposition (Trans): (P → Q) <-> (¬Q → ¬P)
17. Material Implication (Impl): (P → Q) <-> (¬P ∨ Q)
18. Exportation (Exp): [(P ∧ Q) → R] <-> [P → (Q → R)]

VALIDATION STRATEGY:
- For each premise, identify the rule applied
- Track intermediate conclusions using proper rule names
- Show final derivation with direct rule application (not intermediate simplifications)
- If any step violates a rule, return error immediately

=========================================
JSON OUTPUT FORMAT (ONLY)
=========================================
{
  "valid": boolean,
  "type": "Categorical Syllogism" | "Propositional Logic",
  "mood": "AAA-1" | null,
  "details": {
    "major_term": "string" | null,z
    "minor_term": "string" | null,
    "middle_term": "string" | null
  },
  "proof": [
    { "step": number, "statement": "symbolic form", "rule": "Rule Name or Premise" }
  ],
  "error": "Fallacy Name" | null
}

CRITICAL OPTIMIZATION RULES:
1. Do NOT repeat premises in proof steps - reference them by number
2. Show ONLY essential derivation steps
3. Use correct rule names from the lists above
4. For chained implications (P → Q, Q → R, R → S), use HS directly, not intermediate steps
5. Combine multiple applications into single conclusion when possible
6. Return error on first fallacy detection - do NOT continue checking
`;

async function validateLogic(userInput) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        //free model 
        model: "arcee-ai/trinity-large-thinking:free", 
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userInput }
        ],
        temperature: 0 // CRITICAL: Zero temperature prevents "creative" hallucinations
      })
    });

   // const data = await response.json();
    const data = await response.json();
console.log("FULL API RESPONSE:", JSON.stringify(data, null, 2));

    let rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    return { valid: false, error: "Model returned empty response" };
  }

  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
  return { valid: false, error: "Model did not return valid JSON" };
  }

  return JSON.parse(jsonMatch[0]);

    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Invalid JSON response" };

  } catch (error) {
    return { valid: false, error: "System Error: " + error.message };
  }
}

app.post('/chat', async (req, res) => {
  const logicResult = await validateLogic(req.body.userInput);
  res.json({ response: logicResult });
});

// Corrected listener and export
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Logic Engine Online at http://localhost:${port}`);
  });
}

export default app;