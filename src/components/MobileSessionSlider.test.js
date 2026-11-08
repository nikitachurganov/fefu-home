import { describe, expect, it } from 'vitest'
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
    expect(formatRoom('Студенческий центр · Комната 12')).toBe('Комната 12')
    expect(formatRoom('А914')).toBe('А914')
    expect(formatRoom('')).toBe('Кампус')
  })
})
