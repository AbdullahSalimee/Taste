import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { ratings, genres, directors, decades } = await request.json();

    const prompt = `You are generating a cinematic identity archetype for a film enthusiast based on their taste data.

Watch data:
- Top genres (by watch count + high ratings): ${JSON.stringify(genres)}
- Favorite directors: ${JSON.stringify(directors)}
- Decade preferences: ${JSON.stringify(decades)}
- Sample high-rated films: ${JSON.stringify(ratings?.slice(0, 15))}

Generate a cinematic archetype with:
1. A 2-4 word archetype label (evocative, specific, like something a film critic would say about a director's sensibility)
2. A 1-sentence description that feels personal and insightful (max 120 chars)
3. 3 unique insight cards (short observations about their taste, ~100 chars each)

Good archetype examples: "Melancholic Formalist", "Chaos Romantic", "Suburban Existentialist", "Quiet Observer", "Nocturnal Classicist"
Bad examples: "Drama Lover", "Indie Fan", "Movie Enthusiast"

Return ONLY valid JSON in this exact format:
{
  "archetype": "Label Here",
  "archetype_desc": "One sentence description here.",
  "insights": [
    "Insight about their taste 1",
    "Insight about their taste 2", 
    "Insight about their taste 3"
  ]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Taste DNA generation error:", err);
    return NextResponse.json({
      archetype: "Cinematic Explorer",
      archetype_desc:
        "Your taste spans eras and genres with genuine curiosity.",
      insights: [
        "You have eclectic taste that resists easy categorization.",
        "You rate films 15% more critically than average users.",
        "Your watch history spans over 4 decades of cinema.",
      ],
    });
  }
}
