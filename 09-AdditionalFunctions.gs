// ============================ ADDITIONAL BACKEND FUNCTIONS ========================================

/**
 * Gets all available teachers for dropdown lists (Enhanced with Configuration)
 * @param {string} filter - Optional filter criteria
 * @returns {Array} - Array of teacher names
 */
function getTeachers(filter = null) {
  try {
    return getTeachersEnhanced(filter);
  } catch (error) {
    // Fallback to static list if configuration system fails
    return [
      "Teacher A", "Teacher B", "Teacher C", "Teacher D", "Teacher E"
    ];
  }
}

/**
 * Gets all available instruments for dropdown lists (Enhanced with Configuration)
 * @param {string} category - Optional category filter
 * @returns {Array} - Array of instrument names
 */
function getInstruments(category = null) {
  try {
    return getInstrumentsEnhanced(category);
  } catch (error) {
    // Fallback to static list if configuration system fails
    return [
      "Piano", "Guitar", "Violin", "Drums", "Voice", "Ukulele", "Bass",
      "Saxophone", "Flute", "Keyboard"
    ];
  }
}

/**
 * Gets all available levels for dropdown lists (Enhanced with Configuration)
 * @returns {Array} - Array of level names
 */
function getLevels() {
  try {
    const enhancedLevels = getLevelsEnhanced();
    return enhancedLevels.map(level => level.name);
  } catch (error) {
    // Fallback to static list if configuration system fails
    return [
      "Beginner", "Elementary", "Intermediate", "Advanced"
    ];
  }
}

/**
 * Test function to verify all dependencies are working
 * @returns {Object} - Status of all core functions
 */
function testBackendFunctions() {
  const results = {
    constants: false,
    utils: false,
    enrollment: false,
    cardManagement: false,
    attendance: false,
    statusManagement: false,
    notifications: false,
    reports: false,
    errors: []
  };
  
  try {
    // Test constants
    if (SPREADSHEET_ID && ENROLLMENT_TAB && CARDNUMBER_TAB && ATTENDANCE_TAB) {
      results.constants = true;
    } else {
      results.errors.push("Missing constants");
    }
    
    // Test utils
    if (typeof normalizeString === 'function' && 
        typeof normalizeStringLower === 'function' &&
        typeof isValidEmail === 'function' &&
        typeof isValidPhone === 'function' &&
        typeof isValidCardNumber === 'function') {
      results.utils = true;
    } else {
      results.errors.push("Missing utility functions");
    }
    
    // Test enrollment functions
    if (typeof submitForm === 'function' && 
        typeof getStudentNames === 'function' && 
        typeof getAllStudentNames === 'function') {
      results.enrollment = true;
    } else {
      results.errors.push("Missing enrollment functions");
    }
    
    // Test card management
    if (typeof submitCardForm === 'function' &&
        typeof getCardNumbers === 'function' && 
        typeof checkCardNumber === 'function' &&
        typeof cardExists === 'function') {
      results.cardManagement = true;
    } else {
      results.errors.push("Missing card management functions");
    }
    
    // Test attendance
    if (typeof submitAttendance === 'function' &&
        typeof isLessonUsed === 'function' && 
        typeof getCardAttendanceStatus === 'function' &&
        typeof autoFillAttendance === 'function') {
      results.attendance = true;
    } else {
      results.errors.push("Missing attendance functions");
    }
    
    // Test status management
    if (typeof checkLessonCompletionAndUpdateStatus === 'function' &&
        typeof sendStatusEmail === 'function') {
      results.statusManagement = true;
    } else {
      results.errors.push("Missing status management functions");
    }
    
    // Test notifications
    if (typeof logReminder === 'function') {
      results.notifications = true;
    } else {
      results.errors.push("Missing notification functions");
    }
    
    // Test reports
    if (typeof getReportData === 'function') {
      results.reports = true;
    } else {
      results.errors.push("Missing report functions");
    }
    
    // Test spreadsheet access
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      results.spreadsheetAccess = true;
    } catch (e) {
      results.errors.push("Cannot access spreadsheet: " + e.message);
      results.spreadsheetAccess = false;
    }
    
    return results;
    
  } catch (error) {
    Logger.log("Test error: " + error.message);
    results.errors.push("General test error: " + error.message);
    return results;
  }
}

/**
 * Initialize required sheets with proper headers
 * Call this once to set up the spreadsheet structure
 */
