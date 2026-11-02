const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

let cachedGeminiModels: string[] | null = null;

export async function getSupportedGeminiModels(apiKey: string): Promise<string[]> {
  if (cachedGeminiModels && cachedGeminiModels.length > 0) {
    return cachedGeminiModels;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const available = (data.models || [])
        .filter(
          (m: any) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes('generateContent') &&
            m.name?.includes('gemini') &&
            !m.name?.includes('tts') &&
            !m.name?.includes('image') &&
            !m.name?.includes('embedding') &&
            !m.name?.includes('robotics') &&
            !m.name?.includes('computer-use')
        )
        .map((m: any) => m.name.replace('models/', ''));

      const merged = [...DEFAULT_GEMINI_MODELS];
      for (const modelName of available) {
        if (!merged.includes(modelName)) {
          merged.push(modelName);
        }
      }
      cachedGeminiModels = merged;
      return merged;
    }
  } catch (err) {
    // Fallback to default official Gemini models if discovery request fails
  }

  return DEFAULT_GEMINI_MODELS;
}

export function buildValidGeminiContents(
  history: Array<{ role: string; content: string }>,
  currentMessage: string
) {
  const rawTurns: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (Array.isArray(history)) {
    for (const h of history) {
      if (!h || typeof h.content !== 'string' || !h.content.trim()) continue;
      rawTurns.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        text: h.content.trim(),
      });
    }
  }

  rawTurns.push({
    role: 'user',
    text: currentMessage.trim(),
  });

  // Gemini API requires conversation history to start with a 'user' turn
  while (rawTurns.length > 0 && rawTurns[0].role !== 'user') {
    rawTurns.shift();
  }

  // Merge consecutive turns of the same role so user/model roles strictly alternate
  const mergedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const turn of rawTurns) {
    const prev = mergedContents[mergedContents.length - 1];
    if (prev && prev.role === turn.role) {
      prev.parts[0].text += `\n\n${turn.text}`;
    } else {
      mergedContents.push({
        role: turn.role,
        parts: [{ text: turn.text }],
      });
    }
  }

  return mergedContents;
}

