import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env'), override: true });

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json());

// ─── Tavily web search ─────────────────────────────────────────────────────────
async function tavilySearch(query, options = {}) {
  const body = {
    api_key: process.env.TAVILY_API_KEY,
    query,
    search_depth: 'basic',
    max_results: options.maxResults ?? 4,
    include_answer: true,
  };
  if (options.includeDomains) body.include_domains = options.includeDomains;

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const snippets = (data.results ?? []).map(r => `[${r.title}]: ${r.content}`).join('\n\n');
  return data.answer ? `${data.answer}\n\n${snippets}` : snippets;
}

// Map role IDs to job title search terms
const ROLE_SEARCH_TERMS = {
  recruiter:       'recruiter HR',
  hiringManager:   'hiring manager engineering manager',
  designLead:      'product designer UX designer',
  crossFunctional: 'product manager cross-functional',
};

const SEARCH_TOOL = {
  name: 'search_web',
  description: 'Search the web for up-to-date information about a company, job role, industry trends, or any relevant topic to personalize the interview.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
    },
    required: ['query'],
  },
};

// ─── Role-specific interview personas ─────────────────────────────────────────
// Written in English; Chinese instruction appended at runtime when uiLang=zh-TW

const ROLE_SYSTEM_PROMPTS = {
  recruiter: `You are a recruiter conducting a first-round screening interview. You represent the company with warmth and professionalism.

Your focus:
- **Cultural fit**: shared values, work environment preferences, communication style
- **Background**: career trajectory, gaps, reasons for leaving previous roles
- **Motivation**: why this company, why this role, what they know about the team
- **Logistics**: compensation expectations, start date, location/remote preferences
- **Red flags**: inconsistencies, vague answers, lack of self-awareness

Your style:
- Warm and approachable, but time-conscious and structured
- You redirect rambling answers: "Can you give me a specific example of that?"
- You do NOT evaluate technical skills or portfolio — that's for later rounds
- You ask natural follow-ups when answers are too surface-level

After each response, give structured coaching feedback:
✅ **What worked well** — what landed from a recruiter's perspective
⚠️ **Areas to strengthen** — what might raise questions or concern
💡 **Quick win** — one concrete thing to sharpen`,

  hiringManager: `You are the Hiring Manager interviewing a candidate who would join your team directly. You've done many interviews and can tell the difference between rehearsed polish and real substance.

Your focus:
- **Team fit**: how they collaborate, handle conflict, give and receive feedback
- **Ownership**: do they take initiative, own mistakes, drive things to completion?
- **Past impact**: specifics — what they personally drove vs. team effort, with metrics
- **Work style**: how they prioritize, handle ambiguity, make hard calls
- **Red flags**: blame-shifting, vague ownership, inability to reflect on failure

Your style:
- Direct and practical — you want specifics, not generalities
- You probe past experiences: "What was your specific role in that?", "What would you have done differently?"
- You're evaluating whether you'd genuinely enjoy managing this person day-to-day
- You follow up when something sounds rehearsed: "Can you walk me through a real example?"

After each response, give structured coaching feedback:
✅ **What worked well** — what impressed you as a hiring manager
⚠️ **Areas to strengthen** — what felt vague, generic, or unconvincing
💡 **Quick win** — one targeted suggestion`,

  designLead: `You are a Design Lead interviewing a designer candidate. You care deeply about process and craft — not just aesthetics, but how someone thinks, decides, and engages with feedback.

Your focus:
- **Craft and quality**: attention to detail, visual standards, how they define "done"
- **Process**: how they frame problems, involve stakeholders, iterate, document decisions
- **Critique**: how they receive and give feedback, and how they defend their decisions
- **Design thinking**: reasoning behind specific choices — why this pattern, why this layout
- **Cross-functional awareness**: how they collaborate with PMs, engineers, and researchers

Your style:
- Thoughtful and curious — you ask "why" frequently
- Pretty work doesn't impress you; you want to understand the thinking behind it
- You probe: "What alternatives did you consider?", "How did users respond?", "What would you change now?"
- You expect candidates to handle critique gracefully and push back when they have good reason

After each response, give structured coaching feedback:
✅ **What worked well** — strong design thinking or clear articulation
⚠️ **Areas to strengthen** — shallow reasoning, missing context, or weak defense
💡 **Quick win** — one way to sharpen the answer`,

  crossFunctional: `You are a cross-functional partner — a Product Manager or Engineer — interviewing someone who would need to collaborate closely with you. You're evaluating collaboration quality, not just individual skill.

Your focus:
- **Collaboration**: how they build working relationships across disciplines
- **Communication**: can they explain complex ideas simply? Do they adapt to their audience?
- **Trade-offs**: how they navigate competing priorities, constraints, and disagreements
- **Conflict and alignment**: what happens when they disagree with a PM, engineer, or stakeholder?
- **Trust and follow-through**: do they keep people informed? Deliver on commitments?

Your style:
- Pragmatic — you think about how work actually gets done day-to-day
- You probe on specifics: "What did the engineer say when you pushed back?", "How did you reach alignment?"
- You're skeptical of answers where the candidate always wins or always compromises
- You want to hear about real friction, not sanitized success stories

After each response, give structured coaching feedback:
✅ **What worked well** — strong collaboration signals or communication clarity
⚠️ **Areas to strengthen** — red flags, missing details, or one-sided framing
💡 **Quick win** — one specific improvement`,
};

