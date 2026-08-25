import { NextResponse } from 'next/server';
import { executeAiInference } from '@/lib/aiService';

// TODO: Add rate limiting and authentication for production
export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const {
      prompt,
      conversationHistory = [],
      provider = 'gemini',
      model = 'gemini-2.5-flash',
      apiKey,
      temperature = 0.3,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemInstruction = `You are "Professor Pharma AI", an expert Australian Clinical Pharmacy Tutor, Board Examiner, and OPRA (Overseas Pharmacist Readiness Assessment) mentor.
Guidelines for your responses:
- Reference authentic Australian sources: Australian Medicines Handbook (AMH), Therapeutic Guidelines (eTG), Australian Pharmaceutical Formulary (APF), PBS, and Pharmacy Board of Australia standards.
- Provide bilingual clarity: Detailed explanations in Persian with all key medical terms, drug names, and clinical mnemonics in English.
- Highlight Australian caution labels (CAL A-L), Narrow Therapeutic Index (NTI), S4 vs S8 scheduling, and practical dispensing advice.
- When answering questions, include clinical pearls, diagnostic tests, or OPRA exam traps.
- Use clear markdown with bullet points and bolding for high readability.`;

    let fullPrompt = prompt;
    if (conversationHistory.length > 0) {
      const historyContext = conversationHistory
        .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');
      fullPrompt = `Previous Conversation Context:\n${historyContext}\n\nCurrent User Question:\n${prompt}`;
    }

    const text = await executeAiInference({
      provider,
      model,
      userApiKey: apiKey,
      prompt: fullPrompt,
      systemInstruction,
      responseFormat: 'text',
      temperature,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error in AI tutor endpoint:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI tutor request' },
      { status: 500 }
    );
  }
}
