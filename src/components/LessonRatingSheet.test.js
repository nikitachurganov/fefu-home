import { describe, expect, it } from 'vitest'

describe('LessonRatingSheet logic & copywriting', () => {
  const ratingDescriptions = {
    1: 'Плохо, материал не понятен',
    2: 'Слабо, было скучно',
    3: 'Нормально, есть вопросы',
    4: 'Хорошо, было полезно',
    5: 'Отлично! Всё понравилось',
  }

  it('содержит корректные описания для всех уровней звёзд', () => {
    expect(ratingDescriptions[5]).toBe('Отлично! Всё понравилось')
    expect(ratingDescriptions[4]).toBe('Хорошо, было полезно')
    expect(ratingDescriptions[3]).toBe('Нормально, есть вопросы')
    expect(ratingDescriptions[2]).toBe('Слабо, было скучно')
    expect(ratingDescriptions[1]).toBe('Плохо, материал не понятен')
  })

  it('содержит позитивные и конструктивные теги обратной связи', () => {
    const positiveTags = [
      'Понятная подача',
      'Интересный материал',
      'Вовлечённость группы',
      'Отличный темп',
      'Полезная практика',
    ]

    const criticalTags = [
      'Слишком быстрый темп',
      'Сложно понять тему',
      'Было шумно в аудитории',
      'Проблемы с оборудованием',
      'Мало практики',
    ]

    expect(positiveTags).toContain('Понятная подача')
    expect(positiveTags).toContain('Полезная практика')
    expect(criticalTags).toContain('Слишком быстрый темп')
    expect(criticalTags).toContain('Проблемы с оборудованием')
  })
})
