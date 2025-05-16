// utils/dateUtils.js

/**
 * Checks if a given date falls on a weekend (Saturday or Sunday).
 * @param {Date} date - The date to evaluate.
 * @returns {boolean} - True if the date is Saturday or Sunday.
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Shifts the provided date forward until it lands on a weekday (Monday–Friday).
 * @param {Date} date - The original date.
 * @returns {Date} - The adjusted date that falls on a weekday.
 */
export function shiftDateToNextWeekday(date) {
  const shifted = new Date(date);
  while (isWeekend(shifted)) {
    shifted.setDate(shifted.getDate() + 1);
  }
  return shifted;
}
