// ============= ENHANCED REPORT SYSTEM - INTEGRATION OF SHEET-BASED & WEB-BASED REPORTS =============

/**
 * Enhanced getReportData function that works with the HTML dashboard
 * Combines the logic from your existing reportcode.gs with web-friendly data structure
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
    
    // Get enrollment data with referral tracking
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
          
          // Parse referral details if available
          if (student.referralSource && student.referralSource.includes(' - ')) {
            const parts = student.referralSource.split(' - ');
            student.referralSource = parts[0];
            student.referralDetails = parts[1];
          }
          
          reportData.students.push(student);
        }
      }
    }
    
    // Get card data with fees and promo information
    const cardData = cardSheet.getDataRange().getValues();
    if (cardData.length > 1) {
      for (let i = 1; i < cardData.length; i++) {
        const row = cardData[i];
        const timestamp = new Date(row[0]);
        if (timestamp >= startDate && timestamp <= endDate) {
          // Enhanced fee parsing with better validation
          const rawTotalFee = parseFloat(row[8]);
          const rawMonthlyFee = parseFloat(row[6]);
          const monthlyFee = !isNaN(rawMonthlyFee) ? rawMonthlyFee : 0;
          const totalFee = !isNaN(rawTotalFee) ? rawTotalFee : monthlyFee;
          
          const card = {
            timestamp: timestamp,
            studentName: row[1],
            cardNumber: row[2],
            teacher: row[3],
            level: row[4],
            instrument: row[5],
            monthlyFee: monthlyFee,
            promoType: row[7] || '',
            totalFee: totalFee
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
    
    // Calculate enhanced summary statistics
    reportData.summary.totalEnrollments = reportData.students.length;
    reportData.summary.totalCards = reportData.cards.length;
    reportData.summary.totalLessons = reportData.attendance.length;
    reportData.summary.totalTuition = reportData.cards.reduce((sum, card) => sum + card.totalFee, 0);
    
    // Enhanced teacher statistics (matching your reportcode.gs logic)
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
    
    // Referral statistics
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
    
    // ======== AGGREGATE ALL DATA (SINGLE PASS) ========
    const teacherStatsMap = {};
    const promoCounts = {};
    const instrumentCounts = {};
    const totalCards = reportData.cards.length;
    
    // Process attendance for teacher stats
    reportData.attendance.forEach(attendance => {
      const card = reportData.cards.find(c => c.cardNumber === attendance.cardNumber);
      if (!card || !card.teacher) return;

      const teacher = card.teacher;
      if (!teacherStatsMap[teacher]) {
        teacherStatsMap[teacher] = { teacher, present: 0, forfeited: 0, total: 0 };
      }

      teacherStatsMap[teacher].total++;
      const remark = (attendance.remarks || '').toLowerCase();
      if (remark === 'present') {
        teacherStatsMap[teacher].present++;
      } else if (remark === 'forfeited') {
        teacherStatsMap[teacher].forfeited++;
      }
    });

    // Process cards for promo and instrument stats (single pass)
    reportData.cards.forEach(card => {
      // Count promo types
      const promo = card.promoType || 'No Promo';
      promoCounts[promo] = (promoCounts[promo] || 0) + 1;
      
      // Count instrument types
      const instrument = card.instrument || 'Not Specified';
      instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
    });

    // Process referrals
    const referralCounts = {};
    const totalReferrals = reportData.students.filter(s => s.referralSource && s.referralSource !== 'Not specified').length;
    
    reportData.students
      .filter(s => s.referralSource && s.referralSource !== 'Not specified')
      .forEach(student => {
        const key = student.referralDetails ? 
          `${student.referralSource}|${student.referralDetails}` : 
          `${student.referralSource}|-`;
        referralCounts[key] = (referralCounts[key] || 0) + 1;
      });

    // Convert to final arrays for frontend
    const teachers = Object.values(teacherStatsMap);
    
    const promos = Object.entries(promoCounts).map(([promo, count]) => ({
      promo,
      count,
      percentage: ((count / totalCards) * 100).toFixed(1)
    }));

    const instruments = Object.entries(instrumentCounts).map(([instrument, count]) => ({
      instrument,
      count,
      percentage: ((count / totalCards) * 100).toFixed(1)
    }));
      
    const referrals = Object.entries(referralCounts).map(([key, count]) => {
      const [source, details] = key.split('|');
      const percentage = totalReferrals > 0 ? ((count / totalReferrals) * 100).toFixed(1) : '0.0';
      return { source, details: details === '-' ? '-' : details, count, percentage };
    });
    
    // Update legacy summary object (for backward compatibility)
    reportData.summary.teacherStats = Object.fromEntries(
      Object.entries(teacherStatsMap).map(([teacher, stats]) => [teacher, {
        present: stats.present,
        forfeited: stats.forfeited,
        closed: 0, // Not tracked in new aggregation
        schoolForfeited: 0, // Not tracked in new aggregation
        total: stats.total
      }])
    );
    reportData.summary.promoStats = promoCounts;
    reportData.summary.instrumentStats = instrumentCounts;
    
    // Return the structure expected by the frontend
    return {
      students: reportData.students,
      cards: reportData.cards,
      attendance: reportData.attendance,
      teachers: teachers,
      promos: promos,
      instruments: instruments,
      referrals: referrals
    };
    
  } catch (error) {
    Logger.log("Enhanced report data error: " + error.message);
    throw new Error("Failed to get enhanced report data: " + error.message);
  }
}

/**
 * Generate sheet-based report (your original logic)
 * This creates the formatted report in the REPORT(2WEEKS) sheet
 */
