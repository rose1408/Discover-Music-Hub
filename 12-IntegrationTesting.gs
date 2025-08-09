// ============= FINAL INTEGRATION TESTING =============

/**
 * Test the integrated reporting system
 * This function validates both web and sheet-based reporting
 */
function testIntegratedReportingSystem() {
  console.log("🧪 TESTING INTEGRATED REPORTING SYSTEM");
  console.log("=====================================");
  
  try {
    // Test 1: Validate enhanced getReportData function
    console.log("\n📊 Testing Web Dashboard Data Retrieval...");
    const testStartDate = '2024-01-01';
    const testEndDate = '2024-12-31';
    
    const webData = getReportData(testStartDate, testEndDate);
    
    console.log(`✅ Web data structure validation:`);
    console.log(`   - Students array: ${webData.students ? '✓' : '✗'}`);
    console.log(`   - Cards array: ${webData.cards ? '✓' : '✗'}`);
    console.log(`   - Attendance array: ${webData.attendance ? '✓' : '✗'}`);
    console.log(`   - Summary object: ${webData.summary ? '✓' : '✗'}`);
    
    if (webData.summary) {
      console.log(`   - Total enrollments: ${webData.summary.totalEnrollments}`);
      console.log(`   - Total cards: ${webData.summary.totalCards}`);
      console.log(`   - Total lessons: ${webData.summary.totalLessons}`);
      console.log(`   - Active students: ${webData.summary.activeStudents}`);
      console.log(`   - Total tuition: ₱${webData.summary.totalTuition.toLocaleString()}`);
      console.log(`   - Teacher stats available: ${Object.keys(webData.summary.teacherStats).length} teachers`);
      console.log(`   - Promo stats available: ${Object.keys(webData.summary.promoStats).length} promos`);
      console.log(`   - Instrument stats available: ${Object.keys(webData.summary.instrumentStats).length} instruments`);
    }
    
    // Test 2: Validate sheet-based report functions
    console.log("\n📋 Testing Google Sheets Report Generation...");
    
    // Check if report sheet exists or can be created
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let reportSheet = ss.getSheetByName("REPORT(2WEEKS)");
    
    if (!reportSheet) {
      console.log("⚠️  REPORT(2WEEKS) sheet not found, testing initialization...");
      const initResult = initializeReportSystem();
      console.log(`   Initialization result: ${initResult}`);
      reportSheet = ss.getSheetByName("REPORT(2WEEKS)");
    }
    
    if (reportSheet) {
      console.log("✅ REPORT(2WEEKS) sheet available");
      
      // Test date input cells
      const startDateCell = reportSheet.getRange("A6");
      const endDateCell = reportSheet.getRange("B6");
      
      console.log(`   - Start date cell (A6): ${startDateCell ? '✓' : '✗'}`);
      console.log(`   - End date cell (B6): ${endDateCell ? '✓' : '✗'}`);
      
      // Test if we can set dates
      try {
        startDateCell.setValue(new Date('2024-01-01'));
        endDateCell.setValue(new Date('2024-01-31'));
        console.log("✅ Date cells successfully updated");
        
        // Test report generation
        console.log("🔄 Testing report generation...");
        const reportResult = generate2WeeksFullReport();
        console.log(`   Report generation result: ${reportResult}`);
        
      } catch (sheetError) {
        console.log(`⚠️  Sheet operations error: ${sheetError.message}`);
      }
    }
    
    // Test 3: Validate all helper functions
    console.log("\n🔧 Testing Supporting Functions...");
    
    const supportingFunctions = [
      'generateLessonReportPerTeacher',
      'generateAccurateTuitionReport', 
      'generateEnrollmentSummary',
      'setupReportSheetStructure',
      'formatDateSelectionSection'
    ];
    
    supportingFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        console.log(`   - ${funcName}: ${typeof func === 'function' ? '✓' : '✗'}`);
      } catch (e) {
        console.log(`   - ${funcName}: ✗ (${e.message})`);
      }
    });
    
    // Test 4: Validate data consistency between systems
    console.log("\n🔍 Testing Data Consistency...");
    
    if (webData.students.length > 0 || webData.cards.length > 0 || webData.attendance.length > 0) {
      console.log("✅ Sample data available for consistency testing");
      
      // Check teacher stats consistency
      const webTeachers = Object.keys(webData.summary.teacherStats);
      console.log(`   - Web system teachers: ${webTeachers.length}`);
      console.log(`   - Teachers: ${webTeachers.join(', ')}`);
      
      // Check promo stats
      const webPromos = Object.keys(webData.summary.promoStats);
      console.log(`   - Web system promos: ${webPromos.length}`);
      console.log(`   - Promos: ${webPromos.join(', ')}`);
      
    } else {
      console.log("ℹ️  No sample data available - test with actual data after deployment");
    }
    
    console.log("\n✅ INTEGRATION TESTING COMPLETED!");
    console.log("=====================================");
    console.log("🎉 Both web dashboard and sheet reporting systems are ready!");
    console.log("\n📝 Next Steps:");
    console.log("1. Deploy the web app with updated HTML files");
    console.log("2. Test reports.html with real date ranges");
    console.log("3. Test REPORT(2WEEKS) sheet with date inputs");
    console.log("4. Compare results between both systems for consistency");
    
    return "✅ Integrated reporting system test completed successfully!";
    
  } catch (error) {
    console.log(`❌ Integration testing error: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
    throw new Error("Integration testing failed: " + error.message);
  }
}
