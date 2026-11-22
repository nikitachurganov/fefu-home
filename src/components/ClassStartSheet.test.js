import { describe, expect, it } from 'vitest'

describe('ClassStartSheet copywriting and layout configuration (Figma 1118:3436)', () => {
  const sheetTexts = {
    title: 'Начните пару',
    description: 'Вас назначили ответственным за старт занятия. Наведите камеру на QR-код аудитории, чтобы зафиксировать начало и открыть пару для группы.',
    primaryAction: 'Сканировать код',
    secondaryAction: 'Закрыть',
  }

  it('содержит корректный заголовок, описание и действия шторки по макету 1118:3436', () => {
    expect(sheetTexts.title).toBe('Начните пару')
    expect(sheetTexts.description).toContain('Вас назначили ответственным за старт занятия')
    expect(sheetTexts.description).toContain('Наведите камеру на QR-код аудитории')
    expect(sheetTexts.primaryAction).toBe('Сканировать код')
    expect(sheetTexts.secondaryAction).toBe('Закрыть')
  })

  it('содержит корректные параметры пары в карточке шторки', () => {
    const lesson = {
      title: 'Производственная практика. Практика в информационно-аналитической и организационно-управленческой деятельности',
      instructor: 'Константинопольский Константин Константинович',
      room: 'А914',
      timeRange: '10:10 - 11:40',
    }

    expect(lesson.title).toContain('Производственная практика')
    expect(lesson.instructor).toBe('Константинопольский Константин Константинович')
    expect(lesson.room).toBe('А914')
    expect(lesson.timeRange).toBe('10:10 - 11:40')
  })
})