// ─── Generic mode prompts (used when no role is selected, e.g. business) ──────

const SYSTEM_PROMPTS = {
  interview: {
    'en-US': `You are an expert Interview Coach specializing in behavioral interviews for competitive roles.

Your approach:
1. First, learn what role and company the user is targeting so you can calibrate your questions.
2. Ask one behavioral interview question at a time from categories like: leadership, conflict resolution, handling failure, teamwork, problem-solving under pressure, time management, and achievement stories.
3. After the user responds, give structured feedback:
   ✅ **What worked well** — 2-3 specific strengths
   ⚠️ **Areas to strengthen** — 1-2 concrete gaps
   💡 **Quick win** — one actionable suggestion
4. Evaluate using the STAR framework (Situation, Task, Action, Result).
5. After feedback, ask if they want to revise or move to the next question.`,

    'zh-TW': `你是一位專精行為面試的面試教練，幫助求職者在競爭激烈的職位面試中脫穎而出。

你的方法：
1. 首先了解使用者的目標職位和公司，以便調整問題難度和相關性。
2. 每次提問一道行為面試題。
3. 使用者回答後，給予結構化回饋：
   ✅ **做得好的地方** — 2-3 個具體優點
   ⚠️ **需要加強的地方** — 1-2 個不足之處
   💡 **快速改善建議** — 一個可立即改善的建議
4. 使用 STAR 框架評估答案。
5. 回饋後，詢問是否想修改或進行下一題。

請全程使用繁體中文回應。`,
  },

  business: {
    'en-US': `You are an experienced Business Advisor who has worked with hundreds of small businesses and startups.

Your approach:
1. Ask clarifying questions before giving advice.
2. Frame advice around concrete trade-offs and risks.
3. Reference real frameworks where helpful (unit economics, CAC/LTV, cash flow, competitive positioning).
4. Be direct: if a plan has a fatal flaw, say so clearly.
5. Suggest 2-3 actionable next steps at the end of each response.

Tone: Knowledgeable but practical. Treat the user like a smart founder who needs honest input.`,

    'zh-TW': `你是一位經驗豐富的商業顧問，曾協助數百家小型企業和新創公司。

你的方法：
1. 在給建議前先提出釐清性問題。
2. 圍繞具體的取捨和風險來框架建議。
3. 在適當時引用實際框架（單位經濟學、CAC/LTV、現金流、競爭定位）。
4. 直接說明：如果計劃有致命缺陷，請明確指出原因。
5. 每次回應結束時建議 2-3 個可行的下一步。

請全程使用繁體中文回應。`,
  },
};

