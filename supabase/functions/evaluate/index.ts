import { serve } from 'https://deno.land/std@0.201.0/http/server.ts'

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

Be direct and specific. Write fixes as concrete rewrites, not abstract advice. Return only the JSON — no preamble, no markdown code blocks.`

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing Anthropic API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const emailText = body.emailText
  if (!emailText || typeof emailText !== 'string') {
    return new Response(JSON.stringify({ error: 'emailText is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const prompt = `${SYSTEM_PROMPT}\n\nEMAIL:\n${emailText}`

  const response = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      prompt,
      max_tokens_to_sample: 1500,
      temperature: 0.0
    })
  })

  const result = await response.json()
  let text = result?.completion || result?.output || result?.text || ''
  if (!text && result?.data && Array.isArray(result.data)) {
    text = result.data.map((item: any) => item.text || item.content).filter(Boolean).join('\n')
  }

  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/m)
    if (match) {
      try {
        parsed = JSON.parse(match[0])
      } catch {
        parsed = null
      }
    }
  }

  if (!parsed) {
    return new Response(JSON.stringify({ error: 'Failed to parse JSON from AI response', raw: text }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
