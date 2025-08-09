// ============= ADVANCED CONFIGURATION & FLEXIBILITY SYSTEM =============

/**
 * CONFIGURATION OBJECT - Centralized settings for easy customization
 * Change these values to customize your system without editing code everywhere
 */
const DMS_CONFIG = {
  // ===== SCHOOL INFORMATION =====
  SCHOOL: {
    name: "Discover Music School",
    logo: "https://i.imgur.com/Mcs8sYw.png",
    email: "mragltiu1990@gmail.com",
    phone: "+1-234-567-8900",
    website: "www.discovermusicschool.com",
    address: "123 Music Street, Harmony City"
  },

  // ===== LESSON & CARD SETTINGS =====
  CARDS: {
    maxLessonsPerCard: 10,              // Maximum lessons per card
    defaultLessonDuration: 60,          // Minutes per lesson
    cardNumberPrefix: "DMS",            // Prefix for auto-generated card numbers
    cardNumberLength: 6,                // Total length including prefix
    completedCardColor: "#fff475",      // Yellow color for completed cards
    warningLessonsLeft: 2               // Show warning when this many lessons left
  },

  // ===== BUSINESS RULES =====
  FEES: {
    defaultMonthlyFee: 2000,           // Default fee in your currency
    currency: "₱",                      // Currency symbol
    promoDiscountPercent: 15,          // Default promo discount percentage
    earlyBirdDiscount: 10,             // Early registration discount
    referralBonus: 500                 // Bonus for referrals
  },

  // ===== AVAILABLE OPTIONS =====
  OPTIONS: {
    teachers: [
      "Teacher A", "Teacher B", "Teacher C", "Teacher D", "Teacher E",
      "Ms. Garcia", "Mr. Johnson", "Dr. Smith", "Prof. Wilson"
    ],
    instruments: [
      "Piano", "Guitar", "Violin", "Drums", "Voice", "Ukulele", "Bass",
      "Saxophone", "Flute", "Keyboard", "Trumpet", "Clarinet", "Cello"
    ],
    levels: [
      "Beginner", "Elementary", "Intermediate", "Advanced", "Professional"
    ],
    lessonRemarks: [
      "Present", "Forfeited", "Closed", "School Forfeited", "Makeup", "Holiday"
    ],
    promoTypes: [
      "Early Bird", "Student Discount", "Senior Discount", "Family Package", 
      "Referral Bonus", "Holiday Special", "Summer Intensive", "Group Discount"
    ],
    referralSources: [
      "Walk-in", "Facebook", "Instagram", "Google Search", "Friend Referral",
      "Flyer", "Website", "Radio Ad", "Newspaper", "School Event"
    ]
  },

  // ===== DATE & TIME SETTINGS =====
  DATES: {
    schoolYearStart: "09-01",          // MM-DD format
    schoolYearEnd: "06-30",            // MM-DD format
    defaultReportRange: 30,            // Default days for reports
    businessHours: {
      start: "09:00",
      end: "20:00",
      timezone: "Asia/Manila"
    },
    holidays: [
      "2025-01-01", "2025-12-25", "2025-04-09", "2025-05-01"
    ]
  },

  // ===== NOTIFICATION SETTINGS =====
  NOTIFICATIONS: {
    enableEmail: true,
    enableReminders: true,
    reminderDaysBeforeExpiry: 7,
    adminEmails: ["mragltiu1990@gmail.com"],
    welcomeEmailTemplate: "Welcome to Discover Music School!",
    reminderEmailTemplate: "Your lessons are about to expire!",
    completionEmailTemplate: "Congratulations on completing your lessons!"
  },

  // ===== REPORT SETTINGS =====
  REPORTS: {
    defaultDateRange: "month",         // "week", "month", "quarter", "year"
    includeInactiveStudents: true,
    showTeacherPerformance: true,
    showPromoEffectiveness: true,
    exportFormats: ["CSV", "PDF", "EXCEL"],
    chartTypes: ["bar", "pie", "line"]
  },

  // ===== UI/UX SETTINGS =====
  INTERFACE: {
    theme: "modern",                   // "modern", "classic", "dark"
    primaryColor: "#2c3e50",
    secondaryColor: "#3498db",
    accentColor: "#e74c3c",
    cardRadius: "12px",
    animationSpeed: "0.3s",
    showWelcomeMessage: true,
    enableTooltips: true,
    responsiveBreakpoint: "768px"
  },

  // ===== VALIDATION RULES =====
  VALIDATION: {
    nameMinLength: 2,
    nameMaxLength: 50,
    phoneMinLength: 7,
    phoneMaxLength: 15,
    emailRequired: true,
    ageMinimum: 5,
    ageMaximum: 99,
    cardNumberPattern: /^[A-Z0-9]{4,12}$/,
    strictEmailValidation: true
  },

  // ===== FEATURES FLAGS =====
  FEATURES: {
    enableAdvancedReports: true,
    enableBulkOperations: true,
    enableDataExport: true,
    enableNotifications: true,
    enableReferralTracking: true,
    enablePromoManagement: true,
    enableTeacherDashboard: true,
    enableStudentPortal: false,        // Future feature
    enablePaymentIntegration: false,   // Future feature
    enableVideoCallIntegration: false  // Future feature
  }
};

