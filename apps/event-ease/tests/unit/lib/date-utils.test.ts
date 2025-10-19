import {
  formatEventDate,
  getDaysFromToday,
  isWithinNextWeek,
  formatEventDateDetailed,
  formatEventTime
} from '@/lib/date-utils';

// Mock the current date to ensure consistent test results
const mockDate = new Date('2024-01-15T12:00:00Z'); // Monday, January 15, 2024

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(mockDate);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('formatEventDate', () => {
  const referenceDate = new Date('2024-01-15T12:00:00Z'); // Monday, January 15, 2024

  it('should return day name for events within the next 7 days', () => {
    // Tomorrow
    expect(formatEventDate('2024-01-16T12:00:00Z', referenceDate)).toBe('Tuesday');
    
    // Day after tomorrow
    expect(formatEventDate('2024-01-17T12:00:00Z', referenceDate)).toBe('Wednesday');
    
    // This week
    expect(formatEventDate('2024-01-21T12:00:00Z', referenceDate)).toBe('Sunday');
    
    // Today
    expect(formatEventDate('2024-01-15T12:00:00Z', referenceDate)).toBe('Monday');
  });

  it('should return month and day for events beyond 7 days', () => {
    // Next week
    expect(formatEventDate('2024-01-22T12:00:00Z', referenceDate)).toBe('Jan 22');
    
    // Next month
    expect(formatEventDate('2024-02-15T12:00:00Z', referenceDate)).toBe('Feb 15');
    
    // Far future
    expect(formatEventDate('2024-12-25T12:00:00Z', referenceDate)).toBe('Dec 25');
  });

  it('should handle past dates', () => {
    // Yesterday
    expect(formatEventDate('2024-01-14T12:00:00Z', referenceDate)).toBe('Jan 14');
    
    // Last week
    expect(formatEventDate('2024-01-08T12:00:00Z', referenceDate)).toBe('Jan 8');
  });
});

describe('getDaysFromToday', () => {
  const referenceDate = new Date('2024-01-15T12:00:00Z'); // Monday, January 15, 2024

  it('should return correct number of days for future dates', () => {
    expect(getDaysFromToday('2024-01-16T12:00:00Z', referenceDate)).toBe(1); // Tomorrow
    expect(getDaysFromToday('2024-01-17T12:00:00Z', referenceDate)).toBe(2); // Day after tomorrow
    expect(getDaysFromToday('2024-01-22T12:00:00Z', referenceDate)).toBe(7); // Next week
  });

  it('should return negative numbers for past dates', () => {
    expect(getDaysFromToday('2024-01-14T12:00:00Z', referenceDate)).toBe(-1); // Yesterday
    expect(getDaysFromToday('2024-01-08T12:00:00Z', referenceDate)).toBe(-7); // Last week
  });

  it('should return 0 for today', () => {
    expect(getDaysFromToday('2024-01-15T12:00:00Z', referenceDate)).toBe(0);
  });
});

describe('isWithinNextWeek', () => {
  const referenceDate = new Date('2024-01-15T12:00:00Z'); // Monday, January 15, 2024

  it('should return true for events within the next 7 days', () => {
    expect(isWithinNextWeek('2024-01-15T12:00:00Z', referenceDate)).toBe(true); // Today
    expect(isWithinNextWeek('2024-01-16T12:00:00Z', referenceDate)).toBe(true); // Tomorrow
    expect(isWithinNextWeek('2024-01-21T12:00:00Z', referenceDate)).toBe(true); // This week
  });

  it('should return false for events beyond 7 days', () => {
    expect(isWithinNextWeek('2024-01-22T12:00:00Z', referenceDate)).toBe(false); // Next week
    expect(isWithinNextWeek('2024-02-15T12:00:00Z', referenceDate)).toBe(false); // Next month
  });

  it('should return false for past dates', () => {
    expect(isWithinNextWeek('2024-01-14T12:00:00Z', referenceDate)).toBe(false); // Yesterday
    expect(isWithinNextWeek('2024-01-08T12:00:00Z', referenceDate)).toBe(false); // Last week
  });
});

describe('formatEventDateDetailed', () => {
  it('should return full date format', () => {
    expect(formatEventDateDetailed('2024-01-15T12:00:00Z')).toBe('Monday, January 15, 2024');
    expect(formatEventDateDetailed('2024-12-25T12:00:00Z')).toBe('Wednesday, December 25, 2024');
  });
});

describe('formatEventTime', () => {
  it('should format time correctly', () => {
    expect(formatEventTime('14:30:00')).toBe('2:30 PM');
    expect(formatEventTime('09:00:00')).toBe('9:00 AM');
    expect(formatEventTime('23:45:00')).toBe('11:45 PM');
    expect(formatEventTime('00:15:00')).toBe('12:15 AM');
  });

  it('should handle edge cases', () => {
    expect(formatEventTime('12:00:00')).toBe('12:00 PM');
    expect(formatEventTime('00:00:00')).toBe('12:00 AM');
  });
});

describe('Edge cases and error handling', () => {
  it('should handle invalid date strings gracefully', () => {
    // These should not throw errors, but may return unexpected results
    expect(() => formatEventDate('invalid-date')).not.toThrow();
    expect(() => getDaysFromToday('invalid-date')).not.toThrow();
    expect(() => isWithinNextWeek('invalid-date')).not.toThrow();
  });

  it('should handle timezone differences', () => {
    const referenceDate = new Date('2024-01-15T12:00:00Z'); // Monday, January 15, 2024
    // Test with different timezone offsets
    expect(formatEventDate('2024-01-16T00:00:00Z', referenceDate)).toBe('Tuesday');
    expect(formatEventDate('2024-01-16T23:59:59Z', referenceDate)).toBe('Tuesday');
  });
});
