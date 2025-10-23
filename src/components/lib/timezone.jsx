/**
 * Timezone utility functions for handling Pacific Time
 */

/**
 * Get the current date and time in Pacific Time
 * @returns {Date} Current date/time adjusted to Pacific timezone
 */
export const getCurrentPacificTime = () => {
  const now = new Date();
  const pacificTimeString = now.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles' 
  });
  return new Date(pacificTimeString);
};

/**
 * Convert a date string to Pacific Time at start of day (00:00:00 PT)
 * @param {string} dateString - Date string in format "YYYY-MM-DD"
 * @returns {Date} Date at midnight Pacific Time
 */
export const dateStringToPacificStartOfDay = (dateString) => {
  if (!dateString) return null;
  return new Date(`${dateString}T00:00:00`);
};

/**
 * Convert a date string to Pacific Time at end of day (23:59:59 PT)
 * @param {string} dateString - Date string in format "YYYY-MM-DD"
 * @returns {Date} Date at end of day Pacific Time
 */
export const dateStringToPacificEndOfDay = (dateString) => {
  if (!dateString) return null;
  return new Date(`${dateString}T23:59:59`);
};

/**
 * Check if current Pacific Time is within a date range
 * @param {string} startDateString - Start date "YYYY-MM-DD"
 * @param {string} endDateString - End date "YYYY-MM-DD"
 * @returns {boolean} True if current PT is within range
 */
export const isWithinDateRange = (startDateString, endDateString) => {
  const now = getCurrentPacificTime();
  const start = dateStringToPacificStartOfDay(startDateString);
  const end = dateStringToPacificEndOfDay(endDateString);
  
  return now >= start && now <= end;
};

/**
 * Check if a date has passed in Pacific Time
 * @param {string} dateString - Date string "YYYY-MM-DD"
 * @returns {boolean} True if the date has passed (after end of day PT)
 */
export const hasDatePassed = (dateString) => {
  const now = getCurrentPacificTime();
  const endOfDay = dateStringToPacificEndOfDay(dateString);
  
  return now > endOfDay;
};

/**
 * Get cycle status with manual override support
 * @param {Object} cycle - Cycle object with dates and manual_status
 * @returns {Object} Status object with text, color, and icon
 */
export const getCycleStatus = (cycle) => {
  // If manual status is set, use it
  if (cycle.manual_status) {
    const manualStatuses = {
      reviewing: { 
        text: "Reviewing", 
        color: "bg-purple-100 text-purple-800 border-purple-200", 
        icon: 'Clock'
      },
      completed: { 
        text: "Completed", 
        color: "bg-gray-100 text-gray-800 border-gray-200", 
        icon: 'CheckCircle2'
      },
      closed: { 
        text: "Closed", 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: 'XCircle'
      }
    };
    return manualStatuses[cycle.manual_status] || manualStatuses.reviewing;
  }

  // Otherwise calculate based on dates
  const nowPT = getCurrentPacificTime();
  const startDate = dateStringToPacificStartOfDay(cycle.start_date);
  const endDate = dateStringToPacificEndOfDay(cycle.end_date);
  const announceDate = dateStringToPacificEndOfDay(cycle.announce_by);

  if (nowPT > announceDate) {
    return { 
      text: "Completed", 
      color: "bg-gray-100 text-gray-800 border-gray-200", 
      icon: 'CheckCircle2'
    };
  }
  if (nowPT > endDate) {
    return { 
      text: "Reviewing", 
      color: "bg-purple-100 text-purple-800 border-purple-200", 
      icon: 'Clock'
    };
  }
  if (nowPT >= startDate && cycle.is_open_for_submissions) {
    return { 
      text: "Open", 
      color: "bg-green-100 text-green-800 border-green-200", 
      icon: 'CheckCircle2'
    };
  }
  if (nowPT >= startDate && !cycle.is_open_for_submissions) {
    return { 
      text: "Closed", 
      color: "bg-red-100 text-red-800 border-red-200", 
      icon: 'XCircle'
    };
  }
  return { 
    text: "Upcoming", 
    color: "bg-blue-100 text-blue-800 border-blue-200", 
    icon: 'Calendar'
  };
};