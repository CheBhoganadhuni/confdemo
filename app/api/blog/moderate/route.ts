import { NextResponse } from 'next/server'

const TAG_SYSTEM_PROMPTS: Record<string, string> = {
  'Meme': 'This is a meme or humor post. Allow funny content, jokes, relatable situations. Reject only if offensive, hateful, or sexual.',
  'Rant': 'This is a rant or frustration post. Allow venting, criticism of systems, colleges, recruiters. Reject only if it targets a specific individual by name with malicious intent, contains hate speech, or is sexually explicit.',
  'Mental Health': 'This post is about mental health. Be lenient — allow vulnerability, struggles, burnout. Reject only if it glorifies self-harm or suicide.',
  'Career': 'Career-related post. Allow salary discussions, job frustrations, placement experiences. Reject spam or fake opportunity scams.',
  'default': 'Student lifestyle post. Allow wide range of student experiences and opinions.'
}

export async function POST(req: Request) {
  try {
    const { title, body, tags } = await req.json() as {
      title: string
      body: string
      tags: string[]
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Fail open — don't block students due to missing config
      return NextResponse.json({ approved: true, reason: '' })
    }

    const tagPrompt = TAG_SYSTEM_PROMPTS[tags[0]] || TAG_SYSTEM_PROMPTS['default']

    const prompt = `You are a content moderator for a student learning platform in India.
Students post blogs, memes, rants, tech articles and life updates.

Context for this post type: ${tagPrompt}

ALWAYS APPROVE: tech content, career advice, study tips, memes, humor,
rants about college systems, movie/book/music opinions, project showcases,
personal experiences, motivational content, constructive criticism.

ALWAYS REJECT: hate speech targeting gender/religion/caste/race,
sexual content, content that names and attacks specific real individuals
with malicious intent, spam/advertisement, content promoting illegal activities.

Post title: ${title}
Post body (first 500 chars): ${body.slice(0, 500)}

Respond with ONLY valid JSON:
{ "approved": true/false, "reason": "brief reason if rejected, empty string if approved" }`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) {
      // Fail open
      return NextResponse.json({ approved: true, reason: '' })
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ approved: true, reason: '' })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      approved: !!parsed.approved,
      reason: parsed.reason || '',
    })
  } catch {
    // Fail open
    return NextResponse.json({ approved: true, reason: '' })
  }
}
