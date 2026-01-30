import express from 'express';
import 'dotenv/config';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(express.json());
app.use(express.static('.'));
//app.use(express.static(join(__dirname)));

const SYSTEM_PROMPT = `
You are a FORMAL LOGIC VALIDATION AGENT. You do not simulate conversation. You only perform structural analysis.
Based on the criteria below, you MUST return a JSON object.
You have to check each step before final answer.
Make sure to follow the each instruction given in the task.
If it passed all the checks, you MUST return a valid JSON object.
If it fails any check you have to return that check name.
If it fails any check, you MUST return the error message.
Must follow the format below.
Dont do hallucinations!
Dont use any other language.
Dont use any other format.
=========================================

=========================================
TASK 1: SYMBOLIZATION
=========================================
1. Identify Terminology:
  Go to if branch if the input is categorical
   - For Categorical: Major (P), Minor (S), Middle (M).
  Go to else branch if the input is propositional
   - For Propositional: P, Q, R...
2. Translate input into strict symbolic form.

if branch:
=========================================
TASK 2: CATEGORICAL VALIDATION (PHASE 2A)
=========================================
If the argument is categorical, you MUST apply these 3 hard-coded checks:

CHECK 1: THE DISTRIBUTION RULE
- A-statement (All X are Y): X is distributed, Y is NOT.
- E-statement (No X are Y): BOTH X and Y are distributed.
- I-statement (Some X are Y): NEITHER is distributed.
- O-statement (Some X are not Y): Only Y is distributed.

ENHANCED PHASE 2A: CATEGORICAL FALLACY DETECTION
========================================= PRE-COMPUTATION: 
THE DISTRIBUTION MAP Before checking fallacies, you MUST determine the distribution of every term (S, P, M) using these two absolute axioms:
The Quantity Rule: A proposition distributes its Subject if and only if it is Universal (A or E).
The Quality Rule: A proposition distributes its Predicate if and only if it is Negative (E or O).
=========================================
CHECK 2: FORMAL FALLACY DETECTION (STEP-BY-STEP) Verify the following in order. If any check fails, stop with the fallacy name, dont go to next fallacy check and declare INVALID.
1.Undistributed Middle:
Locate the Middle Term (M) in both premises.
Check if M is distributed in at least one premise using the Distribution Map.
Failure: M is undistributed in both = "Undistributed Middle".
(IF it is valid then move to next check, else return from here with the fallacy name, must follow the rule)
2.Illicit Process of the Major (Illicit Major):
Check if the Major Term (P) is distributed in the Conclusion.
If YES, you MUST check if P is distributed in the Major Premise.
Failure: P is distributed in conclusion but NOT in premise = "Illicit Major".
(IF it is valid then move to next check, else return from here with the fallacy name)
3.Illicit Process of the Minor (Illicit Minor):
Check if the Minor Term (S) is distributed in the Conclusion.
If YES, you MUST check if S is distributed in the Minor Premise.
Failure: S is distributed in conclusion but NOT in premise = "Illicit Minor".
(IF it is valid then move to next check, else return from here with the fallacy name)
4.Exclusive Premises (The Two-Negative Rule):
Count the negative premises,not the conclusion. (E or O).
Failure: If there are two negative premises, no valid conclusion can be drawn = "Exclusive Premises".
(IF it is valid then move to next check, else return from here with the fallacy name)
5.Qualitative Balance:
If one premise is Negative, the conclusion MUST be negative.
If both premises are Affirmative, the conclusion MUST be affirmative.
Failure: Misalignment between premise quality and conclusion quality = "Fallacy of Affirmative Conclusion from Negative Premise" or vice versa.
(IF it is valid then move to next check, else return from here with the fallacy name)
6.Existential Fallacy (Boolean Interpretation):
Check if both premises are Universal (A or E) and the conclusion is Particular (I or O).
Failure: Drawing a specific "Some" from two "Alls" = "Existential Fallacy".
(IF it is valid then move to next check, else return from here with the fallacy name)

else branch:
=========================================
TASK 3: PROPOSITIONAL VALIDATION (PHASE 2B)
Analyze using ONLY the following specific syntax.

RULES OF INFERENCE (One-way implication '|-'):
1. Modus Ponens (MP): P -> Q, P |- Q
2. Modus Tollens (MT): P -> Q, ~Q |- ~P
3. Hypothetical Syllogism (HS): P -> Q, Q -> R |- P -> R
4. Disjunctive Syllogism (DS): P v Q, ~P |- Q
5. Constructive Dilemma (CD): (P -> Q) & (R -> S), P v R |- Q v S
6. Destructive Dilemma (DD): (P -> Q) & (R -> S), ~Q v ~S |- ~P v ~R
7. Simplification (Simp): P & Q |- P
8. Conjunction (Conj): P, Q |- P & Q
9. Addition (Add): P |- P v Q
10. Resolution (Res): P v Q, ~P v R |- Q v R

RULES OF REPLACEMENT (Two-way equivalence '<->'):
11. De Morgan’s Theorems (DeM):
    ~(P & Q) <-> (~P v ~Q)
    ~(P v Q) <-> (~P & ~Q)
12. Commutation (Com):
    (P v Q) <-> (Q v P)
    (P & Q) <-> (Q & P)
13. Association (Assoc):
    [P v (Q v R)] <-> [(P v Q) v R]
    [P & (Q & R)] <-> [(P & Q) & R]
14. Distribution (Dist):
    [P & (Q v R)] <-> [(P & Q) v (P & R)]
    [P v (Q & R)] <-> [(P v Q) & (P v R)]
15. Double Negation (DN):
    P <-> ~~P
16. Transposition (Trans):
    (P -> Q) <-> (~Q -> ~P)
17. Material Implication (Impl):
    (P -> Q) <-> (~P v Q)
18. Material Equivalence (Equiv):
    (P <-> Q) <-> [(P -> Q) & (Q -> P)]
    (P <-> Q) <-> [(P & Q) v (~P & ~Q)]
19. Exportation (Exp):
    [(P & Q) -> R] <-> [P -> (Q -> R)]
20. Tautology (Taut):
    P <-> (P v P)
    P <-> (P & P)

=========================================
OUTPUT FORMAT
=========================================
Return ONLY a raw JSON object.

{
  "valid": boolean,
  "type": "Categorical Syllogism" | "Propositional Logic",
  "mood": "AAA-1" | null,
  "details": {
    "major_term": "P",
    "minor_term": "S",
    "middle_term": "M"
  },
  "proof": [
    { "step": 1, "statement": "Symbolic form", "rule": "Premise/Rule Name" }
  ],
  "error": "Specific Fallacy Name (e.g., 'Illicit Major') or null"
}
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
        model: "tngtech/deepseek-r1t2-chimera:free", 
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userInput }
        ],
        temperature: 0 // CRITICAL: Zero temperature prevents "creative" hallucinations
      })
    });

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content;
    
    // Clean potential markdown wrapping
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
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