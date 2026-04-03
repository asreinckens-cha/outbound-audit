const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Anthropic = require('@anthropic-ai/sdk');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert outbound sales email auditor trained on the best GTM frameworks. Evaluate the email or sequence provided and return ONLY a valid JSON object with this exact structure:

{
  "overall_score": <integer 1-10>,
  "verdict": "<one sentence summary>",
  "issues": [
    {
      "rule": "<rule name>",
      "problem": "<what is wrong>",
      "fix": "<concrete rewrite or fix>"
    }
  ],
  "rewrite": "<full rewritten version if score < 7, otherwise null>"
}

Evaluate strictly against these 10 rules:

RULE 1 — LENGTH: Each email must be ideally max 75 words. Subject line must be ideally under 6 words. Flag any that exceed this.

RULE 2 — STRUCTURE: Must follow Problem → Solution → CTA. Flag emails that open with a company/product introduction instead of the prospect's problem.

RULE 3 — CTA: Must be a simple ask ("reply yes/no", "ping me for me info",) or a pointed question ("How are you currently evaluating {problm}?"), not a calendar link in message 1. One CTA per email only.

RULE 4 — SIGNAL/TRIGGER: The email should reference a specific reason for reaching out (regulatory change, hiring, event, competitor, recent news). Flag generic outreach with no trigger.

RULE 5 — AI/GENERIC LANGUAGE: Flag these exact phrases and their variants: "I hope this message finds you well", "I wanted to reach out", "leverage", "game-changing", "cutting-edge", "I came across your profile", "at the forefront", "revolutionize", "synergies", "I'd love to connect". These phrases kill reply rates.

RULE 6 — PVP (PERMISSIONLESS VALUE PROP): Message 1 must lead with insight or value, not a product pitch. Flag any message 1 that pitches features or asks for a meeting upfront.

RULE 7 — SEQUENCE VARIETY: In a multi-email sequence, each follow-up must introduce a new angle, case study, or insight — not simply reference the previous email. Flag "following up on my previous email" structure.

RULE 8 — SOCIAL PROOF: Concrete numbers are required when making performance claims. Flag vague claims like "improves efficiency" or "saves time" where a specific metric (e.g. "cuts module creation from 3 weeks to 2 hours") could replace them.

RULE 9 — PERSONALIZATION: Must include at least one contextual element specific to the prospect beyond [First Name] and [Company Name]. Generic personalization does not count.

Be direct and specific. Write fixes as concrete rewrites, not abstract advice. Return only the JSON — no preamble, no markdown code blocks.`;

app.post('/api/evaluate', async (req, res) => {
  try {
    const { emailText } = req.body;
    if (!emailText) return res.status(400).json({ error: 'emailText is required' });

    const prompt = `${SYSTEM_PROMPT}\n\nEMAIL:\n${emailText}`;

    const response = await client.complete({
      model: 'claude-3-5-sonnet-20241022',
      prompt,
      max_tokens_to_sample: 1500,
      temperature: 0.0,
    });

    // Try common fields where the SDK may return text
    let text = response?.completion || response?.completion?.text || response?.text || response?.output || '';

    // Fallback: some SDK versions return { data: [{content: "...")] }
    if (!text && response?.data && Array.isArray(response.data)) {
      text = response.data.map(d => d.text || d.content).filter(Boolean).join('\n');
    }

    // Attempt to parse JSON directly, otherwise extract JSON substring
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const m = text.match(/\{[\s\S]*\}/m);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e) { /* ignore */ }
      }
    }

    if (!parsed) {
      return res.status(500).json({ error: 'Failed to parse JSON from AI response', raw: text });
    }

    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`OutboundAudit backend listening on ${port}`));