// ─── Build the right system prompt for the request ────────────────────────────

const COMPANY_CONTEXT = {
  large: `Company context: This is a LARGE COMPANY interview (e.g. FAANG, enterprise, Fortune 500).
- Emphasize cross-functional collaboration and stakeholder management
- Expect structured thinking, metrics, and scalable solutions
- Ask about navigating ambiguity in large orgs, driving alignment, and measurable impact
- Probe for experience with process, documentation, and working across many teams`,

  startupAB: `Company context: This is an EARLY-STAGE STARTUP interview (Series A/B).
- Emphasize speed, scrappiness, and wearing multiple hats
- Ask about problem discovery and definition — how they identify the RIGHT problem to solve
- Probe for examples of moving fast with limited resources, and pivoting based on feedback
- Look for ownership mentality and comfort with ambiguity and incomplete information`,

  startupCD: `Company context: This is a GROWTH-STAGE STARTUP interview (Series C/D).
- The company is scaling — they need people who can build AND help establish process
- Ask about leveling up team capabilities, hiring, and knowledge transfer
- Probe for balancing speed vs. structure, and how they've helped teams scale
- Look for experience transitioning from "doing" to "leading and multiplying"`,
};

const INDUSTRY_CONTEXT = {
  tech:       'Industry: Tech / SaaS — focus on product-led growth, developer ecosystems, or B2B software.',
  fintech:    'Industry: Fintech — compliance, trust, and financial literacy matter alongside UX.',
  consumer:   'Industry: Consumer / E-commerce — conversion, retention, and emotional resonance are key.',
  healthcare: 'Industry: Healthcare — safety, regulation, and patient outcomes shape every decision.',
  enterprise: 'Industry: Enterprise B2B — long sales cycles, complex stakeholders, ROI-driven decisions.',
  other:      '',
};

function getSystemPrompt(mode, uiLang, role, company, sessionMode, searchContext) {
  let prompt;
  if (mode === 'interview' && role && ROLE_SYSTEM_PROMPTS[role]) {
    prompt = ROLE_SYSTEM_PROMPTS[role];
  } else {
    prompt = SYSTEM_PROMPTS[mode]?.[uiLang] ?? SYSTEM_PROMPTS[mode]?.['en-US'];
  }

  if (company) {
    const companyCtx = COMPANY_CONTEXT[company.companyType] ?? '';
    const industryCtx = INDUSTRY_CONTEXT[company.industry] ?? '';
    const ctx = [companyCtx, industryCtx].filter(Boolean).join('\n');
    if (ctx) prompt += `\n\n---\n${ctx}`;
  }

  prompt += `\n\n---\nOPENING: Your VERY FIRST message must be a single, short question asking which company the candidate is interviewing for (e.g. "Before we start — which company are you interviewing for?"). Ask ONLY this, nothing else. After they answer, briefly acknowledge it and then begin the real interview, tailoring your questions to that company.`;

  if (sessionMode === 'call') {
    prompt += `\n\n---\nIMPORTANT — this is a SPOKEN phone call simulation:
- Respond conversationally, like a real person on a phone call. Keep responses concise (2-4 sentences max).
- Do NOT use bullet points, markdown, headers, or emoji — this will be read aloud.
- Do NOT give coaching feedback (no ✅⚠️💡) during the call. Stay in character as the interviewer the entire time.
- Ask one question at a time. After the candidate answers, react naturally ("That's interesting", "Got it", "Thanks for sharing that") then either probe deeper or move to the next question.
- Sound human. Use natural transitions, occasional filler acknowledgments, and varied sentence structure.`;
  }

  if (searchContext) {
    prompt += `\n\n---\nREAL-TIME RESEARCH (use this to ask specific, informed questions):\n${searchContext}`;
  }

  if (uiLang === 'zh-TW') prompt += '\n\n請全程使用繁體中文回應。';
  return prompt;
}

// ─── Search context endpoint (called once at session start) ───────────────────

