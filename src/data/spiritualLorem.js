// src/utils/spiritualLorem.js

const SPIRITUAL_BUZZWORDS = [
  'chakra-aligned', 'high-vibrational', 'quantum-activated', 'crystal-infused', 
  'manifestation-ready', 'third-eye-opening', 'soul-aligned', 'universe-guided',
  'energy-cleansed', 'aura-boosting', 'consciousness-expanding', 'mindfulness-enhanced'
];

const WELLNESS_VERBS = [
  'manifest', 'activate', 'align', 'transform', 'elevate', 'harmonize', 
  'balance', 'cleanse', 'awaken', 'illuminate', 'transcend', 'embody'
];

const SPIRITUAL_NOUNS = [
  'abundance', 'enlightenment', 'inner goddess', 'divine masculine', 
  'sacred geometry', 'lunar cycles', 'ancestral wisdom', 'cosmic energy',
  'soul purpose', 'higher self', 'light codes', 'frequency upgrades'
];

const BUZZWORD_ENDINGS = [
  'for the awakened entrepreneur', 'in just 21 days', 'without toxic hustle culture',
  'using ancient wisdom', 'through breathwork and cacao ceremonies', 
  'with certified moon water', 'via sacred plant medicine', 'in alignment with mercury retrograde'
];

const SPIRITUAL_CTA_VERBS = [
  'Activate', 'Unlock', 'Channel', 'Embody', 'Awaken', 'Manifest', 'Align', 'Transform'
];

const SPIRITUAL_CTA_OBJECTS = [
  'Your Soul\'s Purpose', 'Infinite Abundance', 'Your Divine Feminine', 
  'Sacred Abundance Codes', 'Your Highest Timeline', 'Quantum Wealth',
  'Your Inner CEO Goddess', 'Cosmic Business Flow'
];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateSpiritualLorem(type, length = 'medium') {
  switch (type) {
    case 'headline':
      return generateSpiritualHeadline();
    
    case 'subheadline':
      return generateSpiritualSubheadline();
    
    case 'body_text':
      return generateSpiritualBody(length);
    
    case 'button_text':
      return generateSpiritualCTA();
    
    case 'eyebrow':
      return generateSpiritualEyebrow();
    
    default:
      return generateSpiritualHeadline();
  }
}

function generateSpiritualHeadline() {
  const patterns = [
    () => `${randomChoice(WELLNESS_VERBS)} Your ${randomChoice(SPIRITUAL_NOUNS)} ${randomChoice(BUZZWORD_ENDINGS)}`.replace(/^./, str => str.toUpperCase()),
    () => `The ${randomChoice(SPIRITUAL_BUZZWORDS)} Way to ${randomChoice(WELLNESS_VERBS)} ${randomChoice(SPIRITUAL_NOUNS)}`.replace(/^./, str => str.toUpperCase()),
    () => `How I ${randomChoice(WELLNESS_VERBS)}ed My ${randomChoice(SPIRITUAL_NOUNS)} and You Can Too`,
    () => `${randomChoice(SPIRITUAL_NOUNS)} Secrets the Universe Doesn't Want You to Know`.replace(/^./, str => str.toUpperCase()),
    () => `Stop Blocking Your ${randomChoice(SPIRITUAL_NOUNS)} With These ${Math.floor(Math.random() * 7) + 3} ${randomChoice(SPIRITUAL_BUZZWORDS)} Techniques`
  ];
  
  return randomChoice(patterns)();
}

function generateSpiritualSubheadline() {
  const patterns = [
    () => `Discover the ${randomChoice(SPIRITUAL_BUZZWORDS)} secrets to ${randomChoice(WELLNESS_VERBS)}ing your ${randomChoice(SPIRITUAL_NOUNS)} ${randomChoice(BUZZWORD_ENDINGS)}`,
    () => `Join thousands of ${randomChoice(SPIRITUAL_BUZZWORDS)} entrepreneurs who've already ${randomChoice(WELLNESS_VERBS)}ed their ${randomChoice(SPIRITUAL_NOUNS)}`,
    () => `Finally, a ${randomChoice(SPIRITUAL_BUZZWORDS)} approach that doesn't require you to sacrifice your ${randomChoice(SPIRITUAL_NOUNS)}`,
    () => `What if I told you that ${randomChoice(SPIRITUAL_NOUNS)} was just one breathwork session away?`
  ];
  
  return randomChoice(patterns)();
}

function generateSpiritualBody(length = 'medium') {
  const sentences = [
    `I used to be stuck in toxic hustle culture until I discovered the power of ${randomChoice(SPIRITUAL_NOUNS)}.`,
    `Now, I help ${randomChoice(SPIRITUAL_BUZZWORDS)} soul-preneurs ${randomChoice(WELLNESS_VERBS)} their ${randomChoice(SPIRITUAL_NOUNS)} ${randomChoice(BUZZWORD_ENDINGS)}.`,
    `Through ${randomChoice(SPIRITUAL_BUZZWORDS)} practices and ${randomChoice(SPIRITUAL_NOUNS)}, you can finally break free from scarcity mindset.`,
    `My signature ${randomChoice(SPIRITUAL_BUZZWORDS)} method has helped over ${Math.floor(Math.random() * 9000) + 1000} awakened entrepreneurs ${randomChoice(WELLNESS_VERBS)} their ${randomChoice(SPIRITUAL_NOUNS)}.`,
    `Stop dimming your light and start ${randomChoice(WELLNESS_VERBS)}ing your ${randomChoice(SPIRITUAL_NOUNS)} today.`,
    `The universe is literally conspiring to help you ${randomChoice(WELLNESS_VERBS)} your ${randomChoice(SPIRITUAL_NOUNS)}.`,
    `Are you ready to step into your ${randomChoice(SPIRITUAL_BUZZWORDS)} power and ${randomChoice(WELLNESS_VERBS)} the abundance you deserve?`
  ];
  
  const sentenceCount = length === 'short' ? 2 : length === 'long' ? 5 : 3;
  return sentences.slice(0, sentenceCount).join(' ');
}

function generateSpiritualCTA() {
  return `${randomChoice(SPIRITUAL_CTA_VERBS)} ${randomChoice(SPIRITUAL_CTA_OBJECTS)}`;
}

function generateSpiritualEyebrow() {
  const patterns = [
    () => `${randomChoice(SPIRITUAL_BUZZWORDS)} ${randomChoice(SPIRITUAL_NOUNS)}`,
    () => `From the Creator of the ${randomChoice(SPIRITUAL_BUZZWORDS)} Method`,
    () => `As Seen in ${randomChoice(['Goop', 'Mind Body Green', 'The Cosmic Entrepreneur', 'Awakened CEO Magazine'])}`,
    () => `${Math.floor(Math.random() * 50) + 10}-Day ${randomChoice(SPIRITUAL_BUZZWORDS)} Challenge`
  ];
  
  return randomChoice(patterns)().toUpperCase();
}

// Helper to get appropriate fallback for any field
export function getSpiritualFallback(fieldName, currentValue) {
  if (currentValue && currentValue.trim()) {
    return currentValue;
  }
  
  // Map field names to spiritual lorem types
  const fieldMap = {
    'headline': 'headline',
    'subheadline': 'subheadline', 
    'body_text': 'body_text',
    'content': 'body_text',
    'button_text': 'button_text',
    'eyebrow': 'eyebrow'
  };
  
  const type = fieldMap[fieldName] || 'body_text';
  return generateSpiritualLorem(type);
}