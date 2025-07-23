import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';
import { spawn } from 'child_process';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { imageDataUri } = await req.json();
    if (!imageDataUri || typeof imageDataUri !== 'string') {
      console.error('[tesseract-gemma] Missing or invalid imageDataUri');
      return NextResponse.json({ error: 'Missing or invalid imageDataUri' }, { status: 400 });
    }
    // Decode data URI
    const matches = imageDataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error('[tesseract-gemma] Invalid data URI');
      return NextResponse.json({ error: 'Invalid data URI' }, { status: 400 });
    }
    const buffer = Buffer.from(matches[2], 'base64');
    // Write to temp file
    const tmpFile = `./tmp-tess-${randomBytes(8).toString('hex')}.png`;
    await writeFile(tmpFile, buffer);
    // Run Tesseract
    let ocrText = '';
    try {
      ocrText = await new Promise<string>((resolve, reject) => {
        const proc = spawn('tesseract', [tmpFile, 'stdout', '-l', 'eng']);
        let out = '';
        let err = '';
        proc.stdout.on('data', (d) => (out += d.toString()));
        proc.stderr.on('data', (d) => (err += d.toString()));
        proc.on('close', (code) => {
          unlink(tmpFile).catch(() => {});
          if (code === 0) resolve(out.trim());
          else reject(new Error('Tesseract error: ' + err));
        });
      });
    } catch (err) {
      console.error('[tesseract-gemma] Tesseract error:', err);
      return NextResponse.json({ error: 'Tesseract error: ' + (err as Error).message }, { status: 500 });
    }
    if (!ocrText) {
      console.error('[tesseract-gemma] Tesseract OCR did not extract any text.');
      return NextResponse.json({ error: 'Tesseract OCR did not extract any text.' }, { status: 500 });
    }
    // Update the prompt for Gemma 3:4b via Ollama
    const prompt = `You are an expert at converting OCR-extracted text from chalkboard or handwritten notes into clean, readable HTML notes.\n\nInstructions:\n1. Do NOT mention or output sentiment anywhere.\n2. When converting to HTML, only use <h2> or <h3> for lines that are actual section titles or main keywords (such as 'Input', 'Output', 'Advantages', etc.). Do NOT make long sentences, random lines, or non-keyword text into headings or bold.\n3. Use <ul> and <li> for bullet points, and <strong> for bold text only if it was clearly bold in the original.\n4. The rest of the text should be normal paragraphs (<p>).\n5. Do NOT use Markdown, backslashes, or asterisks for formatting.\n6. The output should match the structure and style of the input notes exactly, but in HTML.\n7. Do NOT omit, summarize, or add any information.\n8. Do NOT add any explanations, introductions, or summaries.\n9. Do NOT include <!DOCTYPE>, <html>, or <body> tags.\n\nInput:\n${ocrText}`;
    let ollamaRes, ollamaData;
    try {
      ollamaRes = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemma3:4b', prompt, stream: false })
      });
      if (!ollamaRes.ok) {
        const errText = await ollamaRes.text();
        console.error('[tesseract-gemma] Ollama call failed:', errText);
        return NextResponse.json({ error: 'Ollama call failed: ' + errText }, { status: 500 });
      }
      ollamaData = await ollamaRes.json();
    } catch (err) {
      console.error('[tesseract-gemma] Ollama fetch error:', err);
      return NextResponse.json({ error: 'Ollama fetch error: ' + (err as Error).message }, { status: 500 });
    }
    const refinedText = ollamaData.response?.trim?.() || '';
    return NextResponse.json({ refinedText });
  } catch (err: any) {
    console.error('[tesseract-gemma] Unknown error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
} 