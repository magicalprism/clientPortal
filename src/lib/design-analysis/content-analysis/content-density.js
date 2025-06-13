export const CONTENT_CHUNKS = {
  hero_headline: { words: 6, chars: 60 },
  hero_subtext: { words: 15, chars: 120 },
  feature_title: { words: 4, chars: 40 },
  feature_description: { words: 20, chars: 150 },
  paragraph_optimal: { words: 50, chars: 400 },
  paragraph_max: { words: 75, chars: 600 }
};

export const DENSITY_THRESHOLDS = {
  too_sparse: 0.3,
  optimal: 0.5,
  too_dense: 0.8
};

export function calculateContentDensity(content) {
  const words = content.split(/\s+/).length;
  return {
    word_count: words,
    density_score: words > 500 ? 0.8 : words > 200 ? 0.5 : 0.3,
    readability: words < 100 ? 'high' : words < 300 ? 'medium' : 'low'
  };
}

export function analyzeReadingComplexity(content) {
  return {
    complexity_level: content.length > 1000 ? 'complex' : 'simple',
    reading_time: Math.ceil(content.split(/\s+/).length / 200)
  };
}
