import { describe, expect, it } from 'vitest'
import { LESSON_REMINDER_MINUTES, lessonBanner, toMinutes } from './teacherStore'

const pairs = [
  { id: 'a', start: '10:10', end: '11:40' },
  { id: 'b', start: '13:00', end: '14:30' },
]
const at = (hhmm) => lessonBanner(pairs, toMinutes(hhmm))

describe('плашка пары преподавателя', () => {
  it('появляется за 15 минут до начала', () => {
    expect(LESSON_REMINDER_MINUTES).toBe(15)
    expect(at('12:45')).toMatchObject({ phase: 'soon', minutesLeft: 15, pair: { id: 'b' } })
    expect(at('12:48')).toMatchObject({ phase: 'soon', minutesLeft: 12 })
  })

  it('раньше чем за 15 минут не показывается', () => {
    expect(at('12:44')).toBeNull()
    expect(at('11:50')).toBeNull()
  })

  it('во время пары показывает, что пара идёт', () => {
    expect(at('13:00')).toMatchObject({ phase: 'live', pair: { id: 'b' } })
    expect(at('14:29')).toMatchObject({ phase: 'live', minutesLeft: 1 })
  })

  it('после конца пары скрывается', () => {
    expect(at('14:30')).toBeNull()
  })
})
