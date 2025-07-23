// src/ai/ollama.ts
export async function callOllamaGemma(
  prompt: string,
  images?: string[]
): Promise<string> {
  const body: any = {
    model: 'gemma3:4b', // Use Gemma 3:4b for all tasks
    prompt,
    stream: false
  };
  if (images && images.length > 0) {
    body.images = images.map(img =>
      img.replace(/^data:image\/(png|jpeg);base64,/, '')
    );
  }
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Ollama call failed');
  const data = await response.json();
  return data.response;
}
