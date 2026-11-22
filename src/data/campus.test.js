import { describe, expect, it } from 'vitest'
import { formatWaitTime, nextDepartures, studentCode, studentId, userFullName, userRole } from './campus'

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
    const baseDate = new Date('2026-11-03T10:30:00+10:00').getTime()
    const result = nextDepartures(departures, baseDate, 2)
    expect(result).toHaveLength(2)
    expect(result[0].time).toBe('11:00')
    expect(result[0].inMinutes).toBe(30)
  })

  it('форматирует время ожидания с учётом часов и склонений', () => {
    expect(formatWaitTime(1)).toBe('1 минуту')
    expect(formatWaitTime(60)).toBe('1 час')
    expect(formatWaitTime(85)).toBe('1 час 25 минут')
    expect(formatWaitTime(122)).toBe('2 часа 2 минуты')
    expect(formatWaitTime(300)).toBe('5 часов')
  })
})