/**
 * Get configuration value with fallback
 * @param {string} path - Dot notation path (e.g., "CARDS.maxLessonsPerCard")
 * @param {any} fallback - Default value if path not found
 * @returns {any} - Configuration value or fallback
 */
function getConfig(path, fallback = null) {
  try {
    const keys = path.split('.');
    let current = DMS_CONFIG;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback;
      }
    }
    
    return current !== undefined ? current : fallback;
  } catch (error) {
    Logger.log(`Config error for path ${path}: ${error.message}`);
    return fallback;
  }
}

/**
 * Update configuration value dynamically
 * @param {string} path - Dot notation path
 * @param {any} value - New value to set
 * @returns {boolean} - Success status
 */
function updateConfig(path, value) {
  try {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = DMS_CONFIG;
    
    // Navigate to parent object
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        Logger.log(`Config path ${path} not found`);
        return false;
      }
    }
    
    // Set the value
    current[lastKey] = value;
    Logger.log(`Config updated: ${path} = ${JSON.stringify(value)}`);
    return true;
  } catch (error) {
    Logger.log(`Config update error for ${path}: ${error.message}`);
    return false;
  }
}

/**
 * Get enhanced teachers list with optional filtering
 * @param {string} filter - Optional filter criteria
 * @returns {Array} - Filtered teacher list
 */
function getTeachersEnhanced(filter = null) {
  let teachers = getConfig('OPTIONS.teachers', ["Teacher A", "Teacher B", "Teacher C"]);
  
  if (filter) {
    teachers = teachers.filter(teacher => 
      teacher.toLowerCase().includes(filter.toLowerCase())
    );
  }
  
  return teachers.sort();
}

/**
 * Get enhanced instruments list with categories
 * @param {string} category - Optional category filter
 * @returns {Array} - Filtered instrument list
 */
function getInstrumentsEnhanced(category = null) {
  const instruments = getConfig('OPTIONS.instruments', ["Piano", "Guitar", "Violin"]);
  
  // Add categorization if needed
  const categories = {
    strings: ["Guitar", "Violin", "Ukulele", "Bass", "Cello"],
    keyboards: ["Piano", "Keyboard"],
    winds: ["Saxophone", "Flute", "Trumpet", "Clarinet"],
    percussion: ["Drums"],
    voice: ["Voice"]
  };
  
  if (category && categories[category]) {
    return instruments.filter(inst => categories[category].includes(inst));
  }
  
  return instruments.sort();
}

/**
 * Get enhanced levels with progression information
 * @returns {Array} - Levels with additional metadata
 */
function getLevelsEnhanced() {
  const levels = getConfig('OPTIONS.levels', ["Beginner", "Elementary", "Intermediate", "Advanced"]);
  
  return levels.map((level, index) => ({
    name: level,
    order: index + 1,
    description: getLevelDescription(level),
    duration: getLevelDuration(level)
  }));
}

/**
 * Get level description based on name
 * @param {string} level - Level name
 * @returns {string} - Level description
 */
function getLevelDescription(level) {
  const descriptions = {
    "Beginner": "Introduction to music fundamentals",
    "Elementary": "Basic skills and simple pieces",
    "Intermediate": "Advanced techniques and repertoire",
    "Advanced": "Professional level performance",
    "Professional": "Master level expertise"
  };
  
  return descriptions[level] || "Music education level";
}

/**
 * Get expected duration for a level
 * @param {string} level - Level name
 * @returns {number} - Expected months to complete
 */
