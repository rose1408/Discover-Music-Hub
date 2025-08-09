# DMS (Discover Music School) - Google Apps Script Files

This repository contains the separated Google Apps Script files for the Student Management System. The code has been organized into logical modules for better maintainability and readability.

## File Structure

### 01-Constants.gs
- Contains all global constants and configuration variables
- Spreadsheet ID and sheet tab names
- Status constants (ACTIVE/INACTIVE)

### 02-Utils.gs
- Utility and helper functions
- Validation functions (email, phone, card number)
- String normalization functions (uppercase and lowercase variants)
- Range intersection detection
- Date formatting utilities

### 03-WebApp.gs
- Main web application entry point
- doGet() function that serves the HTML interface

### 04-Enrollment.gs
- Student enrollment form functionality
- Form submission and validation with referral source tracking
- Student name retrieval for autocomplete

### 05-CardManagement.gs
- Card enrollment and management
- Card number validation and duplicate checking
- Card status tracking and formatting
- Card completion highlighting

### 06-Attendance.gs
- Attendance recording and tracking
- Lesson management (1-10 lessons per card)
- Auto-filling of attendance records with student information
- Attendance status queries
- Support for multiple remarks: Present, Forfeited, Closed, School Forfeited

### 07-StatusManagement.gs
- Student status management (ACTIVE/INACTIVE)
- Automatic status updates based on lesson completion
- Email notifications for status changes
- Status logging and tracking

### 08-Notifications.gs
- Reminder system for re-enrollment
- Email notifications when students reach lessons 7-10
- Reminder logging and tracking

### 09-AdditionalFunctions.gs
- Backend support functions for HTML forms
- Dropdown data providers (teachers, instruments, levels)
- System testing and initialization functions
- Spreadsheet structure setup

## Key Features

1. **Student Enrollment**: Complete student registration with validation and referral tracking
2. **Card Management**: Issue and track student cards with unique numbers
3. **Attendance Tracking**: Record lessons and track progress (1-10 lessons per card)
4. **Status Management**: Automatic ACTIVE/INACTIVE status based on lesson completion
5. **Notifications**: Email reminders for re-enrollment and status changes
6. **Data Validation**: Comprehensive input validation and error handling
7. **Referral Tracking**: Track how students found the school (referral, social media, walk-in)

## Setup Instructions

### 1. Create Google Sheets Structure
Run the initialization function to set up proper sheet headers:
```javascript
initializeSpreadsheetStructure();
```

### 2. Update Configuration
In `01-Constants.gs`, update:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

### 3. Deploy Files
1. Copy all .gs files to your Google Apps Script project
2. Ensure all files are uploaded in order (01 through 09)
3. Save and deploy as web app

### 4. Test Backend Functions
Run the test function to verify all dependencies:
```javascript
testBackendFunctions();
```

## HTML Forms Integration

The system includes several HTML forms that integrate with the backend:

- **student-info-form.html**: Student enrollment with referral tracking
- **attendance-form.html**: Lesson attendance recording
- **new-card-form.html**: Student card issuance
- **reports.html**: System reports and analytics

## Expected Sheet Structure

### ENROLLMENT Sheet Columns:
1. Timestamp
2. Student ID  
3. Student's Full Name
4. Date of Birth
5. Age
6. Emergency Contact
7. Email Address
8. Contact Number
9. Social Media Consent
10. Status
11. Referral Source

### CARDNUMBER Sheet Columns:
1. Timestamp
2. Student's Full Name
3. Student Card Number
4. Teacher
5. Level
6. Instrument

### ATTENDANCE Sheet Columns:
1. Timestamp
2. CardNumber
3. Lesson #
4. Remarks
5. (Empty)
6. (Empty)
7. Student's Full Name
8. Email Address
9. Teacher
10. Level
11. Instrument

## Dependencies

- Google Apps Script environment
- Google Sheets for data storage
- Gmail service for email notifications
- HTML service for web interface

## Email Configuration

Update email recipients in:
- `logReminder()` function in 08-Notifications.gs
- `sendStatusEmail()` function in 07-StatusManagement.gs

## Data Flow

1. Students enroll via enrollment form → ENROLLMENT sheet
2. Cards are issued via card form → CARDNUMBER sheet  
3. Attendance is recorded → ATTENDANCE sheet
4. Status is automatically updated based on lesson completion
5. Email notifications are sent for reminders and status changes

## New Features Added

### Enhanced Student Form:
- Referral source tracking (Referred, Social Media, Walk-in)
- Social media platform selection (Facebook, Instagram, TikTok)
- Improved validation and user experience

### Enhanced Attendance Form:
- Support for multiple remarks types
- Real-time card validation
- Automatic lesson number suggestion
- Duplicate lesson prevention

### Backend Improvements:
- Better error handling and validation
- Modular code organization
- Comprehensive testing functions
- Automatic spreadsheet structure setup

## Troubleshooting

1. **Functions not found**: Ensure all .gs files are uploaded and saved
2. **Spreadsheet errors**: Run `initializeSpreadsheetStructure()` to set up headers
3. **Email not working**: Check Gmail service permissions
4. **Form not submitting**: Run `testBackendFunctions()` to verify dependencies

## Notes

- Each card allows for exactly 10 lessons
- Students become INACTIVE only when ALL their cards are fully used (10 lessons each)
- Reminders are sent when students reach lessons 7-10
- The system maintains comprehensive logging for audit purposes
- Multiple attendance remarks supported for different scenarios
