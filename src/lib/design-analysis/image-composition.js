// Image aspect ratio standards
const ASPECT_RATIOS = {
  hero_images: [16/9, 21/9, 3/2],
  product_shots: [1/1, 4/3, 3/2],
  portraits: [3/4, 2/3],
  landscapes: [16/9, 3/2, 5/3],
  thumbnails: [1/1, 16/9]
}

// Rule of thirds composition
const COMPOSITION_RULES = {
  rule_of_thirds: {
    intersection_points: [
      {x: 0.33, y: 0.33}, {x: 0.67, y: 0.33},
      {x: 0.33, y: 0.67}, {x: 0.67, y: 0.67}
    ],
    tolerance: 0.1 // 10% deviation allowed
  },
  focal_point_zones: {
    center: {x: 0.4, y: 0.4, width: 0.2, height: 0.2},
    golden_spiral: calculateGoldenSpiralPoints()
  }
}

// Image quality metrics
const IMAGE_QUALITY = {
  min_resolution: {
    thumbnail: 150,
    standard: 800,
    hero: 1920,
    retina: 3840
  },
  compression_ratios: {
    jpeg_quality: 85,
    webp_quality: 80,
    file_size_limits: {
      thumbnail: 50, // KB
      standard: 200, // KB
      hero: 500 // KB
    }
  }
}