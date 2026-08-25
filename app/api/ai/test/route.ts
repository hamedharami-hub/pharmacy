import { NextResponse } from 'next/server';
import { executeAiInference } from '@/lib/aiService';
import { AiProvider } from '@/types/pharmacy';

// TODO: Add rate limiting and authentication for production
export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { provider = 'gemini', model = 'gemini-2.5-flash', apiKey } = body;

    const testPrompt = 'Hello! In 1 short sentence, confirm you are active for clinical pharmacology review.';
    const systemInstruction = 'You are an Australian clinical pharmacy AI assistant. Respond concisely.';

    const responseText = await executeAiInference({
      provider: provider as AiProvider,
      model,
      userApiKey: apiKey,
      prompt: testPrompt,
      systemInstruction,
      temperature: 0.1,
    });

    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'اتصال با موفقیت برقرار شد!',
      responseText: responseText.trim(),
      elapsedMs,
      model,
      provider,
    });
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'خطا در برقراری ارتباط با مدل هوش مصنوعی',
        elapsedMs,
      },
      { status: 500 }
    );
  }
}
