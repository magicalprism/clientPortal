// Component pairing rules
const COMPONENT_PAIRING_LOGIC = {
  primary_button: {
    pair_with: ['secondary_button', 'text_link'],
    never_pair_with: ['another_primary_button'],
    spacing_rules: '16px_minimum_between'
  },
  form_inputs: {
    pair_with: ['labels', 'helper_text', 'error_messages'],
    stack_vertically: true,
    spacing_rules: '8px_label_to_input_4px_input_to_helper'
  },
  cards: {
    grid_spacing: '24px',
    max_per_row: { mobile: 1, tablet: 2, desktop: 3 },
    consistent_heights: true
  }
}

// Professional component combinations
const PROFESSIONAL_COMBINATIONS = {
  stripe_style: {
    buttons: 'solid_primary_with_subtle_shadow',
    cards: 'minimal_border_slight_radius',
    inputs: 'clean_borders_focus_states',
    overall_feel: 'clean_trustworthy_spacious'
  },
  apple_style: {
    buttons: 'large_radius_minimal_shadows',
    cards: 'generous_padding_rounded_corners',
    inputs: 'rounded_clean_minimal',
    overall_feel: 'premium_simple_intuitive'
  }
}