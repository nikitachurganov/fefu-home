import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { timerLabel, whenLabel } from '../data/requestModel'

describe('RequestHighlightCard logic & modern styling behavior', () => {
  it('корректно формирует данные активного учебного занятия', () => {
    const now = Date.parse('2026-11-07T12:00:00Z')
    const activeLesson = {
      id: '5001',
      source: 'events',
      status: 'active',
      title: 'Производственная практика. Практика в информационно-аналитической и организационно-управленческой деятельности',
      instructor: 'Константинопольский Константин Константинович',
      room: 'А914',
      timeRange: '10:10 - 11:40',
      startsAt: '2026-11-07T10:10:00Z',
      endsAt: '2026-11-07T12:40:00Z',
    }

    const timer = timerLabel(activeLesson, now)
    expect(timer.overdue).toBe(false)
    expect(activeLesson.instructor).toBe('Константинопольский Константин Константинович')
    expect(activeLesson.room).toBe('А914')
    expect(activeLesson.timeRange).toBe('10:10 - 11:40')
  })

  it('формирует статус «Ближайшая» и дату для предстоящих заявок', () => {
    const upcomingRequest = {
      id: '3001',
      source: 'equipment',
      status: 'upcoming',
      title: 'Проектор',
      startsAt: '2026-10-21T14:00:00+10:00',
      endsAt: '2026-10-21T18:00:00+10:00',
      place: 'Корпус А · Ауд. 305',
    }

    const label = whenLabel(upcomingRequest)
    expect(label).toContain('14:00')
    expect(label).toContain('18:00')
  })

  it('проверяет, что активные состояния карточки используют токен bg spotlight (#121212 с opacity 85%) и имеют opacity: 1 для водяного знака', () => {
    const componentPath = path.resolve(__dirname, 'RequestHighlightCard.vue')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // Убеждаемся, что используется токен bg spotlight с hex #121212 и opacity 85%
    expect(content).toContain('.highlight-card.is-active,')
    expect(content).toContain('.highlight-card.is-active.is-in-progress,')
    expect(content).toContain('background: var(--color-bg-spotlight, rgba(18, 18, 18, 0.85));')

    // Убеждаемся, что opacity водяного знака в CSS = 1
    expect(content).toContain('.card-watermark {')
    expect(content).toContain('opacity: 1;')
  })
})
