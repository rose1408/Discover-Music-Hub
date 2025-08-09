// ====================== ENROLLMENT FORM =====================================

/**
 * Submits student enrollment form data
 * @param {Object} formData - Form data containing student information
 * @throws {Error} - If validation fails or submission error occurs
 */
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
    
    // Build referral information string
    let referralInfo = formData.referralSource || 'Not specified';
    if (formData.referralDetails && formData.referralDetails !== formData.referralSource) {
      referralInfo += ` - ${formData.referralDetails}`;
    }
    
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
      STATUS_ACTIVE, // default status
      referralInfo // referral source information
    ]);
    
    return "✅ Student information submitted successfully!";
    
  } catch (err) {
    Logger.log("❌ Error in submitForm: " + err.message);
    throw err;
  }
}

/**
 * Gets all student names from enrollment sheet
 * @returns {Array} - Array of student names
 */
function getAllStudentNames() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ENROLLMENT_TAB);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const names = sheet.getRange(2, 3, lastRow - 1).getValues();
  return names.flat().filter(name => !!name);
}

/**
 * Gets student names for autocomplete functionality
 * @returns {Array} - Array of formatted student names
 */
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
