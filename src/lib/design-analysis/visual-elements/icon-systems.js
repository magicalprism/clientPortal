// Icon sizing and spacing
const ICON_SPECIFICATIONS = {
  base_sizes: [16, 20, 24, 32, 40, 48, 64],
  touch_targets: {
    minimum: 44, // iOS/Android minimum
    comfortable: 48,
    generous: 56
  },
  spacing_from_text: {
    inline: 8,
    separate: 16,
    grouped: 4
  }
}

// Icon style consistency metrics
const ICON_CONSISTENCY = {
  stroke_weight: {
    thin: 1,
    regular: 1.5,
    medium: 2,
    bold: 2.5
  },
  corner_radius: {
    sharp: 0,
    slightly_rounded: 2,
    rounded: 4,
    very_rounded: 8
  },
  visual_weight_balance: 0.1 // 10% tolerance between icons
}

// Icon recognition and clarity
const ICON_CLARITY = {
  minimum_detail_size: 2, // pixels
  contrast_ratio_min: 3.0,
  legibility_test_sizes: [16, 20, 24],
  cultural_recognition_score: 0.8 // 80% universal recognition
}