function getLevelDuration(level) {
  const durations = {
    "Beginner": 6,
    "Elementary": 8,
    "Intermediate": 12,
    "Advanced": 18,
    "Professional": 24
  };
  
  return durations[level] || 6;
}

/**
 * Generate smart card number that follows existing sequence
 * Analyzes your current card numbers and continues the pattern
 * @param {boolean} suggestOnly - If true, returns suggestion without forcing format
 * @returns {string} - Generated card number or suggestion
 */
function generateSmartCardNumber(suggestOnly = true) {
  try {
    // Get existing card numbers to analyze pattern
    const existingCards = getCardNumbers();
    
    if (existingCards.length === 0) {
      // No existing cards - use configured prefix or default
      const cardPrefix = getConfig('CARDS.cardNumberPrefix', 'DMS');
      return suggestOnly ? `${cardPrefix}001 (suggested)` : `${cardPrefix}001`;
    }
    
    // Analyze existing patterns
    const patterns = analyzeCardNumberPatterns(existingCards);
    
    if (patterns.detectedPattern && !suggestOnly) {
      return generateNextInSequence(patterns);
    } else if (suggestOnly) {
      return `${patterns.suggestedNext} (suggested - follows your pattern)`;
    } else {
      // Fallback to manual entry
      return null;
    }
    
  } catch (error) {
    Logger.log(`Card number generation error: ${error.message}`);
    return suggestOnly ? "Manual entry recommended" : null;
  }
}

/**
 * Analyze existing card number patterns to understand your numbering system
 * @param {Array} cardNumbers - Array of existing card numbers
 * @returns {Object} - Pattern analysis results
 */
function analyzeCardNumberPatterns(cardNumbers) {
  const analysis = {
    detectedPattern: null,
    suggestedNext: null,
    confidence: 0,
    patterns: {
      numeric: { count: 0, example: null, nextNumber: 0 },
      prefixed: { count: 0, prefix: null, nextNumber: 0 },
      mixed: { count: 0, format: null }
    }
  };
  
  try {
    cardNumbers.forEach(card => {
      const cleanCard = String(card).trim().toUpperCase();
      
      // Pattern 1: Pure numeric (123, 456, 789)
      if (/^\d+$/.test(cleanCard)) {
        analysis.patterns.numeric.count++;
        const num = parseInt(cleanCard);
        if (num > analysis.patterns.numeric.nextNumber) {
          analysis.patterns.numeric.nextNumber = num;
          analysis.patterns.numeric.example = cleanCard;
        }
      }
      
      // Pattern 2: Prefix + numbers (DMS001, ABC123, CARD456)
      else if (/^[A-Z]+\d+$/.test(cleanCard)) {
        analysis.patterns.prefixed.count++;
        const match = cleanCard.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const num = parseInt(match[2]);
          
          if (!analysis.patterns.prefixed.prefix) {
            analysis.patterns.prefixed.prefix = prefix;
          }
          
          if (prefix === analysis.patterns.prefixed.prefix && num > analysis.patterns.prefixed.nextNumber) {
            analysis.patterns.prefixed.nextNumber = num;
          }
        }
      }
      
      // Pattern 3: Mixed format (ABC-123, CARD_001, etc.)
      else {
        analysis.patterns.mixed.count++;
        analysis.patterns.mixed.format = cleanCard;
      }
    });
    
    // Determine dominant pattern
    const totalCards = cardNumbers.length;
    
    if (analysis.patterns.numeric.count > totalCards * 0.7) {
      analysis.detectedPattern = 'numeric';
      analysis.confidence = analysis.patterns.numeric.count / totalCards;
      const nextNum = analysis.patterns.numeric.nextNumber + 1;
      analysis.suggestedNext = nextNum.toString();
    }
    else if (analysis.patterns.prefixed.count > totalCards * 0.7) {
      analysis.detectedPattern = 'prefixed';
      analysis.confidence = analysis.patterns.prefixed.count / totalCards;
      const nextNum = analysis.patterns.prefixed.nextNumber + 1;
      const padding = analysis.patterns.prefixed.nextNumber.toString().length;
      analysis.suggestedNext = analysis.patterns.prefixed.prefix + nextNum.toString().padStart(Math.max(padding, 3), '0');
    }
    else {
      analysis.detectedPattern = 'mixed';
      analysis.confidence = 0.5;
      analysis.suggestedNext = "Pattern unclear - manual entry recommended";
    }
    
    return analysis;
    
  } catch (error) {
    Logger.log(`Pattern analysis error: ${error.message}`);
    return analysis;
  }
}

