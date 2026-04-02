import type { CardIdentity } from "@vaultlore/shared";
import { featuredCards } from "@vaultlore/shared";

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export type ScanMatch = Pick<
  CardIdentity,
  "id" | "title" | "category" | "subjectName" | "setName" | "year"
>;

export type ScanAnalysisResult = {
  confidence: number;
  matches: ScanMatch[];
  categoryDetected: string | null;
  provider: string;
};

export type ScanInput = {
  frontImageUrl: string | null;
  backImageUrl: string | null;
  categoryHint: string | null;
};

export interface ScanProvider {
  name: string;
  analyze(input: ScanInput): Promise<ScanAnalysisResult>;
}

// ---------------------------------------------------------------------------
// Stub provider (seed-data, no remote calls)
// ---------------------------------------------------------------------------

export class StubScanProvider implements ScanProvider {
  readonly name = "stub";

  async analyze(input: ScanInput): Promise<ScanAnalysisResult> {
    const candidates = input.categoryHint
      ? featuredCards.filter((c) => c.category === input.categoryHint)
      : featuredCards;

    const matches = candidates.slice(0, 2).map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      subjectName: c.subjectName,
      setName: c.setName ?? null,
      year: c.year ?? null
    }));

    return {
      confidence: 0.72,
      matches,
      categoryDetected: input.categoryHint ?? (matches[0]?.category ?? null),
      provider: this.name
    };
  }
}

// ---------------------------------------------------------------------------
// Google Cloud Vision provider
// ---------------------------------------------------------------------------

export class GoogleVisionScanProvider implements ScanProvider {
  readonly name = "google-vision";

  constructor(private readonly apiKey: string) {}

  async analyze(input: ScanInput): Promise<ScanAnalysisResult> {
    const imageUrl = input.frontImageUrl ?? input.backImageUrl;
    if (!imageUrl) {
      return fallbackToStub(input, this.name);
    }

    const endpoint =
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;

    const body = {
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "TEXT_DETECTION", maxResults: 1 }
          ]
        }
      ]
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        return fallbackToStub(input, this.name);
      }

      const json = (await response.json()) as {
        responses?: Array<{
          labelAnnotations?: Array<{ description: string; score: number }>;
          textAnnotations?: Array<{ description: string }>;
        }>;
      };

      const annotations = json.responses?.[0]?.labelAnnotations ?? [];
      const detectedText = json.responses?.[0]?.textAnnotations?.[0]?.description ?? "";
      const topLabel = annotations[0]?.description?.toLowerCase() ?? "";
      const confidence = annotations[0]?.score ?? 0.5;

      // Derive a category from Vision labels using a simple keyword map
      const categoryDetected = deriveCategory(topLabel, detectedText, input.categoryHint);

      // Search seed data with the detected category as a hint
      const candidates = categoryDetected
        ? featuredCards.filter((c) => c.category === categoryDetected)
        : featuredCards;

      const matches = candidates.slice(0, 3).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        subjectName: c.subjectName,
        setName: c.setName ?? null,
        year: c.year ?? null
      }));

      return {
        confidence,
        matches,
        categoryDetected,
        provider: this.name
      };
    } catch {
      return fallbackToStub(input, this.name);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fallbackToStub(input: ScanInput, providerName: string): Promise<ScanAnalysisResult> {
  const stub = new StubScanProvider();
  const result = await stub.analyze(input);
  return { ...result, provider: `${providerName}:fallback` };
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "sports-cards": ["baseball", "basketball", "football", "nfl", "nba", "mlb", "athlete", "sport"],
  "pokemon": ["pokemon", "pikachu", "trainer", "energy", "charizard", "pokémon"],
  "trading-cards": ["magic", "mtg", "yugioh", "yu-gi-oh", "card game", "spell", "creature"],
  "entertainment": ["movie", "actor", "tv show", "actress", "film", "television"]
};

function deriveCategory(
  topLabel: string,
  text: string,
  hint: string | null
): string | null {
  if (hint) return hint;
  const combined = `${topLabel} ${text}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      return category;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createScanProvider(): ScanProvider {
  const visionKey = process.env.GOOGLE_CLOUD_VISION_KEY;
  if (visionKey) {
    return new GoogleVisionScanProvider(visionKey);
  }
  return new StubScanProvider();
}