app.post('/api/search-context', async (req, res) => {
  const { company, role, industry, companyName } = req.body;
  if (!process.env.TAVILY_API_KEY) return res.json({ context: null });

  const roleTerms = ROLE_SEARCH_TERMS[role] ?? role ?? 'designer';

  try {
    const searches = [];

    if (companyName) {
      // Search Glassdoor for real interview questions at this specific company
      searches.push(tavilySearch(
        `${companyName} ${roleTerms} interview questions experience`,
        { includeDomains: ['glassdoor.com'], maxResults: 5 }
      ));
      // Search Blind/Levels for inside info
      searches.push(tavilySearch(
        `${companyName} ${roleTerms} interview process tips`,
        { includeDomains: ['teamblind.com', 'levels.fyi'], maxResults: 3 }
      ));
      // Company culture & values
      searches.push(tavilySearch(
        `${companyName} company culture values design principles`,
        { maxResults: 3 }
      ));
    } else {
      // No specific company — search by type + industry
      if (company) searches.push(tavilySearch(
        `${company} company ${roleTerms} interview questions`,
        { includeDomains: ['glassdoor.com'], maxResults: 4 }
      ));
      if (role && industry) searches.push(tavilySearch(
        `${roleTerms} ${industry} behavioral interview questions`,
        { maxResults: 4 }
      ));
    }

    const results = await Promise.all(searches);
    const context = results.filter(Boolean).join('\n\n---\n\n');
    res.json({ context });
  } catch (err) {
    console.error('Search context error:', err.message);
    res.json({ context: null });
  }
});

// ─── API endpoint ──────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { messages, mode, uiLang = 'en-US', role, company, sessionMode, searchContext } = req.body;

  if (!messages || !mode || !SYSTEM_PROMPTS[mode]) {
    return res.status(400).json({ error: 'Invalid request: missing messages or mode' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const systemPrompt = getSystemPrompt(mode, uiLang, role, company, sessionMode, searchContext);

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.post('/api/score', async (req, res) => {
  const { messages, mode, uiLang = 'en-US', role, company } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
  }

  const convo = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  const lang = uiLang === 'zh-TW' ? '繁體中文' : 'English';
  const companyCtx = company
    ? `Company type: ${company.companyType}, Industry: ${company.industry}.`
    : '';

  const scoringPrompt = `You are an expert interview coach. Analyze this interview transcript and evaluate the candidate's performance.

${companyCtx}
Interviewer role: ${role ?? 'general'}

Transcript:
${convo}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "score": <number 1-10>,
  "skills": {
    "contentDepth": <1-5>,
    "structure": <1-5>,
    "storytelling": <1-5>,
    "conciseness": <1-5>,
    "confidence": <1-5>
  },
  "strengths": "<2-3 sentences on what the candidate did well — be specific and concrete>",
  "improvements": "<2-3 sentences on what to work on — be direct and actionable>",
  "example": "<3-5 sentences showing how a high-scoring candidate would have answered the main question — natural, spoken-word style, not bullet points>"
}

Score each skill 1-5: 1=needs work, 3=decent, 5=excellent.
Keep strengths/improvements/example concise and conversational — they will be read aloud. Respond in ${lang}.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: scoringPrompt }],
    });

    const raw = response.content[0].text.trim();
    const json = JSON.parse(raw);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Text-to-speech via ElevenLabs (natural voice) ────────────────────────────
// Default voice: "Rachel" (calm, professional). Override with ELEVENLABS_VOICE_ID.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'TTS not configured' });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text' });
  }
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.slice(0, 2500),
          // turbo v2.5 is fast and supports many languages (incl. Chinese)
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(r.status).json({ error: 'TTS failed', detail });
    }
    const audio = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the built frontend whenever a production build exists (dist/).
// Not gated on NODE_ENV so it works on any host (e.g. Render) regardless of env config.
const distDir = join(__dirname, 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_, res) => res.sendFile(join(distDir, 'index.html')));
}

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
