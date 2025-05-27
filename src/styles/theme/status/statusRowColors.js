// lib/constants/statusRowColors.js

export const STATUS_ROW_COLORS = {
  // Task statuses
  'not started': 'white',    // ⚪ white
  'todo': '#dfe4ff',           // 🔵 Light blue
  'complete': '#f3eeff',       // 🟢 Light green
  'unavailable': '#f6edf0',    // 🟣 Light purple
  'meeting': '#fef9c3',        // 🟡 Light pink/red
  'archived': '#f3f4f6',       // ⚪ Light gray
  
  // Default fallbacks
  'default': '#ffffff',        // White background
  'unknown': '#fafafa',        // Very light gray
};

// Helper function to get row color based on status
export function getStatusRowColor(status) {
  if (!status) return STATUS_ROW_COLORS.default;
  
  const normalizedStatus = status.toString().toLowerCase().trim();
  return STATUS_ROW_COLORS[normalizedStatus] || STATUS_ROW_COLORS.default;
}

// Smart function to automatically determine text color based on background luminance
export function getStatusRowTextColor(backgroundColor) {
  if (!backgroundColor || backgroundColor === 'transparent') return '#000000';
  
  // Remove # if present
  const color = backgroundColor.replace('#', '');
  
  // Handle 3-digit hex codes by expanding them
  const hex = color.length === 3 
    ? color.split('').map(c => c + c).join('')
    : color;
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance using the standard formula
  // This gives us a value between 0 (black) and 1 (white)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If luminance is less than 0.5, it's a dark background, use white text
  // If luminance is 0.5 or higher, it's a light background, use black text
  return luminance < 0.5 ? '#ffffff' : '#000000';
}