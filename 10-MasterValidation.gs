// ============================== MASTER VALIDATION & SETUP ===============================

/**
 * Master function to validate all HTML form dependencies
 * Call this to ensure all HTML forms will work properly
 * @returns {Object} - Comprehensive validation results
 */
function validateAllHTMLFormDependencies() {
  const validationResults = {
    overallStatus: 'CHECKING',
    htmlForms: {
      'student-info-form.html': {
        requiredFunctions: ['submitForm', 'getStudentNames', 'getAllStudentNames'],
        status: 'UNKNOWN',
        missingFunctions: []
      },
      'attendance-form.html': {
        requiredFunctions: ['getCardNumbers', 'getCardAttendanceStatus', 'isLessonUsed', 'submitAttendance'],
        status: 'UNKNOWN',
        missingFunctions: []
      },
      'new-card-form.html': {
        requiredFunctions: ['submitCardForm', 'getStudentNames'],
        status: 'UNKNOWN',
        missingFunctions: []
      },
      'reports.html': {
        requiredFunctions: ['getReportData'],
        status: 'UNKNOWN',
        missingFunctions: []
      },
      'index.html': {
        requiredFunctions: [], // Main dashboard, no backend functions
        status: 'OK',
        missingFunctions: []
      }
    },
    backendModules: {},
    recommendations: []
  };

  try {
    // Get backend test results
    validationResults.backendModules = testBackendFunctions();

    // Validate each HTML form's dependencies
    for (const [formName, formInfo] of Object.entries(validationResults.htmlForms)) {
      if (formInfo.requiredFunctions.length === 0) continue;
      
      for (const funcName of formInfo.requiredFunctions) {
        if (typeof eval(funcName) !== 'function') {
          formInfo.missingFunctions.push(funcName);
        }
      }
      
      formInfo.status = formInfo.missingFunctions.length === 0 ? 'OK' : 'MISSING_FUNCTIONS';
    }

    // Generate recommendations
    if (validationResults.backendModules.errors && validationResults.backendModules.errors.length > 0) {
      validationResults.recommendations.push("❌ Backend errors found - check testBackendFunctions() results");
    }

    // Check individual forms
    let allFormsOK = true;
    for (const [formName, formInfo] of Object.entries(validationResults.htmlForms)) {
      if (formInfo.status !== 'OK') {
        allFormsOK = false;
        validationResults.recommendations.push(`❌ ${formName} is missing functions: ${formInfo.missingFunctions.join(', ')}`);
      }
    }

    if (allFormsOK && validationResults.backendModules.errors.length === 0) {
      validationResults.overallStatus = 'ALL_GOOD';
      validationResults.recommendations.push("✅ All HTML forms should work properly!");
    } else {
      validationResults.overallStatus = 'ISSUES_FOUND';
    }

    // Add setup recommendations
    if (!validationResults.backendModules.spreadsheetAccess) {
      validationResults.recommendations.push("🔧 Run initializeSpreadsheetStructure() to set up spreadsheet");
    }

    return validationResults;

  } catch (error) {
    validationResults.overallStatus = 'ERROR';
    validationResults.error = error.message;
    validationResults.recommendations.push("❌ Validation failed: " + error.message);
    return validationResults;
  }
}

/**
 * Quick setup function - runs all necessary initialization
 * @returns {string} - Setup status message
 */
function quickSetup() {
  try {
    Logger.log("🚀 Starting quick setup...");
    
    // Step 1: Initialize spreadsheet structure
    const initResult = initializeSpreadsheetStructure();
    Logger.log("✅ " + initResult);
    
    // Step 2: Test all functions
    const testResult = testBackendFunctions();
    Logger.log("🧪 Backend test results:", testResult);
    
    // Step 3: Validate HTML dependencies
    const validationResult = validateAllHTMLFormDependencies();
    Logger.log("📋 HTML validation results:", validationResult);
    
    if (validationResult.overallStatus === 'ALL_GOOD') {
      return "✅ Quick setup completed successfully! All systems ready.";
    } else {
      return "⚠️ Setup completed with warnings. Check validation results: " + JSON.stringify(validationResult.recommendations);
    }
    
  } catch (error) {
    Logger.log("❌ Quick setup failed:", error.message);
    return "❌ Quick setup failed: " + error.message;
  }
}

/**
 * Development helper - logs all function names for debugging
 */
function logAllAvailableFunctions() {
  const functionNames = [];
  
  // Try to detect functions by testing typeof
  const commonFunctions = [
    'submitForm', 'getAllStudentNames', 'getStudentNames',
    'submitCardForm', 'getCardNumbers', 'checkCardNumber', 'cardExists',
    'isLessonUsed', 'submitAttendance', 'getCardAttendanceStatus', 'autoFillAttendance',
    'checkLessonCompletionAndUpdateStatus', 'sendStatusEmail',
    'logReminder', 'getReportData',
    'normalizeString', 'normalizeStringLower', 'isValidEmail', 'isValidPhone', 'isValidCardNumber',
    'getTeachers', 'getInstruments', 'getLevels',
    'initializeSpreadsheetStructure', 'testBackendFunctions'
  ];
  
  commonFunctions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        functionNames.push(`✅ ${funcName}`);
      } else {
        functionNames.push(`❌ ${funcName} - NOT FOUND`);
      }
    } catch (e) {
      functionNames.push(`❌ ${funcName} - ERROR: ${e.message}`);
    }
  });
  
  Logger.log("📋 Available Functions:");
  functionNames.forEach(fn => Logger.log(fn));
  
  return functionNames;
}
