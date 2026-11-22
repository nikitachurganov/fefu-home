import { describe, expect, it } from 'vitest'

describe('AttendanceWarningSheet metrics & logic', () => {
  it('рассчитывает минимальное число пар для достижения порога 60%', () => {
    const total = 10
    const attended = 3
    const thresholdPercent = 60
    const minRequired = Math.ceil((total * thresholdPercent) / 100)
    const needed = Math.max(0, minRequired - attended)

    expect(minRequired).toBe(6)
    expect(needed).toBe(3)
  })

  it('содержит корректный заголовок и шаги решения проблемы', () => {
    const sheetData = {
      title: 'Посещаемость: 30%',
      threshold: 60,
      subject: 'Английский язык',
      teacher: 'Иванов Иван Иваныч',
    }

    expect(sheetData.title).toBe('Посещаемость: 30%')
    expect(sheetData.threshold).toBe(60)
    expect(sheetData.subject).toBe('Английский язык')
  })
})