function generate2WeeksFullReport() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let reportSheet = ss.getSheetByName("REPORT(2WEEKS)");
  
  // Create the report sheet if it doesn't exist
  if (!reportSheet) {
    reportSheet = ss.insertSheet("REPORT(2WEEKS)");
    setupReportSheetStructure(reportSheet);
  }
  
  const cardSheet = ss.getSheetByName(CARDNUMBER_TAB);
  const enrollSheet = ss.getSheetByName(ENROLLMENT_TAB);
  const attendanceSheet = ss.getSheetByName(ATTENDANCE_TAB);

  const startDate = new Date(reportSheet.getRange("A6").getValue());
  const endDate = new Date(reportSheet.getRange("B6").getValue());
  endDate.setHours(23, 59, 59, 999);

  reportSheet.getRange("A9:Z100").clear({ contentsOnly: false });

  // Generate all report sections using your original logic
  const lessonSummary = generateLessonReportPerTeacher(reportSheet, attendanceSheet, startDate, endDate, 9);
  const tuitionSummary = generateAccurateTuitionReport(reportSheet, cardSheet, startDate, endDate, lessonSummary.nextRow);
  const enrollmentSummary = generateEnrollmentSummary(reportSheet, enrollSheet, startDate, endDate, tuitionSummary.nextRow);

  // Generate dashboard summary
  generateTopDashboardSummary(reportSheet, {
    totalLessons: lessonSummary.totalLessons,
    newStudents: enrollmentSummary.newStudents,
    active: enrollmentSummary.active,
    inactive: enrollmentSummary.inactive,
    cardPurchases: tuitionSummary.cardPurchases,
    totalTuition: tuitionSummary.totalTuition
  });

  reportSheet.autoResizeColumns(1, 10);
  
  return "✅ 2-Week report generated successfully!";
}

/**
 * Setup the report sheet structure with proper headers and formatting
 */
function setupReportSheetStructure(sheet) {
  // Title section
  sheet.getRange("A1:E3").merge()
    .setValue("📊 DISCOVER MUSIC SCHOOL - 2 WEEKS REPORT")
    .setFontSize(16)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#4F81BD")
    .setFontColor("white");
    
  // Date selection section
  formatDateSelectionSection(sheet);
  
  // Instructions
  sheet.getRange("A4").setValue("Instructions: Enter start and end dates above, then report will auto-generate")
    .setFontStyle("italic")
    .setFontColor("#666666");
}

/**
 * Format date selection section (your original function)
 */
function formatDateSelectionSection(sheet) {
  // Set label for A5
  sheet.getRange("A5").setValue("START DATE")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setFontSize(12)
    .setBackground("#B4C6E7");

  // Merge and set label for B5:E5
  sheet.getRange("B5:E5").merge()
    .setValue("END DATE")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setFontSize(12)
    .setBackground("#B4C6E7");

  // Merge end date input field
  sheet.getRange("B6:E6").merge()
    .setHorizontalAlignment("center")
    .setFontSize(12)
    .setBackground("#FFF2CC")
    .setNumberFormat("mm/dd/yyyy");

  // Format A6 (start date input)
  sheet.getRange("A6")
    .setHorizontalAlignment("center")
    .setFontSize(12)
    .setBackground("#FFF2CC")
    .setNumberFormat("mm/dd/yyyy");

  // Add border to the entire section
  sheet.getRange("A5:E6").setBorder(true, true, true, true, true, true);
}

