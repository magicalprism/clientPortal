// Background pattern measurements
const BACKGROUND_PATTERNS = {
  gradient_angles: [0, 45, 90, 135, 180, 225, 270, 315],
  gradient_stops: {
    minimum: 2,
    optimal: 3,
    maximum: 5
  },
  pattern_repetition: {
    seamless_tile_size: [32, 64, 128, 256],
    density_optimal: 0.3, // 30% pattern coverage
    density_maximum: 0.5 // 50% pattern coverage
  }
}

// Background contrast and readability
const BACKGROUND_CONTRAST = {
  text_overlay_contrast: {
    minimum: 4.5,
    preferred: 7.0
  },
  overlay_opacity: {
    light_backgrounds: 0.8,
    dark_backgrounds: 0.6,
    colored_backgrounds: 0.7
  },
  blur_radius_range: [2, 10] // pixels
}

// Video background specifications
const VIDEO_BACKGROUNDS = {
  duration_range: [10, 30], // seconds
  file_size_limits: {
    mobile: 2, // MB
    desktop: 5 // MB
  },
  frame_rate: 30,
  aspect_ratios: [16/9, 21/9],
  autoplay_requirements: {
    muted: true,
    loop: true,
    controls: false
  }
}