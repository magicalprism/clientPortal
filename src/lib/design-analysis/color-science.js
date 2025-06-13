// Color contrast calculations
function calculateContrastRatio(color1, color2) {
  // WCAG 2.1 contrast ratio formula
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Color harmony rules (measurable relationships)
const COLOR_HARMONY = {
  complementary: 180, // degrees apart on color wheel
  analogous: 30, // degrees apart
  triadic: 120, // degrees apart
  split_complementary: [150, 210] // degrees apart
}

// Color usage percentages (60-30-10 rule)
const COLOR_DISTRIBUTION = {
  primary: 0.6, // 60% neutral/background
  secondary: 0.3, // 30% supporting color
  accent: 0.1 // 10% accent/action color
}