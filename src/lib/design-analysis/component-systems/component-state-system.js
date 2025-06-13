// Universal component states
const COMPONENT_STATES = {
  default: {
    opacity: 1.0,
    transform: 'scale(1)',
    transition: '200ms ease'
  },
  hover: {
    opacity_change: -0.1, // 10% darker/lighter
    transform: 'scale(1.02)', // Slight grow
    shadow_increase: 'next_elevation_level'
  },
  active: {
    opacity_change: -0.2,
    transform: 'scale(0.98)', // Slight shrink
    shadow_decrease: 'previous_elevation_level'
  },
  focus: {
    outline: '2px solid brand_primary',
    outline_offset: '2px',
    shadow_add: '0 0 0 3px rgba(brand_primary, 0.2)'
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointer_events: 'none'
  }
}

// State transition timing
const STATE_TRANSITIONS = {
  micro_interactions: 100, // ms - hover, focus
  state_changes: 200, // ms - active, disabled
  content_changes: 300, // ms - loading states
  layout_changes: 400 // ms - expand/collapse
}