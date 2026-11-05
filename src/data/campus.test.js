import { describe, expect, it } from 'vitest'
import { nextDepartures, studentCode, studentId, userFullName, userRole } from './campus'

describe('campus student data', () => {
  it('предоставляет данные студента и код', () => {
    expect(userFullName).toBe('Никита Чурганов')
    expect(userRole).toContain('Студент')
    expect(studentId).toBe('24-08192')
    expect(studentCode).toBe(`FEFU-ONE:STUDENT:${studentId}`)
  })

  it('считает следующие отправления шаттла', () => {
    const departures = ['10:00', '11:00', '12:00']
    // 10:30 (10*60 + 30 = 630 мин)
    const baseDate = new Date('2026-11-03T10:30:00').getTime()
    const result = nextDepartures(departures, baseDate, 2)
    expect(result).toHaveLength(2)
    expect(result[0].time).toBe('11:00')
    expect(result[0].inMinutes).toBe(30)
  })
})