/**
 * Generate lesson report per teacher (your original function)
 */
function generateLessonReportPerTeacher(sheet, attendanceSheet, startDate, endDate, startRow) {
  const data = attendanceSheet.getDataRange().getValues().slice(1);
  const lessonCounts = {};
  const dateCol = 0, teacherCol = 8, remarksCol = 3;
  let totalLessons = 0;

  for (const row of data) {
    const date = new Date(row[dateCol]);
    const teacher = row[teacherCol];
    const remark = row[remarksCol];
    if (date >= startDate && date <= endDate && teacher) {
      if (!lessonCounts[teacher]) lessonCounts[teacher] = { present: 0, forfeited: 0, closed: 0, schoolForfeited: 0 };
      
      switch(remark?.toLowerCase()) {
        case 'present': lessonCounts[teacher].present++; break;
        case 'forfeited': lessonCounts[teacher].forfeited++; break;
        case 'closed': lessonCounts[teacher].closed++; break;
        case 'school forfeited': lessonCounts[teacher].schoolForfeited++; break;
      }
    }
  }

  sheet.getRange(startRow++, 1).setValue("📘 Lessons per Teacher").setFontWeight("bold").setFontSize(12).setBackground("#DDEEFF");
  sheet.getRange(startRow, 1, 1, 6).setValues([["Teacher", "Present", "Forfeited", "Closed", "School Forfeited", "Total"]]).setFontWeight("bold");

  const output = Object.entries(lessonCounts).map(([teacher, counts]) => {
    const total = counts.present + counts.forfeited + counts.closed + counts.schoolForfeited;
    totalLessons += total;
    return [teacher, counts.present, counts.forfeited, counts.closed, counts.schoolForfeited, total];
  });

  if (output.length) {
    sheet.getRange(startRow + 1, 1, output.length, 6).setValues(output).setNumberFormat("0");
  }

  return { nextRow: startRow + 2 + output.length, totalLessons };
}

/**
 * Generate accurate tuition report (your original function with enhancements)
 */
function generateAccurateTuitionReport(sheet, cardSheet, startDate, endDate, rowStart) {
  const data = cardSheet.getDataRange().getValues();
  let count = 0, total = 0;
  const promoTypes = {}, instrumentTypes = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const d = row[0];
    const fee = parseFloat(row[8]) || parseFloat(row[6]) || 0; // Check total fee first, then monthly fee
    const instrument = (row[5] || "Unspecified").toString().trim();
    const promo = (row[7] || "").toString().trim();

    if (d instanceof Date && d >= startDate && d <= endDate) {
      count++;
      total += fee;
      instrumentTypes[instrument] = (instrumentTypes[instrument] || 0) + 1;
      if (promo) promoTypes[promo] = (promoTypes[promo] || 0) + 1;
    }
  }

  sheet.getRange(rowStart++, 1).setValue("🎯 VERIFIED TUITION REPORT").setFontWeight("bold").setBackground("#FCE4D6");
  sheet.getRange(rowStart++, 1).setValue("Total Card Purchases (All):");
  sheet.getRange(rowStart - 1, 2).setValue(count).setNumberFormat("0");
  sheet.getRange(rowStart++, 1).setValue("Total Tuition Fee (All):");
  sheet.getRange(rowStart - 1, 2).setValue(total).setNumberFormat("₱#,##0.00");

  rowStart++;

  // Promo types section
  sheet.getRange(rowStart++, 1).setValue("🏷️ Promo Types Availed").setFontWeight("bold").setFontSize(12).setBackground("#FFF2CC");
  const promoEntries = Object.entries(promoTypes).map(([promo, count]) => [promo, count]);
  if (promoEntries.length) {
    sheet.getRange(rowStart, 1, 1, 2).setValues([["Promo Type", "Count"]]).setFontWeight("bold");
    sheet.getRange(rowStart + 1, 1, promoEntries.length, 2).setValues(promoEntries);
    rowStart += promoEntries.length + 2;
  }

  // Instruments section
  sheet.getRange(rowStart++, 1).setValue("🎼 Instrument Types Availed").setFontWeight("bold").setFontSize(12).setBackground("#D9EAD3");
  const instrumentIcons = {
    "Piano": "🎹", "Guitar": "🎸", "Drums": "🥁", "Violin": "🎻",
    "Voice": "🎤", "Ukulele": "🪕", "Flute": "🎶", "Unspecified": "❓"
  };
  const instrumentEntries = Object.entries(instrumentTypes).map(([inst, count]) => {
    const icon = instrumentIcons[inst] || "🎵";
    return [`${icon} ${inst}`, count];
  });
  if (instrumentEntries.length) {
    sheet.getRange(rowStart, 1, 1, 2).setValues([["Instrument", "Count"]]).setFontWeight("bold");
    sheet.getRange(rowStart + 1, 1, instrumentEntries.length, 2).setValues(instrumentEntries);
    rowStart += instrumentEntries.length + 2;
  }

  return { nextRow: rowStart, cardPurchases: count, totalTuition: total };
}

