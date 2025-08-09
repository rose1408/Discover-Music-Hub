// ======================== CARD ENROLLMENT FORM ===================================

/**
 * Submits card enrollment form data
 * @param {Object} cardData - Card data containing student and card information
 * @returns {string} - Success message
 * @throws {Error} - If validation fails or card already exists
 */
function submitCardForm(cardData) {
  try {
    if (!cardData.studentName || !cardData.cardNumber || !cardData.teacher || !cardData.level || !cardData.instrument) {
      throw new Error("All fields are required.");
    }
    if (!isValidCardNumber(cardData.cardNumber)) {
      throw new Error("Invalid card number format.");
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CARDNUMBER_TAB);
    const cardNumber = String(cardData.cardNumber).trim().toUpperCase();

    const lastRow = sheet.getLastRow();
    let values = [];
    if (lastRow >= 2) {
      values = sheet.getRange(2, 3, lastRow - 1).getValues().flat();
    }
    const cardExists = values.map(v => String(v).trim().toUpperCase()).includes(cardNumber);

    if (cardExists) {
      throw new Error("Duplicate card number.");
    }

    sheet.appendRow([
      new Date(),
      cardData.studentName.trim(),
      cardNumber,
      cardData.teacher,
      cardData.level,
      cardData.instrument
    ]);

    const newRow = sheet.getLastRow();
    try {
      //sheet.getRange(newRow, 3).setNumberFormat('@STRING@');
    } catch (e) {
      Logger.log("Skipped formatting: " + e.message);
    }

    return "Card submitted successfully.";
    
  } catch (err) {
    Logger.log("❌ Error in submitCardForm: " + err.message);
    throw new Error("Failed to submit card: " + err.message);
  }
}

/**
 * Checks if a card number exists in the system
 * @param {string} cardNumber - Card number to check
 * @returns {boolean} - True if card exists
 */
function checkCardNumber(cardNumber) {
  if (!isValidCardNumber(cardNumber)) return false;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CARDNUMBER_TAB);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  let values = [];
  if (lastRow >= 2) {
    values = sheet.getRange(2, 3, lastRow - 1).getValues();
  }
  return values.flat().some(c => String(c).trim().toUpperCase() === String(cardNumber).trim().toUpperCase());
}

/**
 * Gets all card numbers from the system
 * @returns {Array} - Array of normalized card numbers
 */
function getCardNumbers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CARDNUMBER_TAB);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 3, lastRow - 1).getValues();
  return data.flat().map(c => String(c).trim().toUpperCase());
}

/**
 * Converts card numbers in spreadsheet to text format
 */
function convertCardNumbersToText() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CARDNUMBER_TAB);
  const startRow = 2;
  const column = 3;
  const lastRow = sheet.getLastRow();

  const numRows = lastRow - startRow + 1;
  if (numRows <= 0) return;

  const range = sheet.getRange(startRow, column, numRows);
  const values = range.getValues();

  const textValues = values.map(row => [String(row[0]).trim()]);
  range.setValues(textValues);
  Logger.log("✅ Card numbers in column C have been converted to text.");
}

/**
 * Checks if a card exists (alias for checkCardNumber)
 * @param {string} cardNumber - Card number to check
 * @returns {boolean} - True if card exists
 */
function cardExists(cardNumber) {
  const normalized = normalizeString(cardNumber);
  const allCards = getCardNumbers();
  Logger.log("Checking card: " + normalized);
  Logger.log("Available cards: " + JSON.stringify(allCards));
  return allCards.includes(normalized);
}

/**
 * Colors completed cards (10 lessons used) in yellow
 */
function colorCompletedCards() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
  const attendanceSheet = ss.getSheetByName(ATTENDANCE_TAB);

  const cardNumbers = cardSheet.getRange('C2:C' + cardSheet.getLastRow()).getValues().flat();
  const attendanceData = attendanceSheet.getRange('B2:B' + attendanceSheet.getLastRow()).getValues().flat();

  const cardCounts = {};
  attendanceData.forEach(card => {
    if (card) {
      const normalized = normalizeString(card);
      cardCounts[normalized] = (cardCounts[normalized] || 0) + 1;
    }
  });

  for (let i = 0; i < cardNumbers.length; i++) {
    const card = normalizeString(cardNumbers[i]);
    if (!card) continue;
    const lessons = cardCounts[card] || 0;
    const range = cardSheet.getRange(i + 2, 1, 1, 6);
    
    // Use configurable max lessons and color
    const maxLessons = getConfig('CARDS.maxLessonsPerCard', 10);
    const completedColor = getConfig('CARDS.completedCardColor', '#fff475');
    
    if (lessons >= maxLessons) {
      range.setBackground(completedColor);
    } else {
      range.setBackground(null); // Clear previous color
    }
  }
}
