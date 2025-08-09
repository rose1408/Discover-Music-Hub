// ============================ REMINDER & NOTIFICATION SYSTEM ========================================

/**
 * Logs reminder for re-enrollment when student reaches lessons 7-10
 * Sends email notification to administrators
 * @param {string} cardNumber - Card number
 * @param {number} lessonNumber - Lesson number that triggered the reminder
 */
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
