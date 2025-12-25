import express from 'express';
import 'dotenv/config';
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
You are a highly sophisticated formal logic validation agent.

Tasks:
- Analyze propositional logic arguments (Rules of Inference + Rules of Replacement)
- Analyze categorical syllogisms and always determine the mood explicitly (AAA-1, AAI-2, EAE-1, etc.)
- Determine if an argument is VALID or INVALID
- If valid, produce a step-by-step proof citing the rule used
- If invalid, clearly explain the logical flaw
- Provide detailed reasoning and explanations for every step
- Respond strictly in JSON; mood must be present (null only if argument is not categorical)

Rules of Inference: Modus Ponens, Modus Tollens, Hypothetical Syllogism, Disjunctive Syllogism, Addition, Simplification, Conjunction, Constructive Dilemma, Resolution, Double Negation, Absorption, Exportation

Rules of Replacement: De Morgan, Commutation, Association, Distribution, Material Implication, Biconditional, Transposition, Tautology

Categorical syllogisms:
- A (All S are P)
- E (No S are P)
- I (Some S are P)
- O (Some S are not P)

IMPORTANT:
- Always detect categorical arguments
- Always output correct mood for categorical syllogisms
- Provide clear, human-readable explanation along with formal proof
`;

const OUTPUT_FORMAT = `
Output format (JSON only):
{
  "valid": true | false,
  "proof": [
    { "step": 1, "statement": "...", "rule": "Premise" }
  ],
  "mood": "AAA-1" | "AAI-2" | "EAE-1" | "AII-1" | null,
  "error": null | "Reason argument is invalid",
  "explanation": "Detailed step-by-step explanation for the conclusion"
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
        "X-Title": "Logic Agent"
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

    // Clean Markdown JSON fences
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanJson);

      // Ensure mood and explanation are explicitly present
      if (parsed.mood === undefined) parsed.mood = null;
      if (parsed.explanation === undefined) parsed.explanation = "";

      return parsed;
    } catch {
      return {
        valid: false,
        proof: [],
        mood: null,
        error: "Model did not return valid JSON",
        explanation: "The AI response could not be parsed. Ensure the argument is in proper logical form."
      };
    }
  } catch (error) {
    console.error("Logic Engine Error:", error.message);
    return {
      valid: false,
      proof: [],
      mood: null,
      error: "Logic engine failure: " + error.message,
      explanation: "The AI model could not process the request. Check your API key or network connection."
    };
  }
}

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.post('/chat', async (req, res) => {
  const userInput = req.body?.userInput;
  if (!userInput) return res.status(400).json({ error: "No input provided" });

  const botResponse = await runChat(userInput);
  res.json({ response: botResponse });
});

app.listen(port, () => {
  console.log(`Logic Agent running at http://localhost:${port}`);
});
