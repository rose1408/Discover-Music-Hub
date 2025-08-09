// ========== GLOBAL CONSTANTS ==========
const SPREADSHEET_ID = '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
const ENROLLMENT_TAB = 'ENROLLMENT';
const CARDNUMBER_TAB = 'CARDNUMBER';
const ATTENDANCE_TAB = 'ATTENDANCE';

const STATUS_ACTIVE = 'ACTIVE';
const STATUS_INACTIVE = 'INACTIVE';

// ============================== MAIN WEBAPP ENTRY ===============================
function doGet() {
  return HtmlService.createHtmlOutputFromFile('DMS')
    .setTitle('Student Forms')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ====================== ENROLLMENT FORM =====================================
function submitForm(formData) {
  try {
    if (!formData.fullName || !formData.dob || !formData.age || !formData.emergencyContact || !formData.email || !formData.phone || !formData.socialMediaConsent) {
      throw new Error("All fields are required.");
    }
    if (!isValidEmail(formData.email)) {
      throw new Error("Invalid email address.");
    }
    if (!isValidPhone(formData.phone)) {
      throw new Error("Invalid phone number.");
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ENROLLMENT_TAB);
    sheet.appendRow([
      new Date(),
      '', // Student ID placeholder
      formData.fullName.trim(),
      formData.dob,
      formData.age,
      formData.emergencyContact.trim(),
      formData.email.trim(),
      formData.phone.trim(),
      formData.socialMediaConsent,
      STATUS_ACTIVE // default status
    ]);
  } catch (err) {
    Logger.log("❌ Error in submitForm: " + err.message);
    throw err;
  }
}

function getAllStudentNames() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ENROLLMENT_TAB);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const names = sheet.getRange(2, 3, lastRow - 1).getValues();
  return names.flat().filter(name => !!name);
}


// ======================== CARD ENROLLMENT FORM ===================================
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

    // ✅ Return a success message to the frontend
    return "Card submitted successfully.";
    
  } catch (err) {
    Logger.log("❌ Error in submitCardForm: " + err.message);
    // ✅ Forward error message to the frontend
    throw new Error("Failed to submit card: " + err.message);
  }
}


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

function getCardNumbers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CARDNUMBER_TAB);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 3, lastRow - 1).getValues();
  return data.flat().map(c => String(c).trim().toUpperCase());
}

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

// =========================== STUDENT INFO AUTOCOMPLETE =============================
function getStudentNames() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ENROLLMENT_TAB);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const names = sheet.getRange(2, 3, lastRow - 1).getValues();
  return names
    .flat()
    .map(name => typeof name === 'string' ? name.trim() : String(name).trim())
    .filter(name => name);
}

// ============================ ATTENDANCE ========================================

function cardExists(cardNumber) {
  const normalized = normalizeString(cardNumber);
  const allCards = getCardNumbers();
  Logger.log("Checking card: " + normalized);
  Logger.log("Available cards: " + JSON.stringify(allCards));
  return allCards.includes(normalized);
}

function isLessonUsed(cardNumber, lessonNumber) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();
  const normalizedCard = normalizeString(cardNumber);

  return data.some(row =>
    normalizeString(row[1]) === normalizedCard &&
    row[2] === Number(lessonNumber)
  );
}

function submitAttendance(data) {
  const cardNumber = normalizeString(data.cardNumber);
  const lessonNumber = Number(data.lessonNumber);
  const remarks = data.remarks ? String(data.remarks).trim() : "";

  if (!cardNumber) throw new Error("Card number is required.");
  if (!lessonNumber || isNaN(lessonNumber) || lessonNumber < 1 || lessonNumber > 10) throw new Error("Invalid lesson number.");
  if (!remarks || (remarks !== "Present" && remarks !== "Forfeited")) throw new Error("Remarks must be 'Present' or 'Forfeited'.");

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);

  sheet.appendRow([new Date(), cardNumber, lessonNumber, remarks]);
  const newRow = sheet.getLastRow();

  autoFillAttendance(newRow, cardNumber);
  logReminder(cardNumber, lessonNumber);
  updateStudentStatus();

  // ✅ Return success confirmation
  return "✅ Attendance recorded successfully.";
}

function normalizeString(s) {
  return s
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}


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


