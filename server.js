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
You are a formal logic validation agent.

Tasks:
- Analyze propositional logic arguments using Rules of Inference and Rules of Replacement
- Analyze categorical syllogisms and ALWAYS determine the correct mood (AAA-1, AAI-2, EAE-1, etc.)
- Determine whether the argument is VALID or INVALID
- If valid, provide a step-by-step formal proof citing the rule used
- If invalid, clearly explain the logical error or fallacy
- Respond STRICTLY in valid JSON

Rules of Inference:
Modus Ponens, Modus Tollens, Hypothetical Syllogism, Disjunctive Syllogism,
Addition, Simplification, Conjunction, Constructive Dilemma, Resolution,
Double Negation, Absorption, Exportation

Rules of Replacement:
De Morgan, Commutation, Association, Distribution,
Material Implication, Biconditional, Transposition, Tautology

Categorical Propositions:
A (All S are P)
E (No S are P)
I (Some S are P)
O (Some S are not P)

IMPORTANT:
- Always detect categorical syllogisms
- Always output the correct mood
- Mood must NEVER be wrong
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
  console.log(`Logic Agent running at http://localhost:${port}`);
});
