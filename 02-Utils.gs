// ======= HELPER FUNCTIONS FOR SECURITY & VALIDATION =======

/**
 * Normalizes a string by trimming and converting to uppercase
 * @param {string} str - The string to normalize
 * @returns {string} - Normalized string
 */
function normalizeString(str) {
  return str ? String(str).trim().toUpperCase() : '';
}

/**
 * Alternative normalization function for status management (lowercase)
 * @param {string} str - The string to normalize
 * @returns {string} - Normalized string in lowercase
 */
function normalizeStringLower(str) {
  return str ? String(str).trim().toLowerCase() : "";
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  return /^[\w\.-]+@[\w\.-]+\.\w+$/.test(email);
}

/**
 * Validates card number format (4-12 alphanumeric characters)
 * @param {string} card - Card number to validate
 * @returns {boolean} - True if valid card format
 */
function isValidCardNumber(card) {
  return /^[A-Z0-9]{4,12}$/.test(String(card).trim().toUpperCase());
}

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
function isValidPhone(phone) {
  return /^\+?\d{7,15}$/.test(String(phone).trim());
}

/**
 * Helper function to detect range intersection
 * @param {Range} range1 - First range
 * @param {Range} range2 - Second range
 * @returns {boolean} - True if ranges intersect
 */
function rangesIntersect(range1, range2) {
  const r1Row = range1.getRow();
  const r1Col = range1.getColumn();
  const r1Rows = range1.getNumRows();
  const r1Cols = range1.getNumColumns();

  const r2Row = range2.getRow();
  const r2Col = range2.getColumn();
  const r2Rows = range2.getNumRows();
  const r2Cols = range2.getNumColumns();

  const rowOverlap = r1Row < r2Row + r2Rows && r2Row < r1Row + r1Rows;
  const colOverlap = r1Col < r2Col + r2Cols && r2Col < r1Col + r1Cols;

  return rowOverlap && colOverlap;
}

/**
 * Gets formatted month and year string from date
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string (e.g., "July 2025")
 */
function getMonthYearString(date) {
  if (!(date instanceof Date)) return '';
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
}