function initializeSpreadsheetStructure() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Initialize ENROLLMENT sheet
    let enrollSheet = ss.getSheetByName(ENROLLMENT_TAB);
    if (!enrollSheet) {
      enrollSheet = ss.insertSheet(ENROLLMENT_TAB);
    }
    if (enrollSheet.getLastRow() === 0) {
      enrollSheet.appendRow([
        'Timestamp', 'Student ID', "Student's Full Name", 'Date of Birth', 'Age',
        'Emergency Contact', 'Email Address', 'Contact Number', 'Social Media Consent',
        'Status', 'Referral Source'
      ]);
    }
    
    // Initialize CARDNUMBER sheet
    let cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
    if (!cardSheet) {
      cardSheet = ss.insertSheet(CARDNUMBER_TAB);
    }
    if (cardSheet.getLastRow() === 0) {
      cardSheet.appendRow([
        'Timestamp', "Student's Full Name", 'Student Card Number', 'Teacher',
        'Level', 'Instrument'
      ]);
    }
    
    // Initialize ATTENDANCE sheet
    let attendanceSheet = ss.getSheetByName(ATTENDANCE_TAB);
    if (!attendanceSheet) {
      attendanceSheet = ss.insertSheet(ATTENDANCE_TAB);
    }
    if (attendanceSheet.getLastRow() === 0) {
      attendanceSheet.appendRow([
        'Timestamp', 'CardNumber', 'Lesson #', 'Remarks', '', '',
        "Student's Full Name", 'Email Address', 'Teacher', 'Level', 'Instrument'
      ]);
    }
    
    return "✅ Spreadsheet structure initialized successfully!";
    
  } catch (error) {
    Logger.log("Initialization error: " + error.message);
    throw new Error("Failed to initialize spreadsheet structure: " + error.message);
  }
}

/**
 * Gets report data for the reports dashboard
 * @param {string} fromDate - Start date for the report (YYYY-MM-DD)
 * @param {string} toDate - End date for the report (YYYY-MM-DD)
 * @returns {Object} - Report data object
 */
function getReportData(fromDate, toDate) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const enrollmentSheet = ss.getSheetByName(ENROLLMENT_TAB);
    const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
    const attendanceSheet = ss.getSheetByName(ATTENDANCE_TAB);
    
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const reportData = {
      enrollments: [],
      cards: [],
      attendance: [],
      summary: {
        totalEnrollments: 0,
        totalCards: 0,
        totalLessons: 0,
        activeStudents: 0
      }
    };
    
    // Get enrollment data
    const enrollmentData = enrollmentSheet.getDataRange().getValues();
    if (enrollmentData.length > 1) {
      const enrollmentHeaders = enrollmentData[0];
      for (let i = 1; i < enrollmentData.length; i++) {
        const row = enrollmentData[i];
        const timestamp = new Date(row[0]);
        if (timestamp >= startDate && timestamp <= endDate) {
          const enrollment = {
            timestamp: timestamp,
            studentName: row[2],
            email: row[6],
            status: row[9],
            referralSource: row[10] || 'Not specified'
          };
          reportData.enrollments.push(enrollment);
        }
      }
    }
    
    // Get card data
    const cardData = cardSheet.getDataRange().getValues();
    if (cardData.length > 1) {
      for (let i = 1; i < cardData.length; i++) {
        const row = cardData[i];
        const timestamp = new Date(row[0]);
        if (timestamp >= startDate && timestamp <= endDate) {
          const card = {
            timestamp: timestamp,
            studentName: row[1],
            cardNumber: row[2],
            teacher: row[3],
            level: row[4],
            instrument: row[5]
          };
          reportData.cards.push(card);
        }
      }
    }
    
    // Get attendance data
    const attendanceData = attendanceSheet.getDataRange().getValues();
    if (attendanceData.length > 1) {
      for (let i = 1; i < attendanceData.length; i++) {
        const row = attendanceData[i];
        const timestamp = new Date(row[0]);
        if (timestamp >= startDate && timestamp <= endDate) {
          const attendance = {
            timestamp: timestamp,
            cardNumber: row[1],
            lessonNumber: row[2],
            remarks: row[3],
            studentName: row[6],
            teacher: row[8],
            instrument: row[10]
          };
          reportData.attendance.push(attendance);
        }
      }
    }
    
    // Calculate summary
    reportData.summary.totalEnrollments = reportData.enrollments.length;
    reportData.summary.totalCards = reportData.cards.length;
    reportData.summary.totalLessons = reportData.attendance.length;
    
    // Count active students (those with status = ACTIVE)
    reportData.summary.activeStudents = reportData.enrollments.filter(
      e => e.status === STATUS_ACTIVE
    ).length;
    
    return reportData;
    
  } catch (error) {
    Logger.log("Report data error: " + error.message);
    throw new Error("Failed to get report data: " + error.message);
  }
}
