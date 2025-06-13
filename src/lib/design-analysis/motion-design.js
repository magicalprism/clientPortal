// Animation timing and easing
const ANIMATION_TIMING = {
  micro_interactions: {
    duration: [100, 200], // milliseconds
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' // Material Design
  },
  transitions: {
    duration: [200, 400],
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Ease-out-quad
  },
  complex_animations: {
    duration: [400, 800],
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)' // Ease-in-out-cubic
  }
}

// Performance constraints
const ANIMATION_PERFORMANCE = {
  frame_rate_target: 60, // fps
  maximum_concurrent: 3, // animations
  cpu_usage_limit: 0.3, // 30% CPU
  battery_impact: 'low',
  reduced_motion_alternatives: true
}

// Animation principles (quantified)
const ANIMATION_PRINCIPLES = {
  anticipation_ratio: 0.2, // 20% of total duration
  follow_through_ratio: 0.3, // 30% of total duration
  bounce_dampening: 0.8, // 80% reduction each bounce
  elastic_overshoot: 1.1 // 110% of target value
}