/**
 * Generate enrollment summary (your original function)
 */
function generateEnrollmentSummary(sheet, enrollSheet, startDate, endDate, startRow) {
  const data = enrollSheet.getDataRange().getValues();
  let newStudents = 0, active = 0, inactive = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const enrollDate = row[0];
    const status = (row[9] || "").toString().trim().toLowerCase();

    if (enrollDate instanceof Date && enrollDate >= startDate && enrollDate <= endDate) newStudents++;
    if (status === "active") active++;
    else if (status === "inactive") inactive++;
  }

  sheet.getRange(startRow++, 1).setValue("📋 ENROLLMENT SUMMARY").setFontWeight("bold").setFontSize(12).setBackground("#DAE8FC");
  const rows = [["New Students", newStudents], ["Active Students", active], ["Inactive Students", inactive]];
  sheet.getRange(startRow, 1, rows.length, 2).setValues(rows).setFontWeight("bold");

  return { newStudents, active, inactive };
}

/**
 * Generate top dashboard summary (your original function)
 */
function generateTopDashboardSummary(sheet, summaryData) {
  const dashboardStartRow = 8;
  const dashboardStartCol = 7; // Column G

  const headers = [
    ["🎯 Total Lessons", summaryData.totalLessons],
    ["🧑‍🎓 New Students", summaryData.newStudents],
    ["🟢 Active Students", summaryData.active],
    ["🔴 Inactive Students", summaryData.inactive],
    ["💳 Card Purchases", summaryData.cardPurchases],
    ["💰 Tuition Collected", summaryData.totalTuition]
  ];

  const range = sheet.getRange(dashboardStartRow, dashboardStartCol, headers.length, 2);
  range.setValues(headers);
  range.setFontWeight("bold").setFontSize(11).setBorder(true, true, true, true, true, true);
  range.setHorizontalAlignment("left");
  sheet.getRange(dashboardStartRow + 5, dashboardStartCol + 1).setNumberFormat("₱#,##0.00");
}

/**
 * Auto-generate report when dates are changed in the sheet (your original function)
 */
function onEdit(e) {
  const sheet = e.source.getSheetByName("REPORT(2WEEKS)");
  const range = e.range;
  if (sheet && (range.getA1Notation() === "A6" || range.getA1Notation() === "B6")) {
    // Check if both dates are filled before generating
    const startDate = sheet.getRange("A6").getValue();
    const endDate = sheet.getRange("B6").getValue();
    if (startDate && endDate) {
      generate2WeeksFullReport();
    }
  }
}

/**
 * Initialize the report system - creates the sheet and sets up structure
 */
function initializeReportSystem() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let reportSheet = ss.getSheetByName("REPORT(2WEEKS)");
    
    if (!reportSheet) {
      reportSheet = ss.insertSheet("REPORT(2WEEKS)");
    }
    
    setupReportSheetStructure(reportSheet);
    
    return "✅ Report system initialized successfully! You can now use both web dashboard and sheet-based reports.";
    
  } catch (error) {
    Logger.log("Report system initialization error: " + error.message);
    throw new Error("Failed to initialize report system: " + error.message);
  }
}
