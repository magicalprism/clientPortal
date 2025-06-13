// 8px grid system validation
const SPACING_GRID = {
  base_unit: 8,
  valid_increments: [8, 16, 24, 32, 40, 48, 64, 80, 96],
  max_deviation: 2 // pixels
}

// Proximity relationships
const PROXIMITY_RULES = {
  related_elements: { min: 8, max: 16 },
  section_separation: { min: 32, max: 64 },
  page_margins: { min: 24, max: 80 },
  content_padding: { min: 16, max: 32 }
}

// Whitespace to content ratios
const WHITESPACE_RATIOS = {
  minimal: 0.5, // 50% content, 50% whitespace
  balanced: 0.67, // 67% content, 33% whitespace  
  generous: 0.75, // 75% content, 25% whitespace
  luxurious: 0.8 // 80% content, 20% whitespace
}