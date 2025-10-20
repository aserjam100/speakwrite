import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text, prompt } = await request.json();

    if (!text || !prompt) {
      return NextResponse.json(
        { error: "Missing text or prompt" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `I'm practicing writing. The prompt was: "${prompt}"

Here's what I wrote:

"${text}"

Please provide constructive feedback on my writing. Focus on:
1. How well I addressed the prompt
2. Clarity and coherence of ideas
3. Vocabulary and word choice
4. Grammar and sentence structure
5. Engagement and descriptive quality

Please organize your feedback in 3-4 short paragraphs:
- First paragraph: What I did well
- Second paragraph: Areas for improvement with specific examples
- Third paragraph: 2-3 practical tips for next time

Keep the tone encouraging and supportive. Be specific and actionable.`,
        },
      ],
    });

    const feedback = message.content[0].text;

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error analyzing writing:", error);
    return NextResponse.json(
      { error: "Failed to analyze writing", details: error.message },
      { status: 500 }
    );
  }
}
