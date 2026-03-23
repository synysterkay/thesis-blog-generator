import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const SYSTEM_PROMPT = `You are Thesis Generator's friendly and helpful support assistant. Your role is to help users with questions about Thesis Generator - an AI-powered thesis and academic writing generation platform.

Key information about Thesis Generator:
- Thesis Generator generates complete academic theses (90+ pages) with proper structure
- Features: Auto-generated tables & charts, PDF/DOCX/LaTeX export, human-like academic writing
- Pricing: Pro ($9/mo, 5 theses), Pro Unlimited ($19/mo, unlimited theses), One-time export ($4)
- Free tier: 1 thesis per month, 5 chapters max, basic text export
- Pro features: Unlimited thesis generation, tables & charts, priority support

Guidelines:
1. Be helpful, friendly, and concise
2. Answer questions about features, pricing, usage, and technical matters
3. If you cannot help with something or the user has a complex issue, suggest they email hello@thesisgenerator.tech
4. Do not make up features that don't exist
5. For account-specific issues, billing problems, or refund requests, direct them to email support
6. Keep responses brief and to the point (2-4 sentences when possible)

If the user asks something you can't help with, say something like:
"I'd recommend reaching out to our team directly at hello@thesisgenerator.tech for this. They'll be able to help you within 24 hours!"`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { message: "I'm currently offline. Please email us at hello@thesisgenerator.tech and we'll help you right away!" },
        { status: 200 }
      );
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('DeepSeek API error');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 
      "I'm having trouble right now. Please email hello@thesisgenerator.tech for assistance.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json(
      { message: "I apologize, but I'm experiencing technical difficulties. Please email us at hello@thesisgenerator.tech and we'll respond within 24 hours." },
      { status: 200 }
    );
  }
}