function getRemainingLessons(cardNumber) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_TAB);
  const data = sheet.getDataRange().getValues();
  const normalizedCard = normalizeString(cardNumber);

  const usedLessons = data.filter(row =>
    normalizeString(row[1]) === normalizedCard
  ).length;

  return Math.max(10 - usedLessons, 0);
}

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

function fillMissingAttendanceData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // or hardcode your ID here
  const sheet = ss.getSheetByName(ATTENDANCE_TAB);    // or hardcode 'ATTENDANCE'
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





function logReminder(cardNumber, lessonNumber) {
  if (lessonNumber < 7 || lessonNumber > 10) return;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reminderSheet = ss.getSheetByName('REMINDER_LOG') || ss.insertSheet('REMINDER_LOG');

  if (reminderSheet.getLastRow() === 0) {
    reminderSheet.appendRow(['Card Number', 'Lesson Number', 'Student Name', 'Timestamp']);
  }

  const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
  let cardData = [];
  if (cardSheet.getLastRow() > 1) {
    cardData = cardSheet.getRange(2, 2, cardSheet.getLastRow() - 1, 5).getValues();
  }

  const emailSheet = ss.getSheetByName(ENROLLMENT_TAB);
  let enrollmentData = [];
  if (emailSheet.getLastRow() > 1) {
    enrollmentData = emailSheet.getRange(2, 3, emailSheet.getLastRow() - 1, 6).getValues();
  }

  const normalizedCard = normalizeString(cardNumber);
  const match = cardData.find(row => normalizeString(row[1]) === normalizedCard);
  const studentName = match ? match[0] : "Unknown";

  const emailMatch = enrollmentData.find(row => normalizeString(row[0]) === normalizeString(studentName));
  const emailAddress = emailMatch ? emailMatch[4] : "";

  reminderSheet.appendRow([
    cardNumber,
    lessonNumber,
    studentName,
    new Date()
  ]);

  const subject = `🎵 Reminder: ${studentName} has reached Lesson #${lessonNumber}`;
  const body = `
Student Name: ${studentName}
Card Number: ${cardNumber}
Lesson Consumed: ${lessonNumber}
Remarks: FOR RE-ENROLLMENT

Thank You!
  `.trim();

  const recipients = "mragltiu1990@gmail.com,discovermusicschool01@gmail.com";
  MailApp.sendEmail(recipients, subject, body);
}

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

//ACTIVE AND INACTIVE STATUS
function normalizeString(str) {
  return str ? String(str).trim().toLowerCase() : "";
}

