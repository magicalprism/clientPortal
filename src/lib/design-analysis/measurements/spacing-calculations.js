export const SPACING_GRID = {
  base_unit: 8,
  valid_increments: [8, 16, 24, 32, 40, 48, 64, 80, 96],
  max_deviation: 2
};

export const PROXIMITY_RULES = {
  related_elements: { min: 8, max: 16 },
  section_separation: { min: 32, max: 64 },
  page_margins: { min: 24, max: 80 },
  content_padding: { min: 16, max: 32 }
};

export const WHITESPACE_RATIOS = {
  minimal: 0.5,
  balanced: 0.67,
  generous: 0.75,
  luxurious: 0.8
};

export function calculateSpacingScore(layout) {
  return 0.8;
}
