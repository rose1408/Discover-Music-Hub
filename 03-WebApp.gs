// ============================== MAIN WEBAPP ENTRY ===============================

/**
 * Main entry point for the web app
 * @returns {HtmlOutput} - The HTML output for the web app
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Discover Music School - Main Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Enhanced getReportData function for web dashboard
 * Integrates with existing reportcode.gs functionality
 */
function getReportData(fromDate, toDate) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const enrollmentSheet = ss.getSheetByName(ENROLLMENT_TAB);
    const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
    const attendanceSheet = ss.getSheetByName(ATTENDANCE_TAB);
    
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
    
    const reportData = {
      students: [],
      cards: [],
      attendance: [],
      summary: {
        totalEnrollments: 0,
        totalCards: 0,
        totalLessons: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        totalTuition: 0,
        teacherStats: {},
        promoStats: {},
        instrumentStats: {},
        referralStats: {}
      }
    };
    
    // Get enrollment data with enhanced referral tracking
    const enrollmentData = enrollmentSheet.getDataRange().getValues();
    if (enrollmentData.length > 1) {
      for (let i = 1; i < enrollmentData.length; i++) {
        const row = enrollmentData[i];
        const timestamp = new Date(row[0]);
        if (timestamp >= startDate && timestamp <= endDate) {
          const student = {
            timestamp: timestamp,
            fullName: row[2],
            age: row[4],
            emergencyContact: row[5],
            email: row[6],
            phone: row[7],
            socialMediaConsent: row[8],
            status: row[9],
            referralSource: row[10] || 'Not specified'
          };
          
          // Parse referral details if available (format: "source - details")
          if (student.referralSource && student.referralSource.includes(' - ')) {
            const parts = student.referralSource.split(' - ');
            student.referralSource = parts[0];
            student.referralDetails = parts[1];
          }
          
          reportData.students.push(student);
        }
      }
    }
    
    // Get card data with enhanced fee tracking
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
            instrument: row[5],
            monthlyFee: parseFloat(row[6]) || 0,
            promoType: row[7] || '',
            totalFee: parseFloat(row[8]) || parseFloat(row[6]) || 0
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
            studentName: row[6] || 'Unknown',
            teacher: row[8] || 'Unknown',
            instrument: row[10] || 'Unknown'
          };
          reportData.attendance.push(attendance);
        }
      }
    }
    
    // Calculate comprehensive summary statistics
    reportData.summary.totalEnrollments = reportData.students.length;
    reportData.summary.totalCards = reportData.cards.length;
    reportData.summary.totalLessons = reportData.attendance.length;
    reportData.summary.totalTuition = reportData.cards.reduce((sum, card) => sum + card.totalFee, 0);
    
    // Enhanced teacher statistics (matching reportcode.gs logic)
    const teacherStats = {};
    reportData.attendance.forEach(record => {
      const teacher = record.teacher || 'Unknown';
      if (!teacherStats[teacher]) {
        teacherStats[teacher] = { present: 0, forfeited: 0, closed: 0, schoolForfeited: 0, total: 0 };
      }
      
      teacherStats[teacher].total++;
      
      switch(record.remarks?.toLowerCase()) {
        case 'present':
          teacherStats[teacher].present++;
          break;
        case 'forfeited':
          teacherStats[teacher].forfeited++;
          break;
        case 'closed':
          teacherStats[teacher].closed++;
          break;
        case 'school forfeited':
          teacherStats[teacher].schoolForfeited++;
          break;
      }
    });
    reportData.summary.teacherStats = teacherStats;
    
    // Promo statistics
    const promoStats = {};
    reportData.cards.forEach(card => {
      const promo = card.promoType || 'No Promo';
      promoStats[promo] = (promoStats[promo] || 0) + 1;
    });
    reportData.summary.promoStats = promoStats;
    
    // Instrument statistics  
    const instrumentStats = {};
    reportData.cards.forEach(card => {
      const instrument = card.instrument || 'Not Specified';
      instrumentStats[instrument] = (instrumentStats[instrument] || 0) + 1;
    });
    reportData.summary.instrumentStats = instrumentStats;
    
    // Enhanced referral statistics
    const referralStats = {};
    reportData.students.forEach(student => {
      if (student.referralSource) {
        const key = student.referralDetails ? 
          `${student.referralSource} - ${student.referralDetails}` : 
          student.referralSource;
        referralStats[key] = (referralStats[key] || 0) + 1;
      }
    });
    reportData.summary.referralStats = referralStats;
    
    // Calculate active/inactive students
    const activeCards = new Set(reportData.attendance.map(a => a.cardNumber));
    const allCards = new Set(reportData.cards.map(c => c.cardNumber));
    reportData.summary.activeStudents = activeCards.size;
    reportData.summary.inactiveStudents = allCards.size - activeCards.size;
    
    return reportData;
    
  } catch (error) {
    Logger.log("Enhanced report data error: " + error.message);
    throw new Error("Failed to get enhanced report data: " + error.message);
  }
}
