import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }
    // Call Ollama Gemma 3:4b locally
    const prompt = `Refine and correct the following OCR-extracted text from a chalkboard or handwritten notes.\n- Fix spelling and formatting errors.\n- Structure the output as clean, readable notes.\n- Use headings, bullet points, and lists if appropriate.\n- Do not add content that is not present in the original text.\n- Return only the improved, clean version.\n\n${text}`;
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemma3:4b', prompt, stream: false })
    });
    if (!ollamaRes.ok) {
      return NextResponse.json({ error: 'Ollama call failed' }, { status: 500 });
    }
    const ollamaData = await ollamaRes.json();
    const refinedText = ollamaData.response?.trim?.() || '';
    return NextResponse.json({ refinedText });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
} 