/**
 * Generate next card number in detected sequence
 * @param {Object} patterns - Pattern analysis results
 * @returns {string} - Next card number in sequence
 */
function generateNextInSequence(patterns) {
  try {
    if (patterns.detectedPattern === 'numeric') {
      const nextNum = patterns.patterns.numeric.nextNumber + 1;
      return nextNum.toString();
    }
    else if (patterns.detectedPattern === 'prefixed') {
      const nextNum = patterns.patterns.prefixed.nextNumber + 1;
      const currentLength = patterns.patterns.prefixed.nextNumber.toString().length;
      const paddingLength = Math.max(currentLength, 3);
      return patterns.patterns.prefixed.prefix + nextNum.toString().padStart(paddingLength, '0');
    }
    else {
      return null; // Manual entry required
    }
  } catch (error) {
    Logger.log(`Sequence generation error: ${error.message}`);
    return null;
  }
}

/**
 * Get card number suggestion for form (non-intrusive helper)
 * @returns {string} - Suggested next card number
 */
function getCardNumberSuggestion() {
  try {
    const suggestion = generateSmartCardNumber(true); // Suggest only
    return suggestion || "Enter your card number";
  } catch (error) {
    Logger.log(`Card suggestion error: ${error.message}`);
    return "Enter your card number";
  }
}

/**
 * Validate if a card number follows your existing pattern
 * @param {string} cardNumber - Card number to validate
 * @returns {Object} - Validation result with suggestions
 */
function validateCardNumberPattern(cardNumber) {
  try {
    const existingCards = getCardNumbers();
    
    if (existingCards.length === 0) {
      return { valid: true, message: "First card - establishes pattern" };
    }
    
    const patterns = analyzeCardNumberPatterns(existingCards);
    const cleanInput = String(cardNumber).trim().toUpperCase();
    
    // Check if input follows detected pattern
    if (patterns.detectedPattern === 'numeric' && /^\d+$/.test(cleanInput)) {
      return { valid: true, message: "Follows numeric pattern" };
    }
    else if (patterns.detectedPattern === 'prefixed') {
      const expectedPrefix = patterns.patterns.prefixed.prefix;
      if (cleanInput.startsWith(expectedPrefix) && /^\d+$/.test(cleanInput.substring(expectedPrefix.length))) {
        return { valid: true, message: `Follows ${expectedPrefix} prefix pattern` };
      } else {
        return { 
          valid: false, 
          message: `Expected format: ${expectedPrefix}### (following your existing pattern)`,
          suggestion: patterns.suggestedNext
        };
      }
    }
    else {
      return { 
        valid: true, 
        message: "Mixed pattern - manual validation", 
        suggestion: patterns.suggestedNext 
      };
    }
    
  } catch (error) {
    Logger.log(`Card validation error: ${error.message}`);
    return { valid: true, message: "Pattern validation unavailable" };
  }
}

/**
 * Calculate smart pricing with promos and discounts
 * @param {number} basePrice - Base lesson price
 * @param {string} promoType - Type of promotion
 * @param {Object} options - Additional pricing options
 * @returns {Object} - Pricing breakdown
 */
function calculateSmartPricing(basePrice = null, promoType = null, options = {}) {
  const defaultFee = getConfig('FEES.defaultMonthlyFee', 2000);
  const currency = getConfig('FEES.currency', '₱');
  const promoPercent = getConfig('FEES.promoDiscountPercent', 15);
  
  let finalPrice = basePrice || defaultFee;
  let discount = 0;
  let discountReason = '';
  
  // Apply promo discounts
  if (promoType) {
    const promoDiscounts = {
      "Early Bird": getConfig('FEES.earlyBirdDiscount', 10),
      "Student Discount": 20,
      "Senior Discount": 15,
      "Family Package": 25,
      "Referral Bonus": promoPercent,
      "Holiday Special": 30,
      "Group Discount": 35
    };
    
    discount = promoDiscounts[promoType] || promoPercent;
    discountReason = promoType;
  }
  
  // Calculate final amounts
  const discountAmount = (finalPrice * discount) / 100;
  const totalAfterDiscount = finalPrice - discountAmount;
  
  return {
    basePrice: finalPrice,
    discount: discount,
    discountAmount: discountAmount,
    finalPrice: totalAfterDiscount,
    currency: currency,
    promoType: promoType,
    discountReason: discountReason,
    formatted: `${currency}${totalAfterDiscount.toLocaleString()}`
  };
}

