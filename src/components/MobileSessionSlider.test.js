import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { timerLabel } from '../data/requestModel'

function formatRemaining(request, now) {
  const diff = Date.parse(request.endsAt) - now
  const total = Math.floor(Math.abs(diff) / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) return `${days} д ${hours} ч`
  if (hours > 0) return `${hours} ч ${minutes} мин`
  return `${minutes} мин ${seconds} сек`
}

function formatRoom(place) {
  if (!place) return 'Кампус'
  const items = place.split('·').map((s) => s.trim())
  return items.length > 1 ? items[1] : place
}

function formatStatusText(request, now) {
  const timer = timerLabel(request, now)
  const remaining = formatRemaining(request, now)
  return timer.overdue ? `Превышено на ${remaining}` : `Идёт · ${remaining}`
}

describe('MobileSessionSlider formatting', () => {
  it('форматирует оставшееся время в секундах/минутах, часах и днях', () => {
    const now = Date.parse('2026-11-07T12:00:00Z')

    // 25 минут 10 секунд
    expect(formatRemaining({ endsAt: '2026-11-07T12:25:10Z' }, now)).toBe('25 мин 10 сек')

    // 2 часа 15 минут
    expect(formatRemaining({ endsAt: '2026-11-07T14:15:00Z' }, now)).toBe('2 ч 15 мин')

    // 2 дня 3 часа
    expect(formatRemaining({ endsAt: '2026-11-09T15:00:00Z' }, now)).toBe('2 д 3 ч')
  })

  it('формирует статус «Идёт» вместо «Осталось» для активных сессий', () => {
    const now = Date.parse('2026-11-07T12:00:00Z')
    const activeRequest = {
      startsAt: '2026-11-07T11:00:00Z',
      endsAt: '2026-11-07T13:30:00Z',
      status: 'active',
    }
    expect(formatStatusText(activeRequest, now)).toBe('Идёт · 1 ч 30 мин')
  })

  it('корректно определяет статус просроченной сессии для таймера', () => {
    const now = Date.parse('2026-11-07T12:00:00Z')
    const overdueRequest = {
      startsAt: '2026-11-07T10:00:00Z',
      endsAt: '2026-11-07T11:45:00Z',
      status: 'active',
    }
    const timer = timerLabel(overdueRequest, now)
    expect(timer.overdue).toBe(true)
    expect(timer.state).toBe('overdue')
    expect(formatStatusText(overdueRequest, now)).toBe('Превышено на 15 мин 0 сек')
  })

  it('форматирует аудиторию и локацию из составных строк', () => {
    expect(formatRoom('Корпус А · Ауд. А914')).toBe('Ауд. А914')
    expect(formatRoom('Студенческий центр · Кабинет 12')).toBe('Кабинет 12')
    expect(formatRoom('А914')).toBe('А914')
    expect(formatRoom('')).toBe('Кампус')
  })

  it('определяет состояния карточек учебных занятий (Figma 1107:2634: Default и Variant2)', () => {
    const now = Date.parse('2026-11-07T10:00:00Z')

    // Variant2: "Пара скоро начнется" (занятие начнется через 10 минут)
    const soonLesson = {
      id: '5001',
      source: 'events',
      startsAt: '2026-11-07T10:10:00Z',
      endsAt: '2026-11-07T11:40:00Z',
      instructor: 'Константинопольский Константин Константинович',
      room: 'А914',
    }
    const isSoon = Date.parse(soonLesson.startsAt) > now
    expect(isSoon).toBe(true)

    // Default: "Пара идет" (занятие началось 20 минут назад)
    const inProgressLesson = {
      id: '5002',
      source: 'events',
      startsAt: '2026-11-07T09:40:00Z',
      endsAt: '2026-11-07T11:10:00Z',
      instructor: 'Константинопольский Константин Константинович',
      room: 'А914',
    }
    const isInProgress = Date.parse(inProgressLesson.startsAt) <= now && Date.parse(inProgressLesson.endsAt) >= now
    expect(isInProgress).toBe(true)
  })

  it('проверяет, что состояния карточек используют токен bg spotlight (#121212 с opacity 85%)', () => {
    const componentPath = path.resolve(__dirname, 'MobileSessionSlider.vue')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // Убеждаемся, что используется токен bg spotlight с hex #121212 и opacity 85%
    expect(content).toContain('.session-card.is-in-progress,')
    expect(content).toContain('.session-card.is-soon,')
    expect(content).toContain('background: var(--color-bg-spotlight, rgba(18, 18, 18, 0.85));')

    const watermarkStyle = content.match(/\.session-watermark \{([^}]+)\}/)?.[1]
    expect(watermarkStyle).toContain('mask-image: linear-gradient')
    expect(watermarkStyle).not.toContain('opacity:')
  })
})
