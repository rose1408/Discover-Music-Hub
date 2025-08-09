// ============================ STATUS MANAGEMENT ========================================

/**
 * Checks lesson completion and updates student status (ACTIVE/INACTIVE)
 * Students become INACTIVE only when ALL their cards have 10 lessons used
 */
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
    const card = normalizeStringLower(row[cardIndex_att]);
    const lesson = Number(row[lessonIndex]);
    if (!card || isNaN(lesson)) return;
    if (!lessonCountPerCard[card]) lessonCountPerCard[card] = new Set();
    lessonCountPerCard[card].add(lesson);
  });

  // Map student names to their cards
  const nameToCards = {};
  cardData.slice(1).forEach(row => {
    const name = normalizeStringLower(row[nameIndex_card]);
    const card = normalizeStringLower(row[cardIndex_card]);
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
    const name = normalizeStringLower(row[nameIndex_enroll]);
    const currentStatus = normalizeStringLower(row[statusIndex_enroll]);
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
      if (currentStatus !== STATUS_INACTIVE.toLowerCase()) {
        statusCell.setValue(STATUS_INACTIVE);
        fontRange.setFontColor("red");
        logSheet.appendRow([new Date(), name, currentStatus, STATUS_INACTIVE]);
        sendStatusEmail(name, STATUS_INACTIVE);
      } else {
        fontRange.setFontColor("red");
      }
    } else {
      if (currentStatus !== STATUS_ACTIVE.toLowerCase()) {
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

/**
 * Sends individual status update email
 * @param {string} studentName - Name of the student
 * @param {string} newStatus - New status (ACTIVE/INACTIVE)
 */
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

/**
 * Sends summary email of all status changes
 * @param {Array} statusChanges - Array of status change objects
 */
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