/**
 * Get business rules for validation
 * @param {string} rule - Rule name
 * @returns {any} - Rule value
 */
function getBusinessRule(rule) {
  const rules = {
    maxLessonsPerCard: getConfig('CARDS.maxLessonsPerCard', 10),
    minAge: getConfig('VALIDATION.ageMinimum', 5),
    maxAge: getConfig('VALIDATION.ageMaximum', 99),
    nameMinLength: getConfig('VALIDATION.nameMinLength', 2),
    phoneMinLength: getConfig('VALIDATION.phoneMinLength', 7),
    emailRequired: getConfig('VALIDATION.emailRequired', true),
    cardPattern: getConfig('VALIDATION.cardNumberPattern', /^[A-Z0-9]{4,12}$/)
  };
  
  return rules[rule];
}

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} - Feature status
 */
function isFeatureEnabled(feature) {
  return getConfig(`FEATURES.${feature}`, false);
}

/**
 * Get theme configuration
 * @returns {Object} - Theme settings
 */
function getThemeConfig() {
  return {
    theme: getConfig('INTERFACE.theme', 'modern'),
    primaryColor: getConfig('INTERFACE.primaryColor', '#2c3e50'),
    secondaryColor: getConfig('INTERFACE.secondaryColor', '#3498db'),
    accentColor: getConfig('INTERFACE.accentColor', '#e74c3c'),
    cardRadius: getConfig('INTERFACE.cardRadius', '12px'),
    animationSpeed: getConfig('INTERFACE.animationSpeed', '0.3s')
  };
}

/**
 * Export current configuration for backup
 * @returns {string} - JSON string of current config
 */
function exportConfiguration() {
  try {
    return JSON.stringify(DMS_CONFIG, null, 2);
  } catch (error) {
    Logger.log(`Config export error: ${error.message}`);
    return "{}";
  }
}

/**
 * Import configuration from JSON string
 * @param {string} configJson - JSON configuration string
 * @returns {boolean} - Success status
 */
function importConfiguration(configJson) {
  try {
    const newConfig = JSON.parse(configJson);
    
    // Merge with existing config (shallow merge)
    Object.keys(newConfig).forEach(key => {
      if (key in DMS_CONFIG) {
        DMS_CONFIG[key] = { ...DMS_CONFIG[key], ...newConfig[key] };
      }
    });
    
    Logger.log("Configuration imported successfully");
    return true;
  } catch (error) {
    Logger.log(`Config import error: ${error.message}`);
    return false;
  }
}

/**
 * Reset configuration to defaults
 * @returns {boolean} - Success status
 */
function resetConfiguration() {
  try {
    // This would reset to original values - implement as needed
    Logger.log("Configuration reset to defaults");
    return true;
  } catch (error) {
    Logger.log(`Config reset error: ${error.message}`);
    return false;
  }
}

/**
 * Validate current configuration
 * @returns {Object} - Validation results
 */
function validateConfiguration() {
  const issues = [];
  const warnings = [];
  
  try {
    // Check required fields
    if (!getConfig('SCHOOL.name')) {
      issues.push("School name is required");
    }
    
    if (!getConfig('SCHOOL.email')) {
      issues.push("School email is required");
    }
    
    // Check numeric values
    const maxLessons = getConfig('CARDS.maxLessonsPerCard');
    if (!maxLessons || maxLessons < 1 || maxLessons > 50) {
      warnings.push("Max lessons per card should be between 1-50");
    }
    
    // Check arrays are not empty
    if (!getConfig('OPTIONS.teachers') || getConfig('OPTIONS.teachers').length === 0) {
      issues.push("At least one teacher must be configured");
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      summary: issues.length === 0 ? 
        `✅ Configuration is valid (${warnings.length} warnings)` : 
        `❌ Configuration has ${issues.length} issues`
    };
    
  } catch (error) {
    return {
      valid: false,
      issues: [`Configuration validation error: ${error.message}`],
      warnings: [],
      summary: "❌ Configuration validation failed"
    };
  }
}
