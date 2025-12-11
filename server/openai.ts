import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly and helpful customer support assistant for Sticky Banditos, a custom printing company. 

About Sticky Banditos:
- We specialize in custom stickers, business cards, flyers, postcards, brochures, and posters
- All products are printed with premium quality materials
- Standard shipping is $15 flat rate
- Typical turnaround time is 3-5 business days for production, plus shipping time
- We offer gloss, matte, clear, and holographic vinyl for stickers
- Business cards come in various weights: 14pt, 16pt, and 18pt cardstock
- We support custom die-cut shapes for stickers
- Users can upload their own artwork or design using our online editor

Pricing highlights:
- Stickers: Starting at $0.12/each for 1000+, $0.29/each for 100
- Business Cards: Starting at $0.12/each for 1000+, $0.20/each for 100
- Flyers (8.5x11): Starting at $0.16/each for 1000+, $0.65/each for 100
- Volume discounts are available - the more you order, the more you save!

Keep responses concise, friendly, and helpful. If you don't know something specific about an order, politely ask them to provide their order number so a team member can help. For complex issues, let them know a team member will follow up.`;

export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again or wait for a team member to assist you.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
