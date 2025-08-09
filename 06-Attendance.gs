// ============================ ATTENDANCE ========================================

/**
 * Checks if a specific lesson number is already used for a card
 * @param {string} cardNumber - Card number to check
 * @param {number} lessonNumber - Lesson number to check
 * @returns {boolean} - True if lesson is already used
 */
function isLessonUsed(cardNumber, lessonNumber) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();
  const normalizedCard = normalizeString(cardNumber);

  return data.some(row =>
    normalizeString(row[1]) === normalizedCard &&
    row[2] === Number(lessonNumber)
  );
}

/**
 * Submits attendance record
 * @param {Object} data - Attendance data containing cardNumber, lessonNumber, and remarks
 * @returns {string} - Success confirmation message
 * @throws {Error} - If validation fails
 */
function submitAttendance(data) {
  const cardNumber = normalizeString(data.cardNumber);
  const lessonNumber = Number(data.lessonNumber);
  const remarks = data.remarks ? String(data.remarks).trim() : "";

  if (!cardNumber) throw new Error("Card number is required.");
  if (!lessonNumber || isNaN(lessonNumber) || lessonNumber < 1 || lessonNumber > 10) throw new Error("Invalid lesson number.");
  if (!remarks || !["Present", "Forfeited", "Closed", "School Forfeited"].includes(remarks)) throw new Error("Invalid remarks value.");

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);

  sheet.appendRow([new Date(), cardNumber, lessonNumber, remarks]);
  const newRow = sheet.getLastRow();

  autoFillAttendance(newRow, cardNumber);
  logReminder(cardNumber, lessonNumber);
  
  // Call status update function
  try {
    checkLessonCompletionAndUpdateStatus();
  } catch (e) {
    Logger.log("Warning: Status update failed: " + e.message);
  }

  return "✅ Attendance recorded successfully.";
}

/**
 * Auto-fills attendance record with student information
 * @param {number} rowNum - Row number to fill
 * @param {string} cardNumber - Card number to get information for
 */
function autoFillAttendance(rowNum, cardNumber) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ATTENDANCE_TAB);
  const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
  const enrollSheet = ss.getSheetByName(ENROLLMENT_TAB);
  const cardNumberUpper = normalizeString(cardNumber);

  // Get card info safely
  const cardLastRow = cardSheet.getLastRow();
  let cardData = [];
  if (cardLastRow > 1) {
    cardData = cardSheet.getRange(2, 2, cardLastRow - 1, 5).getValues();
  }
  const cardMatch = cardData.find(row => normalizeString(row[1]) === cardNumberUpper);

  let studentName = "", teacher = "", level = "", instrument = "";
  if (cardMatch) {
    studentName = cardMatch[0];
    teacher = cardMatch[2];
    level = cardMatch[3];
    instrument = cardMatch[4];
  }

  // Get email by student name safely
  const enrollLastRow = enrollSheet.getLastRow();
  let enrollData = [];
  if (enrollLastRow > 1) {
    enrollData = enrollSheet.getRange(2, 3, enrollLastRow - 1, 6).getValues();
  }
  const enrollMatch = enrollData.find(row => normalizeString(row[0]) === normalizeString(studentName));
  let email = enrollMatch ? enrollMatch[4] : "";

  // Batch write to G-K (columns 7 to 11)
  sheet.getRange(rowNum, 7, 1, 5).setValues([[studentName, email, teacher, level, instrument]]);
}

/**
 * Gets remaining lessons for a card (out of 10 total)
 * @param {string} cardNumber - Card number to check
 * @returns {number} - Number of remaining lessons
 */
function getRemainingLessons(cardNumber) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();
  const normalizedCard = normalizeString(cardNumber);

  const usedLessons = data.filter(row =>
    normalizeString(row[1]) === normalizedCard
  ).length;

  return Math.max(10 - usedLessons, 0);
}

/**
 * Gets the next available lesson number for a card
 * @param {string} cardNumber - Card number to check
 * @returns {number|null} - Next lesson number or null if all lessons used
 */
function getNextLessonNumber(cardNumber) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();
  const normalizedCard = normalizeString(cardNumber);

  const usedLessons = data
    .filter(row => normalizeString(row[1]) === normalizedCard)
    .map(row => Number(row[2]));

  for (let i = 1; i <= 10; i++) {
    if (!usedLessons.includes(i)) return i;
  }
  return null;
}

/**
 * Fills missing attendance data for existing records
 */
function fillMissingAttendanceData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();

  Logger.log(`📋 Total rows: ${data.length}`);

  for (let rowNum = 2; rowNum <= data.length; rowNum++) {
    const row = data[rowNum - 1];

    let cardNumber = row[1]; // Column B
    // Normalize safely
    if (typeof cardNumber !== 'string') {
      cardNumber = String(cardNumber);
    }
    cardNumber = cardNumber.trim();

    if (cardNumber === '') {
      Logger.log(`⚠️ Skipped row ${rowNum}: blank card number`);
      continue;
    }

    const needsFill =
      !row[6] || !row[7] || !row[8] || !row[9] || !row[10];

    Logger.log(`🔍 Row ${rowNum}: card ${cardNumber} | needs fill? ${needsFill}`);

    if (needsFill) {
      try {
        autoFillAttendance(rowNum, cardNumber);
        Logger.log(`✅ Autofilled row ${rowNum}: ${cardNumber}`);
      } catch (e) {
        Logger.log(`❌ Error on row ${rowNum} (${cardNumber}): ${e.message}`);
      }
    }
  }

  Logger.log("✅ fillMissingAttendanceData finished.");
}

/**
 * Gets card attendance status including remaining lessons and next lesson
 * @param {string} cardNumber - Card number to check
 * @returns {Object} - Status object with exists, remaining, and nextLesson properties
 */
function getCardAttendanceStatus(cardNumber) {
  const normalizedCard = normalizeString(cardNumber);
  const cardExists = getCardNumbers().includes(normalizedCard);

  if (!cardExists) {
    return { exists: false };
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();

  const rows = data.filter(row => normalizeString(row[1]) === normalizedCard);
  const usedLessons = rows.map(row => Number(row[2])).filter(num => !isNaN(num));
  const remaining = Math.max(10 - usedLessons.length, 0);

  let nextLesson = null;
  for (let i = 1; i <= 10; i++) {
    if (!usedLessons.includes(i)) {
      nextLesson = i;
      break;
    }
  }

  return { exists: true, remaining, nextLesson };
}
