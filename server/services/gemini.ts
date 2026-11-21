const DEFAULT_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

const EXCLUDED_MODEL_PATTERNS = [
  'gemini-1.',
  'gemini-2.0',
  'gemini-2.5',
  'pro-latest',
  'tts',
  'image',
  'embedding',
  'robotics',
  'computer-use',
  'transcribe',
  'omni',
  'customtools',
  'antigravity',
  'deep-research',
  'lyria',
  'nano-banana',
];

const DISCOVERY_CACHE_TTL_MS = 30 * 60 * 1000;
const COOLDOWN_429_MS = 10 * 60 * 1000;
const COOLDOWN_503_MS = 2 * 60 * 1000;

let cachedDiscovery: { apiKey: string; models: string[]; expiresAt: number } | null = null;
const modelCooldowns = new Map<string, number>();

export function markGeminiModelFailure(modelName: string, status: number): void {
  if (!modelName) return;
  if (status === 404) {
    modelCooldowns.set(modelName, Infinity);
  } else if (status === 429) {
    modelCooldowns.set(modelName, Date.now() + COOLDOWN_429_MS);
  } else if (status === 503 || status === 0 || status >= 500) {
    modelCooldowns.set(modelName, Date.now() + COOLDOWN_503_MS);
  }
}

function isSupportedFlashModel(model: any): boolean {
  if (
    !Array.isArray(model?.supportedGenerationMethods) ||
    !model.supportedGenerationMethods.includes('generateContent') ||
    typeof model?.name !== 'string'
  ) {
    return false;
  }

  const lower = model.name.replace(/^models\//, '').toLowerCase();
  if (!lower.includes('gemini') || !lower.includes('flash')) {
    return false;
  }

  return !EXCLUDED_MODEL_PATTERNS.some((pattern) => lower.includes(pattern));
}

function applyOverrideAndCooldown(baseModels: string[]): string[] {
  const override = process.env.GEMINI_MODEL?.trim();
  const candidates = override
    ? [override, ...baseModels.filter((m) => m !== override)]
    : [...baseModels];

  const now = Date.now();
  for (const [name, until] of modelCooldowns.entries()) {
    if (until !== Infinity && until <= now) {
      modelCooldowns.delete(name);
    }
  }

  const non404 = candidates.filter((m) => modelCooldowns.get(m) !== Infinity);
  const active = non404.filter((m) => {
    const until = modelCooldowns.get(m);
    return until === undefined || until <= now;
  });

  return active.length > 0 ? active : non404;
}

export async function getSupportedGeminiModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (
    cachedDiscovery &&
    cachedDiscovery.apiKey === apiKey &&
    cachedDiscovery.expiresAt > now &&
    cachedDiscovery.models.length > 0
  ) {
    return applyOverrideAndCooldown(cachedDiscovery.models);
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      const available: string[] = (data.models || [])
        .filter(isSupportedFlashModel)
        .map((m: any) => m.name.replace(/^models\//, ''));

      if (available.length > 0) {
        const availableSet = new Set(available);
        const prioritized = DEFAULT_GEMINI_MODELS.filter((m) => availableSet.has(m));
        for (const modelName of available) {
          if (!prioritized.includes(modelName)) {
            prioritized.push(modelName);
          }
        }
        cachedDiscovery = {
          apiKey,
          models: prioritized,
          expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS,
        };
        return applyOverrideAndCooldown(prioritized);
      }
    }
  } catch {
    // Fallback to default official Gemini models if discovery request fails
  }

  return applyOverrideAndCooldown(DEFAULT_GEMINI_MODELS);
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

