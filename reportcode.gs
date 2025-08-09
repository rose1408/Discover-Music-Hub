function formatDateSelectionSection() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("REPORT(2WEEKS)");

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

  // Merge end date input field (but don't write values)
  sheet.getRange("B6:E6").merge()
    .setHorizontalAlignment("center")
    .setFontSize(12)
    .setBackground("#FFF2CC")
    .setNumberFormat("mm/dd/yyyy");

  // Format A6 (start date input), but don't write to it
  sheet.getRange("A6")
    .setHorizontalAlignment("center")
    .setFontSize(12)
    .setBackground("#FFF2CC")
    .setNumberFormat("mm/dd/yyyy");

  // Add border to the entire section
  sheet.getRange("A5:E6").setBorder(true, true, true, true, true, true);
}

/**
 * Full 2-Week Report Generator with Dashboard Summary
 */

function generate2WeeksFullReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportSheet = ss.getSheetByName("REPORT(2WEEKS)");
  const cardSheet = ss.getSheetByName("CARDNUMBER");
  const enrollSheet = ss.getSheetByName("ENROLLMENT");
  const attendanceSheet = ss.getSheetByName("ATTENDANCE");

  const startDate = new Date(reportSheet.getRange("A6").getValue());
  const endDate = new Date(reportSheet.getRange("B6").getValue());
  endDate.setHours(23, 59, 59, 999);

  reportSheet.getRange("A9:Z100").clear({ contentsOnly: false });


  // Lesson per teacher and total lesson summary
  const lessonSummary = generateLessonReportPerTeacher(reportSheet, attendanceSheet, startDate, endDate, 9);

  // Card purchase and tuition report (with promo + instrument)
  const tuitionSummary = generateAccurateTuitionReport(reportSheet, cardSheet, startDate, endDate, lessonSummary.nextRow);

  // Enrollment summary (new, active, inactive)
  const enrollmentSummary = generateEnrollmentSummary(reportSheet, enrollSheet, startDate, endDate, tuitionSummary.nextRow);

  // Dashboard Summary G8:H13
  generateTopDashboardSummary(reportSheet, {
    totalLessons: lessonSummary.totalLessons,
    newStudents: enrollmentSummary.newStudents,
    active: enrollmentSummary.active,
    inactive: enrollmentSummary.inactive,
    cardPurchases: tuitionSummary.cardPurchases,
    totalTuition: tuitionSummary.totalTuition
  });

  reportSheet.autoResizeColumns(1, 10);
}

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
      if (!lessonCounts[teacher]) lessonCounts[teacher] = { present: 0, forfeited: 0 };
      if (remark === "Present") lessonCounts[teacher].present++;
      else if (remark === "Forfeited") lessonCounts[teacher].forfeited++;
    }
  }

  sheet.getRange(startRow++, 1).setValue("📘 Lessons per Teacher").setFontWeight("bold").setFontSize(12).setBackground("#DDEEFF");
  sheet.getRange(startRow, 1, 1, 4).setValues([["Teacher", "Present", "Forfeited", "Total"]]).setFontWeight("bold");

  const output = Object.entries(lessonCounts).map(([teacher, counts]) => {
    const total = counts.present + counts.forfeited;
    totalLessons += total;
    return [teacher, counts.present, counts.forfeited, total];
  });

  if (output.length) {
    sheet.getRange(startRow + 1, 1, output.length, 4).setValues(output).setNumberFormat("0");
  }

  return { nextRow: startRow + 2 + output.length, totalLessons };
}

function generateAccurateTuitionReport(sheet, cardSheet, startDate, endDate, rowStart) {
  const data = cardSheet.getDataRange().getValues();
  let count = 0, total = 0;
  const promoTypes = {}, instrumentTypes = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const d = row[0];
    const fee = parseFloat(row[6]) || 0;
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

  sheet.getRange(rowStart++, 1).setValue("🏷️ Promo Types Availed").setFontWeight("bold").setFontSize(12).setBackground("#FFF2CC");
  const promoEntries = Object.entries(promoTypes).map(([promo, count]) => [promo, count]);
  if (promoEntries.length) {
    sheet.getRange(rowStart, 1, 1, 2).setValues([["Promo Type", "Count"]]).setFontWeight("bold");
    sheet.getRange(rowStart + 1, 1, promoEntries.length, 2).setValues(promoEntries);
    rowStart += promoEntries.length + 2;
  }

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

function onEdit(e) {
  const sheet = e.source.getSheetByName("REPORT(2WEEKS)");
  const range = e.range;
  if (sheet && (range.getA1Notation() === "A6" || range.getA1Notation() === "B6")) {
    generate2WeeksFullReport();
  }
}

function clearReportArea(sheet, startRow, startCol, numRows, numCols) {
  const range = sheet.getRange(startRow, startCol, numRows, numCols);
  range.clear({ contentsOnly: false });
  range.clearFormat();
  range.clearNote();
  range.clearDataValidations();
}
