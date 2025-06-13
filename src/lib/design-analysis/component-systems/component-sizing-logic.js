// Size scales based on importance
const COMPONENT_SIZE_HIERARCHY = {
  hero_elements: {
    multiplier: 2.0,
    components: ['hero_buttons', 'main_headlines']
  },
  primary_elements: {
    multiplier: 1.5,
    components: ['section_headers', 'primary_buttons']
  },
  standard_elements: {
    multiplier: 1.0,
    components: ['body_text', 'secondary_buttons', 'form_inputs']
  },
  supporting_elements: {
    multiplier: 0.875,
    components: ['captions', 'helper_text', 'tertiary_buttons']
  },
  minimal_elements: {
    multiplier: 0.75,
    components: ['fine_print', 'timestamps', 'badges']
  }
}

// Responsive sizing behavior
const RESPONSIVE_COMPONENT_SCALING = {
  mobile: {
    button_height_min: 44, // iOS accessibility
    touch_target_min: 44,
    text_size_increase: 1.1 // 10% larger for readability
  },
  tablet: {
    button_height_min: 40,
    touch_target_min: 40,
    text_size_increase: 1.0
  },
  desktop: {
    button_height_min: 36,
    hover_states: true,
    text_size_increase: 1.0
  }
}