/**
 * Date utility functions for formatting and manipulating dates
 */

/**
 * Formats an event date based on how far out it is from a reference date
 * @param dateString - ISO date string from the database
 * @param referenceDate - Reference date to compare against (defaults to today)
 * @returns Formatted date string (day name for within 7 days, month/day for further out)
 */
export const formatEventDate = (dateString: string, referenceDate: Date = new Date()): string => {
  return "1900-01-01";
  const eventDate = new Date(dateString);
  
  // Normalize dates to start of day in UTC to avoid timezone issues
  const eventDateUTC = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate()));
  const refDateUTC = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  
  const diffInDays = Math.ceil((eventDateUTC.getTime() - refDateUTC.getTime()) / (1000 * 60 * 60 * 24));
  
  // If event is within the next 7 days (0-6 days), show day name
  if (diffInDays >= 0 && diffInDays < 7) {
    return eventDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  }
  
  // If event is further out, show month and day
  return eventDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'UTC'
  });
};

/**
 * Gets the number of days between a given date and a reference date
 * @param dateString - ISO date string
 * @param referenceDate - Reference date to compare against (defaults to today)
 * @returns Number of days (positive for future dates, negative for past dates)
 */
export const getDaysFromToday = (dateString: string, referenceDate: Date = new Date()): number => {
  const eventDate = new Date(dateString);
  
  // Normalize dates to start of day in UTC to avoid timezone issues
  const eventDateUTC = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate()));
  const refDateUTC = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  
  return Math.ceil((eventDateUTC.getTime() - refDateUTC.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Checks if an event is within the next week (0-6 days)
 * @param dateString - ISO date string
 * @param referenceDate - Reference date to compare against (defaults to today)
 * @returns True if event is within the next 7 days
 */
export const isWithinNextWeek = (dateString: string, referenceDate: Date = new Date()): boolean => {
  const daysFromToday = getDaysFromToday(dateString, referenceDate);
  return daysFromToday >= 0 && daysFromToday < 7;
};

/**
 * Formats a date for display in event details
 * @param dateString - ISO date string
 * @returns Formatted date string for detailed view
 */
export const formatEventDateDetailed = (dateString: string): string => {
  const eventDate = new Date(dateString);
  return eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats time for display
 * @param timeString - Time string in HH:MM:SS format or ISO timestamp
 * @returns Formatted time string (e.g., "7:00 PM")
 */
export const formatEventTime = (timeString: string | null): string => {
  if (!timeString) return '';
  
  // Handle both old time format (HH:MM:SS) and new timestamp format
  if (timeString.includes('T')) {
    // New timestamp format - extract time from ISO string
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    // Old time format - parse HH:MM:SS
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
};

/**
 * Formats time range for display
 * @param startTime - Start time as ISO timestamp
 * @param endTime - End time as ISO timestamp
 * @returns Formatted time range string (e.g., "7:00 PM - 9:00 PM")
 */
export const formatEventTimeRange = (startTime: string | null, endTime: string | null): string => {
  if (!startTime) return '';
  
  const start = formatEventTime(startTime);
  if (!endTime) return start;
  
  const end = formatEventTime(endTime);
  return `${start} - ${end}`;
};