function checkLessonCompletionAndUpdateStatus() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const attendanceSheet = ss.getSheetByName(ATTENDANCE_TAB);
  const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
  const enrollmentSheet = ss.getSheetByName(ENROLLMENT_TAB);
  const logSheet = ss.getSheetByName('STATUS_LOG') || ss.insertSheet('STATUS_LOG');

  // Declare this early
  const statusChanges = [];

  const attendanceData = attendanceSheet.getDataRange().getValues();
  const cardData = cardSheet.getDataRange().getValues();
  const enrollData = enrollmentSheet.getDataRange().getValues();

  const attendanceHeaders = attendanceData[0];
  const lessonIndex = attendanceHeaders.indexOf("Lesson #");
  const cardIndex_att = attendanceHeaders.indexOf("CardNumber");

  const cardHeaders = cardData[0];
  const nameIndex_card = cardHeaders.indexOf("Student's Full Name");
  const cardIndex_card = cardHeaders.indexOf("Student Card Number");

  const enrollHeaders = enrollData[0];
  const nameIndex_enroll = enrollHeaders.indexOf("Student's Full Name");
  const statusIndex_enroll = enrollHeaders.indexOf("Status");

  // Count unique lessons per card
  const lessonCountPerCard = {};
  attendanceData.slice(1).forEach(row => {
    const card = normalizeString(row[cardIndex_att]);
    const lesson = Number(row[lessonIndex]);
    if (!card || isNaN(lesson)) return;
    if (!lessonCountPerCard[card]) lessonCountPerCard[card] = new Set();
    lessonCountPerCard[card].add(lesson);
  });

  // Map student names to their cards
  const nameToCards = {};
  cardData.slice(1).forEach(row => {
    const name = normalizeString(row[nameIndex_card]);
    const card = normalizeString(row[cardIndex_card]);
    if (!name || !card) return;
    if (!nameToCards[name]) nameToCards[name] = [];
    nameToCards[name].push(card);
  });

  // Clean up status formatting
  for (let i = 1; i < enrollData.length; i++) {
    const val = enrollData[i][statusIndex_enroll];
    if (val) {
      enrollmentSheet.getRange(i + 1, statusIndex_enroll + 1).setValue(String(val).trim().toUpperCase());
    }
  }

  // Main status tagging logic
  enrollData.slice(1).forEach((row, i) => {
    const name = normalizeString(row[nameIndex_enroll]);
    const currentStatus = normalizeString(row[statusIndex_enroll]);
    const cards = nameToCards[name] || [];
    const rowNum = i + 2;

    if (cards.length === 0) return;

    // ✅ New logic: student becomes INACTIVE only if ALL cards are used up
    const allUsedUp = cards.every(card => {
      const used = lessonCountPerCard[card]?.size || 0;
      return used >= 10;
    });

    const statusCell = enrollmentSheet.getRange(rowNum, statusIndex_enroll + 1);
    const fontRange = enrollmentSheet.getRange(rowNum, 1, 1, 12);

    if (allUsedUp) {
      if (currentStatus !== STATUS_INACTIVE) {
        statusCell.setValue(STATUS_INACTIVE);
        fontRange.setFontColor("red");
        logSheet.appendRow([new Date(), name, currentStatus, STATUS_INACTIVE]);
        sendStatusEmail(name, STATUS_INACTIVE);
      } else {
        fontRange.setFontColor("red");
      }
    } else {
      if (currentStatus !== STATUS_ACTIVE) {
        statusCell.setValue(STATUS_ACTIVE);
        fontRange.setFontColor("black");
        logSheet.appendRow([new Date(), name, currentStatus, STATUS_ACTIVE]);
        sendStatusEmail(name, STATUS_ACTIVE);
      } else {
        fontRange.setFontColor("black");
      }
    }
  });

   // Send 1 summary email after processing
  sendSummaryStatusEmail(statusChanges);

  SpreadsheetApp.flush();
}


function sendStatusEmail(studentName, newStatus) {
  const recipients = ["mragltiu1990@gmail.com"];
  const subject = `Status Update: ${studentName} is now ${newStatus}`;
  const body = `Student Name: ${studentName}\nStatus: ${newStatus}\n\nThis is an automated update.`;

  try {
    MailApp.sendEmail({
      to: recipients.join(","),
      subject: subject,
      body: body
    });
  } catch (e) {
    Logger.log(`❌ Email failed for ${studentName}: Quota reached or error occurred.`);
  }
}

function getMonthYearString(date) {
  if (!(date instanceof Date)) return '';
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options); // Example: "July 2025"
}

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
    if (lessons === 10) {
      range.setBackground('#fff475'); // Yellow
    } else {
      range.setBackground(null); // Clear previous color
    }
  }
}

// Helper function in sending emails
function sendSummaryStatusEmail(statusChanges) {
  if (statusChanges.length === 0) return;

  const recipients = ["mragltiu1990@gmail.com"];
  const subject = `Status Summary Update (${new Date().toLocaleString()})`;

  let body = "Here is the summary of student status updates:\n\n";

  statusChanges.forEach(item => {
    body += `• ${item.name}: ${item.oldStatus} → ${item.newStatus}\n`;
  });

  body += "\nThis is an automated system summary.";

  try {
    MailApp.sendEmail({
      to: recipients.join(","),
      subject: subject,
      body: body
    });
  } catch (e) {
    Logger.log("❌ Failed to send summary email: " + e);
  }
}

// Helper function to detect range intersection
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



// ======= HELPER FUNCTIONS FOR SECURITY & VALIDATION =======
function normalizeString(str) {
  return str ? String(str).trim().toUpperCase() : '';
}

function isValidEmail(email) {
  return /^[\w\.-]+@[\w\.-]+\.\w+$/.test(email);
}

function isValidCardNumber(card) {
  return /^[A-Z0-9]{4,12}$/.test(String(card).trim().toUpperCase());
}

function isValidPhone(phone) {
  return /^\+?\d{7,15}$/.test(String(phone).trim());
}