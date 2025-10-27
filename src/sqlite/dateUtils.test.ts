import { describe, it, expect } from 'vitest'
import { 
  makeWeekKey, 
  parseWeekKey, 
  getIsoWeekIdentifier,
  getWeekRange,
  getCurrentWeekRange,
  getWeekRangeForDate,
  getWeeksInISOYear,
  getPreviousIsoWeek,
  getNextIsoWeek
} from './dateUtils'

describe('dateUtils', () => {
  describe('makeWeekKey', () => {
    it('should create week key from year and week number', () => {
      expect(makeWeekKey(2025, 44)).toBe('2025-W44')
    })

    it('should pad week number with zero', () => {
      expect(makeWeekKey(2025, 1)).toBe('2025-W01')
      expect(makeWeekKey(2025, 9)).toBe('2025-W09')
    })

    it('should handle week 53', () => {
      expect(makeWeekKey(2025, 53)).toBe('2025-W53')
    })
  })

  describe('parseWeekKey', () => {
    it('should parse valid week key', () => {
      const result = parseWeekKey('2025-W44')
      expect(result).toEqual({
        iso_year: 2025,
        week_of_year: 44,
      })
    })

    it('should parse week 01', () => {
      const result = parseWeekKey('2025-W01')
      expect(result).toEqual({
        iso_year: 2025,
        week_of_year: 1,
      })
    })

    it('should throw error for invalid format', () => {
      expect(() => parseWeekKey('2025-44' as any)).toThrow('Invalid week key format')
    })
  })

  describe('getIsoWeekIdentifier', () => {
    it('should return ISO week identifier for a date', () => {
      const date = new Date('2025-10-27')
      const result = getIsoWeekIdentifier(date)
      
      expect(result).toHaveProperty('iso_year')
      expect(result).toHaveProperty('week_of_year')
      expect(result.iso_year).toBe(2025)
    })

    it('should handle ISO string date', () => {
      const result = getIsoWeekIdentifier('2025-01-06')
      expect(result.iso_year).toBe(2025)
    })
  })

  describe('getWeekRange', () => {
    it('should return start and end dates for a week', () => {
      const result = getWeekRange(44, 2025)
      
      expect(result).toHaveProperty('start_date')
      expect(result).toHaveProperty('end_date')
      expect(result.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return Monday as start_date', () => {
      const result = getWeekRange(1, 2025)
      const startDate = new Date(result.start_date)
      const dayOfWeek = startDate.getUTCDay()
      expect(dayOfWeek).toBe(1)
    })

    it('should return Sunday as end_date', () => {
      const result = getWeekRange(1, 2025)
      const endDate = new Date(result.end_date)
      const dayOfWeek = endDate.getUTCDay()
      expect(dayOfWeek).toBe(0)
    })
  })

  describe('getCurrentWeekRange', () => {
    it('should return current week range with metadata', () => {
      const result = getCurrentWeekRange()
      
      expect(result).toHaveProperty('start_date')
      expect(result).toHaveProperty('end_date')
      expect(result).toHaveProperty('week_of_year')
      expect(result).toHaveProperty('iso_year')
      expect(result.week_of_year).toBeGreaterThan(0)
      expect(result.week_of_year).toBeLessThanOrEqual(53)
    })
  })

  describe('getWeekRangeForDate', () => {
    it('should return week range for a specific date', () => {
      const result = getWeekRangeForDate(new Date('2025-10-27'))
      
      expect(result).toHaveProperty('start_date')
      expect(result).toHaveProperty('end_date')
      expect(result).toHaveProperty('week_of_year')
      expect(result).toHaveProperty('iso_year')
    })
  })

  describe('getWeeksInISOYear', () => {
    it('should return number of weeks in a year', () => {
      const weeks = getWeeksInISOYear(2025)
      expect(weeks).toBeGreaterThanOrEqual(52)
      expect(weeks).toBeLessThanOrEqual(53)
    })

    it('should return valid week count for different years', () => {
      const weeks2024 = getWeeksInISOYear(2024)
      const weeks2025 = getWeeksInISOYear(2025)
      
      expect([52, 53]).toContain(weeks2024)
      expect([52, 53]).toContain(weeks2025)
    })
  })

  describe('getPreviousIsoWeek', () => {
    it('should get previous week in same year', () => {
      const result = getPreviousIsoWeek({ iso_year: 2025, week_of_year: 10 })
      expect(result).toEqual({ iso_year: 2025, week_of_year: 9 })
    })

    it('should go to previous year when at week 1', () => {
      const result = getPreviousIsoWeek({ iso_year: 2025, week_of_year: 1 })
      expect(result.iso_year).toBe(2024)
      expect(result.week_of_year).toBeGreaterThan(50)
    })
  })

  describe('getNextIsoWeek', () => {
    it('should get next week in same year', () => {
      const result = getNextIsoWeek({ iso_year: 2025, week_of_year: 10 })
      expect(result).toEqual({ iso_year: 2025, week_of_year: 11 })
    })

    it('should go to next year when at last week', () => {
      const lastWeek = getWeeksInISOYear(2025)
      const result = getNextIsoWeek({ iso_year: 2025, week_of_year: lastWeek })
      
      expect(result.iso_year).toBe(2026)
      expect(result.week_of_year).toBe(1)
    })
  })
})
